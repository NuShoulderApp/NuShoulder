// QUERIES
const StateRootResolvers = {
	async States(root, args, context) {
		return await context.knex("states").orderBy("countryId", "state");
	}
}

// EXPORT
export { StateRootResolvers }
