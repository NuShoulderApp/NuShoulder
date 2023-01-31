const CountrySubResolvers = {
	async States({countryId}, args, context) {
		const knex = context.knex;

		return await knex("states").where({countryId}).orderBy("state");
	}
}

// QUERIES
const CountryRootResolvers = {
	async Countries(root, args, context) {
		const knex = context.knex;

		return await knex("countries").orderBy("countryId");
	}
}

// EXPORT
export { CountryRootResolvers, CountrySubResolvers }
