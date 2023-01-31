// QUERIES
const RootResolvers = {
	// Get all of the records for this company and product
	async CompanyDefaultProducts(root, {companyId, productId}, context) {
		const knex = context.knex;
		const companyDefaultProducts = await knex('companyDefaultProducts')
			.select('productsAccounts.*', 'products.productName')
			.join('productsAccounts', 'productsAccounts.productId', 'companyDefaultProducts.defaultProductId')
			.join('products', 'products.productId', 'companyDefaultProducts.defaultProductId')
			.where('companyDefaultProducts.companyId', companyId)
			.andWhere('companyDefaultProducts.productId', productId)
			.andWhere('productsAccounts.accountId', context.Account.accountId)

		return companyDefaultProducts;
	}
}

// EXPORT
export { RootResolvers }
