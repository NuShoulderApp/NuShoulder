import { CremationRootResolvers } from "./Cremation";
import { Response } from "../../utilities/helpers";

const CremationLogSubResolvers = {
	Cremations(CremationLog, args, context) {
		const onlyOpenCremations = args.onlyOpenCremations ? args.onlyOpenCremations : false;
		const machineId = args.machineId ? args.machineId : false;
		return CremationRootResolvers.Cremations(CremationLog, {cremationLogId: CremationLog.cremationLogId, machineId, onlyOpenCremations}, context);
	},
	async Machine({ machineId }, args, context) {
		if(machineId) {
			return await context.knex("machines").where('machines.machineId', machineId).first();
		} else {
			return [];
		}
	},
	async Machines(CremationLog, args, context) {
		let machines = await context.knex("machines")
			.where({ 'machines.accountId': context.Account.accountId })
			.leftOuterJoin('cremationLogs', function() {
				this.on('machines.machineId', '=', 'cremationLogs.machineId')
					.onNull('cremationLogs.dateCremationLogEnd')
			});
		return machines;
	},
	async User({ performedByUserId }, args, context) {
		if(performedByUserId) {
			return await context.knex("users").where('users.userId', performedByUserId).first();
		} else {
			return [];
		}

	}
}

// QUERIES
const CremationLogRootResolvers = {
	// Get CremationLog - gets an array and then returns the .first() entry
	// Set this function as async so we can wait on the knex calls.
	CremationLog(root, {cremationLogId}, context) {
		const knex = context.knex;

		let accountId = context.Account.accountId;
		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		return knex('cremationLogs')
			.where('cremationLogs.cremationLogId', cremationLogId )
			.andWhere('cremationLogs.accountId', accountId)
			.first();
	},

	// Get CremationLogs
	// Set this function as async so we can wait on the knex calls.
	CremationLogs: async (root, args, context) => {
		const knex = context.knex;
		let accountId = context.Account.accountId;
		return await knex('cremationLogs')
			.select('cremationLogs.*', 'machines.machineName', 'users.firstName', 'users.lastName')
			.join('machines', 'cremationLogs.machineId', 'machines.machineId')
			.join('users', 'cremationLogs.performedByUserId', 'users.userId')
			.where({ 'cremationLogs.accountId': accountId })
			.orderBy("cremationLogs.dateCremationLogStart", 'DESC');
	},

	async OpenCremationLogs(root, {machineId=0}, context) {
		console.log({machineId})
		const OpenCremations =  await context.knex('cremationLogs')
			.where({ accountId: context.Account.accountId })
			.whereNull('dateCremationLogEnd')
			.andWhere(function() {
				if(machineId > 0) {
					this.where('machineId', machineId)
				} else {
					// This is just a placehold that will return all results
					this.whereNotNull('machineId')
				}
			});
		return OpenCremations
	}
}

