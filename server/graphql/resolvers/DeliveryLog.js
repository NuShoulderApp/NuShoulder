
export const RootResolvers = {

	async DeliveryLog(root, { deliveryLogId }, context) {
		return await context.knex("deliveryLog")
			.select(
				'addresses.*',
				'companies.companyName',
				'deliveryLog.deliveryLogId',
				'deliveryLog.dateCreated',
				'routes.routeName',
				'signatures.signatureData',
				'signatureUser.firstName as signatureFirstName',
				'states.state',
				'users.firstName',
				'users.lastName'
			)
			.join('addresses', 'addresses.addressId', 'deliveryLog.deliveryAddressId')
			.join('companies', 'companies.companyId', 'deliveryLog.companyId')
			.join('routes', 'routes.routeId', 'deliveryLog.routeId')
			.join('signatures', 'signatures.signatureId', 'deliveryLog.signatureId')
			.join('states', 'states.stateId', 'addresses.stateId')
			.join('users', 'users.userId', 'deliveryLog.driverId')
			.join('users as signatureUser', 'signatureUser.userId', 'signatures.collectedByUserId')
			.where({ deliveryLogId }).first();
	},

	async DeliveryLogCompanies(root, args, context) {
		return await context.knex("deliveryLog")
			.distinct()
			.select("deliveryLog.companyId", "companies.companyName")
			.join("companies", "companies.companyId", "deliveryLog.companyId")
			.where("deliveryLog.accountId", context.Account.accountId)
			.orderBy("companies.companyname", "asc")
	},

	async DeliveryLogs(root, {companyIds='', dateEnd, dateStart, routeIds=''}, context) {
		const companyIdsArray = companyIds.split(",");
		const routeIdsArray = routeIds.split(",");
		// Note: in the 'whereIn' statements, we check for companyIds/routeIds being blank as opposed to companyIdsArray.length > 0 because a blank companyIds will still make a single cell array, so length =1
		// (continued) Which is the same as if a single companyId was passed in companyIds. So checking for a blank companyIds to then get all companies on the account is the correct approach.
		const DeliveryLogs = await context.knex("deliveryLog")
			.where("deliveryLog.accountId",context.Account.accountId)
			.whereIn("deliveryLog.companyId", function() {
				if(companyIds !== '') {
					this.select('companyId')
						.from('companies')
						.whereIn('companyId', companyIdsArray)
				} else {
					this.select('companyId')
						.from('companies')
						.where('accountId', context.Account.accountId)
				}
			})
			.whereIn("deliveryLog.routeId", function() {
				if(routeIds !== '') {
					this.select('routeId')
						.from('routes')
						.whereIn('routeId', routeIdsArray)
				} else {
					this.select('routeId')
						.from('routes')
						.where('accountId', context.Account.accountId)
				}
			})
			.andWhere("deliveryLog.dateCreated", "<", dateEnd)
			.andWhere("deliveryLog.dateCreated", ">", dateStart)
			.orderBy("deliveryLog.dateCreated", "desc");

		return DeliveryLogs;
	},
	 	// Get the specific logs and signature for a given order
	async DeliveryLogOrderDetails(root, { orderId } , context) {

		return await context.knex("deliveryLogsOrders")
			.select(
				'deliveryLog.deliveryLogId',
				'deliveryLog.dateCreated',
				'deliveryLogsOrders.deliveryLogOrderId',
				'deliveryLogsOrders.deliveryType',
				'routes.routeName',
				'signatures.signatureData',
				'signatureUser.firstName as signatureFirstName',
				'signatureUser.lastName as signatureLastName',
				'users.firstName',
				'users.lastName'
			)
			.join('deliveryLog', 'deliveryLog.deliveryLogId', 'deliveryLogsOrders.deliveryLogId')
			.leftJoin('routes', 'routes.routeId', 'deliveryLog.routeId')
			.join('signatures', 'signatures.signatureId', 'deliveryLog.signatureId')
			.join('users', 'users.userId', 'deliveryLog.driverId')
			.join('users as signatureUser', 'signatureUser.userId', 'signatures.collectedByUserId')
			.where('deliveryLogsOrders.orderId', orderId);
	}

};

export const SubResolvers = {
	async Driver({ driverId: userId }, args , context) {
		return await context.knex("users")
			//.where("accountId", context.Account.accountId)
			.where({ userId }).first();
	},
	async Route({ routeId }, args , context) {
		return await context.knex("routes")
			//.where("accountId", context.Account.accountId)
			.where({ routeId }).first();
	},
	async Company({ companyId }, args , context) {
		return await context.knex("companies")
			.where("accountId", context.Account.accountId)
			.where({ companyId }).first();
	},
	async CompanyAddress({ companyId, deliveryAddressId: addressId }, args , context) {
		return await context.knex("companiesAddresses")
			.join("addresses", "companiesAddresses.addressId","addresses.addressId")
			.where("companiesAddresses.accountId", context.Account.accountId)
			.where({ companyId })
			.where("companiesAddresses.addressId", addressId)
			.first();
	},
	async DeliveryLogOrder({ deliveryLogId }, args , context) {
		const DeliveryLogsOrders = await context.knex("deliveryLogsOrders")
			.where({ deliveryLogId });
		return DeliveryLogsOrders;
	},


	async Signature({ signatureId }, args , context) {
		return await context.knex("signatures")
			.where("accountId", context.Account.accountId)
			.where({ signatureId }).first();
	},
	async Orders({ deliveryLogId }, args, context) {
		return await context.knex("deliveryLogsOrders").where({ deliveryLogId });

	}
};
