import gql from 'graphql-tag';

export const getAccountQuery = gql`
    query getAccount($accountId: ID!) {
		Account (accountId: $accountId) {
			accountId
            accountName
            accountPrefix
            active
			dateCreated
			url
			Settings {
				accountSettingId
				accountSettingOverrideId
				json
				name
				value
				defaultValue
				description
			}
			Companies{
				active,
				companyId,
				companyName,
				companyNameLegal,
				companyDescription,
				companyIconId,
				companyLogoId,
				companyTypeId
			}
			AccountAdmins {
				userId
				dateCreated
				firstName
				lastName
				middleName
				salutation
				userTypeId
			}
		}
        Modules {
            active
            label
            moduleId
            name
        }
	}`;

export const getAccountsQuery = gql`
    query getAccounts($active: Int) {
		Accounts (active: $active) {
            accountId
            accountName
            accountPrefix
            active
			dateCreated
		}
	}`;

export const AccountSaveMutation = gql`
    mutation accountSave($input: AccountInput!) {
		accountSave (input: $input) {
			Response{
				success
				message
			}
			Account {
				accountId
				accountName
				accountPrefix
				active
				url
			}
		}
	}
`;

export const AccountSettingOverrideSaveMutation = gql`
    mutation accountSettingOverrideSave($input: AccountSettingOverride!) {
		accountSettingOverrideSave (input: $input) {
			Response {
				success
				message
			}
			Setting {
				accountSettingId
				accountSettingOverrideId
				json
				name
				value
				defaultValue
				description
			}
		}
	}
`;