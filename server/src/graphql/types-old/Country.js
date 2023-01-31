// set of fields for both State and StateInput for Query and Mutation to use
const CountryFields = `
	countryId: ID
	country: String
	iso: String
	iso3: String
	numcode: String
`;

// main State types and inputs to be exported
export default `
	type Country {
		${CountryFields}
		States: [State]
	}

	input CountryInput {
		${CountryFields}
	}

	extend type RootQuery {
		Countries: [Country]
	}
`;
