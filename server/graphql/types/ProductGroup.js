export default `
	type ProductGroup {
		productGroupId: ID
		productGroup: String
	}

	type ProductGroupsMemorialization {
		productGroupId: ID
		productGroup: String
		productId: ID
		productName: String
		productVariationType: String
		productVariationTypeId: ID
		productVariationValue: String
		productVariationValueId: ID
	}

	input ProductGroupInput {
		productGroupId: ID
		productGroup: String
	}

	type ProductGroupResponse {
		productGroupId: ID
		productGroup: String
		Response: Response
	}

	extend type RootQuery {
		ProductGroups: [ProductGroup]
		ProductGroupsMemorializations: [ProductGroupsMemorialization]
	}

	extend type RootMutation {
		productGroupSave(input: ProductGroupInput!): ProductGroupResponse!
	}

`;
