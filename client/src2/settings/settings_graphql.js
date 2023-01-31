import gql from 'graphql-tag';

export const getSettingsQuery = gql`
    query getAccountSettings {
		AccountSettings {
            value
           	description
			accountSettingId
			name
			serverOnly
		}
	}`;


export const SettingSaveMutation = gql`
    mutation accountSettingSave($input: AccountSettingInput!) {
		AccountSettingSave (input: $input) {
			Response{
				success
				message
			}
			AccountSetting {
				value
				description
				accountSettingId
				name
				serverOnly
			}
		}
	}
`;
