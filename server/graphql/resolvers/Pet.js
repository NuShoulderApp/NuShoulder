import { UserInputError } from "apollo-server";

// return first pet record matching search criteria
export async function findPet({referenceNumber, petId}, context) {
	const knex = context.knex;

	let search_params = {};
	if (referenceNumber) search_params.referenceNumber = referenceNumber;
	if (petId) search_params['pets.petId'] = petId;
	return await knex('pets')
		// we want data from the pets table, plus the referenceNumber.
		// selecting dateCreated, etc. from petReferenceNumbers will clobber data in pets records
		.select('pets.*', 'petReferenceNumbers.referenceNumber', 'species.species')
		.leftJoin('petReferenceNumbers', 'pets.petId', 'petReferenceNumbers.petId')
		.leftJoin('species', 'pets.speciesId', 'species.speciesId')
		.where(search_params)
		.first();
}

// QUERIES
const PetSubResolvers = {
	Pet: {
		async species(root) {
			if (root.hasOwnProperty('species')
				&& root.species.hasOwnProperty('speciesId') && root.species.hasOwnProperty('species')) {

				// result is already formatted properly
				return root.species;
			}
			// result is not formatted properly. Currently assuming that result came from above query
			let { species, speciesId } = root;
			if (species && speciesId) {
				return { species, speciesId };
			}

			// data not found, return empty species
			return null;
		}
	}
}

const PetRootResolvers = {
	// get all available species
	async Species(root, args, context) {
		return await context.knex('species').select('species', 'speciesId');
	},
	async Pet(root, { referenceNumber='', petId='' }, context) {
		if (!referenceNumber && !petId) throw new UserInputError('Must provide reference number or pet ID');

		return await findPet({referenceNumber, petId}, context);

	},
}

export { PetSubResolvers as SubResolvers, PetRootResolvers as PetRootResolvers  }
