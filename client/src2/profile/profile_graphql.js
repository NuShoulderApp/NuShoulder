import gql from 'graphql-tag';

export const getUserPhonesQuery = gql`
    query getUserPhones($userId: ID!) {
		UserPhones (userId: $userId) {
		    accountId,
		    active,
		    phoneId,
		    userId,
            userPhoneId
		}
    }`;

export const getUserProfileQuery = gql`
    query getUserProfile($userId: ID!) {
		User (userId: $userId) {
		    accountId
		    dateCreated
            email
		    firstName
		    lastName
			middleName
			Permissions {
				userPermissionId
				permissionLevel
				permissionLevelString
				Permission {
					permissionId
					permission
				}
			}
			salutation,
            userEmailId,
            UserAddresses {
                accountId
                active
                address1
                address2
                addressId
                addressTypeId
                city
                countryId
                postalCode
                state
                stateId
                userAddressId
                userId
            },
			userId
			UserLogin {
				userLoginId
			}
            UserPhones {
                active
                phone
                phoneId
                phoneLabel
                phoneType
                phoneTypeId
                userId
                userPhoneId
            },
			userTypeId
		}
	}`;

export const getUserQuery = gql`
    query getUser($userId: ID!) {
		User (userId: $userId) {
			userId
		    accountId
		    dateCreated
            email
		    firstName
		    lastName
			middleName
			salutation
			userEmailId
			UserLogin {
				userLoginId
			}
			userTypeId
		}
	}`;

export const getUsersQuery = gql`
    query getUsers($accountId: ID!) {
		Users (accountId: $accountId) {
			userId
		    accountId
		    dateCreated
		    firstName
		    lastName
			middleName
			salutation
			userTypeId
		}
	}`;

export const getPermissionsQuery = gql`
    query getPermissions {
		Permissions {
			permissionId
			permission
			description
		  }
	}
`;

export const UserAddressSaveMutation = gql`
	mutation userAddressSave($input: UserAddressInput!) {
		userAddressSave (input: $input) {
			Response{
				success
				message
			}
			UserAddress{
				accountId
				active
				address1
				address2
				addressId
				addressTypeId
				city
				postalCode
				stateId
				userAddressId
				userId
			}
		}
	}
`;

export const UserAddressRemoveMutation = gql`
	mutation userAddressRemove($userAddressId: ID!) {
		userAddressRemove (userAddressId: $userAddressId) {
			Response{
				success
				message
			}
		}
	}
`;

export const UserCreateMutation = gql`
    mutation userCreate($input: UserInput!) {
		userCreate (input: $input) {
			Response{
				success
				message
			}
			action
			User {
				email
				firstName
				lastName
				userId
				UserLogin {
					userLoginId
				}
			}
			Users {
				dateCreated
                email
                firstName
                lastName
                middleName
                userId
                userTypeId
			}
		}
	}
`;

export const UserLoginUpdateMutation = gql`
    mutation userLoginUpdate($input: UserLoginInput!) {
		userLoginUpdate (input: $input) {
			Response{
				success
				message
			}
			User {
				userId
				email
			}
		}
	}
`;

export const UserPermissionSaveMutation = gql`
	mutation userPermissionSave($input: UserPermissionInput!) {
		userPermissionSave (input: $input) {
			Response{
				success
				message
			}
			UserPermission {
				userPermissionId
				userId
				Permission {
					permissionId
					permission
				}
				permissionLevel
				permissionLevelString
			}
		}
	}
`;

export const UserPasswordUpdateMutation = gql`
    mutation userPasswordUpdate($input: UserPasswordInput!) {
		userPasswordUpdate (input: $input) {
			Response {
				success
				message
			}
		}
	}
`;

export const UserPhoneSaveMutation = gql`
	mutation userPhoneSave($input: UserPhoneInput!) {
		userPhoneSave (input: $input) {
			Response {
				success
				message
			}
            UserPhone {
				accountId,
				active,
				phone,
				phoneId,
				phoneLabel,
				phoneTypeId,
				userId,
				userPhoneId
			}
		}
	}
`;

export const UserPhoneRemoveMutation = gql`
	mutation userPhoneRemove($userPhoneId: ID!) {
		userPhoneRemove (userPhoneId: $userPhoneId) {
			Response{
				success
				message
			}
		}
	}
`;

export const UserUpdateMutation = gql`
	mutation userUpdate($input: UserInput!) {
		userUpdate (input: $input) {
			Response{
				success
				message
			}
			User {
				firstName
				lastName
				middleName
				salutation
				userId
			}

		}
	}`;
