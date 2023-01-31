import { Response } from "../../utilities/helpers";

// QUERIES
export const RootResolvers = {
	async OrderStatus(root, { orderStatusId }, context) {
		return await context.knex('orderStatuses AS os')
			.select('os.*', 'osa.sortOrder', 'osa.active', context.knex.raw(`IF( os.accountId = ${context.Account.accountId}, true, false) as editable`))
			.leftOuterJoin('orderStatusesAccounts AS osa', 'os.orderStatusId', 'osa.orderStatusId')
			.where({'osa.accountId': context.Account.accountId, 'os.orderStatusId': orderStatusId})
			.first();
	},
	
	async OrderStatuses(root, args, context) {
		return await context.knex('orderStatuses AS os')
			.select('os.*', 'osa.sortOrder', 'osa.active', context.knex.raw(`IF( os.accountId = ${context.Account.accountId}, true, false) as editable`))
			.leftOuterJoin('orderStatusesAccounts AS osa', 'os.orderStatusId', 'osa.orderStatusId')
			.where({'osa.accountId': context.Account.accountId})
			.orderBy('osa.sortOrder', 'ASC')
			.orderBy('os.defaultSortOrder', 'ASC')
			.orderBy('os.orderCompletedIndicator', 'ASC')
			.orderBy('os.orderStatus', 'ASC');
	}
}

export const Mutations = {
	async OrderStatusReorder(root, { input }, context) {
		const knex = context.knex;

		const {
			orderStatusId,
			sortOrderOld,
			sortOrderNew
		} = input;

		// update other order statuses
		if (sortOrderOld > sortOrderNew) {
			await knex('orderStatusesAccounts')
				.where({ accountId: context.Account.accountId })
				.andWhere('sortOrder', '>=', sortOrderNew)
				.andWhere('sortOrder', '<', sortOrderOld)
				.increment('sortOrder', 1);
		} else if (sortOrderOld < sortOrderNew) {
			await knex('orderStatusesAccounts')
				.where({ accountId: context.Account.accountId })
				.andWhere('sortOrder', '<=', sortOrderNew)
				.andWhere('sortOrder', '>', sortOrderOld)
				.decrement('sortOrder', 1);
		}

		// update sortOrder to sortOrderNew
		await knex('orderStatusesAccounts')
			.where({ orderStatusId: orderStatusId, accountId: context.Account.accountId })
			.update({sortOrder: sortOrderNew})

		// Return Updated Order Statuses
		const OrderStatuses = RootResolvers.OrderStatuses({}, {}, context);

		return Response(true,"Status Order Saved", {OrderStatuses});
	},
	async OrderStatusSave(root, { input }, context) {
		const knex = context.knex;

		const {
			active,
			barcode,
			orderStatus,
			orderStatusId,
			visibleOrderUpdater
		} = input;

		const accountId = context.Account.accountId;
		let OrderStatuses = null;
		let OrderStatus = null;

		// validate that the order status name and barcdeo are unique


		if(orderStatusId > 0) {
			// update order status
			await knex('orderStatuses')
				.where({ accountId: accountId, orderStatusId: orderStatusId })
				.update({barcode, orderStatus, visibleOrderUpdater})
			// set if order status is active on this account
			await knex('orderStatusesAccounts')
				.where({ accountId: accountId, orderStatusId: orderStatusId })
				.update({active})
			// get updated info to return
			OrderStatuses = RootResolvers.OrderStatuses({}, {}, context)
			OrderStatus = RootResolvers.OrderStatus({}, {orderStatusId}, context)

			return Response(true,"Order Status Saved", { OrderStatus: OrderStatus, OrderStatuses: OrderStatuses });
		} else {
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const [orderStatusId] = await knex('orderStatuses')
				.insert({ 'accountId': context.Account.accountId, 'barcode': barcode, 'defaultSortOrder': null , 'orderCompletedIndicator': 0, 'orderStatus': orderStatus, 'visibleOrderUpdater': visibleOrderUpdater, 'statusAtCrematory': 1, 'statusAtVet': 0, 'statusInTransit': 0})
			// get the sortOrder to insert the order status into the orderStatusesAccounts table at
			const sortOrderStatus = await knex('orderStatusesAccounts')
				.where('orderStatusId', 9)
				.andWhere('accountId', context.Account.accountId)
				.first();
			// reorder the orderStatusesAccounts table to fit everything in the correct order then add the new status in the spot we free up
			await knex('orderStatusesAccounts')
				.where({ accountId: context.Account.accountId })
				.andWhere('sortOrder', '>=', sortOrderStatus.sortOrder)
				.increment('sortOrder', 1);
			// add to the orderStatusesAccounts table then 
			await knex('orderStatusesAccounts')
				.insert({ 'accountId': context.Account.accountId, 'active': active, 'orderStatusId': orderStatusId, 'sortOrder': sortOrderStatus.sortOrder});

			// get info to return
			OrderStatuses = RootResolvers.OrderStatuses({}, {}, context)
			OrderStatus = RootResolvers.OrderStatus({}, {orderStatusId}, context)

			return Response(true,"Order Status Saved", {OrderStatus: OrderStatus, OrderStatuses: OrderStatuses });
		}
	}
}
