import _ from "lodash";
import Math from 'mathjs';
import moment from 'moment';

import { enqueueMessage } from "../../utilities/RabbitMQ";
import { Response } from "../../utilities/helpers";

import { sendEmail } from "./Email";
import { CompanyDepartmentRootResolvers } from "./CompanyDepartment";
import { Mutations as PetReferenceNumberMutations } from "./PetReferenceNumber";
import { OrderHoldRootResolvers } from "./OrderHold";
import { RootResolvers as CompanyDefaultProductsRootResolvers } from "./CompanyDefaultProduct";
import { RootResolvers as PrintableLogRootResolvers } from "./PrintableLog";
import { RootResolvers as PrintableOrderRootResolvers } from "./PrintableOrder";
import { Mutations as OrderProductMutations, orderProductsPriceCalculations } from "./OrderProduct";

import { withFilter } from "graphql-subscriptions";

// NOTE: use camelCase for fields and PascalCase for types and objects

/// *************** CONSTANTS: ORDER STATUS IDS FOR PICKUP AND DELIVERY ORDERS

// Order is at vet, awaiting pickup
const ORDER_AWAITING_PICKUP = 1;
// Order is at crematory, awaiting delivery
const ORDER_AWAITING_DELIVERY = 9;

// status ids for pet on delivery truck
const ORDER_OUT_FOR_DELIVERY = 8;
const ORDER_EN_ROUTE_TO_CREMATORY = 7;

//TODO: update theses ids

// orderStatusIds for orders that have been scanned at pickup/dropoff location, but the delivery has not been completed (completed means all pets accounted and signed for, or explicitly skipped)
const ORDER_DELIVERY_SCANNED_AT_VET = 10;
const ORDER_DELIVERY_SCANNED_AT_CREMATORY = 11;
const ORDER_PICKUP_SCANNED_AT_CREMATORY = 12;
const ORDER_PICKUP_SCANNED_AT_VET = 13;

// statuses that should be shown in pickup UI
const PICKUP_ORDER_STATUSES = [ ORDER_AWAITING_PICKUP, ORDER_PICKUP_SCANNED_AT_VET, ORDER_EN_ROUTE_TO_CREMATORY, ORDER_PICKUP_SCANNED_AT_CREMATORY ];
// statuses that should be shown in delivery UI
const DELIVERY_ORDER_STATUSES = [ ORDER_AWAITING_DELIVERY, ORDER_DELIVERY_SCANNED_AT_CREMATORY, ORDER_OUT_FOR_DELIVERY, ORDER_DELIVERY_SCANNED_AT_VET ];

// cursor class to hold current place in order list
function Cursor(cursor) {
	if (cursor && cursor.after) {
		this.after = parseInt(cursor.after, 10);
	} else {
		this.after = 0;
	}
	return this;
}

// this is also used in the OrderStatus subscriptions; applies a filter to get orders for a certain work queue
export async function applyWorkQueueFilter(context, query, selectedWorkQueue) {
	const knex = context.knex;

	let matchStr = selectedWorkQueue.toUpperCase();

	if (matchStr === 'BURIALS') {
		query.whereIn('orders.orderId', function() {
			this.select('op.orderId')
				.from('ordersProducts as op')
				.whereNotIn('op.orderId', function() {
					this.select('orderId')
						.from('burials')
						.distinct()
				})
				.andWhere('op.statusIsBurial', 1)
				.andWhere('op.deleted', 0)
				.distinct();
		}).orderBy('orders.orderId', 'desc');
	}
	else if (matchStr === 'COMPLETED') {
		// Order the cremations by 'dateExpectedDelivery' and then by pet weight
		query.whereIn('orders.orderId', function() {
			this.select('o.orderId')
				.from('orders as o')
				.join('orderStatuses as os', 'os.orderStatusId', 'o.orderStatusId')
				.andWhere('os.orderCompletedIndicator', 1)	// order has a status flagged as a completed status
				.distinct();
		})
			.orderBy('orders.dateCompleted', 'desc');
	}
	// NEW FROM BARRETT
	else if (matchStr === 'NOT_COMPLETED') {
		// Order the cremations by 'dateExpectedDelivery' and then by pet weight
		query.whereNull('orders.dateCompleted')
			.andWhereNot('orders.orderStatusId', 6)
			.orderBy('orders.dateCreated', 'asc');
	}
	// NEW FROM BARRETT
	else if (matchStr === 'CREMATION_PRIORITIZATION') {
		// Order the cremations that have a status indicating that they are at the crematory ('At Crematory', 'Preparing Order', 'Preparation completed, awaiting delivery')
		// Join to the logOrderActivities table to get all orders which have been scanned as at the crematory. StatusId 12 is "Scanned for pickup - at Crematory", which is the first action all pets/orders receive once at Crematory, so this is the best reference point for how long the pet has been in our custody.
		query
			// .select('log.dateCreated AS dateScannedAtCrematory')
			// .leftJoin('logOrderActivities as log', 'log.orderId', 'orders.orderId')
			// .where('log.dbField', 'orderStatusId')
			// .andWhere('log.valueNew', 12)
			.whereIn('orders.orderStatusId', function() {
				this.select('os.orderStatusId')
					.from('orderStatuses as os')
					.where('os.statusAtCrematory', 1)
					.andWhere('os.orderCompletedIndicator', 0)
					.andWhere('os.visibleOrderUpdater', 1)
					.whereIn('os.accountId', function() {
						this.select('accountId')
							.from('accounts')
							.where('accountId', 1)
							.orWhere('accountId', context.Account.accountId)
					})
			})
			// .orderBy('orders.dateExpectedDelivery', 'ASC')
			// .orderBy('orders.weight', 'DESC')
			// .orderBy('log.dateCreated', 'ASC');
			.orderBy('orders.dateCreated', 'ASC');
	}
	else if (matchStr === 'CREMATIONS') {
		// Order the cremations by 'dateExpectedDelivery' and then by pet weight
		query.whereIn('orders.orderId', function() {
			this.select('op.orderId')
				.from('ordersProducts as op')
				.whereNotIn('op.orderId', function() {
					this.select('orderId')	// check for orderId in the cremations that have been done
						.from('cremations')
						.distinct()
				})
				.andWhere('op.statusIsCremation', 1)	// cremation product ordered
				.andWhere('op.deleted', 0)
				.distinct();
		})
			.whereIn('orders.orderStatusId', function() {
				this.select('os.orderStatusId')
					.from('orderStatuses as os')
					.where('os.statusAtCrematory', 1)
					.whereIn('os.accountId', function() {
						this.select('accountId')
							.from('accounts')
							.where('accountId', 1)
							.orWhere('accountId', context.Account.accountId)
					})
			})
			.whereNotIn('orders.orderId', function() {
				this.select('op.orderId')
					.from('ordersProducts as op')
					.where('op.statusIsPawPrint', 1)
					.andWhere('op.statusPawPrintTaken', 0)
					.whereNull('op.dateDeleted')
					.whereNull('op.dateRefunded')

			})
			.whereNotIn('orders.orderId', function() {
				this.select('op.orderId')
					.from('ordersProducts as op')
					.where('op.statusIsFurClipping', 1)
					.andWhere('op.statusFurClippingCompleted', 0)
					.whereNull('op.dateDeleted')
					.whereNull('op.dateRefunded')
			})



			// .orderBy('orders.dateExpectedDelivery', 'ASC')
			// .orderBy('orders.weight', 'DESC')
			.orderBy('orders.dateCreated', 'ASC');
	}
	// NEW FROM BARRETT
	else if (matchStr === 'ENGRAVING') {
		query.whereIn('orders.orderId', function() {
			this.select('op.orderId')
				.from('products as p')
				.join('ordersProducts as op', 'op.productId', 'p.productId')
				.join('orders as o', 'o.orderId', 'op.orderId')
				.join('orderStatuses as os', 'os.orderStatusId', 'o.orderStatusId')
				.join('productsAccounts as pa', 'pa.productId', 'op.productId')
				.where('p.productTypeId', 3)
				.andWhereNot('o.orderStatusId', 6)
				.andWhere('pa.accountId', context.Account.accountId)
				.andWhere('pa.stockAvailable', '>', '0')
				.andWhere('os.orderCompletedIndicator', 0)
				.andWhere('op.personalizeProduct', 1)
				.andWhere('op.personalizationConfirmed', 1)
				.andWhere('op.statusConfirmedIndicator', 1)
				.andWhere('op.statusConfirmed', 0)
				.andWhere('op.deleted', 0)
				.distinct();
		})
		.orderBy('orders.orderId', 'desc');
	}
	else if (matchStr === 'FOLLOWUPS') {
		// Use the accountSetting autoCloseMemorialization to determine which orders go into this queue.
		// If autoCloseMemorialization=1, then the followup queue will only show orders that have items in their basket which have not been paid for and the memorialization window has closed (the memorializationCheckedOut flag cannot be 1 if there are unpaid items in the basket, so we do not need to account for this variable). Otherwise, if the memorialization window has closed, cremation can proceed normally.
		// If autoCloseMemorialization=0, then the followup queue will show orders that are past the dateMemorializationEnds and have not been checkouted out yet, so having memorializationCheckedOut = 0;
		if(parseInt(context.Account.Settings.find((setting) => setting.name === 'autoCloseMemorialization').value) === 1) {
			query.whereIn('orders.orderId', function() {
				this.select('op.orderId')
					.from('ordersProducts as op')
					.join('orders as o', 'o.orderId', 'op.orderId')
					.where('op.invoiceVet', 0)
					.andWhere('op.deleted', 0)
					.andWhere('op.paymentCompletedPetOwner', 0)
					.andWhere('o.dateMemorializationEnds', '<', moment().format());
			})
				.andWhereNot('orders.orderStatusId', 6)
				.orderBy('orders.orderId', 'asc');
		} else {
			query.where('orders.dateMemorializationEnds', '<', moment().format())
				.andWhere('orders.memorializationCheckedOut', 0)
				.andWhereNot('orders.orderStatusId', 6)
				.orderBy('orders.orderId', 'asc');
		}
	}
	else if (matchStr === 'HOLDS') {
		query.whereIn('orders.orderId', function() {
			this.select('oh.orderId')
				.from('ordersHolds as oh')
				.join('orders as o', 'o.orderId', 'oh.orderId')
				.join('orderStatuses as os', 'os.orderStatusId', 'o.orderStatusId')
				// get all orders currently on hold
				.whereNull('oh.dateRemoved')
				.andWhereNot('os.orderStatus', 'Deleted')
				.distinct();
		})
			.join('ordersHolds', 'ordersHolds.orderId', 'orders.orderId')
			.whereNull('ordersHolds.dateRemoved')
			.andWhereNot('orders.orderStatusId', 6)
			.orderBy('ordersHolds.dateCreated', 'asc');
	}
	// NEW FROM BARRETT - Follow Up Calls via Memorializations Messages
	else if (matchStr === 'MEMORIALIZATION_CALLS') {
		query.whereNotNull('orders.dateNextFollowUpCall')
			.andWhereNot('orders.orderStatusId', 6)
			.orderBy('orders.dateNextFollowUpCall', 'ASC')
	}
	// NEW FROM BARRETT
	else if (matchStr === 'ORDERING_PRODUCTS') {
		// Get list of Memorialization Categories
		let categoryIds = await knex('productCategories').pluck('productCategoryId')
			.where('productCategory', 'Urns')
			.orWhere('productCategory', 'Keepsakes')
			.orWhere('productCategory', 'Jewelry')
			.orWhere('productCategory', 'Markers');

		query.whereIn('orders.orderId', function() {
			this.select('op.orderId')
				.from('products as p')
				.join('ordersProducts as op', 'op.productId', 'p.productId')
				.join('orders as o', 'o.orderId', 'op.orderId')
				.join('orderStatuses as os', 'os.orderStatusId', 'o.orderStatusId')
				.join('productsAccounts as pa', 'pa.productId', 'op.productId')
				.whereIn('p.productCategoryId', categoryIds)
				.andWhereNot('o.orderStatusId', 6)
				.andWhere('pa.accountId', context.Account.accountId)
				.andWhere('pa.stockAvailable', '0')
				.andWhere('os.orderCompletedIndicator', 0)
				.andWhere('op.statusConfirmedIndicator', 1)
				.andWhere('op.statusConfirmed', 0)
				.andWhere('op.deleted', 0)
				.distinct();
		})
		.orderBy('orders.orderId', 'desc');
	}
	else if (matchStr === 'PAWPRINTS') {	
		query.whereIn('orders.orderId', function() {
				this.select('op.orderId')
					.from('ordersProducts as op')
					.where('op.deleted', 0)
					.andWhere('op.statusIsPawPrint', 1)			// paw print product ordered
					.andWhere('op.statusPawPrintCompleted', 0)		// paw print is not completed and therefore not ready for packaging
					.distinct();
			})
			.orWhereIn('orders.orderId', function() {
				this.select('op.orderId')
					.from('ordersProducts as op')
					.where('op.deleted', 0)
					.andWhere('op.statusIsFurClipping', 1)			// fur clipping ordered
					.andWhere('op.statusFurClippingCompleted', 0)		// fur clipping is not completed and therefore not ready for packaging
					.distinct();
			})
			.andWhereNot('orders.orderStatusId', 6)
			.orderBy('orders.dateCreated', 'ASC')
	}
	else if (matchStr === 'PRODUCTS') {
		// Products that can be fulfilled and packaged up at any time - not paw prints, urns, cremations, deliveries, burials, special services
		/*query.where('orders.orderTypeId', 3)
			.orWhereIn('orders.orderId', function() {
				this.select('op.orderId')
					.from('ordersProducts as op')
					.join('products as p', 'p.productId', 'op.productId')
					.join('orders as o', 'o.orderId', 'op.orderId')
					.join('orderStatuses as os', 'os.orderStatusId', 'o.orderStatusId')
					.whereIn('p.productId', function() {
						this.select('p2.productId')
							.from('products as p2')
							.where('p2.productName', 'Keepsake Stand')
							.orWhere('p2.productName', '20" Snake Chain (GV)')
							.orWhere('p2.productName', '20" Snake Chain (SS)')
							.orWhere('p2.productName', 'Paw Print Stand')
					})
					.andWhere('op.deleted', 0)
					.andWhere('os.orderCompletedIndicator', 0)	// order has a status flagged as a NOT completed status
					.distinct();
			})
			.andWhereNot('orders.orderStatusId', 6)
			.distinct()
			.orderBy('orders.orderId', 'asc');*/
		
		// Product Only orders - order.orderTypeId === 3
		query
			.join('orderStatuses as os', 'os.orderStatusId', 'orders.orderStatusId')
			.where('orders.orderTypeId', 3)	// Product Only Order Type
			.andWhereNot('orders.orderStatusId', 6) // NOT Deleted
			.andWhere('orderStatuses.orderCompletedIndicator', 0) // NOT Completed
			.distinct()
			.orderBy('orders.orderId', 'asc');
	}
	else if (matchStr === 'VISITATIONS') {
		query.whereIn('orders.orderId', function() {
			this.select('op.orderId')
				.from('ordersProducts as op')
				.where( 'op.statusIsVisitation', 1)				// visitation product ordered
				.andWhere('op.statusCompletedAndPackaged', 0) 	// visitation not completed
				.andWhere('op.deleted', 0)
				.distinct();
		})
			.andWhereNot('orders.orderStatusId', 6)
			.orderBy('orders.orderId', 'asc');
	}
	else if (matchStr === 'ROUTES') {
		// this is just a combination of the two below
		query.whereIn('orders.orderStatusId', [...PICKUP_ORDER_STATUSES, ...DELIVERY_ORDER_STATUSES])
			.orderBy('orders.orderId', 'desc');
	}
	else if (matchStr === 'PICKUPS') {
		// Queue for collections to be made
		query.whereIn('orders.orderStatusId', PICKUP_ORDER_STATUSES)
			.orderBy('orders.orderId', 'desc');
	}
	else if (matchStr === 'DELIVERIES') {
		// Queue for deliveries to be made
		query.whereIn('orders.orderStatusId', DELIVERY_ORDER_STATUSES)
			.orderBy('orders.orderId', 'desc');
	} else if (matchStr === "DELIVERIES_TO_LOAD") {
		// Queue for deliveries to be made
		query.whereIn('orders.orderStatusId', [ORDER_AWAITING_DELIVERY, ORDER_DELIVERY_SCANNED_AT_CREMATORY])
			.orderBy('orders.orderId', 'desc');
	} else if (matchStr === "DELIVERIES_TO_UNLOAD") {
		// Queue for deliveries to be made
		query.whereIn('orders.orderStatusId', [ORDER_EN_ROUTE_TO_CREMATORY, ORDER_PICKUP_SCANNED_AT_CREMATORY])
			.orderBy('orders.orderId', 'desc');
	} else if (matchStr === 'URNS') {
		// First, get full list of categories which are a subcategory of the Urns category (also including the Urns category itself)
		let categoryIds = [];
		let newIds = await knex('productCategories').pluck('productCategoryId').where('productCategory', 'Urns');
		while (newIds.length > 0) {
			categoryIds = categoryIds.concat(newIds);
			newIds = await knex('productCategories').pluck('productCategoryId').whereIn('parentCategoryId', newIds);
		}
		// The second .whereIn works as a second 'filter down' of the orders. There is not an easy/good way in knex to properly combine .where/.andWhere with .orWhere where the .orWhere needs to be AND ( .where X or .where Y)
		query.whereIn('orders.orderId', function() {
			this.select('op.orderId')
				.from('products as p')
				.join('ordersProducts as op', 'op.productId', 'p.productId')
				.join('orders as o', 'o.orderId', 'op.orderId')
				.join('orderStatuses as os', 'os.orderStatusId', 'o.orderStatusId')
				.whereIn( 'p.productCategoryId', categoryIds )
				.andWhere('op.statusCompletedAndPackaged', 0)
				.andWhere('os.orderCompletedIndicator', 0)
				.andWhere('op.deleted', 0)
				.distinct();
		})
			.whereIn('orders.orderId', function() {
				this.select('op.orderId')
					.from('ordersProducts as op')
					.where('op.paymentCompletedPetOwner', 1)
					.orWhere('op.invoiceVet', 1)
					.distinct();
			})
			.andWhereNot('orders.orderStatusId', 6)
			.orderBy('orders.orderId', 'desc');
	}
	else if (matchStr === 'SUPPLIES') {
		query.where('orders.orderTypeId', 1) // orderTypeId 2 = Vet Supplies Order
			.andWhereNot('orders.orderStatusId', 6)
			.orderBy('orders.orderId', 'desc');
	}
	else if (matchStr === '') {
		// this is for the 'View Orders', which shows all orders
		query.orderBy('orders.orderId', 'desc');
	}
	else {
		// TODO: implement
		// Error, or search with no type filtering?
		query.whereRaw('orders.orderStatusId < 0');
	}

	return {query};
}

