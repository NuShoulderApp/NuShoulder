// import { ResponseFields } from "./Response" // Consistent set of fields for the status of a Query or Mutation to be sent back with every response from the graphql server

// set of fields for both User and UserInput for Query and Mutation to use
const UserFields = `
	user_ID: ID
	first_name: String
	last_name: String
	user_type_ID: Int
`;

// main User types and inputs to be exported
export default`
	type User {
		${UserFields}
	}

	extend type RootQuery {
		users: [User]
	}
`;

// export default`
// 	type User {
// 		${UserFields}
// 	}

// 	// type UserResponse {
// 	// 	Response: Response
// 	// 	User: User
// 	// }

// 	// type UserCreateResponse {
// 	// 	Response: Response
// 	// 	action: String
// 	// 	User: User
// 	// 	Users: [User]
// 	// }

// 	// input UserInput {
// 	// 	${UserFields}
// 	// }

// 	extend type RootQuery {
// 		User(userId: ID!): User
// 	}

// 	extend type RootMutation {
// 		// userCreate(input: UserInput!): UserCreateResponse!
// 		// userUpdate(input: UserInput!): UserResponse!
// 	}
// `;

// main User types and inputs to be exported
// const typeDefs = `#graphql
//   type User {
// 	user_ID: ID
// 	first_name: String
// 	last_name: String
// 	user_type_ID: Int
// }

//   type Query {
//     users: [User]
//   }
// `;
 // Put extend type Query once we have more than one!!
