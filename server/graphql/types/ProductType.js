// main ProductType types and inputs to be exported
export default `
	type ProductType {
		productType: String
		productTypeId: ID
	}

	extend type RootQuery {
		ProductType(productTypeId: ID!): ProductType
		ProductTypes: [ProductType]
	}

`;