// MUTATIONS
const Mutations = {
	async CremationLogCreate(root, { input }, context) {
		const result = await Mutations.CremationLogSave(root, { input: {...input, calledFromCremationLogCreate: true} }, context);
		return result

	},
	// input is a CremationLog object with the data to insert or update
	async CremationLogSave(root, { input }, context) {
		if(context.Session.User.userTypeId === 2 || context.Session.User.userTypeId === 3) {
			const knex = context.knex;

			const {
				calledFromCremationLogCreate=false,
				cremationLogId,
				cremationType,
				machineId
			} = input;

			let accountId = context.Account.accountId;
			let performedByUserId = context.Session.User.userId;

			if(cremationLogId > 0) {
				// if Communal with no Memorialization products then autoamtically update the order Status to Completed and update orderservice status to Cremated orderServiceStatusId = 1
				if(cremationType === "Communal") {
					/*let memorializationProducts = await knex('ordersProducts')
						.join('products', 'products.productId', 'ordersProducts.productId')
						.join('productTypes', 'productTypes.productTypeId', 'products.productTypeId')
						.where('productTypes.productType', "Memorialization")
						.andWhereNot('products.productCategoryId', 12)
						.andWhere('ordersProducts.orderId', Cremation.orderId);*/
					
					await knex('orders')
						.whereNotIn('orderId', function() {
							this.select('cremations.orderId')
								.from('cremations')
								.join('ordersProducts', 'cremations.orderId', 'ordersProducts.orderId')
								.join('products', 'ordersProducts.productId', 'products.productId')
								.where('products.productTypeId', 3)
								.andWhereNot('products.productCategoryId', 12)
								.andWhere('cremations.cremationLogId', cremationLogId)
						})
						.whereIn('orderId', function() {
							this.select('cremations.orderId')
								.from('cremations')
								.where('cremations.cremationLogId', cremationLogId)
						})
						.update ({ 'orderStatusId':  3, 'orderServiceStatusId': 1 });

					// DUPLICATE QUERY FOR DATECOMPLETED - Check if this Order already has 'dateCompleted', which is what we use to determine if the order can be invoiced.
					await knex('orders')
						.whereNotIn('orderId', function() {
							this.select('cremations.orderId')
								.from('cremations')
								.join('ordersProducts', 'cremations.orderId', 'ordersProducts.orderId')
								.join('products', 'ordersProducts.productId', 'products.productId')
								.where('products.productTypeId', 3)
								.andWhereNot('products.productCategoryId', 12)
								.andWhere('cremations.cremationLogId', cremationLogId)
						})
						.whereIn('orderId', function() {
							this.select('cremations.orderId')
								.from('cremations')
								.where('cremations.cremationLogId', cremationLogId)
						})
						.whereNull('dateCompleted')
						.update ({ 'dateCompleted': knex.fn.now() });

				}
				// updated the cremation status to "Cremated" for any cremations on this log
				await knex('orders')
					.whereIn('orderId', function() {
						this.select('cremations.orderId')
							.from('cremations')
							.where('cremations.cremationLogId', cremationLogId)
							.whereNull('cremations.dateCremationEnd')
					})
					.update ({'orderServiceStatusId': 1 });

				await knex('cremationLogs')
					.where({ cremationLogId })
					.update({ cremationType, dateCremationLogEnd: knex.fn.now(), machineId, performedByUserId });

				// close any cremations on this log that are still open
				await knex('cremations')
					.where({ cremationLogId, dateCremationEnd: null })
					.update({ dateCremationEnd: knex.fn.now(), 'userIdEnd': context.Session.User.userId });

				if(calledFromCremationLogCreate === true) {
					return Response(true,"Cremation Log Successfully Closed", { CremationLogCreate: { cremationLogId } });
				} else {
					return Response(true,"Cremation Log Successfully Closed",  { CremationLog: await knex("cremationLogs").where({ cremationLogId }).first() });
				}
			} else {
				// Check if this machine already has an open log, if so, don't let them start a new log for that machine
				const openCremationLog = await knex('cremationLogs')
					.where({'cremationLogs.accountId': accountId,
						'cremationLogs.machineId': machineId })
					.whereNull('cremationLogs.dateCremationLogEnd')
					.first();
				console.log({openCremationLog})
				if(!openCremationLog) {
					// If this log is created from the new cremation log system for Jon, then we need to get the cremation type from the pet reference number.

					// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
					const [cremationLogId] = await knex('cremationLogs')
						.insert({accountId, cremationType, machineId, performedByUserId});

					if(calledFromCremationLogCreate === true) {
						return Response(true,"Cremation Log Successfully Started", { CremationLogCreate: { cremationLogId } });
					} else {
						return Response(true,"Cremation Log Successfully Started", { CremationLog: await knex("cremationLogs").where({ cremationLogId }).first() });
					}
				} else {
					if(calledFromCremationLogCreate === true) {
						return Response(true,"Cremation Log NOT Started. Machine already has an open Log", { CremationLogCreate: {} });
					} else {
						return Response(true,"Cremation Log NOT Started. Machine already has an open Log", { CremationLog: {} });
					}
				}
			}
		} else {
			return Response(false,"Please Login as Crematory Staff", { CremationLog: {} });
		}
	}
}

// EXPORT
export { CremationLogSubResolvers, Mutations, CremationLogRootResolvers }
