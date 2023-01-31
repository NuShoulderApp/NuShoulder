import gql from 'graphql-tag';

// Generic list of userLogin Fields to be used by many queries.
const UserLoginFields = `
	UserLogin {
		userLoginId
		userLoginTypeId
		token
		passwordLastUpdated
		dateExpiration
		updatedBy {
			firstName
			lastName
		}
		Account {
			url
		}
	}
`;

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
			${UserLoginFields}
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
            }
            UserCompanyAddresses {
                address1
                address2
                city
                companyAddressId
                postalCode
                state
                userCompanyAddressId
            }
            UserCompanyPhones {
                companyPhoneId
                phone
                phoneLabel
                phoneType
                userCompanyPhoneId
            }
            userEmailId
			userId

            UserPhones {
                active
                phone
                phoneId
                phoneLabel
                phoneType
                phoneTypeId
                userId
                userPhoneId
            }
			userTypeId
		}
        CompanyAddresses (userId: $userId) {
            active
            address1
            address2
            addressId
            city
            companyAddressId
            postalCode
            state
        }
        CompanyPhones (userId: $userId) {
            active
            companyPhoneId
            phone
            phoneId
            phoneLabel
            phoneType
            phoneTypeId
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
            ${UserLoginFields}
			userTypeId
		}
	}`;

export const GetEmployeeUsersQuery = gql`
    query getUsers($accountId: ID, $companyId: ID, $userTypeId: [ID]) {
		Users (accountId: $accountId, companyId: $companyId userTypeId: $userTypeId) {
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

export const getUsersQuery = gql`
    query getUsers($accountId: ID, $companyId: ID, $userTypeId: [ID]) {
		Users (accountId: $accountId, companyId: $companyId userTypeId: $userTypeId) {
			userId
			accountId
			dateCreated
			firstName
			lastName
			middleName
			salutation
			UserLogin {
				active
				userLoginId
				userLoginTypeId
			}
			userTypeId
		}
	}`;

export const getPermissionsQuery = gql`
    query getPermissions($userTypeId: ID) {
		Permissions{
			permissionId
			permission
			description
			permissionDefaults(userTypeId: $userTypeId) {
				permissionLevel
			}
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

export const UserCompanyAddressSaveMutation = gql`
	mutation userCompanyAddressSave($input: UserCompanyAddressInput!) {
		userCompanyAddressSave (input: $input) {
			Response {
				success
				message
			}
            UserCompanyAddress {
				companyAddressId,
				userCompanyAddressId,
				userId
			}
		}
	}
`;

export const UserCompanyAddressRemoveMutation = gql`
	mutation userCompanyAddressRemove($userCompanyAddressId: ID!) {
		userCompanyAddressRemove (userCompanyAddressId: $userCompanyAddressId) {
			Response{
				success
				message
			}
		}
	}
`;

export const UserCompanyPhoneSaveMutation = gql`
	mutation userCompanyPhoneSave($input: UserCompanyPhoneInput!) {
		userCompanyPhoneSave (input: $input) {
			Response {
				success
				message
			}
            UserCompanyPhone {
				companyPhoneId,
				userCompanyPhoneId,
				userId
			}
		}
	}
`;

export const UserCompanyPhoneRemoveMutation = gql`
	mutation userCompanyPhoneRemove($userCompanyPhoneId: ID!) {
		userCompanyPhoneRemove (userCompanyPhoneId: $userCompanyPhoneId) {
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
                ${UserLoginFields}
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

export const UsersLoginsSaveMutation = gql`
    mutation usersLoginsSave($input: UserLoginInput!) {
		usersLoginsSave (input: $input) {
			Response{
				success
				message
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
			${UserLoginFields}
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

export const UserCreateTemporaryPasswordMutation = gql`
	mutation createTemporaryPassword($email: String, $accountId: ID, $sendRecoveryEmail: Boolean){
		temporaryPasswordCreate(accountId: $accountId,	email: $email, sendRecoveryEmail:$sendRecoveryEmail){
			Response {
				success
				message
			}
			token
		}
	}
`;
