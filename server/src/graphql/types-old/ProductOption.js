export default `
	type ProductOption {
		isRequired: Int
		maxLength: Int
		minLength: Int
		optionName: String
		productOptionId: ID
		productOptionTypeId: ID
		sortOrder: Int
		typeName: String
		ProductOptionValue: [ProductOptionValue]
	}

	input ProductOptionInput {
		isRequired: Int
		maxLength: Int
		minLength: Int
		optionName: String
		productOptionId: ID
		productOptionTypeId: ID
		productOptionValueIds: String
	}

	type ProductOptionResponse {
		productOptionId: ID
		ProductOptionValues: [ProductOptionValue]
		Response: Response
	}


	extend type RootQuery {
		ProductOptions: [ProductOption]
	}

	extend type RootMutation {
		productOptionSave(input: ProductOptionInput!): ProductOptionResponse!
	}

`;
