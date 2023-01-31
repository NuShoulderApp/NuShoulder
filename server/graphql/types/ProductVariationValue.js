export default `
	type ProductVariationValue {
		productVariationTypeId: ID
		productVariationValueId: ID
		productVariationValue: String
	}

	input ProductVariationValueInput {
		productVariationValueId: ID
		productVariationValue: String
	}

	type ProductVariationValueResponse {
		productVariationValueId: ID
		productVariationValue: String
		Response: Response
	}


	extend type RootQuery {
		ProductVariationValues: [ProductVariationValue]
	}

	extend type RootMutation {
		productVariationValueSave(input: ProductVariationValueInput!): ProductVariationValueResponse!
	}

`;
