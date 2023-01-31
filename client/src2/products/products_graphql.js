import gql from 'graphql-tag';

// common fields for Product images
export const productImageFields = `
	productId
	productImageId
	caption
	defaultImage
	image {
		location
		filename
		fileId
	}
	Species {
		speciesId
		species
	}
	thumbnails {
		size
		height
		width
		file {
			location
			filename
		}
	}
	uniqueImage
`;

const ProductFields = `
	accountId
	active
	accountDescriptionLong
	accountDescriptionShort
	accountProductName
	crematoryCost
	descriptionLong
	descriptionShort
	editable
	height
	invoiceCost
	invoiceCostPersonalization
	length
	personalizationAllowed
	personalizationDefaultedToYes
	personalizationRequired
	fragile
	isFurClipping
	isPawPrint
	remainsFilledIndicator
	requiresPawPrint
	petWeightMax
	petWeightMin
	priceRetail
	priceRetailPersonalization
	productAccountActive
	productCategoryId
	productCategory
	productGroupId
	productId
	productMaterialId
	productModel
	productName
	productTypeId
	productType
	sortOrder
	stockAvailable
	stockCheck
	taxRate
	unitWeightInvoiceCost
	unitWeightPriceRetail
	unitWeightPriceInterval
	unitWeightPriceIntervalUnits
	unitWeightPriceMax
	unitWeightPriceMin
	weight
	weightUnits
	width
	ProductAccountWeightTierPrice {
		productPriceWeightId
		productId
		accountId
		invoiceCost
		priceRetail
		weightMin
		weightMax
		weightUnits
	}
	Species {
		speciesId
		species
	}
	defaultImage {
		${productImageFields}
	}
	images {
		${productImageFields}
	}
`;

export const getProductAttributesQuery = gql`
	query getProductAttributes ($productId: ID!) {
        ProductAttributes (productId: $productId) {
            isDefault
            isRequired
            maxLength
            minLength
            optionName
            productAttributeId
            productId
            productOptionId
            productOptionRequired
            productOptionValueId
			sortOrderProductOption
			sortOrderProductOptionValues
            typeName
            valueLabel
        }
	}
`;

export const getProductCategoriesQuery = gql`
	query getProductCategories {
		ProductCategories {
			active
			editable
			parentCategoryId
			productCategory
			productCategoryId
			productTypeId
		}
		ProductTypes {
			productType
			productTypeId
		}
	}
`;

export const getProductMaterialsQuery = gql`
	query getProductMaterials {
		ProductMaterials {
			productMaterialId
			materialDescription
			materialName
		}
	}
`;

export const getProductQuery = gql`
	query getProduct ($productId: ID!) {
		Product (productId: $productId) {
			${ProductFields}
			ProductAttributes {
				productAttributeId
				productOptionId
				optionName
				sortOrderProductOption
			}
			ProductVariations(productId: $productId) {
				productId
				productVariationId
				productVariationValueId
			}
		}
		ProductCategories {
			active
			parentCategoryId
			productCategory
			productCategoryId
			productTypeId
		}
		ProductGroups {
			productGroup
			productGroupId
		}
		ProductMaterials {
			materialDescription
			materialName
			productMaterialId
		}
		ProductTypes {
			productType
			productTypeId
		}
		Species {
			species,
			speciesId
		}
	}
`;

export const getProductImageQuery = gql`
	query getProductImage ($productId: ID!) {
		Product (productId: $productId) {
			productId
			productName
			defaultImage {
				${productImageFields}
			}
			images {
				${productImageFields}
			}
		}
	}
`;

export const getSpeciesQuery = gql`
	query Species {
		Species {
			species,
			speciesId
		}
	}
`;

