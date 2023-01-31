// main UserType types and inputs to be exported
export default `
	type UserType {
        userTypeId: ID
		userType: String
	}

	input UserTypeInput {
        userTypeId: ID
		userType: String
	}

	extend type RootQuery {
		UserTypes: [UserType]
	}
`;