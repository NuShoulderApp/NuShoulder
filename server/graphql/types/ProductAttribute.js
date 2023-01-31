export default `
	type ProductAttribute {
        isDefault: Boolean
		isRequired: Boolean
		maxLength: Int
		minLength: Int
		optionName: String
		productAttributeId: ID
		productId: ID
		productOptionId: ID
		productOptionRequired: Boolean
		productOptionValueId: ID
		sortOrderProductOption: Int
		sortOrderProductOptionValues: Int
		typeName: String
		valueLabel: String
	}

	type ProductAttributesResponse {
		ProductAttributes: [ProductAttribute]
		Response: Response
	}

	type ProductOptionsReorderResponse {
		ProductAttributes: [ProductAttribute]
		Response: Response
	}

	input ProductAttributesInput {
		productId: ID
		productOptionIds: String
	}

	input ProductOptionsReorderInput {
		productId: ID
		productOptionId: ID
		sortOrderProductOptionOld: Int
		sortOrderProductOptionNew: Int
	}

	extend type RootQuery {
		ProductAttributes(productId: ID!): [ProductAttribute]
	}

	extend type RootMutation {
		productAttributesSave(input: ProductAttributesInput!): ProductAttributesResponse!
		productOptionsReorder(input: ProductOptionsReorderInput!): ProductOptionsReorderResponse
	}

`;
