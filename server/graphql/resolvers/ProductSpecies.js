// QUERIES
const ProductSpeciesRootResolvers = {
	async ProductSpecies(root, input, context) {
		const productSpecies = await context.knex('productSpecies')
		return productSpecies;
	}
}

// EXPORT
export { ProductSpeciesRootResolvers as RootResolvers}
