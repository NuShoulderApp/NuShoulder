// Consistent set of fields for the status of a Query or Mutation to be sent back with every response from the graphql server
export default `
	type Response {
		success: Boolean!
		message: String!
		code: Int
	}
`;
