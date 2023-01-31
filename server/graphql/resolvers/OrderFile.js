// MUTATIONS

const SubResolvers = {
	async File(OrderFiles, args, context) {
		return await context.knex("files").where('fileId', OrderFiles.fileId ).first();
	}
};


const RootResolvers = {
	async OrderFiles(root, {orderId}, context) {
		const knex = context.knex;

		const OrderFiles = await knex('ordersFiles')
			.join('users', 'users.userId', 'ordersFiles.uploaderId')
			.where('ordersFiles.orderId', orderId )
			.orderBy('ordersFiles.fileId', 'desc');

		return OrderFiles
	}
}

const Mutations = {
	// input is an object with the data to insert or update
	async orderFileSave(root, { input }, context) {
		const knex = context.knex;

		const { documentDisplayName, fileId, orderId } = input;

		const [orderFileId] = await knex('ordersFiles').insert({ accountId: context.Account.accountId, documentDisplayName, fileId, orderId, uploaderId: context.Session.User.userId });

		return {...input, orderFileId};
	}
}


// EXPORT
export { Mutations, RootResolvers, SubResolvers }
