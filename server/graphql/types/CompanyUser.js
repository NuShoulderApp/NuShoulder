// set of fields for both CompanyUser and CompanyUserInput for Query and Mutation to use
const CompanyUserFields = `
    accountId: ID
    active: Int
    companyId: ID
    companyUserId: ID
`;

// main CompanyUser types and inputs to be exported
export default `
	type CompanyUser {
        ${CompanyUserFields}
	}

    type CompanyUserCreate {
        action: String
        user: User
        users: [User]
    }

	input CompanyUserInput {
		${CompanyUserFields}
	}

	extend type RootQuery {
		CompanyUsers(companyId: ID!): [CompanyUser]
	}

	extend type RootMutation {
		companyUserCreate(input: CompanyUserInput!): CompanyUserCreate!
	}
`;
