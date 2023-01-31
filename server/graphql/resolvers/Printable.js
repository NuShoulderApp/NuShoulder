const SubResolvers = {
	// OPTIONAL: get linked items in subresolvers
	/* async File({ fileId }, args, context) {
		console.log("called File subresolver for Printable with fileId" + fileId);
		return await context.knex("files").where('files.fileId', fileId).first();
	}
	*/
}

// QUERIES
const RootResolvers = {
	async Printable(root, { printableName }, context) {
		const knex = context.knex;

		const Printable = await knex('printables')
			.join('printablesAccounts', 'printablesAccounts.printableId', 'printables.printableId')
			.where('printables.printableName', printableName)
			.andWhere('printablesAccounts.accountId', context.Account.accountId)

		return Printable
	},
	async Printables(root, args, context) {
		const knex = context.knex;

		const Printables = await knex('printables')
			.join('printablesAccounts', 'printablesAccounts.printableId', 'printables.printableId')
			.where('printablesAccounts.accountId', context.Account.accountId)
			.orderBy('printables.printableType', 'ASC')
			.orderBy('printables.printableName', 'ASC');

		return Printables
	}
}

// MUTATIONS
const Mutations = {

}

// EXPORT
export { Mutations, RootResolvers, SubResolvers }
