import { Response } from '../../utilities/helpers';

export async function getLanguageByID(languageId, context) {
	let language = await context.knex('languages')
		.where('languages.languageId', languageId)
		// TODO: account_ID check
		.andWhere('languages.active', 1)
		.first();
	//if (!language) throw new Error("Language Not Found");
	return language;
}

async function getLanguageList(filters, context) {
	const knex = context.knex;

	// get accepted args (right now, just label)
	let { label } = filters;

	// process filters
	let query = knex('languages');
	if (label !== undefined) {
		query = query.whereRaw('languageLabel LIKE ?', `%${label}%`);
	}
	query = query.orderBy('languageId');

	return await query;
}

const LanguageSubResolvers = {
}

// QUERIES
const LanguageRootResolvers = {
	async Language(root, args, context) {
		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		let data = await getLanguageByID(args.languageId, context);
		return data;
	},
	async LanguageList(root, args, context) {
		let data = await getLanguageList(args, context);
		return data;
	}
}

// MUTATIONS
const LanguageMutations = {
	// add language using 'input' data
	async languageAdd(root, { input }, context) {
		const knex = context.knex;

		let { languageCode, languageLabel, ...data } = input;
		let duplicateRecord = await knex('languages').where({ languageCode, languageLabel }).first('languageId');

		let language = null;

		if (duplicateRecord && duplicateRecord.languageId > 0) {
			//TODO: return validation error
			//let err = new Error('Cannot Add Language -- Duplicate Language');
			//throw err;
			return Response(false, 'Duplicate Language', {language});
		}

		let data_to_insert = { ...input };

		// default accountId to 0 (maybe should be done in db layer?)
		if (data.hasOwnProperty('accountId') == false) {
			data_to_insert.accountId = 0;
		}

		let [insertedId] = await knex('languages').insert(data_to_insert);
		let result = {
			...data_to_insert,
			languageId: insertedId
		}

		return Response(true, '', {language: result});
	},
}

// EXPORT
export { LanguageSubResolvers, LanguageMutations, LanguageRootResolvers }