// Export a function to generate a query for getting product company promotions from an order Id.
export function ProductsCompaniesPromotionsQuery(orderId, context) {
	return context.knex("orders")
		.join("ordersProducts", "orders.orderId", "ordersProducts.orderId" )
		.join("productsCompaniesPromotions",
			(builder) => builder.on("ordersProducts.productId","=","productsCompaniesPromotions.productId")
				.andOn("orders.companyId","=","productsCompaniesPromotions.companyId")
		)
		.select("productsCompaniesPromotions.*")
		.distinct()
		.whereNull('ordersProducts.dateDeleted')
		.whereNull('ordersProducts.dateRefunded')
		.andWhere("ordersProducts.orderId", orderId)
		.orderBy("productsCompaniesPromotions.productCompanyPromotionId");
}

// get list of orders
export async function getOrders(searchParams, cursor, context, limit) {
	const knex = context.knex;
	if (!cursor) {
		cursor = new Cursor();
	}
	console.log({searchParams})
	let query = null;

	if(context.Session.User !== null) {

		// base query
		query = knex('orders')
			.select(
				'orders.*',
				'orderServiceStatuses.orderServiceStatus',
				'orderStatuses.orderStatus',
				'orderStatuses.orderCompletedIndicator',
				'orderStatuses.statusAtCrematory',
				'companies.companyName',
				'companiesAddresses.routeId'
			)
			.leftJoin('orderServiceStatuses', 'orderServiceStatuses.orderServiceStatusId', 'orders.orderServiceStatusId')
			.leftJoin('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
			.leftJoin('companies', 'companies.companyId', 'orders.companyId')
			.leftOuterJoin('companiesAddresses', 'orders.deliveryAddressId', 'companiesAddresses.addressId')
			.whereIn('orders.companyId', function() {
				// filter to only the vet's orders
				if(parseInt(context.Session.User.userTypeId) === 5) {
					this.select('companyId')
						.from('companies')
						.where('companyId', context.Session.User.companyId)
						.distinct();
				} else {
					// show all companies on the account for crematory staff
					this.select('companyId')
						.from('companies')
						.where('accountId', context.Account.accountId)
				}
			})
			.andWhere('orders.accountId', searchParams.accountId);
			// DO NOT DO ORDER BY HERE - orderBy is applied in the applyWorkQueueFilter below. Adding it here means that a second orderBy will not function for any of the other work queues
		
		if (limit) {
			query.limit(limit);
		} else if(searchParams.limit > 0) {
			query.limit(searchParams.limit)
		}

		// use searchParams to apply WHERE clauses
		let {
			orderIds=[],
			orderStatusId=0,
			orderQueue="",
			petName="",
			ownerPhoneNumber=""
		} = searchParams;

		if (orderIds && orderIds.length) {
			query.whereIn('orders.orderId', orderIds);
		}

		if (orderStatusId) {
			query.where('orders.orderStatusId', orderStatusId);
		}

		if(ownerPhoneNumber !== "") {
			query.where('orders.ownerPhoneNumber', 'like', `%${ownerPhoneNumber}%`)
		}

		if( petName !== "") {
			query.where((builder) => builder.where("orders.petFirstName", "like", `%${petName}%`).orWhere("orders.petLastName","like",`%${petName}%`))
		}

		if( searchParams.petReferenceNumber !== undefined && searchParams.petReferenceNumber ) {
			query.where("orders.petReferenceNumber", searchParams.petReferenceNumber);
		}

		if( searchParams.companyIds !== undefined && searchParams.companyIds.length > 0 ) {
			query.whereIn("orders.companyId", searchParams.companyIds);
		}

		if( searchParams.orderServiceStatusIds !== undefined && searchParams.orderServiceStatusIds.length > 0 ) {
			query.whereIn("orders.orderServiceStatusId", searchParams.orderServiceStatusIds);
		}

		if( searchParams.orderStatusIds !== undefined && searchParams.orderStatusIds.length > 0 ) {
			query.whereIn("orders.orderStatusId", searchParams.orderStatusIds);
		}

		if( searchParams.memorialization !== undefined && searchParams.memorialization.length > 0 ) {
			query.whereIn("orders.memorialization", searchParams.memorialization);
		}

		if( searchParams.orderTypeIds !== undefined && searchParams.orderTypeIds.length > 0 ) {
			query.whereIn("orders.orderTypeId", searchParams.orderTypeIds);
		}

		// filter for cremation product type
		if( searchParams.productIds !== undefined && searchParams.productIds.length > 0 ) {
			query.whereIn('orders.orderId', function() {
				this.select('op.orderId')
					.from('products as p')
					.join('ordersProducts as op', 'op.productId', 'p.productId')
					.join('orders as o', 'o.orderId', 'op.orderId')
					.whereIn('p.productId', searchParams.productIds )
					.andWhere('op.deleted', 0);
			});
		}

		// You MUST go to this function in order to get the .orderBy added to the query. For the full 'view orders' queue, orderQueue="" and we order by orderId
		({ query } = await applyWorkQueueFilter(context, query, orderQueue || ''))

		// if there is no queue specified then just show not completed orders
		if(orderQueue === "") {
			// query.where('orderStatuses.orderCompletedIndicator', 0);
		}

		// if cursor provided, only get records that follow cursor
		if (cursor && cursor.after > 0) {
			query.where('orders.orderId', '<', cursor.after)
		}
	} else {
		// session broken, return nothing, companyId = -1
		query = knex('orders')
			.select(
				'orders.*',
				'orderServiceStatuses.orderServiceStatus',
				'orderStatuses.orderStatus',
				'orderStatuses.orderCompletedIndicator',
				'companies.companyName',
				'companiesAddresses.routeId'
			)
			.leftJoin('orderServiceStatuses', 'orderServiceStatuses.orderServiceStatusId', 'orders.orderServiceStatusId')
			.leftJoin('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
			.leftJoin('companies', 'companies.companyId', 'orders.companyId')
			.leftOuterJoin('companiesAddresses', 'orders.deliveryAddressId', 'companiesAddresses.addressId')
			.where('orders.companyId', -1)
	}

	// Execute the query.
	const orders = await query;

	// get min id for cursor
	cursor.after = orders.reduce((cur_val, o) => ((o.orderId < cur_val || !cur_val) ? o.orderId : cur_val), cursor.after);
	return {
		orders,
		cursor
	}
}

async function getOrderAddress(addressId, context) {
	return await context.knex('addresses as a')
		.leftJoin('companiesAddresses as ca', 'ca.addressId', 'a.addressId')
		.leftOuterJoin('routes as r', 'ca.routeId', 'r.routeId')
		.where('a.addressId', addressId)
		.andWhere('a.accountId', context.Account.accountId)
		//.select('a.*', 'ca.routeId')
		.first();
}

// Function for logging changes to the order.
async function handleLogOrderActivities(context, Order, input, TempOrderStatus={}) {
	const knex = context.knex;
	const {
		orderId
	} = input;

	// Loop through each column of the orders table and compare it to the input values, if they are different, push the column to an array which we will then loop through and log the differences
	let columnsChanged = [];
	const timestamp = knex.fn.now();
	for(var key in Order) {
		// Verify that the input has the key so that we do not log anything that is not going to be updated
		if(Order[key] != input[key] && input.hasOwnProperty(key) && !(Order[key] === null && input[key] === '') ) {
			let tempActivity = `${_.startCase(key)} changed from '${Order[key]}' to '${input[key]}'`;
			if(Order[key] === null) {
				tempActivity = `${_.startCase(key)} changed from '' to '${input[key]}'`;
			}
			let tempActivityType = context.Session.LoggedIn === false ? `${_.startCase(key)} changed by pet owner` : `${_.startCase(key)} changed by user`;
			let pushChangeToLogsArray = true;

			const listKeysYesNo = 'courierDeliveryOffered,crematoryPickupOffered,expeditedCremationAllowed,familyFriendPet,homeMemorializationsEditCremation,hospitalDeliveryOffered,payAtPickupOffered,payByCreditCardOffered,paymentAlternativeOffered,servicePet,staffEmployeePet,tabCremationServicesOpen,tabDeliveryOpen,tabJewelryOpen,tabKeepsakesOpen,tabPawPrintsOpen,tabSpecialServicesOpen,tabUrnsOpen,visitationAllowed';

			if(listKeysYesNo.includes(key)) {
				const oldValue = parseInt(Order[key]) === 1 ? 'Yes' : 'No';
				const newValue = parseInt(input[key]) === 1 ? 'Yes' : 'No';
				tempActivity = `${_.startCase(key)} changed from '${oldValue}' to '${newValue}'`;

			} else if(key === 'communalPawPrintAllowed' || key === 'cremationTypesOffered') {
				tempActivity = `${_.startCase(key)} changed from '${_.startCase(Order[key])}' to '${_.startCase(input[key])}'`;
			} else if(key === 'dateCompleted') {
				pushChangeToLogsArray = false;
			} else if(key === 'deliveryAddressId') {
				let oldAddress = '';
				let newAddress = '';

				if(input.deliveryMethodName === 'Hospital Delivery') {
					if(input[key] > 0) {
						// Have to account for the added feature that a Crematory user in the Order Details can select a delivery address for ANY Vet in their account. So the companyId on the order will not always have a match to the addressId that is selected for devliery.
						const NewAddress = await knex('companiesAddresses')
							.join('companies', 'companies.companyId', 'companiesAddresses.companyId')
							.where('companiesAddresses.addressId', input[key])
							.first();

						if(NewAddress && ((NewAddress.addressName !== "" && NewAddress.addressName !== null) || (NewAddress.companyName !== "" && NewAddress.companyName !== null))) {
							newAddress = NewAddress.addressName !== "" && NewAddress.addressName !== null ? `'Hospital Pickup' ${NewAddress.addressName}` : `'Hospital Pickup' ${NewAddress.companyName}`;
						} else {
							const CompanyAddress = await knex('companiesAddresses')
								.join('companies', 'companies.companyId', 'companiesAddresses.companyId')
								.where('companiesAddresses.addressId', input[key])
								.andWhere('companies.accountId', context.Account.accountId)
								.first();

							if(CompanyAddress && ((CompanyAddress.addressName !== "" && CompanyAddress.addressName !== null) || (CompanyAddress.companyName !== "" && CompanyAddress.companyName !== null))) {
								newAddress = CompanyAddress.addressName !== "" && CompanyAddress.addressName !== null ? `'Hospital Pickup' ${CompanyAddress.addressName}` : `'Hospital Pickup' ${CompanyAddress.companyName}`;
							}
						}
					}

				} else if(input.deliveryMethodName === 'Courier Delivery' || input.deliveryMethodName === 'Pickup at Crematory' || input.deliveryMethodName === 'No Delivery') {
					newAddress = `'${input.deliveryMethodName}'`;
				}

				if(Order.deliveryMethodName === 'Hospital Delivery') {
					if(Order.deliveryAddressId > 0) {
						const OldAddress = await knex('companiesAddresses')
							.join('companies', 'companies.companyId', 'companiesAddresses.companyId')
							.where('companiesAddresses.addressId', Order.deliveryAddressId)
							.first();

						if(OldAddress && ((OldAddress.addressName !== "" && OldAddress.addressName !== null) || (OldAddress.companyName !== "" && OldAddress.companyName !== null))) {
							oldAddress = OldAddress.addressName !== "" && OldAddress.addressName !== null ? `'Hospital Pickup' ${OldAddress.addressName}` : `'Hospital Pickup' ${OldAddress.companyName}`;
						} else {
							const OldCompanyAddress = await knex('companiesAddresses')
								.join('companies', 'companies.companyId', 'companiesAddresses.companyId')
								.where('companiesAddresses.addressId', Order.deliveryAddressId)
								.andWhere('companies.accountId', context.Account.accountId)
								.first();

							if(OldCompanyAddress && ((OldCompanyAddress.addressName !== "" && OldCompanyAddress.addressName !== null) || (OldCompanyAddress.companyName !== "" && OldCompanyAddress.companyName !== null))) {
								oldAddress = OldCompanyAddress.addressName !== "" && OldCompanyAddress.addressName !== null ? `'Hospital Pickup' ${OldCompanyAddress.addressName}` : `'Hospital Pickup' ${OldCompanyAddress.companyName}`;
							}
						}
					}
				} else if(Order.deliveryMethodName === 'Courier Delivery' || Order.deliveryMethodName === 'Pickup at Crematory' || Order.deliveryMethodName === 'No Delivery') {
					oldAddress = `'${Order.deliveryMethodName}'`;
				}

				tempActivity = `Requested Delivery Location changed from ${oldAddress} to ${newAddress}`;
				tempActivityType = context.Session.LoggedIn === true ? 'Requested delivery location changed by user' : 'Requested delivery location changed by pet owner';

			} else if(key === 'deliveryMethodName') {
				// This is handled within the deliveryAddressId change
				pushChangeToLogsArray = false;
			} else if(key === 'deliveryMethodProductId') {
				// This is handled within the deliveryAddressId change
				pushChangeToLogsArray = false;
			} else if(key === 'memorialization') {
				let newMemorialization = input[key];
				if(newMemorialization === 'none') { newMemorialization = 'No Memorialization' }
				else if(newMemorialization === 'home') { newMemorialization = 'Memorialization At Home' }
				else if(newMemorialization === 'clinic') { newMemorialization = 'Memorialization In Hospital' }

				let oldMemorialization = Order.memorialization;
				if(oldMemorialization === 'none') { oldMemorialization = 'No Memorialization' }
				else if(oldMemorialization === 'home') { oldMemorialization = 'Memorialization At Home' }
				else if(oldMemorialization === 'clinic') { oldMemorialization = 'Memorialization In Hospital' }

				tempActivity = `Memorialization Type changed from '${oldMemorialization}' to '${newMemorialization}'`;

			} else if(key === 'memorializationCheckedOut') {
				if(input[key] === 1) {
					tempActivity = `Memorialization Order (Submitted)`;
				} else {
					tempActivity = `Memorialization Order (Re-Opened)`;
				}

			} else if(key === 'orderStatusId') {
				tempActivity = `Order Status Updated to '${TempOrderStatus.orderStatus}'`;
				tempActivityType = context.Session.LoggedIn === false ? `Order Status updated by pet owner` : `Order Status updated by user`;

			} else if(key === 'pickupAddressId') {
				let oldAddress = '';
				if(Order.pickupAddressId > 0) {
					const OldAddress = await knex('companiesAddresses').where({addressId: Order.pickupAddressId}).first();
					oldAddress = `'Hospital Pickup' ${OldAddress.addressName}`;
				} else if(Order.pickupAddressId === 0) {
					oldAddress = 'Crematory Drop-off';
				}

				let newAddress = '';
				if(input[key] > 0) {
					const NewAddress = await knex('companiesAddresses').where({addressId: input[key]}).first();
					newAddress = `'Hospital Pickup' ${NewAddress.addressName}`;
				} else if(input[key] === 0) {
					newAddress = 'Crematory Drop-off';
				}

				tempActivity = `Pickup Remains Location changed from ${oldAddress} to ${newAddress}`;
				tempActivityType = 'Pickup remains location changed by user';

			} else if(key === 'speciesId') {
				const OldSpecies = await knex('species').where({speciesId: Order.speciesId}).first();
				const NewSpecies = await knex('species').where({speciesId: input.speciesId}).first();
				tempActivity = `Pet Species changed from '${OldSpecies.species}' to '${NewSpecies.species}'`;
				tempActivityType = 'Pet Species updated by user';

			} else if(key === 'specialInstructions') {
				tempActivity = `Special Instructions Updated`;
				pushChangeToLogsArray = false;
			} else if(key === 'tabMemorializationOpen') {
				if(input[key] === 1) {
					tempActivity = `Memorialization Order (Re-Opened)`;
				} else {
					tempActivity = `Memorialization Order (Submitted)`;
				}

			}

			// else if(key === 'staffEmployeePet') {
			// 	pushChangeToLogsArray = false;
			// }
			// For certain columns we do not need/want to log their changes
			if(pushChangeToLogsArray === true) {
				let loggedInUserId = context.Session.LoggedIn === false ? null : context.Session.User.userId;
				columnsChanged.push({accountId: context.Account.accountId, activity: tempActivity, activityType: tempActivityType, dateCreated: timestamp, dbField: key, dbTable: 'orders', loggedInUserId: loggedInUserId, orderId: orderId, showVet: 1, userInitials: input.userInitials, valueNew: input[key], valueOld: Order[key]});
			}
		}
	}

	// If there are any columns that are changed, then log the change
	if(columnsChanged.length > 0) {
		await knex('logOrderActivities').insert(columnsChanged);
	}
}

export const SubResolvers = {
	async CompanyDepartments(Order, args, context) {
		return CompanyDepartmentRootResolvers.CompanyDepartments(Order, {companyId: Order.companyId}, context);
	},
	async DeliveryAddress(Order, args, context) {
		let result = {};
		if(Order.deliveryAddressId > 0) {
			result = getOrderAddress(Order.deliveryAddressId, context)
		}
		return result;
	},

	async ItemsInvoice(Order, args, context) {
		return await context.knex('invoiceItems')
			.select('invoiceItems.*', 'orders.petReferenceNumber', 'ordersProducts.productName')
			.join('orders', 'orders.orderId', 'invoiceItems.orderId')
			.leftJoin('ordersProducts', 'ordersProducts.orderProductId', 'invoiceItems.orderProductId')
			.whereNot('invoiceItems.deleted', 1)
			.andWhere('invoiceItems.orderId', Order.orderId)
			.orderBy('invoiceItems.invoiceItemId', 'desc');
	},

	async LogOrderActivities(Order, args, context) {
		return await context.knex('logOrderActivities')
			.select('logOrderActivities.*', 'users.firstName AS loggedInUserFirstName', 'users.lastName AS loggedInUserLastName')
			.where('logOrderActivities.orderId', Order.orderId)
			.where('logOrderActivities.accountId', context.Account.accountId)
			.leftOuterJoin('users', 'users.userId', 'logOrderActivities.loggedInUserId')
			.orderBy('logOrderActivities.dateCreated', 'desc');
	},

	PickupAddress(Order, args, context) {
		let result = {};
		if(Order.pickupAddressId > 0) {
			result = getOrderAddress(Order.pickupAddressId, context)
		}
		return result;
	},

	async PrintablesOrders(Order, args, context) {
		return await PrintableOrderRootResolvers.PrintableOrders(null, {orderId: Order.orderId}, context);
	},
	async PrintablesLogs(Order, args, context) {
		return await PrintableLogRootResolvers.PrintableLogs(null, {orderId: Order.orderId}, context);
	},

	OrderComments(Order, args, context) {
		if (context.Session && context.Session.User !== null) {
			// Get comments that are Internal Only - only for Crematory Staff and Admins
			if(context.Session.User.userTypeId === 2 || context.Session.User.userTypeId === 3) {
				return context.knex('ordersComments')
					.select('ordersComments.*', 'users.firstName', 'users.lastName', 'companies.companyName')
					.join('users', 'users.userId', 'ordersComments.userId')
					.join('companies', 'companies.companyId', 'users.companyId')
					.where('ordersComments.orderId', Order.orderId)
					.orderBy('ordersComments.orderCommentId', 'desc');
			} else {
				return context.knex('ordersComments')
					.select('ordersComments.*', 'users.firstName', 'users.lastName', 'companies.companyName')
					.join('users', 'users.userId', 'ordersComments.userId')
					.join('companies', 'companies.companyId', 'users.companyId')
					.where('ordersComments.orderId', Order.orderId)
					.andWhere('ordersComments.orderCommentInternal', 0)
					.orderBy('ordersComments.orderCommentId', 'desc');
			}
		} else {
			// return just the comments for this order
			return context.knex('ordersComments')
				.select('ordersComments.*', 'users.firstName', 'users.lastName', 'companies.companyName')
				.join('users', 'users.userId', 'ordersComments.userId')
				.join('companies', 'companies.companyId', 'users.companyId')
				.where('ordersComments.orderId', Order.orderId)
				.andWhere('ordersComments.orderCommentInternal', 0)
				.orderBy('ordersComments.orderCommentId', 'desc');
		}
	},

	async OrderHold(Order, args, context) {
		// This returns only the most recent hold record, if there is one for this orderId
		const OrderHold = await OrderHoldRootResolvers.OrderHold(null, {orderId: Order.orderId}, context);
		/*let orderId = Order.orderId;
		let OrderHold = context.knex('ordersHolds')
			.select('ordersHolds.*', 'companies.companyTypeId', 'users.firstName', 'users.lastName')
			.where({ orderId })
			.join('users', 'users.userId', 'ordersHolds.userId')
			.join('companies', 'users.companyId', 'companies.companyId')
			.orderBy('orderHoldId', 'desc')
			.limit(1);*/
		// If there is a hold record, check to see that the hold has not been removed. If it has been removed, then there is no hold.
		if(OrderHold.length > 0) {
			// check to see that the hold has not been removed
			if(parseInt(OrderHold[0].removerId) > 0) {
				return [];
			} else {
				return OrderHold
			}
		} else {
			// returns empty array
			return [];
		}
	},

	async OwnerAddress(Order, args, context) {
		return await context.knex('addresses')
			.where('addresses.addressId', Order.ownerAddressId).first();
	},

	//IMPORTANT: The reason that we name this differently than the actual db table name is that you cannot have the same name for a Root Resolver and a Sub Resolver - this causes issues with the types and schema errors.
	async ProductOptions(Order, args, context) {
			//  removed this chunk 9/11/20 because it is unnecessary
			// .join('productAttributes', function() {
			// 	this.andOn('productAttributes.productId', '=', 'ordersProducts.productId')
			// 	this.andOn('productAttributes.productOptionId', '=', 'orderProductProductOptions.productOptionId')
			// })
			// .andWhere('productAttributes.accountId', Order.accountId)
			// .orderBy('productAttributes.sortOrderProductOption', 'asc');
			return await context.knex('orderProductProductOptions')
			.join('ordersProducts', 'ordersProducts.orderProductId', 'orderProductProductOptions.orderProductId')
			.where('ordersProducts.orderId', Order.orderId)
	},

	async ProductsCompanyPrice(Order, args, context) {
		return context.knex('productsCompaniesPrices')
			.where({ companyId: Order.companyId })
	},

	//IMPORTANT: The reason that we name this differently than the actual db table name is that you cannot have the same name for a Root Resolver and a Sub Resolver - this causes issues with the types and schema errors.
	async ProductsOrder(Order, args, context) {
		const includeDeleted = (args || {}).includeDeleted ? args.includeDeleted : false;

		// Get all of the products on an order, these get placed into the 'OrderProducts' object as the 'Products' array
		return await context.knex('products')
			.select('deletedUser.firstName as deletedFirstName', 'deletedUser.lastName as deletedLastName', 'products.*', 'productsAccounts.*', 'productsAccounts.active AS productAccountActive', 'ordersProducts.*', 'productCategories.productCategoryId', 'productCategories.productCategory', 'productCategories.parentCategoryId', 'productCategories2.productCategory as parentCategory', 'refundedUser.firstName as refundedFirstName', 'refundedUser.lastName as refundedLastName')
			.join('productsAccounts', 'productsAccounts.productId', 'products.productId')
			.join('ordersProducts', 'ordersProducts.productId', 'products.productId')
			.join('productCategories', 'productCategories.productCategoryId', 'products.productCategoryId')
			.leftJoin('productCategories as productCategories2', 'productCategories2.productCategoryId', 'productCategories.parentCategoryId')
			.leftJoin('users as deletedUser', 'deletedUser.userId', 'ordersProducts.deletedByUserId')
			.leftJoin('users as refundedUser', 'refundedUser.userId', 'ordersProducts.refundedByUserId')
			.where('ordersProducts.orderId', Order.orderId)
			.andWhere(function() {
				if(includeDeleted) {
					this.where('ordersProducts.deleted', 0).orWhere('ordersProducts.deleted', 1)
				} else {
					this.where('ordersProducts.deleted', 0)
				}
			})
			.andWhere('productsAccounts.accountId', context.Account.accountId);
	},
	
	ProductCompanyPromotion: async ({ orderId }, args, context) => await ProductsCompaniesPromotionsQuery(orderId, context)
}

export const RootResolvers = {
	// Get all of the 'Open' memorialization orders for a company, this is used for the dashboard.
	async OpenOrders(root, {companyId}, context) {
		return await context.knex('orders')
			.select('orders.orderId')
			.join('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
			.where('orders.companyId', companyId)
			.andWhere('orders.memorializationCheckedOut', 0)
			.andWhere('orders.orderTypeId', 2)
			.andWhereNot('orderStatuses.orderStatus', 'Deleted');
	},

	// Get Single Order Details with orderId or petReferenceNumber
	async Order(root, {orderId=0, petReferenceNumber=""}, context) {
		if(orderId > 0) {
			const [order] = await context.knex('orders')
				.select(
					'orders.*', 
					'orderStatuses.orderStatusId', 
					'orderStatuses.barcode', 
					'orderStatuses.defaultSortOrder', 
					'orderStatuses.orderStatus', 
					'orderStatuses.orderCompletedIndicator', 
					'orderStatuses.visibleOrderUpdater', 
					'orderStatuses.statusAtCrematory', 
					'orderStatuses.statusAtVet', 
					'orderStatuses.statusInTransit', 
					'orderServiceStatuses.*', 
					'companies.allowHomeMemorialization', 
					'companies.companyName', 
					'companies.companyNameLegal', 
					'companies.companyTypeId', 
					'companies.payVetOrderByCreditCardOffered', 
					'companyTypes.companyType',  
					'orderTypes.orderTypeName AS orderType'
				)
				.leftJoin('companies', 'companies.companyId', 'orders.companyId')
				.leftJoin('companyTypes', 'companyTypes.companyTypeId', 'companies.companyTypeId')
				.leftJoin('orderServiceStatuses', 'orderServiceStatuses.orderServiceStatusId', 'orders.orderServiceStatusId')
				.leftJoin('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
				.leftOuterJoin('orderTypes', 'orderTypes.orderTypeId', 'orders.orderTypeId')
				.where('orders.orderId', orderId )
				.andWhere('companies.accountId', context.Account.accountId )
			return order;
		} else if(petReferenceNumber !== '') {
			const [order] = await context.knex('orders')
				.select(
					'orders.*', 
					'orderStatuses.orderStatusId', 
					'orderStatuses.barcode', 
					'orderStatuses.defaultSortOrder', 
					'orderStatuses.orderStatus', 
					'orderStatuses.orderCompletedIndicator', 
					'orderStatuses.visibleOrderUpdater', 
					'orderStatuses.statusAtCrematory', 
					'orderStatuses.statusAtVet', 
					'orderStatuses.statusInTransit', 
					'orderServiceStatuses.*', 
					'companies.allowHomeMemorialization', 
					'companies.companyName', 
					'companies.companyNameLegal', 
					'companies.companyTypeId', 
					'companyTypes.companyType',  
					'orderTypes.orderTypeName AS orderType'
				)
				.leftJoin('companies', 'companies.companyId', 'orders.companyId')
				.leftJoin('companyTypes', 'companyTypes.companyTypeId', 'companies.companyTypeId')
				.leftJoin('orderServiceStatuses', 'orderServiceStatuses.orderServiceStatusId', 'orders.orderServiceStatusId')
				.leftJoin('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
				.leftOuterJoin('orderTypes', 'orderTypes.orderTypeId', 'orders.orderTypeId')
				.where('orders.petReferenceNumber', petReferenceNumber)
				.andWhere('companies.accountId', context.Account.accountId )
			return order;
		} else {
			return []
		}
	},

	async OrderWorkQueue(root, args, context) {
		args.accountId = context.Account.accountId;
		let cursor = new Cursor(args.cursor);

		let limit = undefined;
		if (args.orderQueue.toUpperCase() === 'ROUTES') {
			limit = 0;
		}

		let result = await getOrders(args, cursor, context, limit);
		let orderQueue = args.orderQueue || '';
		let response = {
			orders: result.orders,
			cursor: result.cursor,
			orderQueue
		}
		return response;
	},

	// Get Orders
	async Orders(root, { OrderSearchInput = {}, cursor: cursor_input = null }, context) {
		// process/validate args, then pass off to search function
		const searchParams = {
			...OrderSearchInput,
			accountId: context.Account.accountId
		}

		const cursor = new Cursor(cursor_input);
		const result = await getOrders(searchParams, cursor, context);

		return {
			orders: result.orders,
			cursor: result.cursor
		}
	},

	// Get the list of orders for a given company with the given orderTypeId that are still not completed
	async OrdersInProcess(root, {companyId, orderTypeId}, context) {
		return await context.knex('orders')
			.select('orders.orderId')
			.join('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
			.where('orders.companyId', companyId)
			.andWhere('orders.orderTypeId', orderTypeId)
			.andWhereNot('orderStatuses.orderStatus', 'Deleted')
			.andWhereNot('orderStatuses.orderCompletedIndicator', 1);

	},

	// Get the list of cremation type orders for a given company with the given orderStatusId
	async OrdersWithStatus(root, {companyId, orderStatusId}, context) {
		if(companyId > 0 && context.Session.User.userTypeId === 5) {
			return await context.knex('orders')
				.select('orders.orderId')
				.where({companyId, orderStatusId, orderTypeId: 2});
		}
		else {
			return await context.knex('orders')
				.select('orders.orderId')
				.where({accountId: context.Account.accountId, orderStatusId, orderTypeId: 2});
		}

	}
}

// MUTATIONS
export const Mutations = {
	async generatePackingSlip(root, {input}, context) {
		// Create the Tag for the Cremation
		const payload = JSON.stringify({
			template: "packingSlip",
			orderId: input.orderId
		});

		const [jobId] = await context.knex("jobs").insert({
			accountId: context.Account.accountId,
			payload,
			queue: "pdf",
			status: "pending"
		});

		// Use the headers tp send in the account URL so the worker can get the proper context.
		await enqueueMessage("pdf", payload, { appId: String(jobId), headers: { filename: `${input.orderId}_order_packing_slip.pdf`, folder: "packingSlips", accountId: String(context.Account.accountId), url: context.Account.url  } } );

		// poll until the enqueued job is completed and then return the OrderCremation object with the tag file id
		// setInterval(checkJobStatus(jobId, context), 1000);

	},

	// input is a Order object with the data to insert or update
	async orderCremationSave(root, { input }, context) {
		const knex = context.knex;
		const { 
			generateNewCremationTag=false, 
			orderComment='', 
			orderCommentInternal, 
			orderId, 
			payAtPickup=0, 
			productId, 
			selectedFurClippingProductId=0,
			selectedPawPrintProductId=0, 
			selectedUrnProductId=0 
		} = input;

		let jobId = null;

		// use the owner's last name for the pet, capitalize first letter of names
		if(input.ownerLastName) {
			// If this is all upper case, then make it all lowercase and let the next step correct caiptalization
			if(input.ownerLastName === input.ownerLastName.toUpperCase()) {
				input.ownerLastName = input.ownerLastName.toLowerCase();
			}

			// Must use upperFirst and not startCase here because start case will turn names like "O'Leary" or "McDonnel" to " O Leary" and "Mc Donnel"
			if(input.ownerLastName.includes(' ')) {
				input.petLastName = _.startCase(input.ownerLastName);
				input.ownerLastName = _.startCase(input.ownerLastName);
			} else {
				input.petLastName = _.upperFirst(input.ownerLastName);
				input.ownerLastName = _.upperFirst(input.ownerLastName);
			}
		}
		if(input.ownerFirstName) {
			// If this is all upper case, then make it all lowercase and let the next step correct caiptalization
			if(input.ownerFirstName === input.ownerFirstName.toUpperCase()) {
				input.ownerFirstName = input.ownerFirstName.toLowerCase();
			}

			if(input.ownerFirstName.includes(' ')) {
				input.ownerFirstName = _.startCase(input.ownerFirstName)
			} else {
				input.ownerFirstName = _.upperFirst(input.ownerFirstName)
			}
		}

		// if units for weight are not the preferred units for the account, convert between metric and english units before saving
		if(input.weight) {
			let accountUnits = context.Account.getSettingValue("measurementSystem") === "English" ?  "lbs" : "kg";
			if(input.weightUnits === "kg" && accountUnits === "lbs") {
				input.weight = (input.weight * 2.2).toFixed(2);
			} else if(input.weightUnits === "lbs" && accountUnits === "kg") {
				input.weight = (input.weight / 2.205).toFixed(2);
			}
			input.weightUnits = accountUnits;
		}

		if (input.companyDepartmentId === '') {
			input.companyDepartmentId = null;
		}

		if(orderId > 0) {
			const [Order] = await knex('orders').where({orderId});

			// LOG ORDER ACTIVITY - START
			await handleLogOrderActivities(context, Order, input);
			// // Get the current order details before saving so we can do a compare to the input values to see what needs to be logged
			// const [Order] = await knex('orders').where({orderId});
			//
			// // Loop through each column of the orders table and compare it to the input values, if they are different, push the column to an array which we will then loop through and log the differences
			// let columnsChanged = [];
			// const timestamp = knex.fn.now();
			// for(var key in Order) {
			// 	// Verify that the input has the key so that we do not log anything that is not going to be updated
			// 	if(Order[key] != input[key] && input.hasOwnProperty(key)) {
			// 		let loggedInUserId = context.Session.LoggedIn === false ? null : context.Session.User.userId;
			// 		columnsChanged.push({accountId: context.Account.accountId, activity: `${_.startCase(key)} changed from '${Order[key]}' to '${input[key]}'`, activityType: `${_.startCase(key)} changed by user`, dateCreated: timestamp, dbField: key, dbTable: 'orders', loggedInUserId: loggedInUserId, orderId: orderId, showVet: 1, userInitials: input.userInitials, valueNew: input[key], valueOld: Order[key]});
			// 	}
			// }
			//
			// // If there are any columns that are changed, then log the change
			// if(columnsChanged.length > 0) {
			// 	await knex('logOrderActivities').insert(columnsChanged);
			// }
			// LOG ORDER ACTIVITY - END
			await knex('orders')
				.where({ orderId })
				.update(_.omit(input,["dateCreated","generateNewCremationTag","payAtPickup","productId","orderComment","orderCommentInternal","orderId","userInitials"]))

			// Update all of the OrdersProducts for this order that are currently invoiceVet=0 IF the input.payAtPickup flag was passed in as 1. This means that the pet owner is memorializing at home and will pay the vet for the products when they pick everything up.
			if(payAtPickup === 1) {
				await knex('ordersProducts')
					.where({ orderId })
					.andWhere({ invoiceVet: 0})
					.update({ invoiceVet: 1, payAtPickup: 1})
			}

			// Insert a comment into the ordersComments table if there is a comment
			if(context.Session.LoggedIn === true && orderComment !== '') {
				await knex('ordersComments')
					.insert({orderId, orderComment, orderCommentInternal, userId: context.Session.User.userId})
			}
			// Insert a comment into the ordersComments table if there are specialInstructions
			if(input.specialInstructions !== '' && input.specialInstructions !== null && input.specialInstructions !== undefined) {
				await knex('ordersComments')
					.insert({orderId: orderId, orderComment: input.specialInstructions, orderCommentInternal: 0, userId: context.Session.User.userId})
			}

			// If this is called from the Checkout section of the memorialization, we want to generate a new tag
			if(generateNewCremationTag === true) {
				// Create the Tag for the Cremation
				const payload = JSON.stringify({
					template: "cremationTag",
					orderId: orderId
				});

				[jobId] = await knex("jobs").insert({
					accountId: context.Account.accountId,
					payload,
					queue: "pdf",
					status: "pending"
				});

				// Use the headers tp send in the account URL so the worker can get the proper context.
				await enqueueMessage("pdf", payload, { appId: String(jobId), headers: { filename: `${orderId}_order_cremation_tag.pdf`, folder: "cremationTags", accountId: String(context.Account.accountId), url: context.Account.url  } } );

				return Response(true,"Order Successfully Updated", {Order: input, OrderCremation: input, jobId: jobId });

			} else {
				return Response(true,"Order Successfully Updated", {Order: input});
			}

		} else {
			// Need to check that this Pet Reference Number is available.
			// force petReferenceNumnber to uppercase in case that got changed
			input.petReferenceNumber = input.petReferenceNumber.toUpperCase();

			// correct the uppercase / lowercase in the pet name - only on order creation
			if(input.petFirstName) {
				// For pet first name, if it is all lowercase, or if it is all uppercase but NOT 2 characters (PJ, BJ, etc), then upper just the first letter.
				if( !(input.petFirstName === input.petFirstName.toUpperCase() && input.petFirstName.length === 2) || !(_.startCase(input.petFirstName) !== _.startCase(input.petFirstName.toLowerCase()) ) ) {
					// Make the string all lowercase, then upper the first. Using startCase here will capital 'john boy' to 'John Boy' correctly.
					if(input.petFirstName.includes(' ')) {
						input.petFirstName = _.startCase(input.petFirstName.toLowerCase());
					} else {
						input.petFirstName = _.upperFirst(input.petFirstName.toLowerCase());
					}
				}
			}

			const [petReferenceNumberCheck] = await knex('petReferenceNumbers').where({ referenceNumber: input.petReferenceNumber });

			// If this petReferenceNumber is not in the table, or if it exists without an orderId already connected, then proceed with the order cremation creation.
			if(petReferenceNumberCheck === undefined || petReferenceNumberCheck.orderId === 0 || petReferenceNumberCheck.orderId === null) {
				// Check the productId to see if it is a Communal or Communal + Paw Print. If so, we need to flag this order so that Communal will always be an option on the Cremation Services section of the Memorialization Order process.
				const [product] = await knex('products').where({productId});

				// Used for determining within the Products Memorialization process if we should show the Communal + Paw Print option
				const originallyCommunalCremation = input.newOrderType === 'cremation' && product.productName === 'Communal Cremation' ? 1 : 0;
				const originallyIndividualCremation = input.newOrderType === 'cremation' && product.productName === 'Individual Cremation' ? 1 : 0;
				const originallyPrivateCremation = input.newOrderType === 'cremation' && product.productName === 'Private Cremation' ? 1 : 0;

				// If this order is for Memorialization In Home, then we need to create the 48 hour clock for the memorialization window
				// const dateMemorializationEnds = input.memorialization === 'home' ? `${moment().add(2, 'days').format('YYYY-MM-DD HH:mm:ss')}` : null;
				const dateMemorializationEnds = `${moment().add(2, 'days').format('YYYY-MM-DD HH:mm:ss')}`;
				const dateNextFollowUpCall = `${moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss')}`;

				// Set the orderTypeId based on which form this came from - /new_orders/new_order_type/:newOrderType. If we add another newOrderType this will have to be a real IF statement. Options now are only cremation or products
				const orderTypeId = input.newOrderType === 'cremation' ? 2 : 3;

				// Get the hospital information defaults related to Orders from the Companies table, and save their defaults to this Order
				const [Company] = await knex('companies').where({companyId: context.Session.User.companyId})
					.select('communalPawPrintAllowed','companyTypeId','courierDeliveryOffered','crematoryPickupOffered','cremationTypesOffered','expeditedCremationAllowed','homeMemorializationsEditCremation', 'hospitalDeliveryOffered','payAtPickupOffered','payByCreditCardOffered','paymentTerms','requireInitialsEditOrderDetails','visitationAllowed');

				// If this is a communal cremation and they select 'no Memorialization' then mark the order as closed. Making the value on the input object will save it into the Orders insert below
				if(originallyCommunalCremation === 1 && input.memorialization === 'none') {
					input.memorializationCheckedOut = 1;
				}

				// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
				const [newOrderId] = await knex('orders').insert({
					..._.omit(input,["dateCreated", "expeditedCremation", "newOrderType", "productId","orderComment","orderId","selectedFurClippingProductId","selectedPawPrintProductId","selectedUrnProductId"]),
					accountId: context.Account.accountId,
					communalPawPrintAllowed: Company.communalPawPrintAllowed,
					companyId: context.Session.User.companyId,
					courierDeliveryOffered: Company.courierDeliveryOffered,
					crematoryPickupOffered: Company.crematoryPickupOffered,
					cremationTypesOffered: Company.cremationTypesOffered,
					dateMemorializationEnds: dateMemorializationEnds,
					dateNextFollowUpCall: dateNextFollowUpCall,
					expeditedCremationAllowed: Company.expeditedCremationAllowed,
					homeMemorializationsEditCremation: Company.homeMemorializationsEditCremation,
					hospitalDeliveryOffered: Company.hospitalDeliveryOffered,
					orderTypeId,
					originallyCommunalCremation,
					originallyIndividualCremation,
					originallyPrivateCremation,
					payAtPickupOffered: Company.payAtPickupOffered,
					payByCreditCardOffered: Company.payByCreditCardOffered,
					paymentAlternativeOffered: context.Account.getSettingValue("paymentAlternativeOffered"),
					paymentTerms: Company.paymentTerms,
					requireInitialsEditOrderDetails: Company.requireInitialsEditOrderDetails,
					userId: context.Session.User.userId,
					visitationAllowed: Company.visitationAllowed
				});

				// Insert / Update in petReferenceNumbers
				if(petReferenceNumberCheck === undefined) {
					// Create record, Add the orderId to the petReferenceNumbers table
					await knex('petReferenceNumbers').insert({ accountId: context.Account.accountId, orderId: newOrderId, referenceNumber: input.petReferenceNumber });
				} else {
					// Add the orderId to the petReferenceNumbers table
					await knex('petReferenceNumbers').where({ petReferenceNumberId: petReferenceNumberCheck.petReferenceNumberId }).update({ orderId: newOrderId });
				}

				// Insert a comment into the ordersComments table if there is a comment
				if(orderComment !== '') {
					await knex('ordersComments')
						.insert({orderId: newOrderId, orderComment, orderCommentInternal: 0, userId: context.Session.User.userId})
				}
				// Insert a comment into the ordersComments table if there are specialInstructions
				if(input.specialInstructions !== '' && input.specialInstructions !== null && input.specialInstructions !== undefined) {
					await knex('ordersComments')
						.insert({orderId: newOrderId, orderComment: input.specialInstructions, orderCommentInternal: 0, userId: context.Session.User.userId})
				}

				let userInitials = null;
				if(input.creatorInitials !== '' && input.creatorInitials !== null && input.creatorInitials !== undefined) {
					userInitials = input.creatorInitials;
				}

				// Add a log entry in the logOrderActivities table
				await knex('logOrderActivities').insert({
					accountId: context.Account.accountId,
					activity: 'Service Arrangement (Submitted)',
					activityType: 'Order Created',
					loggedInUserId: context.Session.User.userId,
					orderId: newOrderId,
					showVet: 1,
					userInitials: userInitials
				});

				// Only need to do these if the newOrderType is cremation, and not if it is a Product Only order
				if(input.newOrderType === 'cremation') {
					// Get the Product array of this cremation service to pass to the orderProductsPriceCalculations function
					const productAccount = await knex('productsAccounts')
						.select('products.productName', 'productsAccounts.*')
						.join('products', 'products.productId', 'productsAccounts.productId')
						.where('products.productId', productId)
						.andWhere('productsAccounts.accountId', context.Account.accountId);

					// Calculate the prices for this Cremation Service using the ordersProducts calculator
					const [productCalculation] = await orderProductsPriceCalculations({ calledFrom: 'Order.js, 749', orderId: newOrderId, Products: productAccount}, context);

					// If this is NOT a communal cremation (no paw print), then we can calculate the expected delivery date back to the Vet, as long as this is a Vet's Office creating the Order, AND they have a pickupAddressId selected.
					if(productAccount.productName !== 'Communal Cremation' && context.Session.User.userTypeId === 5 && input.pickupAddressId > 0) {
						// Get the Route for this companyAddress
						const [Route] = await knex('companiesAddresses')
							.select('routes.*')
							.join('routes', 'routes.routeId', 'companiesAddresses.routeId')
							.where('companiesAddresses.companyId', context.Session.User.companyId)
							.andWhere('companiesAddresses.addressId', input.pickupAddressId)

						// This returns 1-7 where 1 is Monday and 7 is Sunday
						const dayOfWeekInteger = moment().weekday();

						// This will be a comma separated list of the integer days of delivery, start it as an array for ease of using "push", and then use "join" at the end to make the list
						let deliveryDays = [];
						let nextDeliveryDayInt = 0; // The day the pet will be picked up
						let expectedDeliveryDayInt = 0; // The day the pet will be delivered back to the Vet

						if(Route) {
							if(Route.monday === 1) deliveryDays.push(1);
							if(Route.tuesday === 1) deliveryDays.push(2);
							if(Route.wednesday === 1) deliveryDays.push(3);
							if(Route.thursday === 1) deliveryDays.push(4);
							if(Route.friday === 1) deliveryDays.push(5);
							if(Route.saturday === 1) deliveryDays.push(6);
							if(Route.sunday === 1) deliveryDays.push(7);


							// used to determine if the next available delivery day (actual delivery back to vet) is in this week or next. Using the pickupDayNextWeek as a secondary flag, we know that if pickupDayNextWeek = false and deliveryDayNextWeek = true, then delivery is in the true next week.
							// also, if pickupDayNextWeek = true and deliveryDayNextWeek = false, then we know the delivery is in the true next week also.
							// however, if pickupDayNextWeek = true AND deliveryDayNextWeek = true, we determine that pickup is in the true next week, and delivery will be in the week after that one.
							let deliveryDayNextWeek = false;

							// Used to determine if the next available delivery day (pickup) is in this week or next.
							let pickupDayNextWeek = false;

							deliveryDays.forEach((dayInt) => {
								// If the 'next delivery day' has not been determined yet, set it if the dayInt is GT today's
								if(nextDeliveryDayInt === 0 && dayInt > dayOfWeekInteger) {
									nextDeliveryDayInt = dayInt;
								}
								// If the nextDeliveryDayInt (when the pet will be pickup) has already been determined, we can then set the expected delivery date
								else if(nextDeliveryDayInt > 0 && dayInt > dayOfWeekInteger) {
									expectedDeliveryDayInt = dayInt;
								}
							})

							// If the nextDeliveryDayInt still = 0, that means that there were no delivery days (pickup) left this week. So we need to do another loop to determine that day.
							if(nextDeliveryDayInt === 0) {
								pickupDayNextWeek = true;
								deliveryDays.forEach((dayInt) => {
									// If the 'next delivery day' has not been determined yet, set it to the first available say this week.
									if(nextDeliveryDayInt === 0) {
										nextDeliveryDayInt = dayInt;
									}
									// If the nextDeliveryDayInt (when the pet will be picked up) has already been determined, we can then set the expected delivery date to the NEXT available date if there are any deliveries left this week
									else if(nextDeliveryDayInt > 0) {
										expectedDeliveryDayInt = dayInt;
									}
								})
							}

							// If the expectedDeliveryDayInt was not determined, meaning that there were no more delivery days available this week after the pickup day that was determined, then loop through the delivery days again and determine what the next one is - this will be the expectedDeliveryDayInt
							if(expectedDeliveryDayInt === 0) {
								deliveryDayNextWeek = true;
								deliveryDays.forEach((dayInt) => {
									// Set the expectedDeliveryDayInt to the first available delivery date of the week
									if(expectedDeliveryDayInt === 0) {
										expectedDeliveryDayInt = dayInt;
									}
								})
							}

							// Update the Orders table with the determined expectedDeliveryDay - need to do math to get the actual date
							if(expectedDeliveryDayInt > 0) {
								// Using the flags for pickup and delivery that get set in each of the conditional loops above, determine if the delivery date will be in this week, next week, or two weeks. Default would be this week, and we therefore do not have to do any math.
								if((pickupDayNextWeek === false && deliveryDayNextWeek === true) || (pickupDayNextWeek === true && deliveryDayNextWeek === false)) {
									expectedDeliveryDayInt = Math.add(expectedDeliveryDayInt, 7);
								} else if(pickupDayNextWeek === true && deliveryDayNextWeek === true) {
									expectedDeliveryDayInt = Math.add(expectedDeliveryDayInt, 14);
								}

								const daysDiffInt = Math.subtract(expectedDeliveryDayInt, dayOfWeekInteger);
								const dateExpectedDelivery = moment().add(daysDiffInt, 'days').format('YYYY-MM-DD');

								await knex('orders').where({orderId: newOrderId}).update({dateExpectedDelivery: dateExpectedDelivery});
							}
						} else {
							// can't look up and calcluate the return date so default to 3 days
							await knex('orders').where({orderId: newOrderId}).update({dateExpectedDelivery: moment().add(3, 'days').format('YYYY-MM-DD')});
						}
					} else {
						// For Communal just make it 3 days out. We can make this an account setting later
						await knex('orders').where({orderId: newOrderId}).update({dateExpectedDelivery: moment().add(3, 'days').format('YYYY-MM-DD')});
					}

					// Add the selected cremation product to the ordersProducts table - there is no personalization on the initial order creation
					await OrderProductMutations.orderProductSave(null, { input: { invoiceCostCharged: productCalculation.calculatedInvoiceCost, orderId: newOrderId, priceCharged: productCalculation.calculatedPriceRetail, productId, productName: productCalculation.productName }}, context)

					// PROMOTIONAL PRODUCTS - PP, FUR CLIPPINGS, AND URNS
					// For Clinics that have an urn, paw print, fur clipping included in the purchase of cremation, we can automatically add the selected options here
					if(parseInt(input.selectedFurClippingProductId) > 0) {
						// Get the Product array of this Fur Clipping to pass to the orderProductsPriceCalculations function
						const SelectedFurClipping = await knex('productsAccounts')
							.select('products.productName', 'productsAccounts.*')
							.join('products', 'products.productId', 'productsAccounts.productId')
							.where('products.productId', selectedFurClippingProductId)
							.andWhere('productsAccounts.accountId', context.Account.accountId);

						// Calculate the price for this FurClipping using the ordersProducts calculator
						const [FurClippingCalculation] = await orderProductsPriceCalculations({ calledFrom: 'Order.js, 1368', orderId: newOrderId, Products: SelectedFurClipping}, context);

						// Add the selected paw print product to the ordersProducts table - there is no personalization on the initial order creation
						await OrderProductMutations.orderProductSave(null, { input: { invoiceCostCharged: FurClippingCalculation.calculatedInvoiceCost, orderId: newOrderId, priceCharged: FurClippingCalculation.calculatedPriceRetail, productId: selectedFurClippingProductId, productName: FurClippingCalculation.productName }}, context)
					}
					if(parseInt(input.selectedPawPrintProductId) > 0) {
						// Get the Product array of this Paw Print to pass to the orderProductsPriceCalculations function
						const SelectedPawPrint = await knex('productsAccounts')
							.select('products.productName', 'productsAccounts.*')
							.join('products', 'products.productId', 'productsAccounts.productId')
							.where('products.productId', selectedPawPrintProductId)
							.andWhere('productsAccounts.accountId', context.Account.accountId);

						// Calculate the price for this Paw Print using the ordersProducts calculator
						const [PawPrintCalculation] = await orderProductsPriceCalculations({ calledFrom: 'Order.js, 1368', orderId: newOrderId, Products: SelectedPawPrint}, context);

						// Add the selected paw print product to the ordersProducts table - there is no personalization on the initial order creation
						await OrderProductMutations.orderProductSave(null, { input: { invoiceCostCharged: PawPrintCalculation.calculatedInvoiceCost, orderId: newOrderId, priceCharged: PawPrintCalculation.calculatedPriceRetail, productId: selectedPawPrintProductId, productName: PawPrintCalculation.productName }}, context)
					}
					if(parseInt(selectedUrnProductId) > 0) {
						// Get the Product array of this Urn to pass to the orderProductsPriceCalculations function
						const SelectedUrn = await knex('productsAccounts')
							.select('products.productName', 'productsAccounts.*')
							.join('products', 'products.productId', 'productsAccounts.productId')
							.where('products.productId', selectedUrnProductId)
							.andWhere('productsAccounts.accountId', context.Account.accountId);

						// Calculate the price for this Urn using the ordersProducts calculator
						const [UrnCalculation] = await orderProductsPriceCalculations({ calledFrom: 'Order.js, 1382', orderId: newOrderId, Products: SelectedUrn}, context);

						// Add the selected urn product to the ordersProducts table - there is no personalization on the initial order creation
						await OrderProductMutations.orderProductSave(null, { input: { invoiceCostCharged: UrnCalculation.calculatedInvoiceCost, orderId: newOrderId, priceCharged: UrnCalculation.calculatedPriceRetail, productId: selectedUrnProductId, productName: UrnCalculation.productName }}, context)
					}
					// END PROMTIONAL PRODUCTS - PP AND URNS

					// Initially we only have 'Expedited Cremation' which is a systemwide option, not editable by accounts.
					// We will have to come up with a more elegant system/solution if we start allowing accounts to add their own products into this category.
					if(input.expeditedCremation === true) {
						// Get the Product array of this expedited cremation service to pass to the orderProductsPriceCalculations function
						const expeditedCremationProduct = await knex('products')
							.select('products.productName', 'productsAccounts.*')
							.join('productsAccounts', 'productsAccounts.productId', 'products.productId')
							.where('products.productName', 'Expedited Cremation')
							.andWhere('productsAccounts.accountId', context.Account.accountId);

						// Calculate the prices for this Cremation Service using the ordersProducts calculator
						const [expeditedCremationProductCalculation] = await orderProductsPriceCalculations({ orderId: newOrderId, Products: expeditedCremationProduct}, context);

						// Put this product into the ordersProducts table - there is no personalization on the initial order creation
						await OrderProductMutations.orderProductSave(null, { input: { invoiceCostCharged: expeditedCremationProductCalculation.calculatedInvoiceCost, orderId: newOrderId, priceCharged: expeditedCremationProductCalculation.calculatedPriceRetail, productId: expeditedCremationProductCalculation.productId, productName: expeditedCremationProductCalculation.productName }}, context)
					}

					// Check if a Delivery Method was selected when the Cremation Order is placed
					if(input.deliveryMethodProductId > 0) {
						// Get the price of this delivery method
						const deliveryProduct = await knex('productsAccounts')
							.where('productsAccounts.productId', input.deliveryMethodProductId)
							.andWhere('productsAccounts.accountId', context.Account.accountId);

						// Calculate the prices for this Cremation Service using the ordersProducts calculator
						const [deliveryProductCalculation] = await orderProductsPriceCalculations({ orderId: newOrderId, Products: deliveryProduct}, context);

						// Put this product into the ordersProducts table - there is no personalization on the initial order creation
						await OrderProductMutations.orderProductSave(null, { input: { invoiceCostCharged: deliveryProductCalculation.calculatedInvoiceCost, orderId: newOrderId, priceCharged: deliveryProductCalculation.calculatedPriceRetail, productId: input.deliveryMethodProductId, productName: input.deliveryMethodName }}, context)
					}
					// OR If memorialization is marked as Checked Out, then auto select the delivery as Hospital Delivery
					else if(parseInt(input.memorializationCheckedOut) === 1) {
						// Define the Hospital Delivery Id if needed - this is a temporary work around to get a delivery method defined within the Vet's Order Cremation Creation page for ease of our crematory staff loading/unloading statuses
						await OrderProductMutations.orderProductSave(null, { input: { invoiceCostCharged: 0, orderId: newOrderId, priceCharged: 0, productId: 28, productName: 'Hospital Delivery' }}, context)
						// Update the Order to have the delivery information in its record, this is needed for the order to show up in the pickup and delivery routes correctly.
						await knex('orders').where({ orderId: newOrderId })
							.update({
								deliveryAddressId: input.pickupAddressId > 0 ? input.pickupAddressId : 0,
								deliveryMethodName: 'Hospital Delivery',
								deliveryMethodProductId: 28
							})
					}


					// Check if the cremationProduct that is added has any values in the companyDefaultProducts table for the company adding this order. If so, then add those products to this order.
					const CompanyDefaultProducts = await CompanyDefaultProductsRootResolvers.CompanyDefaultProducts(root, {companyId: context.Session.User.companyId, productId}, context);
					if(CompanyDefaultProducts.length > 0) {
						// Calculate the prices for these new products using the ordersProducts calculator
						const newProductCalculation = await orderProductsPriceCalculations({ orderId: newOrderId, Products: CompanyDefaultProducts}, context);

						// Put this product into the ordersProducts table - there is no personalization on the initial order creation
						let i;
						for(i = 0; i < newProductCalculation.length; i++) {
							const productName = newProductCalculation[i].accountProductName !== null && newProductCalculation[i].accountProductName !== '' ? newProductCalculation[i].accountProductName : newProductCalculation[i].productName;
							await OrderProductMutations.orderProductSave(null, { input: { invoiceCostCharged: newProductCalculation[i].calculatedInvoiceCost, orderId: newOrderId, priceCharged: newProductCalculation[i].calculatedPriceRetail, productId: newProductCalculation[i].productId, productName }}, context)
						}
					}

					// When this Cremation Order is created, only create the Order Tag IF the cremation is marked as checkedout.
					if(parseInt(input.memorializationCheckedOut) === 1 || input.memorialization === 'home') {
						// Create the Tag for the Cremation
						const payload = JSON.stringify({
							template: "cremationTag",
							orderId: newOrderId
						});

						[jobId] = await knex("jobs").insert({
							accountId: context.Account.accountId,
							payload,
							queue: "pdf",
							status: "pending"
						});

						// Use the headers to send in the account URL so the worker can get the proper context.
						await enqueueMessage("pdf", payload, { appId: String(jobId), headers: { filename: `${newOrderId}_order_cremation_tag.pdf`, folder: "cremationTags", accountId: String(context.Account.accountId), url: context.Account.url  } } );

						// poll until the enqueued job is completed and then return the OrderCremation object with the tag file id
						// setInterval(checkJobStatus(jobId, context), 1000);
					}
				}

				// Return different success messages for cremation vs product only order, send the jobId for the PDF tag creation, will poll until that is ready to download and print on the confirmation page
				if(input.newOrderType === 'cremation') {
					return Response(true,"Cremation Order Created Success Message", {OrderCremation: {...input, orderId: newOrderId, companyTypeId: Company.companyTypeId}, jobId: jobId });
				} else {
					return Response(true,"Product Order Created Success Message", {OrderCremation: {...input, orderId: newOrderId}, jobId: jobId });
				}
			} else if(petReferenceNumberCheck.orderId > 0) {
				return Response(false,"Pet reference number already in use.", {OrderCremation: input });
			} else {
				return Response(false,"Something went wrong, please re-enter Order information.", {OrderCremation: input });
			}
		}
	},

	async orderDelete(root, {input}, context) {
		const knex = context.knex;

		const { orderDeleteReason, orderId, orderStatusId } = input;

		if(orderId > 0 && orderDeleteReason !== '') {
			await knex('orders')
				.where({ orderId })
				.update({ orderStatusId, tabMemorializationOpen: 0 });

			await knex(' ordersComments')
				.insert({ orderId, orderComment: orderDeleteReason, userId: context.Session.User.userId });

			return Response(true,"Order Successfully Deleted", {OrderDelete: input });
		} else {
			return Response(false,"Delete Order Failed", {OrderDelete: input });
		}
	},

	async orderSave(root, {input}, context) {
		const knex = context.knex;

		let { memorialization, orderId, orderStatusId, orderTypeId, petReferenceNumber, vetSupplyOrder=0 } = input;

		// if units for weight are not the preferred units for the account, convert between metric and english units before saving
		let accountUnits = context.Account.getSettingValue("measurementSystem") === "English" ?  "lbs" : "kg";
		if(input.weightUnits === "kg" && accountUnits === "lbs") {
			input.weight = (input.weight * 2.2).toFixed(2);
		} else if(input.weightUnits === "lbs" && accountUnits === "kg") {
			input.weight = (input.weight / 2.205).toFixed(2);
		}
		input.weightUnits = accountUnits;

		if(orderId > 0) {
			let TempOrderStatus = {};

			const [Order] = await knex('orders').where({orderId});

			// Need to check if the orderStatusId being passed in has the orderCompletedIndicator = 1 flag. If so, then update the dateCompleted in the Orders table.
			if(orderStatusId > 0) {
				const [OrderStatus] = await knex('orderStatuses')
					.where({orderStatusId: orderStatusId});
				input.dateCompleted = Order.dateCompleted === null && OrderStatus.orderCompletedIndicator === 1 ? knex.fn.now() : Order.dateCompleted;
				// Update TempOrderStatus to use in the logging
				TempOrderStatus = OrderStatus;
			}

			// LOG ORDER ACTIVITY
			await handleLogOrderActivities(context, Order, input, TempOrderStatus);

			// If the orderStatusId has been changed to 15 (Completed (Couriered)), or 4 (Completed (Delivered)), or 9 (Preparation completed, awaiting delivery), then we can email the pet owner that the order has been completed.
			if((parseInt(orderStatusId) === 15 && parseInt(Order.orderStatusId) !== 15) || (parseInt(orderStatusId) === 4 && parseInt(Order.orderStatusId) !== 4) || (parseInt(orderStatusId) === 9 && parseInt(Order.orderStatusId) !== 9)) {
				// The variable is orderIds because this function can be called with many orderIds from the pickups and deliveries page
				await Mutations.sendOwnerEmail(root, {input: {orderIds: orderId, orderStatusId}}, context);
			}

			await knex('orders')
				.where({ orderId })
				.update(_.omit(input,["orderId", "sendOwnerEmailCompletedDelivered", "userInitials"]));

			const NewOrder = await knex("orders").where({ orderId }).first();

			context.subscriptions.broadcast("SUBSCRIPTION_ORDER_UPDATE", { OrderUpdateSubscription: NewOrder, context });

			return Response(true,"Order Successfully Saved", { Order });
		} else {
			// Get the hospital information defaults related to Orders from the Companies table, and save their defaults to this Order
			const [Company] = await knex('companies').where({companyId: context.Session.User.companyId})
				.select('communalPawPrintAllowed','courierDeliveryOffered','crematoryPickupOffered','cremationTypesOffered','expeditedCremationAllowed','homeMemorializationsEditCremation','hospitalDeliveryOffered','payAtPickupOffered','payByCreditCardOffered','paymentTerms','visitationAllowed');

			// force petReferenceNumnber to uppercase in case that got changed
			petReferenceNumber = petReferenceNumber.toUpperCase();

			const [ orderId ] = await knex('orders').insert({
				accountId: context.Account.accountId,
				communalPawPrintAllowed: Company.communalPawPrintAllowed,
				companyId: context.Session.User.companyId,
				courierDeliveryOffered: Company.courierDeliveryOffered,
				crematoryPickupOffered: Company.crematoryPickupOffered,
				cremationTypesOffered: Company.cremationTypesOffered,
				expeditedCremationAllowed: Company.expeditedCremationAllowed,
				homeMemorializationsEditCremation: Company.homeMemorializationsEditCremation,
				hospitalDeliveryOffered: Company.hospitalDeliveryOffered,
				memorialization,
				orderStatusId,
				orderTypeId,
				payAtPickupOffered: Company.payAtPickupOffered,
				payByCreditCardOffered: Company.payByCreditCardOffered,
				paymentTerms: Company.paymentTerms,
				petReferenceNumber: petReferenceNumber,
				userId: context.Session.User.userId,
				vetSupplyOrder,
				visitationAllowed: Company.visitationAllowed
			});

			// If this is creating a Vet Supply Order, then add the Hospital Delivery product to the order. Also, check if this company has only 1 address, if so, then automatically add that as the deliveryAddressId on the order.
			if(parseInt(orderTypeId) === 1) {
				const [HospitalDeliveryProduct] = await knex('products').where({ active: 1, productName: 'Hospital Delivery' });

				// Add Hospital Delivery product
				await OrderProductMutations.orderProductSave(null, { input: { orderId: orderId, orderProductId: 0, personalizeProduct: 0, productId: HospitalDeliveryProduct.productId, productName: 'Hospital Delivery' }}, context)

				// If this is a Vet Staff, then see about automatically adding their address.
				if(parseInt(context.Session.User.userTypeId) === 5) {
					const CompanyAddresses = await knex('companiesAddresses').where({ accountId: context.Account.accountId, active: 1, companyId: context.Session.User.companyId });
					// If there is only 1 address, set it
					if(CompanyAddresses.length === 1) {
						await knex('orders').update({ deliveryAddressId: CompanyAddresses[0].addressId }).where({ orderId: orderId })
					}
				}
			}

			// Insert a comment into the ordersComments table if there are specialInstructions
			if(input.specialInstructions !== '' && input.specialInstructions !== null && input.specialInstructions !== undefined) {
				await knex('ordersComments')
					.insert({orderId: orderId, orderComment: input.specialInstructions, orderCommentInternal: 0, userId: context.Session.User.userId})
			}

			const Order = await knex("orders").where({ orderId }).first();

			context.subscriptions.broadcast("SUBSCRIPTION_ORDER_UPDATE", { OrderUpdateSubscription: Order, context });

			return Response(true,"Order Successfully Saved", { Order });
		}
	},
	// Used by Order Status Updater
	async orderStatusUpdate(root, {input}, context) {
		const knex = context.knex;

		let {  orderStatusId, petReferenceNumber } = input;
		let orderId = 0;

		// force petReferenceNumnber to uppercase in case that got changed
		petReferenceNumber = petReferenceNumber.toUpperCase();

		// check for an order with this petReferenceNumber
		if(petReferenceNumber !== "") {
			const Order = await knex('orders')
				.where({ accountId: context.Account.accountId, petReferenceNumber: petReferenceNumber })
				.first();

			if(Order === null || Order === undefined) {
				return Response(false,"Order Not Found", {});
			} else {
				orderId = Order.orderId;
				input.orderId = Order.orderId;
			}

		} else {
			return Response(false,"Please enter a Reference Number", {});
		}

		if(orderId > 0) {
			let TempOrderStatus = {};

			const [Order] = await knex('orders').where({orderId});
			console.log({Order}) 
			console.log(`date completed null: ${Order.dateCompleted === null}`)
			// Need to check if the orderStatusId being passed in has the orderCompletedIndicator = 1 flag. If so, then update the dateCompleted in the Orders table.
			if(orderStatusId > 0) {
				const [OrderStatus] = await knex('orderStatuses')
					.where({orderStatusId: orderStatusId});
				input.dateCompleted = Order.dateCompleted === null && OrderStatus.orderCompletedIndicator === 1 ? knex.fn.now() : Order.dateCompleted;
				// Update TempOrderStatus to use in the logging
				TempOrderStatus = OrderStatus;
			}

			// LOG ORDER ACTIVITY - START
			await handleLogOrderActivities(context, Order, input, TempOrderStatus);
			//
			// // Get the current order details before saving so we can do a compare to the input values to see what needs to be logged
			// const [Order] = await knex('orders').where({orderId});
			//
			// // Loop through each column of the orders table and compare it to the input values, if they are different, push the column to an array which we will then loop through and log the differences
			// let columnsChanged = [];
			// const timestamp = knex.fn.now();
			// for(var key in Order) {
			// 	// Verify that the input has the key so that we do not log anything that is not going to be updated
			// 	if(Order[key] != input[key] && input.hasOwnProperty(key)) {
			// 		let tempActivity = `${_.startCase(key)} changed from '${Order[key]}' to '${input[key]}'`;
			// 		let tempActivityType = context.Session.LoggedIn === false ? `${_.startCase(key)} changed by pet owner` : `${_.startCase(key)} changed by user`;
			// 		// If this key is the orderStatusId, then get the status string
			// 		if(key === 'orderStatusId') {
			// 			tempActivity = `Order Status Updated to '${TempOrderStatus.orderStatus}'`;
			// 			tempActivityType = context.Session.LoggedIn === false ? `Order Status updated by pet owner` : `Order Status updated by user`;
			// 		}
			// 		let loggedInUserId = context.Session.LoggedIn === false ? null : context.Session.User.userId;
			//
			// 		columnsChanged.push({accountId: context.Account.accountId, activity: tempActivity, activityType: tempActivityType, dateCreated: timestamp, dbField: key, dbTable: 'orders', loggedInUserId: loggedInUserId, orderId: orderId, showVet: 1, userInitials: input.userInitials, valueNew: input[key], valueOld: Order[key]});
			// 	}
			// }
			//
			// // If there are any columns that are changed, then log the change
			// if(columnsChanged.length > 0) {
			// 	await knex('logOrderActivities').insert(columnsChanged);
			// }
			// LOG ORDER ACTIVITY - END
			await knex('orders')
				.where({ orderId })
				.update(_.omit(input,["orderId", "userInitials"]));

			const UpdatedOrder = await context.knex('orders')
				.select('orders.*', 'orderServiceStatuses.*', 'orderStatuses.*', 'companies.companyName', 'orderTypes.orderTypeName AS orderType')
				.leftJoin('companies', 'companies.companyId', 'orders.companyId')
				.leftJoin('orderServiceStatuses', 'orderServiceStatuses.orderServiceStatusId', 'orders.orderServiceStatusId')
				.leftJoin('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
				.leftOuterJoin('orderTypes', 'orderTypes.orderTypeId', 'orders.orderTypeId')
				.where('orders.orderId', orderId )
				.first();

			return Response(true,"Order Successfully Saved", { Order: UpdatedOrder });
		}
	},

	// Check to see if the petReferenceNumber entered on the memorialize page matches any orders that we have for this account.
	// Using a select query as a mutation due to the nature of the reference number search. In the withFormik handleSubmit, we check if there is a result, and redirect to the memorialization process if there is.
	async petReferenceNumberCheck(root, {input}, context) {
		// The .whereIn companyId is to make sure that Vets can only view orders for their company. Crematory staff/admin can view any order on their account, and pet owners would be logged out can memorialization orders on the account based on url.
		let Order = null;

		[Order] = await context.knex('orders')
			.select('orders.*', 'orderServiceStatuses.*', 'orderStatuses.*', 'companies.homeMemorializationsEditCremation', 'companies.companyName')
			.leftJoin('companies', 'companies.companyId', 'orders.companyId')
			.leftJoin('orderServiceStatuses', 'orderServiceStatuses.orderServiceStatusId', 'orders.orderServiceStatusId')
			.leftJoin('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
			.whereIn('orders.companyId', function() {
				if(context.Session.LoggedIn === true && parseInt(context.Session.User.userTypeId) === 5) {
					this.select('companyId')
						.from('companies')
						.where('companyId', context.Session.User.companyId);
				} else {
					this.select('companyId')
						.from('companies')
						.where('companyId', '>', 0);
				}
			})
			.andWhere('orders.petReferenceNumber', input.petReferenceNumber)
			.andWhere('orders.accountId', context.Account.accountId)
			.andWhereNot('orders.orderStatusId', 6);

		if(Order && Order.orderId > 0) {
			return Response(true,"Order Found", {Order});
		} else {
			return Response(false,"Order not found, please check your reference number", {Order});
		}
	},

	// This function is used for comparing the randomly generated petReferenceNumber in the order creation form to the petReferenceNumbers db for duplicates
	async petReferenceNumberCompare(root, {input}, context) {
		const [PetReferenceNumber] = await context.knex('petReferenceNumbers')
			.where({ referenceNumber: input.petReferenceNumber })

		if(PetReferenceNumber && PetReferenceNumber.petReferenceNumberId > 0) {
			return Response(false,"Match Found", {Order:PetReferenceNumber});
		} else {
			return Response(true,"Unique", {Order:PetReferenceNumber});
		}
	},

	// Function takes a Cremation Order's orderId and duplicates the demographic information, but creates the new order as a product only only. Useability is for Vet Orders that we need to add products to after memorialization has been closed.
	async productOrderDuplicateCremationOrder(root, {input}, context) {
		const [OldOrder] = await context.knex('orders')
			.where({ orderId: input.orderId })
		console.log({OldOrder})
		// Get a new petReferenceNumber for this new Product Order
		const { PetReferenceNumbers } = await PetReferenceNumberMutations.petReferenceNumberGenerate(root, {input: { numberToGenerate: 1}}, context);
		let newPetReferenceNumber = PetReferenceNumbers[0].petReferenceNumber;

		// Insert new Product Order with OldOrder demographics
		const [NewOrder] = await context.knex('orders')
			.insert({
				..._.omit(OldOrder,["orderId"]),
				bypassPaymentRequirement: 0,
				companyId: context.Session.User.companyId,
				creatorInitials: null,
				dateCompleted: null,
				dateCreated: context.knex.fn.now(),
				dateExpectedDelivery: null,
				dateMemorializationEnds: null,
				memorialization: 'none',
				memorializationCheckedOut: 0,
				orderServiceStatusId: 3,
				orderStatusId: 2,
				orderTypeId: 3,
				petReferenceNumber: newPetReferenceNumber,
				requireInitialsEditOrderDetails: 0,
				tabCremationServicesOpen: 0,
				tabDeliveryOpen: 0,
				tabJewelryOpen: 0,
				tabKeepsakesOpen: 0,
				tabMemorializationOpen: 0,
				tabPawPrintsOpen: 0,
				tabSpecialServicesOpen: 0,
				tabUrnsOpen: 0,
				userId: context.Session.User.userId
			})

		console.log({NewOrder})
		// const [PetReferenceNumber] = await context.knex('petReferenceNumbers')
		// 	.where({ referenceNumber: input.petReferenceNumber })

		// if(PetReferenceNumber && PetReferenceNumber.petReferenceNumberId > 0) {
		// 	return Response(false,"Match Found", {Order:PetReferenceNumber});
		// } else {
		// 	return Response(true,"Unique", {Order:PetReferenceNumber});
		// }
	},

	async sendOwnerEmail(root, {input}, context) {
		const knex = context.knex;
		const { orderIds, orderStatusId } = input;
		const orderIdsArray = orderIds.split(',');
		let i;
		for(i = 0; i < orderIdsArray.length; i++) {
			const [Order] = await knex('orders')
				.select('orders.memorialization', 'orders.ownerEmail', 'orders.petFirstName', 'companies.companyName', 'companies.bccHospitalForCustomerEmails', 'companies.sendOwnerEmailCompletedDelivered', 'companies.invoiceEmail')
				.join('companies', 'companies.companyId', 'orders.companyId')
				.where('orders.orderId', orderIdsArray[i]);

			// Do not send email for communal without memorialization
			// If the company has 1 flag for sendOwnerEmailCompletedDelivered and there is an owner email on the order, then email them that the order is ready for pickup.
			if(Order.memorialization !== 'none' && Order.sendOwnerEmailCompletedDelivered === 1 && Order.ownerEmail !== '' && Order.ownerEmail !== null) {
				let emailInput = {};
				if(parseInt(Order.bccHospitalForCustomerEmails) === 1 && Order.invoiceEmail !== '') {
					emailInput = {
						"bcc": Order.invoiceEmail,
						"from": context.Account.getSettingValue("adminEmail"),
						"to": Order.ownerEmail,
					};
				} else {
					emailInput = {
						"from": context.Account.getSettingValue("adminEmail"),
						"to": Order.ownerEmail,
					};
				}

				// Create the rest of the email based on what type of Delivery Method is selected on this order.
				// It is IMPORTANT to choose productName from the products table NOT the ordersProducts table because the ordersProducts table may be the productsAccounts override.
				const OrderProducts = await knex('ordersProducts')
					.select('products.productName', 'productCategories.productCategory')
					.join('products', 'products.productId', 'ordersProducts.productId')
					.join('productCategories', 'productCategories.productCategoryId', 'products.productCategoryId')
					.whereNull('ordersProducts.dateDeleted')
					.whereNull('ordersProducts.dateRefunded')
					.andWhere('ordersProducts.orderId', orderIdsArray[i]);

				const [CremationProduct] = OrderProducts.filter((product) => product.productCategory === 'Cremations');
				const [DeliveryProduct] = OrderProducts.filter((product) => product.productCategory === 'Delivery');

				if(parseInt(orderStatusId) === 4) {

					emailInput.subject = `Delivery Notice from ${Order.companyName}`;

					if(CremationProduct && CremationProduct.productName === 'Communal Cremation') {
						emailInput.text = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and any items you have purchased have been safely returned to ${Order.companyName}. Please arrange pick up at your earliest convenience.`;
						emailInput.html = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and any items you have purchased have been safely returned to ${Order.companyName}. Please arrange pick up at your earliest convenience.`;
					} else {
						emailInput.text = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and the cremated remains have been safely returned to ${Order.companyName}. Please arrange pick up at your earliest convenience.`;
						emailInput.html = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and the cremated remains have been safely returned to ${Order.companyName}. Please arrange pick up at your earliest convenience.`;
					}

					emailInput.text = `${emailInput.text} It was an honor and privilege to have been entrusted with your pets aftercare, and we would like to take this opportunity to sincerely thank you for using our services.`;
					emailInput.html = `${emailInput.html} It was an honor and privilege to have been entrusted with your pets aftercare, and we would like to take this opportunity to sincerely thank you for using our services.`;

				} else if(parseInt(orderStatusId) === 15) {

					emailInput.subject = `Delivery Notice from ${Order.companyName}`;

					if(CremationProduct && CremationProduct.productName === 'Communal Cremation') {
						emailInput.text = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and any items you have purchased have been shipped to you.`;
						emailInput.html = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and any items you have purchased have been shipped to you.`;
					} else {
						emailInput.text = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and the cremated remains have been shipped to you.`;
						emailInput.html = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and the cremated remains have been shipped to you.`;
					}

					emailInput.text = `${emailInput.text} It was an honor and privilege to have been entrusted with your pets aftercare, and we would like to take this opportunity to sincerely thank you for using our services.`;
					emailInput.html = `${emailInput.html} It was an honor and privilege to have been entrusted with your pets aftercare, and we would like to take this opportunity to sincerely thank you for using our services.`;

				} else if(parseInt(orderStatusId) === 9 && DeliveryProduct && DeliveryProduct.productName === 'Pickup at Crematory') {

					emailInput.subject = `Pick Up Notice from ${Order.companyName}`;

					if(CremationProduct && CremationProduct.productName === 'Communal Cremation') {
						emailInput.text = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and any items you have purchased are ready for pick up at our facility.`;
						emailInput.html = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and any items you have purchased are ready for pick up at our facility.`;
					} else {
						emailInput.text = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and the cremated remains are ready for pick up at our facility.`;
						emailInput.html = `This is a courtesy email notification to advise you that the cremation service for ${Order.petFirstName} is complete and the cremated remains are ready for pick up at our facility.`;
					}

					emailInput.text = `${emailInput.text} It was an honor and privilege to have been entrusted with your pets aftercare, and we would like to take this opportunity to sincerely thank you for using our services.`;
					emailInput.html = `${emailInput.html} It was an honor and privilege to have been entrusted with your pets aftercare, and we would like to take this opportunity to sincerely thank you for using our services.`;

					// Get the crematory address for this account
					const [Crematory] = await knex('companiesAddresses')
						.select('addresses.*', 'states.state')
						.join('companies', 'companies.companyId', 'companiesAddresses.companyId')
						.join('addresses', 'addresses.addressId', 'companiesAddresses.addressId')
						.join('states', 'states.stateId', 'addresses.stateId')
						.join('companyTypes', 'companyTypes.companyTypeId', 'companies.companyTypeId')
						.where('companies.accountId', context.Account.accountId)
						.andWhere('companyTypes.companyType', 'Crematory');

					emailInput.text = `${emailInput.text} Our address is: ${Crematory.address1}, ${Crematory.city}, ${Crematory.state} ${Crematory.postalCode}.`;
					emailInput.html = `${emailInput.html} Our address is: ${Crematory.address1}, ${Crematory.city}, ${Crematory.state} ${Crematory.postalCode}.`;

				}

				// Send email to the worker
				//await sendEmail(emailInput, context);
			}
		}
	}
}

export const Subscriptions = {
	// Subscription to get notifications when orders are updated.
	OrderUpdateSubscription: {
		subscribe: withFilter((root, args, context) => context.subscriptions.subscribe("SUBSCRIPTION_ORDER_UPDATE"), ( { context }, args, { Account }) => context.Account.accountId === Account.accountId)
	}
}