export const getProductsMemorializationPromotionsQuery = gql`
	query getProductsMemorializationPromotions ($petReferenceNumber: String, $productTypeId: ID, $promotionsOnly: Boolean) {
		ProductsMemorialization (petReferenceNumber: $petReferenceNumber, productTypeId: $productTypeId, promotionsOnly: $promotionsOnly) {
			productId
			active
			calculatedInvoiceCost
			calculatedInvoiceCostPersonalization
			calculatedPriceRetail
			calculatedPriceRetailPersonalization
			promotionalPriceRetail
			promotionalPriceRetailPersonalization
			promotionalInvoiceCost
			promotionalInvoiceCostPersonalization
			ProductCompanyPromotion {
				productCompanyPromotionId
				units
				maxQuantity
				amountDiscount
			}
		}
	}
`;

export const getProductsMemorializationQuery = gql`
	query getProductsMemorialization ($petReferenceNumber: String, $productTypeId: ID, $promotionsOnly: Boolean) {
		ProductsMemorialization (petReferenceNumber: $petReferenceNumber, productTypeId: $productTypeId, promotionsOnly: $promotionsOnly) {
			active
      accountDescriptionLong
			accountDescriptionShort
			accountProductName
			calculatedInvoiceCost
      calculatedInvoiceCostPersonalization
      calculatedPriceRetail
			calculatedPriceRetailPersonalization
			promotionalPriceRetail
			promotionalPriceRetailPersonalization
			promotionalInvoiceCost
			promotionalInvoiceCostPersonalization
			ProductCompanyPromotion {
				productCompanyPromotionId
				units
				maxQuantity
				amountDiscount
			}
			descriptionLong
			descriptionShort
			editable
			height
			length
			materialDescription
			materialName
      parentCategory
			personalizationAllowed
			personalizationDefaultedToYes
			personalizationRequired
			petWeightMax
			petWeightMin
			productAccountActive
			productCategory
			productCategoryId
			productGroupId
			productId
			productMaterialId
			productModel
			productName
			productTypeId
			sortOrder
			speciesId
			stockAvailable
			stockCheck
      taxRate
			width
			defaultImage {
					${productImageFields}
			}
			images {
					${productImageFields}
			}
		}
    CremationProducts (petReferenceNumber: $petReferenceNumber, productTypeId: $productTypeId) {
      active
			accountDescriptionLong
			accountDescriptionShort
			accountProductName
			calculatedInvoiceCost
			calculatedInvoiceCostPersonalization
			calculatedPriceRetail
			calculatedPriceRetailPersonalization
			descriptionLong
			descriptionShort
			productCategory
			productCategoryId
			productId
			productName
			productTypeId
			sortOrder
			defaultImage {
				${productImageFields}
			}
			images {
				${productImageFields}
			}
		}
		ProductGroups {
			productGroup
			productGroupId
		}
		ProductOptionValues {
			productOptionValueId
			valueLabel
		}
		Species {
			species,
			speciesId
		}
	}`;

export const getCremationProductsQuery = gql`
	query getCremationProducts ($companyId: ID, $productTypeId: ID){
		CremationProducts (companyId: $companyId, productTypeId: $productTypeId){
			accountProductName
			productCategory
			productId
			productName
			ProductCompanyWeightTierPrice (companyId: $companyId) {
				productId
				invoiceCost
				priceRetail
				weightMin
				weightMax
				weightUnits
			}
		}
	}
`;

export const getProductsQuery = gql`
	query getProducts {
		Products {
			active
			accountDescriptionLong
			accountDescriptionShort
			accountProductName
			descriptionLong
			descriptionShort
			editable
			height
			length
			personalizationAllowed
			personalizationDefaultedToYes
			personalizationRequired
			productAccountActive
			productCategoryId
			productCategory
			productGroup
			productGroupId
			productId
			productMaterialId
			productModel
			productName
			productTypeId
			productType
			sortOrder
			stockAvailable
			weight
			weightUnits
			width
			defaultImage {
				${productImageFields}
			}
			images {
				${productImageFields}
			}
		}
	}
`;

export const getProductCompanyPromotionsCremationsQuery = gql`
	query getProductCompanyPromotionsCremations($companyId: ID!) {
		ProductCompanyPromotionsCremations (companyId: $companyId) {
			amountDiscount
			productCategory
			productCategoryId
			productCompanyPromotionId
			productId
		}
	}
`;

