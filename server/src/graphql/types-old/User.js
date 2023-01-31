// import { ResponseFields } from "./Response" // Consistent set of fields for the status of a Query or Mutation to be sent back with every response from the graphql server

// set of fields for both User and UserInput for Query and Mutation to use
const UserFields = `
	userId: ID
	accountId: String
	action: String
	dateCreated: DateTime
	email: String
	firstName: String
	lastName: String
	middleName: String
	salutation: String
	userEmailId: ID
	userTypeId: ID
	companyId: ID
`;

// main User types and inputs to be exported
export default`
	type User {
		UserAddresses: [UserAddress]
		UserCompanyAddresses: [UserCompanyAddress]
		UserCompanyPhones: [UserCompanyPhone]
		UserPhones: [UserPhone]
		Permissions: [UserPermission]
		UserLogin: [UserLogin]
		${UserFields}
	}

	type UserResponse {
		Response: Response
		User: User
	}

	type UserCreateResponse {
		Response: Response
		action: String
		User: User
		Users: [User]
	}

	input UserInput {
		${UserFields}
	}

	extend type RootQuery {
		User(userId: ID!): User
		UserCheck: User
	  Users(accountId: ID, companyId: ID, userTypeId: [ID]): [User]
	}

	extend type RootMutation {
		userCreate(input: UserInput!): UserCreateResponse!
		userUpdate(input: UserInput!): UserResponse!
	}
`;
