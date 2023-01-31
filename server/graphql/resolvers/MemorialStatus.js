// QUERIES
const MemorialStatusQueries = {
	async MemorialStatuses(root, args, context) {
		return await context.knex('memorialStatuses');
	}
}


// EXPORT
export { MemorialStatusQueries as RootResolvers }
