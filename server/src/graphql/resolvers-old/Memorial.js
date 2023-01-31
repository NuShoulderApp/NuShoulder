import _ from 'lodash';
import { Response } from '../../utilities/helpers';
import { findPet } from './Pet';

const MEMORIAL_LIST_PAGE_SIZE = 16;

// default values for new memorial -- only add fields that should receive a default value if not present in user input.
const EMPTY_MEMORIAL_FIELDS = {
	authorEmail: '', /*dateBorn: '', dateCreated: '', dateDied: '',*/
	memorialStatusId: 1,
	petId: 0,
	breed: '',
	dateBorn: null,
	dateDied: null,
	petName: ''
};

// cursor class to hold current place in memorial list
function Cursor(cursor) {
	if (cursor && cursor.after) {
		this.after = parseInt(cursor.after, 10);
	} else {
		this.after = 0;
	}
	return this;
}

// inserts new memorial, with values in input argument. input.images[] should be an array of memorialImageIds for this memorial
async function addMemorial(input, context) {
	const knex = context.knex;

	// Make sure memorial gets new id, since this is insert
	if (input.hasOwnProperty('memorialId')) delete input['memorialId'];

	let { images, ...memorial_data } = input;
	let data = _.defaults({}, memorial_data, EMPTY_MEMORIAL_FIELDS);

	// insert new record into memorials table
	const [memorialId] = await knex('memorials').insert(data);

	// update image records -- set memorialId to that of new record where memorialId=0 and imageId in input.images
	if (images && Array.isArray(images) && images.length) {
		await knex('memorialImages')
			.update('memorialId', memorialId)
			.whereIn('memorialImageId', images)
			.andWhere('memorialId', 0);
	}
	return memorialId;
}

async function getMemorialByID(memorialId, context) {
	return await context.knex('memorials')
		.select('memorials.*', 'memorialStatuses.memorialStatus')
		.leftJoin('memorialStatuses', 'memorials.memorialStatusId', 'memorialStatuses.memorialStatusId')
		.where('memorials.memorialId', memorialId )
		.andWhere('memorialStatuses.active', 1)
		.first();
}

// returns first memorial matching search args (1st memorial where petId = petID AND authorEmail = authorEmail).
// if petId or authorEmail not supplied, search using other provided arg
// if no search params supplied, don't search
async function memorialSearch({petId, authorEmail, breed, memorial, dateDied, dateBorn, petName}, accountId=0, context) {
	const knex = context.knex;

	if (!petId && !authorEmail) {
		return null;
	}
	let query = knex('memorials').where({accountId});
	if (petId) {
		query.where({petId});
	}
	if (breed) {
		query.where({breed});
	}
	if (memorial) {
		query.where({memorial});
	}
	if (dateDied) {
		query.whereRaw('memorials.dateDied = DATE(?)', [dateDied]);
	}
	if (dateBorn) {
		query.whereRaw('memorials.dateBorn = DATE(?)', [dateBorn]);
	}
	if (petName) {
		query.where({petName});
	}
	if (authorEmail) {
		query.where({authorEmail});
	}
	return await query.first();
}

// get list of memorials for showcase. Will usually include images
async function getMemorials(searchParams, cursor, context) {
	const knex = context.knex;

	if (!cursor) {
		cursor = new Cursor();
	}

	let query = knex('memorials')
		.select(
			'memorials.*',
			'species.species',
		)
		.leftJoin('species', 'memorials.speciesId', 'species.speciesId')
		.where(searchParams)
		.orderBy('memorials.memorialId', 'DESC')
		.limit(MEMORIAL_LIST_PAGE_SIZE);

	// if cursor provided, only get records that follow cursor
	if (cursor.after > 0) {
		query.whereRaw('memorials.memorialId < ?', cursor.after)
	}
	let memorials = await query;

	// get min id for cursor
	cursor.after = memorials.reduce((cur_val, m) => ((m.memorialId < cur_val || !cur_val) ? m.memorialId : cur_val), cursor.after);
	return {
		memorials,
		cursor
	}
}

