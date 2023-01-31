import moment from 'moment';
import { Response } from "../../utilities/helpers";
import { Mutations as JobMutations } from "./Job";
import { Mutations as OrderMutations } from "./Order";

// SUB RESOLVERS
export const SubResolvers = {
	async RouteStops({ routeId }, args, context) {
		return await context.knex('companiesAddresses')
			.leftOuterJoin('addresses', 'companiesAddresses.addressId', 'addresses.addressId')
			.leftOuterJoin('addressTypes', 'addresses.addressTypeId', 'addressTypes.addressTypeId')
			.leftOuterJoin('states', 'addresses.stateId', 'states.stateId')
			.leftOuterJoin("companies", "companiesAddresses.companyId", "companies.companyId")
			.where({ routeId })
			.orderBy('companiesAddresses.routeStopOrder', 'ASC');
	}
}

export const RootResolvers = {
	async Route(root, { routeId = "" }, context) {
		// TODO: it would be a good idea to add account ids to routes table.
		return await context.knex('routes')
			.where('accountId', context.Account.accountId)
			.where('routeId', routeId).first();
	},

	async Routes(root, args, context) {
		// TODO: it would be a good idea to add account ids to routes table.
		return await context.knex('routes')
			.where('accountId', context.Account.accountId);
	},

	async getRouteAddresses(root, { routeId = "" }, context) {
		// get all addresses and associated routeIds

		// Check if the routeId is the 'Expedited Route' which is -1, in which case we will have to return all of the addresses that need to have an expedited order picked up or delivered.
		// Looking for addresses that are not on routes today, OR are on routes today and have already been stopped at, so they will not be visited again today.
		if(parseInt(routeId) === -1) {
			// This returns 1-7 where 1 is Monday and 7 is Sunday
			const dayOfWeekInteger = moment().weekday();

			let dayColumn = '';
			if(dayOfWeekInteger === 1) dayColumn = 'monday';
			if(dayOfWeekInteger === 2) dayColumn = 'tuesday';
			if(dayOfWeekInteger === 3) dayColumn = 'wednesday';
			if(dayOfWeekInteger === 4) dayColumn = 'thursday';
			if(dayOfWeekInteger === 5) dayColumn = 'friday';
			if(dayOfWeekInteger === 6) dayColumn = 'saturday';
			if(dayOfWeekInteger === 0) dayColumn = 'sunday';

			// Get today's routes
			const TodaysRoutes = await context.knex('routes')
				.select('routeId')
				.where({accountId: context.Account.accountId, [dayColumn]: 1})

			let RouteIds = []
			TodaysRoutes.forEach((route) => RouteIds.push(route.routeId))

			// Get all of the addresses on today's routes that have already been stopped at.
			const AlreadyStoppedAtToday = await context.knex('deliveryLog')
				.distinct()
				.select('deliveryAddressId')
				.whereIn('routeId', RouteIds)
				.andWhere({accountId: context.Account.accountId})
				.andWhere('dateCreated', '>', moment().format('YYYY-MM-DD'))

			// Get all of the addresses NOT on today's routes
			const NotTodaysRoutes = await context.knex('companiesAddresses')
				.distinct()
				.select('addressId')
				.whereNotIn('routeId', RouteIds)
				.andWhere({accountId: context.Account.accountId, active: 1})

			// Put all of the addressIds that are not on today's routes and the addresses that have already been stopped at into a single array.
			let AvailableExpeditedAddressIds = [];
			AlreadyStoppedAtToday.forEach((address) => AvailableExpeditedAddressIds.push(address.deliveryAddressId));
			NotTodaysRoutes.forEach((address) => AvailableExpeditedAddressIds.push(address.addressId));

			// Return the same query as a normal route, except use the addressIds that are not still going to be visited today
			return await context.knex('companiesAddresses as ca')
				.join('addresses as a', 'a.addressId', 'ca.addressId')
				.whereIn('ca.addressId', AvailableExpeditedAddressIds)
				.andWhere('ca.accountId', context.Account.accountId)
				.orderBy("ca.routeId")
				.orderBy("ca.routeStopOrder");
		}

		return await context.knex('companiesAddresses as ca')
			.join('addresses as a', 'a.addressId', 'ca.addressId')
			.where('ca.accountId', context.Account.accountId)
			.where('ca.routeId', routeId)
			.orderBy("ca.routeId")
			.orderBy("ca.routeStopOrder");
	}
};

