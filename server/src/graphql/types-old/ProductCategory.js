// main ProductCategory types and inputs to be exported
export default `
	type ProductCategory {
		active: Int
		editable: Int
		parentCategoryId: ID
		productCategory: String
		productCategoryId: ID
		productTypeId: ID
	}

	type ProductCategoryResponse {
		ProductCategory: ProductCategory
		Response: Response
	}

	input ProductCategoryInput {
		active: Int
		parentCategoryId: ID
		productCategory: String
		productCategoryId: ID
		productTypeId: ID
	}

	extend type RootQuery {
		ProductCategory(ProductCategoryId: ID!): ProductCategory
		ProductCategories: [ProductCategory]
	}

	extend type RootMutation {
		productCategorySave(input: ProductCategoryInput!): ProductCategoryResponse!
	}

`;
