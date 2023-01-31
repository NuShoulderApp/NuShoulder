// main Pet types and inputs to be exported
export default `
	type Pet {
		petId: ID
		petName: String

		dateCreated: String
		dateDeathConfirmed: Date
		dateDeathPredicted: Date

		# TODO: pet reference number is not set up at all.
		referenceNumber: String

		# cat, dog, gerbil, hamster, bird, rabbit
		# using species type so that client can easily + directly access related speciesId if they like
		species: Species

		# lbs, oz, kg, etc.
		weight: Float
		weightUnits: String
	}

	extend type RootQuery {
		Pet(petId: ID, referenceNumber: String): Pet
	}
`;
