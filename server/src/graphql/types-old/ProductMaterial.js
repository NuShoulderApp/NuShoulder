// main ProductMaterial types and inputs to be exported
export default `
	type ProductMaterial {
		productMaterialId: ID
		materialDescription: String
		materialName: String
	}

	type ProductMaterialResponse {
		ProductMaterial: ProductMaterial
		Response: Response
	}

	input ProductMaterialInput {
		productMaterialId: ID
		materialDescription: String
		materialName: String
	}

	extend type RootQuery {
		ProductMaterial(productMaterialId: ID!): ProductMaterial
		ProductMaterials: [ProductMaterial]
	}

	extend type RootMutation {
		productMaterialSave(input: ProductMaterialInput!): ProductMaterialResponse!
	}

`;
