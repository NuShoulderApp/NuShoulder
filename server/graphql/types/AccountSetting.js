// set of fields for both Setting and SettingInput for Query and Mutation to use
const AccountSettingFields = `
	accountSettingId: ID
	value: String
	description: String
	json: Int
	serverOnly: Int
	name: String
`;

// main Account Setting types and inputs to be exported
export default `
	type AccountSetting {
		${AccountSettingFields}
	}

	type AccountSettingResponse {
		AccountSetting: AccountSetting
		Response: Response
	}

	input AccountSettingInput {
		${AccountSettingFields}
	}

	extend type RootQuery {
		AccountSettings: [AccountSetting]
		AccountSetting(accountSettingId: ID!): AccountSetting
	}

	extend type RootMutation {
		AccountSettingSave(input: AccountSettingInput!): AccountSettingResponse!
	}
`;
