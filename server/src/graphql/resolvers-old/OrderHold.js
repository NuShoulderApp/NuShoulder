import { Response } from "../../utilities/helpers";
import { Mutations as LogOrderActivityMutations } from "./LogOrderActivity";

// NOTE: use camelCase for fields and PascalCase for types and objects

// QUERIES
const OrderHoldRootResolvers = {
	// get the most recent orderHold for the orderId
	async OrderHold(root, {orderId}, context) {
		const knex = context.knex;
		return await knex('ordersHolds')
			.select('ordersHolds.*', 'companies.companyTypeId', 'users.firstName', 'users.lastName')
			.where({ orderId })
			.join('users', 'users.userId', 'ordersHolds.userId')
			.join('companies', 'users.companyId', 'companies.companyId')
			.orderBy('orderHoldId', 'desc')
			.limit(1);
	},

	async OrdersHolds(root, {companyId}, context) {
		const knex = context.knex;

		// if this is a clinic, just show orders for their company
		if(parseInt(context.Session.User.userTypeId) === 5) {
			return await knex('ordersHolds')
				.distinct()
				.select('orders.orderId')
				.join('orders', 'orders.orderId', 'ordersHolds.orderId')
				.join('users', 'users.userId', 'ordersHolds.userId')
				.join('companies', 'users.companyId', 'companies.companyId')
				.whereNull('ordersHolds.dateRemoved')
				.andWhere('orders.companyId', companyId)
				.andWhereNot('orders.orderStatusId', '6'); // Deleted = 6
		} 
		// Crematory staff - show all companies on their account
		else if(parseInt(context.Session.User.userTypeId) === 2 || parseInt(context.Session.User.userTypeId) === 3) {
			return await knex('ordersHolds')
				.distinct()
				.select('orders.orderId')
				.join('orders', 'orders.orderId', 'ordersHolds.orderId')
				.join('companies', 'orders.companyId', 'companies.companyId')
				.whereNull('ordersHolds.dateRemoved')
				.andWhere('companies.accountId', context.Account.accountId)
				.andWhereNot('orders.orderStatusId', '6'); // Deleted = 6
		}
	}
}

// MUTATIONS
const OrderHoldMutations = {
	// input is a Order object with the data to insert or update
	async orderHoldSave(root, { input }, context) {
		const knex = context.knex;

		const { orderHold, orderHoldId, orderId } = input;

		if(orderHoldId > 0) {
			await knex('ordersHolds')
				.where({ orderHoldId })
				.update({orderHoldRemovedReason: orderHold, removerId: context.Session.User.userId, dateRemoved: knex.fn.now() });

			const inputLog = {
				activity: `Order Hold removed 'Reason: ${orderHold}'`,
				activityType: 'Hold removed by user',
				dateCreated: knex.fn.now(),
				dbField: 'orderHoldRemovedReason',
				dbTable: 'ordersHolds',
				loggedInUserId: context.Session.User.userId,
				orderId: orderId,
				showVet: 1,
				userInitials: null,
				valueNew: null,
				valueOld: null
			};

			await LogOrderActivityMutations.logOrderActivitySave(null, { input: inputLog }, context);

			return Response(true,"Hold Successfully Removed", {OrderHold: input});
		} else {
			const [newOrderHoldId] =  await knex('ordersHolds')
				.insert({orderHoldReason: orderHold, orderId, userId: context.Session.User.userId});

			const inputLog = {
				activity: `Order Hold added 'Reason: ${orderHold}'`,
				activityType: 'Hold added by user',
				dateCreated: knex.fn.now(),
				dbField: 'orderHoldReason',
				dbTable: 'ordersHolds',
				loggedInUserId: context.Session.User.userId,
				orderId: orderId,
				showVet: 1,
				userInitials: null,
				valueNew: null,
				valueOld: null
			};

			await LogOrderActivityMutations.logOrderActivitySave(null, { input: inputLog }, context);

			return Response(true,"Hold Successfully Created", {OrderHold: { ...input, orderHoldId: newOrderHoldId }});
		}
	}
}

// EXPORT
export { OrderHoldMutations as Mutations, OrderHoldRootResolvers }
