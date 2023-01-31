export default `
	type ProductVariationType {
		productVariationTypeId: ID
		productVariationType: String
	}

	input ProductVariationTypeInput {
		productVariationTypeId: ID
		productVariationType: String
	}

	type ProductVariationTypeResponse {
		productVariationTypeId: ID
		productVariationType: String
		Response: Response
	}


	extend type RootQuery {
		ProductVariationTypes: [ProductVariationType]
	}

	extend type RootMutation {
		productVariationTypeSave(input: ProductVariationTypeInput!): ProductVariationTypeResponse!
	}

`;
