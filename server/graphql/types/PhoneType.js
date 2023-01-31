// main PhoneType types and inputs to be exported
export default `
	type PhoneType {
        phoneTypeId: ID
		phoneType: String
	}

	input PhoneTypeInput {
        phoneTypeId: ID
		phoneType: String
	}

	extend type RootQuery {
		PhoneTypes: [PhoneType]
	}
`;
