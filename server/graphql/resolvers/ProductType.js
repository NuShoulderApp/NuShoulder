// QUERIES
const ProductTypeRootResolvers = {
	ProductType(root, {productTypeId}, context) {
		return context.knex('productTypes')
			.where({ productTypeId })
	},

	// Get Products
	ProductTypes: (root, args, context) => {
		return context.knex('productTypes').orderBy("productType", "asc");
	}
}

// EXPORT
export { ProductTypeRootResolvers as RootResolvers}
