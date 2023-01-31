const AddressFields = `
    accountId: ID
	addressId: ID
    address1: String
    address2: String
    addressTypeId: ID
    city: String
    countryId: ID
    deliveryInstructions: String
    ownerName: String
    postalCode: String
    state: String
    stateId: ID
`;

export default `
	type Address {
        ${AddressFields}
	}

	input AddressInput {
		${AddressFields}
	}

	extend type RootMutation {
		AddressSave(input: AddressInput!): Address
	}

    extend type RootQuery {
        Address(addressId: ID!): Address
    }

`;
