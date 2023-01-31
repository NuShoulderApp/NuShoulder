// set of fields for both Account and AccountInput for Query and Mutation to use
const AccountFields = `
	accountId: ID
	accountName: String
	accountPrefix: String
	active: Int
	dateCreated: DateTime
	Timezone: String
	url: String
`;

// main Account types and inputs to be exported
export default`
	type Account {
		Settings: [Setting]
		Companies: [Company]
		Permissions: [UserPermission]
		AccountAdmins: [User]
		${AccountFields}
	}

	type Setting {
		accountSettingId: ID
		accountSettingOverrideId: ID
		value: String
		defaultValue: String
		description: String
		name: String
		json: Int
	}

	type AccountResponse {
		Response: Response
		Account: Account
	}

	type AccountSettingOverrideResponse {
		Response: Response
		Setting: Setting
	}

	input AccountInput {
		${AccountFields}
	}

	input AccountSettingOverride {
		accountId: ID!
		accountSettingId: ID!
		accountSettingOverrideId: ID!
		value: String
	}

	extend type RootQuery {
		Account(accountId: ID, userTypeId: ID): Account
	  	Accounts(active: Int): [Account]
	}

	extend type RootMutation {
		accountSave(input: AccountInput!): AccountResponse!
		accountSettingOverrideSave(input: AccountSettingOverride!): AccountSettingOverrideResponse!
	}
`;
