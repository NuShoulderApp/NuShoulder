// set of fields for both UserEmail and UserEmailInput for Query and Mutation to use
const UserEmailFields = `
    accountId: ID
	email: String
    userId: ID
`
// main User types and inputs to be exported
export default `
	type UserEmail {
		userEmailId: ID
		${UserEmailFields}
	}

	input UserEmailInput {
		${UserEmailFields}
	}
`;
