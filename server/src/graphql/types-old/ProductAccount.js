export default `
	type ProductAccountResponse {
		Response: Response
	}

	input ProductAccountInput {
		personalizationAllowed: Int
		personalizationDefaultedToYes: Int
		personalizationRequired: Int
		productId: ID
	}

	extend type RootMutation {
		productAccountSave(input: ProductAccountInput!): ProductAccountResponse!
	}

`;