export const getProductCompanyPromotionsProductsQuery = gql`
	query getProductCompanyPromotionsProducts {
		ProductCompanyPromotionsProducts {
			isFurClipping
			isPawPrint
			productCompanyPromotionId
			productName
			promotionalProductId
		}
	}
`;


export const getProductSpeciesQuery = gql`
	query getProductSpecies {
		ProductSpecies {
			productId
			speciesId
		}
	}
`;

export const getProductsListQuery = gql`
	query getProducts {
		Products {
			productId
			productName
			productCategoryId
		}
	}
`;

export const getProductGroups = gql `
	query getProductGroups {
		ProductGroups {
			productGroupId
			productGroup
  	}
	}
`;

export const getProductGroupsMemorializations = gql `
	query getProductGroupsMemorializations {
		ProductGroupsMemorializations {
			productGroupId
			productGroup
			productId
			productName
			productVariationType
			productVariationTypeId
			productVariationValue
			productVariationValueId
  	}
	}
`;

export const getProductOptions = gql `
	query getProductOptions {
		ProductOptions {
			maxLength
			minLength
			productOptionId
			productOptionTypeId
			optionName
			isRequired
			sortOrder
			typeName
			ProductOptionValue {
				productOptionValueId
				valueLabel
			}

		}
  	}
`;

export const getProductOptionTypes = gql `
	query getProductOptionTypes {
		ProductOptionTypes {
			productOptionTypeId
			typeName
		}
  	}
`;

export const getProductOptionValues = gql `
	query getProductOptionValues {
		ProductOptionValues {
			productOptionValueId
			valueLabel
		}
  	}
`;

export const getProductPairings = gql `
	query getProductPairings ($productId: ID){
		ProductPairings (productId: $productId){
			childProduct
			childProductId
			parentProduct
			parentProductId
		}
  }
`;

export const getProductsPairingsMemorializations = gql `
	query getProductsPairingsMemorializations {
		ProductsPairingsMemorializations {
			productId
			productName
		}
  }
`;

export const getProductVariationTypes = gql `
	query getProductVariationTypes {
		ProductVariationTypes {
			productVariationTypeId
			productVariationType
  	}
	}
`;

export const getProductVariationValues = gql `
	query getProductVariationValues {
		ProductVariationValues {
			productVariationTypeId
			productVariationValueId
			productVariationValue
  	}
	}
`;

export const ProductCategorySaveMutation = gql`
	mutation productCategorySave($input: ProductCategoryInput!) {
		productCategorySave (input: $input) {
			Response{
				success
				message
			}
			ProductCategory{
				active
				parentCategoryId
				productCategory
				productCategoryId
				productTypeId
			}
		}
	}
`;

export const ProductGroupSaveMutation = gql`
	mutation productGroupSave($input: ProductGroupInput!) {
		productGroupSave (input: $input) {
			productGroupId
			productGroup
			Response{
				success
				message
			}
		}
	}
`;

export const ProductMaterialSaveMutation = gql`
	mutation productMaterialSave($input: ProductMaterialInput!) {
		productMaterialSave (input: $input) {
			Response{
				success
				message
			}
			ProductMaterial {
				productMaterialId
				materialDescription
				materialName
			}
		}
	}
`;

export const ProductOptionSaveMutation = gql`
	mutation productOptionSave($input: ProductOptionInput!) {
		productOptionSave (input: $input) {
			productOptionId
			ProductOptionValues {
				productOptionValueId
	            valueLabel
			}
			Response{
				success
				message
			}
		}
	}
`;

export const ProductOptionValueSaveMutation = gql`
	mutation productOptionValueSave($input: ProductOptionValueInput!) {
		productOptionValueSave (input: $input) {
			productOptionValueId
			Response{
				success
				message
			}
		}
	}
`;

export const ProductSaveMutation = gql`
	mutation productSave($input: ProductInput!) {
		productSave (input: $input) {
			Response{
				success
				message
			}
			Product {
				${ProductFields}
				ProductAttributes {
					productAttributeId
					productOptionId
					optionName
					sortOrderProductOption
				}
			}
		}
	}
`;


