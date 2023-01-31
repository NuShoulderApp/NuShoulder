// set of fields for both CompanyAddress and CompanyAddressInput for Query and Mutation to use
const CompanyAddressFields = `
    accountId: ID
    active: Int
	addressId: ID
	addressName: String
	address1: String
    address2: String
    addressTypeId: ID
    billingCode: String
    city: String
    companyAddressId: ID
    companyId: ID
    companyName: String
    countryId: ID
    deliveryInstructions: String
    ownerName: String
    postalCode: String
    state: String
	stateId: ID
	routeId: ID
	routeStopOrder: Int
`;

// main CompanyAddress types and inputs to be exported
export default `
	type CompanyAddress {
        ${CompanyAddressFields}
        Route: [Route]
	}

	type CompanyAddressResponse {
		CompanyAddress: CompanyAddress
		Response: Response
	}

	input CompanyAddressInput {
		${CompanyAddressFields}
	}

	extend type RootQuery {
		CompanyAddresses(companyId: ID, returnAllAddresses: Boolean, userId: ID): [CompanyAddress]
	}

	extend type RootMutation {
		companyAddressSave(input: CompanyAddressInput!): CompanyAddressResponse!
		companyAddressRemove(companyAddressId: ID!): CompanyAddressResponse!
	}
`;
