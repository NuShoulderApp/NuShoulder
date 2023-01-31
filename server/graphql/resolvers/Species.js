// QUERIES
const SpeciesRootResolvers = {
	async Species(root, args, context) {
		return await context.knex('species')
	}
}


// EXPORT
export { SpeciesRootResolvers as RootResolvers }
