// main User types and inputs to be exported
export default `
	type Species {
		speciesId: ID!
		species: String!
	}

	input speciesInput {
		speciesId: ID
		species: String
	}

	extend type RootQuery {
		Species: [Species]!
	}
`;
