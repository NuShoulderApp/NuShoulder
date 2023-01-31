import gql from 'graphql-tag';

// Generic Session info gql.
const sessionInfo = `
	Session {
		sessionId
		LoggedIn
		User {
			userId
			companyId
			firstName
			lastName
			userTypeId
			Permissions {
				userPermissionId
				permissionLevel
				permissionLevelString
				Permission {
					permissionId
					permission
				}
			}
		}
	}
`;
// ${sessionInfo}
export const LoginMutation = gql`
    mutation login($email: String!, $password: String) {
		login (email: $email, password: $password) {
			Response {
				success
				message
			}
		}
}`;
