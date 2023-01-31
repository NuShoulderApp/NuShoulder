// set of fields for both AddressType and AddressTypeInput for Query and Mutation to use
const AddressTypeFields = `
    addressType: String
`;

// main AddressType types and inputs to be exported
export default `
	type AddressType {
        addressTypeId: ID
		${AddressTypeFields}
	}

	input AddressTypeInput {
        addressTypeId: ID
		${AddressTypeFields}
	}

	extend type RootQuery {
		AddressTypes: [AddressType]
	}
`;

