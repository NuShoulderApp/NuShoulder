
export default `
	type ProductCompanyPromotion {
		productCompanyPromotionId: ID
		ProductCategory: ProductCategory
		productId: ID
		Products: [Product]
		amountDiscount: String
		maxQuantity: Int
		units: Int
		personalization: Int
		retail: Int
	}

	type ProductCompanyPromotionCremation {
		amountDiscount: String
		productCategory: String
		productCategoryId: ID
		productCompanyPromotionId: ID
		productId: ID
	}

	type ProductCompanyPromotionProduct {
		isFurClipping: Int
		isPawPrint: Int
		productCompanyPromotionId: ID
		productName: String
		promotionalProductId: ID
	}

	type ProductCompanyPromotionResponse {
		Response: Response
		ProductCompanyPromotion: ProductCompanyPromotion
	}

	input ProductCompanyPromotionInput {
		productCompanyPromotionId: ID
		companyId: ID
		productId: ID
		productCategoryId: ID
		productIds: [Int]
		amountDiscount: String
		maxQuantity: Int
		units: Int
		personalization: Int
		retail: Int
	}

	extend type RootQuery {
		ProductCompanyPromotions(companyId: ID, productId: ID): [ProductCompanyPromotion]
		ProductCompanyPromotionsCremations(companyId: ID): [ProductCompanyPromotionCremation]
		ProductCompanyPromotionsProducts: [ProductCompanyPromotionProduct]
	}

	extend type RootMutation {
		productCompanyPromotionRemove(productCompanyPromotionId: ID!): ProductCompanyPromotionResponse!
		productCompanyPromotionSave(input: ProductCompanyPromotionInput!): ProductCompanyPromotionResponse!
	}
`;
