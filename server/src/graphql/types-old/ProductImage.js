// main Product types and inputs to be exported
const ProductImageFields = `
	productId: Int
	productImageId: Int
	defaultImage: Int
	caption: String
	image: File
	Species: [Species]
	uniqueImage: Int
`;

export default `
	type ProductImage {
		${ProductImageFields}
		thumbnails: [ProductImageThumbnail]!
	}

	input ProductImageInput {
		# id of productImage record to be updated (0 = create record)
		productImageId: Int

		# record data
		caption: String
		fileId: Int
		productId: Int
		speciesIds: [Int]
	}

	type ProductImageThumbnail {
		size: String
		height: Int
		width: Int
		file: File
	}

	type ProductImageUploadResponse {
		Response: Response!

		# return uploaded image file data
		image: File
	}

	type ProductImageSaveResponse {
		Response: Response!

		# return updated product image object
		productImage: ProductImage
	}

	type ProductImageDeleteResponse {
		Response: Response!

		# Return updated product object
		product: Product
	}


	type DefaultImageResponse {
		Response: Response!

		# return updated product object
		product: Product
	}

	extend type RootMutation {
		# uploads file
		uploadProductImage(file: Upload!): ProductImageUploadResponse!

		# creates or edits a record in the productImages table
		saveProductImage(image: ProductImageInput!): ProductImageSaveResponse!

		removeProductImage(image: ProductImageInput!): ProductImageDeleteResponse!

		# set an image to be default
		makeProductImageDefault(productImageId: Int!, setDefault: Boolean): DefaultImageResponse!
	}
`;