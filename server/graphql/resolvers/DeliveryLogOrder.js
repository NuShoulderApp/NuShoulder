
export const SubResolvers = {
	async Order({ orderId }, args , context) {
		return await context.knex("orders")
			.where({ orderId }).first();
	},
	async newStatus( { newStatus: orderStatusId }, args, context ) {
		return await context.knex("orderStatuses").where({ orderStatusId }).first();
	}
};
