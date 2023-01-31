import { Response } from "../../utilities/helpers";

const SubResolvers = {
	// OPTIONAL: get linked items in subresolvers
	async File({ fileId }, args, context) {
		//console.log("called File subresolver for PrintableOrder with fileId" + fileId);
		return await context.knex("files").where('files.fileId', fileId).first();
	}
}

// QUERIES
const RootResolvers = {
	async PrintableOrder(root, { printableOrderId }, context) {
		const knex = context.knex;

		const PrintableOrder = await knex('printablesOrders')
			.where({'printableOrderId': printableOrderId}).first();

		return PrintableOrder
	},
	async PrintableOrders(root, { orderId }, context) {
		const knex = context.knex;

		const PrintableOrders = await knex('printablesOrders')
			.where({'orderId ': orderId})
			.orderBy('dateCreated', 'DESC');

		return PrintableOrders
	}
}

// MUTATIONS
const Mutations = {
	async printableOrderGenerate(root, args, context) {
		context.knex;
	},

	// input is a Order object with the data to insert or update
	async printableOrderSave(root, { input }, context) {
		const knex = context.knex;

		const { printableOrderId, statusCompleted } = input;

		await knex('printablesOrders')
			.where({ printableOrderId: printableOrderId, accountID: context.Account.accountId })
			.update({statusCompleted});

		const PrintableOrder = await knex('printablesOrders')
			.where('printablesOrders.printableOrderId', input.printableOrderId)
			.andWhere('printablesOrders.accountId', context.Account.accountId);

		return Response(true,"success", { PrintableOrder: PrintableOrder });
	}
}

// EXPORT
export { Mutations, RootResolvers, SubResolvers }