const MemorialSubResolvers = {
	Memorial: {
		async images(root, args, context) {
			const knex = context.knex;

			// if root.images is an array ([]), parent resolver already did this work
			if (Array.isArray(root.images)) return root.images;

			let memorialId = root.memorialId || args.memorialId || 0;
			let images = await knex('memorialImages').where({memorialId});
			return images;
		},
		async petSpecies (root, args, context) {
			const knex = context.knex;

			let { speciesId=0, species='' } = root;

			// if root.petSpecies exists (and has species!==''), parent resolver already did the work
			if (root.petSpecies && root.petSpecies.species) {
				return root.petSpecies;
			}

			if (speciesId && species) {
				// skip to return
			} else if (speciesId) {
				let record = await knex('species').where({speciesId}).first();
				if (record) {
					species = record.species;
				}
			} else {
				// speciesId not provided, not much to do here.
				return null;
			}

			return {
				speciesId,
				species
			}

		},
		// get pet info out of pets table, if pet is linked
		async pet(root, args) {
			//console.log("Returning pet...");
			let { petId=null } = root;
			if (!petId && args.petId) {
				petId = args.petId;
			}
			// if petID is not linked, still want to return data.
			if (!petId) {
				return _.pick(root, ['petName', 'speciesId', 'petId'])
			}
			let pet = await findPet({petId});
			//if (!pet) throw new Error(`Could not find pet ID: ${petId}`);
			if (!pet) return {
				speciesId: root.speciesId || 0,
				species: root.species || ''
			}
			return pet;
		}
	}
}

// QUERIES
const MemorialRootResolvers = {
	// Get Memorial - gets an array and then returns the .first() entry
	// Set this function as async so we can wait on the knex calls.
	async Memorial(root, {memorialId}, context) {
		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		return await getMemorialByID(memorialId, context);
	},


	// Get Memorials
	// Set this function as async so we can wait on the knex calls.
	Memorials: async (root, args, context) => {
		let searchParams = {
			'memorials.accountId': context.Account.accountId
		}
		if (args.memorialStatusId) {
			searchParams['memorials.memorialStatusId'] = args.memorialStatusId;
		}
		let {
			cursor:cursor_input=null
		} = args;

		let cursor = new Cursor(cursor_input);

		let result = await getMemorials(searchParams, cursor, context);
		return {
			memorials: result.memorials,
			cursor: result.cursor
		}
	}
}

// MUTATIONS
const MemorialMutations = {
	// input is a Memorial object with the data to insert or update
	// Insert Memorial
	// Set this function as async so we can wait on the knex calls.
	async memorialCreate(root, { input }, context) {
		/*
			This mutation is called from attempting to add a new memorial with inputs being email, petId (or reference #, tbd)
			Or if there are already memorial(s) in the db with similar parameters, we can verify that we actually
			want to create the new memorial, in which case we pass in the action 'forceAddMemorial';
		*/

		let accountId = context.Account.accountId;

		// Required data: to create a memorial, we want to have at least
		//		- memorial
		//		- petName
		//		- image

		// If we are not force adding the memorial, check to see if the data matches another record in the system.
		//const MemorialCheck = input.action !== 'forceAddMemorial' ? await memorialSearch(input) : undefined;
		let MemorialCheck;
		if (input.action !== 'forceAddMemorial') MemorialCheck = await memorialSearch(input, 0, context);

		// TODO: improve this check.
		//console.log("MemorialCheck result: ", {MemorialCheck});

		// if the MemorialCheck returns an 'action' of 'noMatch', then we know this is a new unique memorial, and we can create the memorial and Email
		if(MemorialCheck) {
			// send the object result back and let the client determine what to do based on the 'matchLevel'
			return Response(false, "The Memorial was not Added, A duplicate Memorial was Found.", { action: 'memorialFound', Memorial: MemorialCheck });
		} else {
			// TODO: get accountId from context
			const memorialId = await addMemorial({...input, accountId}, context);
			const Memorial = await getMemorialByID(memorialId, context);

			// add the email to the memorial object so we can update it if needed on the next step.
			// here we are return 'memorials' because that is the variable in the MemorialCreate type that needs to be matched to
			return Response(true, "Your Memorial was successfully saved. We are very sorry for your loss.", {action: 'memorialCreated', Memorial});
		}
	},

	// Update Memorial
	// Set this function as async so we can wait on the knex calls.
	async memorialUpdate(root, { input }, context) {
		const knex = context.knex;

		// Verify that the user is logged in.

		if ( context.Session.hasPermission("ADMIN", 4) === false ) {
			// TODO: create memorial admin permission, then change this to check that
		}

		// Currently, the only update available is admin approving/rejecting a memorial post
		let { memorialId=0, memorialStatusId='' } = input;

		if (memorialId > 0 && memorialStatusId) {
			await knex('memorials')
				.where({ memorialId })
				.update({ memorialStatusId });
		} else {
			throw new Error("We could not update the Memorial");
		}

		let Memorial = getMemorialByID(memorialId);

		// Return the response and the current data values.
		return Response(true, "The Memorial was Successfully Updated", { Memorial });
	}
}

// EXPORT
export { MemorialSubResolvers as SubResolvers, MemorialMutations as Mutations, MemorialRootResolvers as RootResolvers }
