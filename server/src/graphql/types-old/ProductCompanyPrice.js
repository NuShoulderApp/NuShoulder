export default `
	type ProductCompanyPrice {
		productCompanyPriceId: ID
		accountId: ID
		companyId: ID
		invoiceCost: String
		invoiceCostPersonalization: String
		priceRetail: String
		priceRetailPersonalization: String
		productId: ID
		unitWeightInvoiceCost: String
		unitWeightPriceRetail: String
		unitWeightPriceInterval: Int
		unitWeightPriceIntervalUnits: String
		unitWeightPriceMax: Int
		unitWeightPriceMin: Int
	}

	input ProductCompanyPriceInput {
		productCompanyPriceId: ID
		productId: ID
		companyId: ID
		invoiceCost: String
		invoiceCostPersonalization: String
		priceRetail: String
		priceRetailPersonalization: String
		unitWeightInvoiceCost: String
		unitWeightPriceRetail: String
		unitWeightPriceInterval: Int
		unitWeightPriceIntervalUnits: String
		unitWeightPriceMax: Int
		unitWeightPriceMin: Int
	}

	type ProductCompanyPriceResponse{
		Response: Response
		ProductCompanyPrice: ProductCompanyPrice
	}

	extend type RootMutation {
		productCompanyPriceSave(input: ProductCompanyPriceInput!): ProductCompanyPriceResponse!
	}
`;