export const ProductImageSaveMutation = gql`
	mutation saveProductImage($image: ProductImageInput!) {
		saveProductImage(image: $image) {
			Response {
				message
				success
			}
			productImage {
				${productImageFields}
			}
		}
	}
`

export const ProductImageUploadMutation = gql`
	mutation uploadProductImage($file: Upload!) {
		uploadProductImage(file: $file) {
			Response {
				message
				success
			}
			image {
				location
				filename
				fileId
			}
		}
	}
`;

export const ProductImageDeleteMutation = gql`
	mutation uploadProductImage($image: ProductImageInput!) {
		removeProductImage(image:$image) {
			Response {
				message
				success
			}
			product {
				active
				descriptionLong
				descriptionShort
				editable
				height
				length
				productCategoryId
				productId
				productMaterialId
				productModel
				productName
				productTypeId
				sortOrder
				stockAvailable
				stockCheck
				weight
				weightUnits
				width
				defaultImage {
					${productImageFields}
				}
				images {
					${productImageFields}
				}
			}
		}
	}
`;

export const ProductImageMakeDefaultMutation = gql`
	mutation updateDefault($productImageId: Int!){
		makeProductImageDefault(productImageId:$productImageId, setDefault: true){
			Response {
				message
				success
			}
			product {
				active
				descriptionLong
				descriptionShort
				editable
				height
				length
				personalizationAllowed
				productCategoryId
				productId
				productMaterialId
				productModel
				productName
				productTypeId
				sortOrder
				stockAvailable
				stockCheck
				weight
				weightUnits
				width
				defaultImage {
					${productImageFields}
				}
				images {
					${productImageFields}
				}
			}
		}
	}
`;

export const ProductAccountSaveMutation = gql`
	mutation productAccountSave($input: ProductAccountInput!) {
		productAccountSave(input: $input) {
			Response {
				message
				success
			}
		}
	}
`;

export const ProductAccountWeightTierPriceSaveMutation = gql`
	mutation productAccountWeightTierPriceSave($input: ProductAccountWeightTierPriceInput!) {
		productAccountWeightTierPriceSave(input: $input) {
			Response {
				message
				success
			}
			ProductAccountWeightTierPrice {
				productPriceWeightId
				productId
				accountId
				invoiceCost
				priceRetail
				weightMin
				weightMax
				weightUnits
			}
		}
	}
`;

export const ProductAccountWeightTierPriceRemoveMutation = gql`
	mutation productAccountWeightTierPriceRemove($productPriceWeightId: ID!) {
		productAccountWeightTierPriceRemove(productPriceWeightId: $productPriceWeightId) {
			Response {
				message
				success
			}
		}
	}
`;

export const ProductAttributesSaveMutation = gql`
	mutation productAttributesSave($input: ProductAttributesInput!) {
		productAttributesSave(input: $input) {
			ProductAttributes {
				productAttributeId
				productOptionId
				optionName
				sortOrderProductOption
			}
			Response {
				message
				success
			}
		}
	}
`;

export const ProductOptionsReorderMutation = gql`
	mutation productOptionsReorder($input: ProductOptionsReorderInput!) {
		productOptionsReorder (input: $input) {
			ProductAttributes {
				productAttributeId
				productOptionId
				optionName
				sortOrderProductOption
			}
			Response {
				success
				message
			}
		}
	}
`;

export const ProductOptionValuesReorderMutation = gql`
	mutation productOptionValuesReorder($input: ProductOptionValuesReorderInput!) {
		productOptionValuesReorder (input: $input) {
			ProductOptionValues {
				productOptionValueId
				valueLabel
			}
			Response {
				success
				message
			}
		}
	}
`;

export const ProductViewSaveMutation = gql`
	mutation productViewSave($input: ProductViewInput!) {
		productViewSave (input: $input) {
			Response{
				success
				message
			}
		}
	}
`;


