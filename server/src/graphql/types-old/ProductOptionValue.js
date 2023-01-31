export default `
	type ProductOptionValue {
		productOptionValueId: ID
		valueLabel: String
		sortOrder: Int
		sortOrderProductOptionValues: Int
	}

	type ProductOptionValuesReorderResponse {
		ProductOptionValues: [ProductOptionValue]
		Response: Response
	}

	input ProductOptionValuesReorderInput {
		productOptionId: ID
		productOptionValueId: ID
		sortOrderProductOptionValueOld: Int
		sortOrderProductOptionValueNew: Int
	}
	input ProductOptionValueInput {
		productOptionValueId: ID
		valueLabel: String
	}

	type ProductOptionValueResponse {
		productOptionValueId: ID
		Response: Response
	}


	extend type RootQuery {
		ProductOptionValues: [ProductOptionValue]
	}

	extend type RootMutation {
		productOptionValueSave(input: ProductOptionValueInput!): ProductOptionValueResponse!
		productOptionValuesReorder(input: ProductOptionValuesReorderInput!): ProductOptionValuesReorderResponse
	}

`;
