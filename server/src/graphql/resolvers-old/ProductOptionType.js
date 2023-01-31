export const RootResolvers = {
	async ProductOptionTypes(root, input, context) {
		const knex = context.knex;

		return await knex('productOptionTypes');
	}
}
