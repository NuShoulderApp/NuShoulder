const SubResolvers = {
	// OPTIONAL: get linked items in subresolvers
	async File({ fileId }, args, context) {
		//console.log("called File subresolver for PrintableLogs with fileId" + fileId);
		return await context.knex("files").where('files.fileId', fileId).first();
	}
}

// QUERIES
const RootResolvers = {
	async PrintableLog(root, { printableLogId }, context) {
		const knex = context.knex;

		const PrintableLog = await knex('printablesLogs')
			.where({'printableLogId': printableLogId}).first();

		return PrintableLog
	},
	async PrintableLogs(root, { orderId }, context) {
		const knex = context.knex;

		const PrintableLogs = await knex('printablesLogs')
			.join('users', 'printablesLogs.userId', 'users.userId')
			.where({'printablesLogs.orderId ': orderId})
			.orderBy('printablesLogs.datePrinted', 'DESC');

		return PrintableLogs
	}
}

// MUTATIONS
const Mutations = {
	async printableLogSave(root, { input }, context) {
		// Only log this if there is a fileId passed in
		if(input.fileId > 0) {
			const knex = context.knex;
			const { fileId, orderId=0, printableId=0 } = input;
			const userId = context.Session.LoggedIn === true ? context.Session.User.userId : 0;

			await knex('printablesLogs').insert({
				'accountId': context.Account.accountId,
				'datePrinted': knex.fn.now(),
				'fileId': fileId,
				'orderId': orderId,
				'printableId': printableId,
				'userId': userId
			});
		}
	}
}

// EXPORT
export { Mutations, RootResolvers, SubResolvers }
