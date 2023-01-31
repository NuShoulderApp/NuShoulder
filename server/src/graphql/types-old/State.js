// set of fields for both State and StateInput for Query and Mutation to use
const StateFields = `
    countryId: ID
    stateAbbr: String
    state: String
    stateId: ID
`

// main State types and inputs to be exported
export default `
	type State {
		${StateFields}
	}

	input StateInput {
		${StateFields}
	}

	extend type RootQuery {
		States: [State]
	}
`;
