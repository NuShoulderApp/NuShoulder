// QUERIES
const RootResolvers = {
	async OrderServiceStatuses(root, args, context) {
		return await context.knex('orderServiceStatuses')
	}
}


// EXPORT
export { RootResolvers }
