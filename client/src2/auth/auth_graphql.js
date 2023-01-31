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

// Main Account Query GQL for getting the account information for the session.
export const AccountQuery = gql `
	query {
		Account {
			accountId
			accountName
			accountPrefix
			url
			Settings {
				name
				value
				json
			}
		}
	}
`;

// Main session qeury to get a valid session for the user.
export const SessionQuery = gql `
	query {
		${sessionInfo}
	}
`;

export const LoginMutation = gql`
    mutation login($email: String!, $password: String, $token: String) {
		login (email: $email, password: $password, token: $token) {
			Response {
				success
				message
			}
			${sessionInfo}
		}
}`;

export const LogoutMutation = gql`
	mutation logout {
		logout {
			Response {
				success
				message
			}
			${sessionInfo}
		}
	}
`;
