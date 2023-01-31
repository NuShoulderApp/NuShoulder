// set of fields for both UserAddress and UserAddressInput for Query and Mutation to use
const UserAddressFields = `
    accountId: ID
    active: Int
	addressId: ID
    address1: String
    address2: String
    addressTypeId: ID
    city: String
    countryId: ID
    ownerName: String
    postalCode: String
    state: String
    stateId: ID
    userAddressId: ID
    userId: ID
`;

const UserCompanyAddressFields = `
    userCompanyAddressId: ID
    userId: ID
    companyAddressId: ID
`;

// main UserAddress types and inputs to be exported
export default `
	type UserAddress {
        ${UserAddressFields}
	}

	type UserAddressResponse {
		Response: Response
		UserAddress: UserAddress
	}

	input UserAddressInput {
		${UserAddressFields}
	}

    type UserCompanyAddress {
        address1: String
        address2: String
        city: String
        ownerName: String
        postalCode: String
        state: String
        ${UserCompanyAddressFields}
    }

    type UserCompanyAddressSaveResponse {
        Response: Response
        UserCompanyAddress: UserCompanyAddress
    }

    input UserCompanyAddressInput {
        ${UserCompanyAddressFields}
    }

	extend type RootQuery {
		UserAddresses(userId: ID!): [UserAddress]
        UserCompanyAddresses(userId: ID!): [UserCompanyAddress]
	}

	extend type RootMutation {
        userCompanyAddressSave(input: UserCompanyAddressInput!): UserCompanyAddressSaveResponse!
        userCompanyAddressRemove(userCompanyAddressId: ID!): UserCompanyAddressSaveResponse!
		userAddressSave(input: UserAddressInput!): UserAddressResponse!
		userAddressRemove(userAddressId: ID!): UserAddressResponse!
	}
`;
