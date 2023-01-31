// main Product types and inputs to be exported
const ProductFields = `
	accountId: String
	accountDescriptionLong: String
	accountDescriptionShort: String
	accountProductName: String
	active: Int
	calculatedInvoiceCost: String
	calculatedInvoiceCostPersonalization: String
	calculatedPriceRetail: String
	calculatedPriceRetailPersonalization: String
	canUseKeepsakeStand: Int
	crematoryCost: String
	descriptionLong: String
	descriptionShort: String
	editable: Int
	height: Float
	invoiceCost: String
	invoiceCostPersonalization: String
	length: Float
	personalizationAllowed: Int
	personalizationDefaultedToYes: Int
	personalizationRequired: Int
	fragile: Int
	isFurClipping: Int
	isPawPrint: Int
	remainsFilledIndicator: Int
	requiresPawPrint: Int
	petWeightMax: Int
	petWeightMin: Int
	priceRetail: String
	priceRetailPersonalization: String
	productAccountActive: Int
	productCategory: String
	productCategoryId: ID
	productGroup: String
	productGroupId: ID
	productId: ID
	productMaterialId: ID
	productModel: String
	productName: String
	productTypeId: ID
	productType: String
	promotionalInvoiceCost: String
	promotionalInvoiceCostPersonalization: String
	promotionalPriceRetail: String
	promotionalPriceRetailPersonalization: String
	sortOrder: Int
	stockAvailable: String
	stockCheck: Int
	taxRate: Float
	unitWeightInvoiceCost: String
	unitWeightPriceRetail: String
	unitWeightPriceInterval: Int
	unitWeightPriceIntervalUnits: String
	unitWeightPriceMax: Int
	unitWeightPriceMin: Int
	weight: Float
	weightUnits: String
	width: Float
`;

const WeightTierPriceFields = `
	accountId: ID
	productId: ID
	invoiceCost: String
	priceRetail: String
	weightMin: Int
	weightMax: Int
	weightUnits: String
`;

export default `
	type Product {
		${ProductFields}
		ProductCompanyPrice(companyId: ID): ProductCompanyPrice
		ProductAccountWeightTierPrice: [ProductAccountWeightTierPrice]
		ProductAttributes: [ProductAttribute]
		ProductCompanyWeightTierPrice(companyId: ID): [ProductCompanyWeightTierPrice]
		ProductCompanyPromotions(companyId: ID): [ProductCompanyPromotion]
		ProductVariations(productId: ID!): [ProductVariation]
		Species: [Species]
		defaultImage: ProductImage
		images: [ProductImage]!
	}

	type ProductCremation {
		${ProductFields}
	}

	type ProductAccountWeightTierPrice {
		productPriceWeightId: ID
		${WeightTierPriceFields}
	}

	type ProductCompanyWeightTierPrice {
		productCompanyPriceWeightId: ID
		companyId: ID
		${WeightTierPriceFields}
	}

	type ProductMemorialization {
		materialDescription: String
		materialName: String
		parentCategory: String
		defaultImage: ProductImage
		images: [ProductImage]!
		ProductCompanyPromotion: ProductCompanyPromotion
		speciesId: ID
		${ProductFields}
	}

	type ProductVariation {
		productId: ID
		productVariationId: ID
		productVariationValueId: ID
	}

	type ProductPairing {
		childProduct: String
		childProductId: ID
		parentProduct: String
		parentProductId: ID
	}

	type ProductResponse {
		Product: Product
		Response: Response
	}

	type ProductAccountWeightTierPriceSaveResponse {
		ProductAccountWeightTierPrice: ProductAccountWeightTierPrice
		Response: Response
	}

	type ProductCompanyWeightTierPriceSaveResponse {
		ProductCompanyWeightTierPrice: ProductCompanyWeightTierPrice
		Response: Response
	}

	input ProductAccountWeightTierPriceInput {
		productPriceWeightId: ID
		${WeightTierPriceFields}
	}

	input ProductCompanyWeightTierPriceInput {
		productCompanyPriceWeightId: ID
		companyId: ID
		${WeightTierPriceFields}
	}

	input ProductInput {
		${ProductFields}
		# used on product save page for duplicating the product
		duplicateProduct: Boolean
		duplicateProductId: ID

		# optional image input
		defaultImage: ProductImageInput
		imageIds: [Int!]
		productOptionIds: [Int]
		productVariations: [String]
		speciesIds: [ID]
	}

	extend type RootQuery {
		CremationProducts(active: ID, companyId: ID, petReferenceNumber: String, productCategoryId: ID, productTypeId: ID): [Product]
		DeliveryProducts: [Product]
		Product(productId: ID!): Product
		Products: [Product]
		ProductsMemorialization(petReferenceNumber: String, productTypeId: ID, promotionsOnly: Boolean): [ProductMemorialization]
		ProductPairings(productId: ID): [ProductPairing]
		ProductsPairingsMemorializations: [Product]
	}

	extend type RootMutation {
		productSave(input: ProductInput!): ProductResponse!
		productAccountWeightTierPriceSave(input: ProductAccountWeightTierPriceInput!): ProductAccountWeightTierPriceSaveResponse!
		productAccountWeightTierPriceRemove(productPriceWeightId: ID!): ProductAccountWeightTierPriceSaveResponse!
		productCompanyWeightTierPriceSave(input: ProductCompanyWeightTierPriceInput!): ProductCompanyWeightTierPriceSaveResponse!
		productCompanyWeightTierPriceRemove(productCompanyPriceWeightId: ID!): ProductCompanyWeightTierPriceSaveResponse!
	}
`;
