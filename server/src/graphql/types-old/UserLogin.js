// main User types and inputs to be exported
export default `
	type UserLogin {
		userLoginId: ID
		accountId: ID
		active: Int
		dateDeactivated: DateTime
		dateExpiration: DateTime
		token: String
		userId: ID
		userLoginTypeId: ID
		passwordLastUpdated: DateTime
		updatedBy: User
		Account: Account
	}

	type LoginResponse {
		Response: Response
		Session: Session
	}

	input UserLoginInput {
		active: Int
		email: String
		userEmailId: ID
		userId: ID
		userLoginId: ID
		userLoginTypeId: ID
	}

	input UserPasswordInput {
		acocuntId: ID
		passwordNew: String
		passwordNewConfirm: String
		userId: ID
		userLoginId: ID
	}

	type UsersLoginsSaveResponse {
		Response: Response
	}

	type UserPasswordUpdateResponse {
		Response: Response
		UserLogin: UserLogin
	}

	type TemporaryPasswordCreateResponse {
		Response: Response
		token: String
	}

	extend type RootMutation {
		login(email: String!, password: String, token: String): LoginResponse!
		logout: LoginResponse!
		userLoginUpdate(input: UserLoginInput!): UserResponse!
		userPasswordUpdate(input: UserPasswordInput!): UserPasswordUpdateResponse!
		usersLoginsSave(input: UserLoginInput!): UsersLoginsSaveResponse
		temporaryPasswordCreate(email: String, accountId: ID, sendRecoveryEmail: Boolean): TemporaryPasswordCreateResponse
	}
`;