export const Mutations = {
	/*
		Add deliveryLog entry,
			add deliveryLogsOrders entries with	deliveryType and newStatus only.

		For each order, update it to show the new statusId.

		orderStatusId	orderStatus	orderCompletedIndicator
		DELIVERIES - FROM CREMATORY TO VET
		11	ORDER_DELIVERY_SCANNED_AT_CREMATORY   -> 	8	ORDER_OUT_FOR_DELIVERY
		10	ORDER_DELIVERY_SCANNED_AT_VET   -> 	4	Completed (Delivered) to the vet

		PICKUPS - FROM VET TO CREAMTORY
		13	ORDER_PICKUP_SCANNED_AT_VET	-> 	7	ORDER_EN_ROUTE_TO_CREMATORY
		12 ORDER_PICKUP_SCANNED_AT_CREMATORY -> 5 	ORDER_PICKUP_COMPLETED and at the crematory to start work
	*/

	async completeRouteStop(root, { input }, context) {
		if(parseInt(context.Session.User.userTypeId) === 2 || parseInt(context.Session.User.userTypeId) === 3) {
			const knex = context.knex;

			const {
				addressId,
				companyId,
				driverId,
				orders,
				orderStatusId=0,
				routeId,
				routeStopType: destinationName,
				signatureData
			} = input;

			// jobId is used for any functionality that needs to create a printable and pass back the jobId to the component that called this mutation
			let jobId = '';

			const accountId = context.Account.accountId;

			// Separate out the deliveries and pickups.
			const deliveriesScannedAtCrematory = orders.filter(({orderStatusId}) => orderStatusId === "11").map(({orderId}) => orderId);
			const deliveriesScannedAtVet = orders.filter(({orderStatusId}) => orderStatusId === "10").map(({orderId}) => orderId);

			const pickupsScannedAtVet =  orders.filter(({orderStatusId}) => orderStatusId === "13").map(({orderId}) => orderId);
			const pickupsScannedAtCrematory =  orders.filter(({orderStatusId}) => orderStatusId === "12").map(({orderId}) => orderId);

			// Create a transaction for all inserts.
			const trx = await new Promise((resolve) => knex.transaction(resolve));

			// Update the status of the deliveries.
			if( deliveriesScannedAtCrematory.length > 0) {
				await knex("orders").transacting(trx).update({orderStatusId: 8}).whereIn("orderId", deliveriesScannedAtCrematory);
				// Update this dateCompleted separately so we can make sure we do not overwrite 
				await knex("orders").transacting(trx).update({dateCompleted: knex.fn.now()}).whereIn("orderId", deliveriesScannedAtCrematory).whereNull('dateCompleted');
			}
			if( deliveriesScannedAtVet.length > 0) {
				// Take the list of orderIds in deliveriesScannedAtVet, and check if the company on the order does sendOwnerEmailCompletedDelivered=1, send the owner an email if there is an email address on the order.
				await OrderMutations.sendOwnerEmail(root, { input: { orderIds: deliveriesScannedAtVet.join() }}, context);
				await knex("orders").transacting(trx).update({orderStatusId: 4}).whereIn("orderId", deliveriesScannedAtVet);
				// Update this dateCompleted separately so we can make sure we do not overwrite 
				await knex("orders").transacting(trx).update({dateCompleted: knex.fn.now()}).whereIn("orderId", deliveriesScannedAtVet).whereNull('dateCompleted');
			}

			// Update the status of the pickups.
			if( pickupsScannedAtVet.length > 0) {
				await knex("orders").transacting(trx).update("orderStatusId", 7).whereIn("orderId", pickupsScannedAtVet);
			}
			if( pickupsScannedAtCrematory.length > 0) {
				// Generate the job for the Pre Cremation Product Stickers
				const Job = await JobMutations.generateJob(root, { input: { orderId: 0,  orderIds: pickupsScannedAtCrematory.join(), printableName: 'Pre Cremation Product Stickers' }}, context);
				jobId = Job.Job.jobId;

				if(orderStatusId > 0) {
					await knex("orders").transacting(trx).update("orderStatusId", orderStatusId).whereIn("orderId", pickupsScannedAtCrematory);
				} else {
					await knex("orders").transacting(trx).update("orderStatusId", 5).whereIn("orderId", pickupsScannedAtCrematory);
				}
			}

			// log the orderStatusId updates - one entry per order scanned
			/*const orderActivityLogRows =
				deliveriesScannedAtCrematory.map( (orderId) => ({ accountId, deliveryLogId, orderId,	deliveryType: deliveryTypeDelivery, newStatus: 8 }))
					.concat(deliveriesScannedAtVet.map( (orderId) => ({ accountId, deliveryLogId, orderId, deliveryType: deliveryTypeDelivery, newStatus: 4 })))
					.concat(pickupsScannedAtVet.map( (orderId) => ({ accountId, deliveryLogId, orderId, deliveryType: deliveryTypePickup, newStatus: 7 })))
					.concat(pickupsScannedAtCrematory.map( (orderId) => ({ accountId, deliveryLogId, orderId, deliveryType: deliveryTypePickup, newStatus: 5 })));

			await knex("deliveryLogsOrders")
				.transacting(trx)
				.insert(deliveryLogsOrdersRows);*/

			let signatureId;

			let deliveryTypeDelivery = "delivery";
			let deliveryTypePickup = "pickup";

			// Load/Unload will not have a signature.
			if(signatureData) {
				[ signatureId ] = await knex("signatures").transacting(trx).insert({
					accountId,
					collectedByUserId: driverId,
					signatureData
				});
			} else {
				// Load/Unload will use the destination name to signify which it is.  We will put this into the delivery type.
				deliveryTypeDelivery = destinationName;
				deliveryTypePickup = destinationName;
			}

			// create a delivery log and then add entries for everything that as scanned
			const [ deliveryLogId ] = await knex("deliveryLog").insert({
				accountId,
				driverId,
				companyId,
				signatureId,
				routeId,
				destinationName,
				deliveryAddressId: addressId
			});

			const deliveryLogsOrdersRows =
				deliveriesScannedAtCrematory.map( (orderId) => ({ accountId, deliveryLogId, orderId,	deliveryType: deliveryTypeDelivery, newStatus: 8 }))
					.concat(deliveriesScannedAtVet.map( (orderId) => ({ accountId, deliveryLogId, orderId, deliveryType: deliveryTypeDelivery, newStatus: 4 })))
					.concat(pickupsScannedAtVet.map( (orderId) => ({ accountId, deliveryLogId, orderId, deliveryType: deliveryTypePickup, newStatus: 7 })))
					.concat(pickupsScannedAtCrematory.map( (orderId) => ({ accountId, deliveryLogId, orderId, deliveryType: deliveryTypePickup, newStatus: 5 })));

			await knex("deliveryLogsOrders")
				.transacting(trx)
				.insert(deliveryLogsOrdersRows);

			trx.commit();

			return Response(true,"Route Stop Completed", {jobId});
		} else {
			return Response(false,"Please Login as a Crematory Admin");
		}
	},
	async RouteReorder(root, { input }, context) {
		if(context.Session.User.userTypeId === 2) {
			const knex = context.knex;

			const {
				companyAddressId,
				routeId,
				routeStopOrderOld,
				routeStopOrderNew
			} = input;

			// update other companyAddresses on route
			if (routeStopOrderOld > routeStopOrderNew) {
				await knex('companiesAddresses')
					.where({ routeId: routeId })
					.andWhere('routeStopOrder', '>=', routeStopOrderNew)
					.andWhere('routeStopOrder', '<', routeStopOrderOld)
					.increment('routeStopOrder', 1);
			} else if (routeStopOrderOld < routeStopOrderNew) {
				await knex('companiesAddresses')
					.where({ routeId: routeId })
					.andWhere('routeStopOrder', '<=', routeStopOrderNew)
					.andWhere('routeStopOrder', '>', routeStopOrderOld)
					.decrement('routeStopOrder', 1);
			}

			// update comapnyAddress to routeStopOrderNew
			await knex('companiesAddresses')
				.where({ companyAddressId: companyAddressId, routeId: routeId })
				.update({routeStopOrder: routeStopOrderNew})

			// Return Updated Route Stops
			const RouteStops = SubResolvers.RouteStops({routeId}, {}, context);

			return Response(true,"Route Order Saved", {RouteStops});
		} else {
			return Response(false,"Please Login as a Crematory Admin", {RouteStops: {}});
		}
	},
	async RouteSave(root, { input }, context) {
		if(context.Session.User.userTypeId === 2) {
			const knex = context.knex;

			const {
				routeId,
				routeName,
				pickupDays,
				monday,
				tuesday,
				wednesday,
				thursday,
				friday,
				saturday,
				sunday
			} = input;

			const accountId = context.Account.accountId;
			let Routes = null;

			if(routeId > 0) {
				await knex('routes')
					.where({ accountId: accountId, routeId: routeId })
					.update({routeName, pickupDays, monday, tuesday, wednesday, thursday, friday, saturday, sunday})

				Routes = await knex('routes')
					.where('accountId', context.Account.accountId);

				return Response(true,"Route Saved", { Route: input, Routes: Routes });
			} else {
				// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
				const [routeId] = await knex('routes')
					.insert({ accountId: context.Account.accountId, routeName, pickupDays, monday, tuesday, wednesday, thursday, friday, saturday, sunday })

				Routes = await knex('routes')
					.where('accountId', context.Account.accountId);

				return Response(true,"Route Saved", {Route: {...input, routeId}, Routes: Routes });
			}
		} else {
			return Response(false,"Please Login as a Crematory Admin", {Route: {}, Routes: {}});
		}
	}
};
