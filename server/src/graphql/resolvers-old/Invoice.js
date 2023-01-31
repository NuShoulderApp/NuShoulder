import _ from "lodash";
import { cleanFilename, uploadFile } from './File';
import { enqueueMessage } from "../../utilities/RabbitMQ";
import Math from 'mathjs';
import moment from 'moment';
import { Response } from "../../utilities/helpers";

var json2xls = require('json2xls');
var fs = require('fs');

// Banfield special functionality to get their invoice into an excel format
async function createBanfieldExcelInvoice(invoiceId, context) {
	const knex = context.knex;

	const BanfieldInvoiceItems = await knex('invoiceItems').where({invoiceId});

	let BillingCodeSubTotals = [];
	// Need to get the subtotal for each address for Banfield, so for each billing code
	BanfieldInvoiceItems.forEach((item) => {
		if(BillingCodeSubTotals.find((code) => code.billingCode === item.billingCode)) {
			// Update the subtotal for this billingCode
			const BillingCodeObjectToUpdate = BillingCodeSubTotals.find((code) => code.billingCode === item.billingCode);
			BillingCodeObjectToUpdate.subtotal = Math.add(BillingCodeObjectToUpdate.subtotal, item.invoiceCostTotal);
		} else {
			// Create a new object for this billingCode to track the subtotal
			const tempObject = { billingCode: item.billingCode, subtotal: item.invoiceCostSubtotal };
			BillingCodeSubTotals.push(tempObject);
		}
	})

	const json = BanfieldInvoiceItems.map((item) => {
		const GLCode = parseInt(item.statusIsCremation) === 1 ? "510060" : "522009";
		const petFirstName = item.petFirstName !== null && item.petFirstName !== '' ? item.petFirstName.toUpperCase() : item.petFirstName;
		const petLastName = item.petLastName !== null && item.petLastName !== '' ? item.petLastName.toUpperCase() : item.petLastName;

		const hospitalSubtotal = BillingCodeSubTotals.find((code) => code.billingCode === item.billingCode).subtotal;
		return (
			{
				"BUSINESS UNIT": "Banfield BU",
				"SUPPLIER NUMBER": "35894",
				"SUPPLIER SITE": "6400BENTLEYAVE",
				"INVOICE #": invoiceId,
				"INVOICE DATE": moment(knex.fn.now()).format('M/D/YYYY'),
				"ACCOUNTING DATE": '',
				"LINE TYPE": "ITEM",
				"HOSPITAL # (SHIP TO)": item.billingCode,
				"COST CENTER (CHARGE TO)": item.billingCode,
				"G/L CODE": GLCode,
				"QTY": 1,
				"UNIT COST": item.invoiceCostSubtotal,
				"LINE AMOUNT": item.invoiceCostSubtotal,
				"DESCRIPTION": `${petLastName}, ${petFirstName}, ${item.invoiceItemDescription}`,
				"Subtotal": hospitalSubtotal,
				"Unit of Measure": '',
			}
		)
	});

	// Use convert to excel file plugin
	var xls = json2xls(json);

	// Add datetime to filename
	const cleanName = cleanFilename('BanfieldInvoice.xls', context);

	// Write the file to the root directory
	fs.writeFileSync(cleanName, xls, 'binary');

	// Save the file to S3
	const fileResult = await uploadFile({
		createReadStream: () => fs.createReadStream(cleanName),
		mimetype: "text/csv",
		encoding:"",
		filename: cleanName
	}, context, 'invoicesExcel', false);

	// Save the fileId into the invoice record
	if(fileResult && fileResult.fileId > 0) {
		await knex('invoices')
			.update({ fileId: fileResult.fileId })
			.where({ invoiceId });
	}

	// Remove the created file from the root directory now that it is saved to S3
	fs.unlink(cleanName, (err) => {
		if (err) throw err;
	});
}

// Function for updating
async function loopingOrderProducts(root, {companyId, newInvoiceId, Order, OrderProductIds}, context) {
	const knex = context.knex;

	// If there are any invoiceItems for this orderId which do not have an invoiceId, update them to have this 'newInvoiceId'. These adjustments are created in the order details page by crematory staff in the Vet Charges area before the order has been invoiced.
	await knex('invoiceItems')
		.update({invoiceId: newInvoiceId})
		.where({orderId: Order.orderId, invoiceid: 0});

	let OrderProducts = [];
	if(OrderProductIds === '') {
		// Get the OrdersProducts records for this Order. We want both invoiceVet = 0 and 1 because the 0 records we will use to determine the difference between the price paid paid the customer and the invoice cost to be used as a credit to the vet on the invoice
		OrderProducts = await knex('ordersProducts')
			.select('ordersProducts.*', 'productsAccounts.accountProductName', 'productsAccounts.accountDescriptionLong', 'productsAccounts.accountDescriptionShort')
			.join('productsAccounts', 'productsAccounts.productId', 'ordersProducts.productId')
			.where('ordersProducts.orderId', Order.orderId)
			.whereNull('ordersProducts.dateDeleted')
			.whereNull('ordersProducts.dateRefunded')
			.andWhere('productsAccounts.accountId', context.Account.accountId)

	} else {
		// Get the OrdersProducts records for this Order that are in the list of OrderProductIds passed in
		OrderProducts = await knex('ordersProducts')
			.select('ordersProducts.*', 'productsAccounts.accountProductName', 'productsAccounts.accountDescriptionLong', 'productsAccounts.accountDescriptionShort')
			.join('productsAccounts', 'productsAccounts.productId', 'ordersProducts.productId')
			.whereIn('ordersProducts.orderProductId', OrderProductIds)
			.whereNull('ordersProducts.dateDeleted')
			.whereNull('ordersProducts.dateRefunded')
			.andWhere('ordersProducts.orderId', Order.orderId)
			.andWhere('productsAccounts.accountId', context.Account.accountId)
	}

	let i;
	for(i = 0; i < OrderProducts.length; i++) {
		const invoiceCostCharged = OrderProducts[i].invoiceCostCharged !== null ? OrderProducts[i].invoiceCostCharged : 0;
		const invoiceCostChargedPersonalization = OrderProducts[i].invoiceCostChargedPersonalization !== null ? OrderProducts[i].invoiceCostChargedPersonalization : 0;
		const invoiceCostSubtotal = Math.add(invoiceCostCharged, invoiceCostChargedPersonalization).toFixed(2);
		const taxDue = OrderProducts[i].taxChargedInvoice;

		const productName = OrderProducts[i].accountProductName !== null && OrderProducts[i].accountProductName !== '' ? OrderProducts[i].accountProductName : OrderProducts[i].productName;

		// Save an invoiceItem for each orderProduct
		await Mutations.invoiceItemSave(
			root,
			{input: {
				accountId: context.Account.accountId,
				billingCode: Order.billingCode,
				companyAddressId: Order.companyAddressId,
				companyId: companyId,
				invoiceId: newInvoiceId,
				invoiceCost: invoiceCostCharged,
				invoiceCostPersonalization: invoiceCostChargedPersonalization,
				invoiceCostSubtotal: invoiceCostSubtotal,
				invoiceCostTotal: Math.add(taxDue, invoiceCostSubtotal).toFixed(2),
				invoiceItemDescription: productName,
				invoiceItemType: 'Charge',
				orderId: Order.orderId,
				orderProductId: OrderProducts[i].orderProductId,
				petFirstName: Order.petFirstName,
				petLastName: Order.petLastName,
				statusIsCremation: OrderProducts[i].statusIsCremation,
				taxDue: taxDue,
				weight: Order.weight,
				weightUnits: Order.weightUnits
			}},
			context
		)

		// Always create an invoiceItem for the "invoice cost" of the order product. IF invoiceVet=0, then also create an invoiceItem for the credit portion of the orderProduct.
		if(OrderProducts[i].invoiceVet === 0) {

			const priceCharged = OrderProducts[i].priceCharged !== null ? OrderProducts[i].priceCharged : 0;
			const priceChargedPersonalization = OrderProducts[i].priceChargedPersonalization !== null ? OrderProducts[i].priceChargedPersonalization : 0;
			const priceChargedSubtotal = Math.add(priceCharged, priceChargedPersonalization).toFixed(2);
			const taxCharged = OrderProducts[i].taxCharged;

			// const tempInvoiceCost = Math.subtract(invoiceCostCharged, priceCharged).toFixed(2);
			// const tempInvoiceCostPersonalization = Math.subtract(invoiceCostChargedPersonalization, priceChargedPersonalization).toFixed(2);
			// const tempInvoiceCostSubtotal = Math.subtract(invoiceCostSubtotal, priceChargedSubtotal).toFixed(2);
			// const tempTaxDue = Math.subtract(taxDue, taxCharged).toFixed(2);

			// Check if this product was paid for by the pet owner - 11/25/20 Barrett
			let tempDescription = productName;
			if(parseInt(OrderProducts[i].paymentCompletedVetOrder) === 1 && priceChargedSubtotal !== '0.00') {
				let tempPaymentMethod = parseInt(OrderProducts[i].paymentCompletedAlternative) === 1 ? OrderProducts[i].paymentCompletedAlternativeMethod : 'Credit Card';
				tempDescription = `${productName} - Paid by ${tempPaymentMethod}`;
			}

			// Only Save this 'Credit' row if paymentCompletedVetOrder = 0 (all standard products), OR based on new functionality for Vet's to be able to selectively pay for orders via CC, if there is a priceCharged.
			if(OrderProducts[i].paymentCompletedVetOrder === 0 || (OrderProducts[i].paymentCompletedVetOrder === 1 && priceChargedSubtotal !== '0.00')) {
				// Save an invoiceItem for each orderProduct
				await Mutations.invoiceItemSave(
					root,
					{input: {
						accountId: context.Account.accountId,
						companyId: companyId,
						invoiceId: newInvoiceId,
						orderId: Order.orderId,
						orderProductId: OrderProducts[i].orderProductId,
						invoiceCost: -priceCharged,
						invoiceCostPersonalization: -priceChargedPersonalization,
						invoiceCostSubtotal: -priceChargedSubtotal,
						invoiceCostTotal: -Math.add(taxCharged, priceChargedSubtotal).toFixed(2),
						invoiceItemDescription: tempDescription,
						invoiceItemType: 'Credit',
						taxDue: -taxCharged,
						weight: Order.weight,
						weightUnits: Order.weightUnits
					}},
					context
				)
			}
		}
	}
}

async function createInvoice(root, {companyId, OrderIds, OrderProductIds, calledFromGenerateAllInvoices=false}, context) {
	const knex = context.knex;

	// Get the company email and net15/30 payment terms
	const Company = await knex('companies')
		.select('invoiceEmail', 'paymentTerms')
		.where('companyId', companyId)
		.first();

	let dateInvoiceDue = null;
	// Set the dateInvoiceDue if this is being called from the "Generate All Invoices"
	if(calledFromGenerateAllInvoices === true) {
		if(Company.paymentTerms === 'net_15') {
			dateInvoiceDue = moment(knex.fn.now()).add(15, 'days').utc().format('YYYY-MM-DD');

		} else if(Company.paymentTerms === 'net_30') {
			dateInvoiceDue = moment(knex.fn.now()).add(30, 'days').utc().format('YYYY-MM-DD');
		}
	}

	// IMPORTANT: DO NOT SET dateInvoiceSent in this function since it is used for the GenerateAllInvoices and for Kyle's single crematory invoice system where we create the invoice THEN sent it with a separate action/button. So sent dateInvoiceSent within the parent functions that call this if applicable.
	// Create the new invoice for this company
	const [newInvoiceId] = await knex('invoices').insert({
		accountId: context.Account.accountId,
		companyId: companyId,
		dateInvoiceDue: dateInvoiceDue,
		emailedTo: Company.invoiceEmail,
		paymentTerms: Company.paymentTerms
	});

	// Get all of the orders for this company on this invoice
	const Orders = await knex('orders')
		.select('orders.*', 'companiesAddresses.billingCode', 'companiesAddresses.companyAddressId')
		.leftJoin('companiesAddresses', 'companiesAddresses.addressId', 'orders.pickupAddressId')
		.whereIn('orders.orderId', OrderIds)
		.andWhere('orders.companyId', companyId);

	// Loop through each order, and then loop through all of the orderProductIds that have that orderId and create invoiceItems for them
	let i;
	for(i = 0; i < Orders.length; i++) {
		await loopingOrderProducts(root, {companyId, newInvoiceId, Order: Orders[i], OrderProductIds}, context);
	}

	return newInvoiceId;
}

export const SubResolvers = {
	async ItemsInvoice(Invoice, args, context) {
		return await context.knex('invoiceItems')
			.select('invoiceItems.*', 'orders.petReferenceNumber', 'ordersProducts.productName', 'orders.familyFriendPet', 'orders.servicePet', 'orders.staffEmployeePet', 'productCategories.productCategory')
			.join('orders', 'orders.orderId', 'invoiceItems.orderId')
			.leftJoin('ordersProducts', 'ordersProducts.orderProductId', 'invoiceItems.orderProductId')
			.leftJoin('products', 'products.productId', 'ordersProducts.productId')
			.leftJoin('productCategories', 'productCategories.productCategoryId', 'products.productCategoryId')
			.whereNot('invoiceItems.deleted', 1)
			.andWhere('invoiceItems.invoiceId', Invoice.invoiceId)
			.orderBy('invoiceItems.orderId', 'desc');
	},
	async File({ fileId }, args, context) {
		return await context.knex("files").where({ fileId }).first();
	},

	// //IMPORTANT: The reason that we name this differently than the actual db table name is that you cannot have the same name for a Root Resolver and a Sub Resolver - this causes issues with the types and schema errors.
	// async InvoiceOrderProduct(Order, args, context) {

	// 	// Get all of the products on an order, these get placed into the 'OrderProducts' object as the 'Products' array
	// 	return await context.knex('ordersProducts')
	// 		.where('ordersProducts.orderId', Order.orderId)
	// }
};

export const RootResolvers = {
	async Invoice(root, {invoiceId, orderId}, context) {
		// orderId is passed in from the Order Details component to get the invoice information from the Vet Charges area
		if(orderId > 0) {
			const [invoice] = await context.knex('invoices')
				.select('invoices.*')
				.join('invoiceItems', 'invoiceItems.invoiceId', 'invoices.invoiceId')
				.where('invoiceItems.orderId', orderId);
			return invoice;

		} else {
			const [invoice] = await context.knex('invoices')
				.select('invoices.*', 'companies.companyName')
				.join('companies', 'companies.companyId', 'invoices.companyId')
				.where('invoices.invoiceId', invoiceId);

			return invoice;
		}
	},

	// This and the function below are called from the Invoice Create page, using filtering. This function is needed to grab the adjustments which are added to an Order via the Details page.
	// Given an orderId, grab all invoiceItems that are not deleted and are not attached to an invoiceId yet. The only option for them to get into the invoiceItems table is they were added as adjustments via the Order Details page.

	async InvoiceableAdjustments(root, {companyId, dateEnd, dateStart}, context) {
		const InvoiceableAdjustments = await context.knex('invoiceItems')
			.select('invoiceItems.*', 'companies.companyName', 'orders.familyFriendPet', 'orders.servicePet', 'orders.staffEmployeePet', 'orders.petReferenceNumber', 'orders.orderId')
			.leftOuterJoin('orders', 'orders.orderId', 'invoiceItems.orderId')
			.leftOuterJoin('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
			.leftOuterJoin('companies', 'companies.companyId', 'orders.companyId')
			.where('invoiceItems.deleted', 0)
			.andWhere('invoiceItems.invoiceId', 0)
			.andWhere('invoiceItems.companyId', companyId)
			.whereNull('invoiceItems.orderProductId')
			.andWhere('orderStatuses.orderCompletedIndicator', 1)
			.andWhere('orders.accountId', context.Account.accountId)
			.andWhere('orders.dateCompleted', '<=', dateEnd)
			.andWhere('orders.dateCompleted', '>=', dateStart)
			.orderBy('invoiceItems.invoiceItemId', 'desc');

		return InvoiceableAdjustments;
	},

	// This is called from the Inoivce Create page, using filtering
	async InvoiceableOrdersProducts(root, {companyId, dateEnd, dateStart}, context) {
		const OrdersProducts = await context.knex('ordersProducts')
			.select('ordersProducts.*', 'companies.companyName', 'orders.familyFriendPet', 'orders.servicePet', 'orders.staffEmployeePet', 'orders.petReferenceNumber', 'orders.orderId', 'productTypes.productType', 'productsAccounts.accountProductName', 'productsAccounts.accountDescriptionLong', 'productsAccounts.accountDescriptionShort')
			.leftOuterJoin('orders', 'orders.orderId', 'ordersProducts.orderId')
			.leftOuterJoin('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
			.leftOuterJoin('products', 'products.productId', 'ordersProducts.productId')
			.leftOuterJoin('productsAccounts', 'productsAccounts.productId', 'ordersProducts.productId')
			.leftOuterJoin('productTypes', 'productTypes.productTypeId', 'products.productTypeId')
			.leftOuterJoin('companies', 'companies.companyId', 'orders.companyId')
			.whereIn('orders.companyId', function() {
				if(companyId > 0) {
					this.select('companyId')
						.from('companies')
						.where({companyId})
				} else {
					this.select('companyId')
						.from('companies')
						.where('companyId', '>', 0)
						.andWhere('accountId', context.Account.accountId)
				}
			})
			.whereNotIn('ordersProducts.orderProductId', function() {
				this.select('orderProductId')
					.from('invoiceItems')
					.where({'deleted': 0})
					.whereNotNull('orderProductId')
					.distinct()
			})
			.andWhere('orderStatuses.orderCompletedIndicator', 1)
			.andWhere('productsAccounts.accountId', context.Account.accountId)
			.andWhere('orders.accountId', context.Account.accountId)
			.andWhere('orders.dateCompleted', '<=', dateEnd)
			.andWhere('orders.dateCompleted', '>=', dateStart)
			.whereNull('ordersProducts.dateDeleted')
			.whereNull('ordersProducts.dateRefunded')
			.orderBy('orders.orderId', 'desc');

		return OrdersProducts;
	},

	async Invoices(root, input, context) {
		// Determine the user's userTypeId, accountId, companyId, and permissions for invoices
		const userTypeId = context.Session.User.userTypeId;
		const invoicePermissionLevel = parseInt(context.Session.User.Permissions.find((permission) => permission.permission === 'invoices').permissionLevel);

		// If this is a Vet or Cemetery Staff, return invoices for just their company.
		if(userTypeId === 5 || userTypeId === 4) {
			if(invoicePermissionLevel > 0) {
				return context.knex('invoices')
					.select('invoices.*', 'files.fileId', 'files.mimeType')
					.leftJoin('files', 'files.fileId', 'invoices.fileId')
					.where('invoices.companyId', context.Session.User.companyId)
					.orderBy('invoices.invoiceId', 'desc');
			} else {
				return [];
			}
		} else if(userTypeId === 2 || userTypeId === 3) {
			if(invoicePermissionLevel > 0) {
				return context.knex('invoices')
					.select('invoices.*', 'companies.companyName', 'files.fileId', 'files.mimeType')
					.join('companies', 'companies.companyId', 'invoices.companyId')
					.leftJoin('files', 'files.fileId', 'invoices.fileId')
					.where('invoices.accountId', context.Account.accountId)
					.orderBy('invoices.dateInvoicePeriodEnding', 'DESC')
					.orderBy('companies.companyName', 'ASC');
			} else {
				return [];
			}
		}
	},

// .select(
// 				'orders.companyId',
// 				'orders.dateCreated',
// 				'ordersProducts.invoiceCostCharged',
// 				'ordersProducts.invoiceCostChargedPersonalization',
// 				'ordersProducts.invoiceVet',
// 				'orders.memorialization',
// 				'orders.orderId',
// 				'ordersProducts.orderProductId',
// 				'orders.orderTypeId',
// 				'ordersProducts.personalizeProduct',
// 				'orders.petReferenceNumber',
// 				'ordersProducts.priceCharged',
// 				'ordersProducts.priceChargedPersonalization',
// 				'ordersProducts.productId',
// 				'ordersProducts.productName',
// 				'ordersProducts.statusIsCremation',
// 				'ordersProducts.statusIsDelivery',
// 				'ordersProducts.statusIsFurClipping',
// 				'ordersProducts.statusIsPawPrint',
// 				'ordersProducts.taxCharged',
// 				'ordersProducts.taxChargedInvoice',
// 				'orders.vetSupplyOrder')



	// Invoice Forecasting by Barrett 11/2020
	async InvoiceForecasting(root, {clinicId=0, dateEnd, dateStart, filterOrderTypeDate}, context) {
		const knex = context.knex;
		// filterOrderTypeDate='Invoiceable' get all orders that have a status of 'Preparation Completed - Awaiting Delivery' or after, that have not been invoiced
		return await knex('orders')
			.select(
				'orders.*', 
				'orders.dateCreated AS orderDate', 
				'ordersProducts.*', 
			)
			.join('ordersProducts', 'ordersProducts.orderId', 'orders.orderId')
			.where(function() {
				if(clinicId > 0) {
					this.where('orders.companyId', clinicId)
				} else {
					this.where('orders.companyId', '>', 0)
				}
			})
			.whereNull('ordersProducts.dateDeleted')
			.whereNull('ordersProducts.dateRefunded')
			.andWhereNot('orders.orderStatusId', 6)
			.whereIn('orders.orderId',function() {
				if(filterOrderTypeDate==='Invoiceable') {
					// All orders with a status beyond the step of "Preparation Completed - awaiting delivery"
					// this.select('o.orderId')
					// 	.from('orders as o')
					// 	.whereIn('o.orderStatusId', function() {
					// 		this.select('orderStatusId')
					// 			.from('orderStatuses')
					// 			.where('defaultSortOrder', '>', 6)
					// 	})
						
					this.select('orderId')
						.from('orders')
						.where('orders.dateCompleted', '<=', moment(dateEnd).format('YYYY-MM-DD'))
						.andWhere('orders.dateCompleted', '>=', moment(dateStart).format('YYYY-MM-DD'))
						.whereNotNull('orders.dateCompleted')
						.whereNotIn('orders.orderId', function() {
							this.select('orderId')
								.from('invoiceItems')
								.where('invoiceItems.invoiceId', '>', 0)
								.distinct()
								
						})
				} else {
					this.select('orderId')
						.from('orders')
						.where('orders.dateCreated', '<=', moment(dateEnd).format('YYYY-MM-DD'))
						.andWhere('orders.dateCreated', '>=', moment(dateStart).format('YYYY-MM-DD'))
				}
			})
			
			.orderBy('orders.companyId')
			.orderBy('orders.orderId')
	},

	// Sub-component of Invoice Forecasting for getting the invoiceItems belonging to orders matching the same filters, and which have not yet been invoiced.
	async InvoiceItemsForecasting(root, {clinicId=0, dateEnd, dateStart, filterOrderTypeDate}, context) {
		const knex = context.knex;

		if(filterOrderTypeDate==='Invoiceable') {
			return await knex('invoiceItems')
				.select(
					'invoiceItems.invoiceCostSubtotal AS adjustmentInvoiceCostSubtotal',
					'invoiceItems.invoiceCostTotal AS adjustmentInvoiceCostTotal',
					'invoiceItems.invoiceItemDescription AS adjustmentInvoiceItemDescription', 
					'invoiceItems.invoiceItemDescriptionPrivate AS adjustmentInvoiceItemDescriptionPrivate',
					'invoiceItems.invoiceItemType AS adjustmentInvoiceItemType',
					'invoiceItems.orderId AS adjustmentOrderId',
					'invoiceItems.taxDue AS adjustmentTaxDue'
				)
				.join('orders', 'orders.orderId', 'invoiceItems.orderId')
				.where(function() {
					if(clinicId > 0) {
						this.where('orders.companyId', clinicId)
					} else {
						this.where('orders.companyId', '>', 0)
					}
				})
				.andWhere('invoiceItems.invoiceId', 0)
				.andWhere('invoiceItems.deleted', 0)
				.andWhereNot('orders.orderStatusId', 6)
				.whereIn('orders.orderId',function() {
					this.select('orderId')
						.from('orders')
						.where('orders.dateCompleted', '<=', moment(dateEnd).format('YYYY-MM-DD'))
						.andWhere('orders.dateCompleted', '>=', moment(dateStart).format('YYYY-MM-DD'))
						.whereNotNull('orders.dateCompleted')
				})
				.orderBy('invoiceItems.invoiceItemId', 'asc')
				.orderBy('orders.orderId')
		} 
		else {
			return await knex('invoiceItems')
				.select(
					'invoiceItems.invoiceCostSubtotal AS adjustmentInvoiceCostSubtotal',
					'invoiceItems.invoiceCostTotal AS adjustmentInvoiceCostTotal',
					'invoiceItems.invoiceItemDescription AS adjustmentInvoiceItemDescription', 
					'invoiceItems.invoiceItemDescriptionPrivate AS adjustmentInvoiceItemDescriptionPrivate',
					'invoiceItems.invoiceItemType AS adjustmentInvoiceItemType',
					'invoiceItems.orderId AS adjustmentOrderId',
					'invoiceItems.taxDue AS adjustmentTaxDue'
				)
				.join('orders', 'orders.orderId', 'invoiceItems.orderId')
				.where(function() {
					if(clinicId > 0) {
						this.where('orders.companyId', clinicId)
					} else {
						this.where('orders.companyId', '>', 0)
					}
				})
				// .andWhere('invoiceItems.invoiceItemType', 'Adjustment')
				.andWhere('invoiceItems.deleted', 0)
				.andWhere('invoiceItems.invoiceId', 0)
				.andWhereNot('orders.orderStatusId', 6)
				.whereIn('orders.orderId',function() {
					this.select('orderId')
						.from('orders')
						.where('orders.dateCreated', '<=', moment(dateEnd).format('YYYY-MM-DD'))
						.andWhere('orders.dateCreated', '>=', moment(dateStart).format('YYYY-MM-DD'))
				})
				.orderBy('invoiceItems.invoiceItemId', 'asc')
				.orderBy('orders.orderId')
		}
	}

}

// MUTATIONS
export const Mutations = {
	// Generates all of the invoices for a crematory to send to each vet
	async invoiceGenerateAll(root, {input}, context) {
		const knex = context.knex;

		// dateEnd and dateStart are coming in as type 'String', and only come through as inputs if they are not blank
		const { dateEnd='', dateStart='' } = input;

		// Get all of the orders which have a status with the completed indicator flag, that have any ordersProducts records that are not in the invoiceItems table. Also verify that the invoiceItem has not been deleted.
		let query = knex('orders')
			.join('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
			.whereNotIn('orders.orderId', function() {
				this.select('ii.orderId')
					.from('invoiceItems as ii')
					.where('ii.deleted', 0)
					.andWhere('ii.invoiceId', '>', 0)
					.distinct()
			})
			.whereNotNull('orders.dateCompleted')
			.andWhere('orderStatuses.orderCompletedIndicator', 1)
			.andWhere('orders.accountId', context.Account.accountId)
			.orderBy('orders.orderId', 'desc')
			.distinct();

		// If the dateEnd or dateStart input variables are passed in, apply them to the OrdersQuery. These are strings and mySQL will evaluate them into dates. dateCompleted is a Date.
		if(dateEnd !== '') {
			//const tempDateEnd = dateEnd.slice(0,10);
			query.whereRaw('orders.dateCompleted <= ?', dateEnd)
		}
		if(dateStart !== '') {
			query.whereRaw('orders.dateCompleted >= ?', dateStart)
		}

		let orders = await query;

		// Here we have a list of all the orderIds in query that need to be invoiced.
		// query is going to be an array of objects like { orderId: 56 }, and we just need an array of those integers
		const OrderIds = orders.map((orderId) => (orderId.orderId));

		// Get the distinct companyIds for the orders - each invoice is for a unique company, and can have many orders
		const CompanyIds = await knex('orders')
			.distinct('companyId')
			.whereIn('orderId', OrderIds);

		let Company = null;

		// Loop through the companyIds, creating an invoice for each, then add the invoiceItems
		let i;
		for(i = 0; i < CompanyIds.length; i++) {
			const newInvoiceId = await createInvoice(root, {companyId: CompanyIds[i].companyId, OrderIds, OrderProductIds: '', calledFromGenerateAllInvoices: true}, context);

			// Get the invoiceCostSubtotal, invoiceCostTotal, and taxDue and add those to the existing values for the invoiceId in the invoice table.
			const InvoiceItems = await knex('invoiceItems')
				.where({invoiceId: newInvoiceId})

			// Loop through the invoiceItems result and add up the subtotal, taxDue, and Total
			let tempNewInvoiceSubtotal = 0;
			let tempNewInvoiceTaxDue = 0;
			let tempNewInvoiceTotalDue = 0;
			let j;
			for(j = 0; j < InvoiceItems.length; j++) {
				tempNewInvoiceSubtotal = Math.add(InvoiceItems[j].invoiceCostSubtotal, tempNewInvoiceSubtotal).toFixed(2);
				tempNewInvoiceTaxDue = Math.add(InvoiceItems[j].taxDue, tempNewInvoiceTaxDue).toFixed(2);
				tempNewInvoiceTotalDue = Math.add(InvoiceItems[j].invoiceCostTotal, tempNewInvoiceTotalDue).toFixed(2);
			}

			let dateInvoicePeriodEnding = dateEnd !== '' ? dateEnd : moment().format('YYYY-MM-DD');
			// Update the dateInvoiceSent also because we sent out each invoice after it is generated here. The reason we do this here and not when we do the invoice insert is that there is a warning alert on the client that checks if any invoiceItems have dateCreated > the invoice's dateInvoiceSent
			await Mutations.invoiceSave(root, {input: {dateInvoiceSent: knex.fn.now(), dateInvoicePeriodEnding, subtotal: tempNewInvoiceSubtotal, invoiceId: newInvoiceId, taxDue: tempNewInvoiceTaxDue, totalDue: tempNewInvoiceTotalDue}}, context);

			// For Banfield, do not send the invoice PDF, create an excel
			Company = await knex('companies')
				.where('companyId', CompanyIds[i].companyId)
				.first();

			if(Company.companyName.substring(0,8) === "Banfield") {
				// Do not create invoice for this.
				await createBanfieldExcelInvoice(newInvoiceId, context)
			} else {
				// Create the Job to generate the invoice PDF
				await Mutations.invoiceSaveAndSend(root, { input: { invoiceId: newInvoiceId, emailedTo: null, dateInvoice: knex.fn.now(), sendEmail: false }}, context);
			}
		}

		return Response(true,"Saved");
	},

	async invoiceItemDelete(root, {input}, context) {
		const knex = context.knex;

		const { deletedReason, invoiceItemId } = input;

		await knex('invoiceItems').update({
			dateDeleted: knex.fn.now(),
			deleted: 1,
			deletedByUserId: context.Session.User.userId,
			deletedReason: deletedReason
		}).where({ invoiceItemId: parseInt(invoiceItemId)});

		return Response(true,"Saved");
	},

	async invoiceItemSave(root, {input}, context) {
		const knex = context.knex;

		// const { accountId, companyId, invoiceId, invoiceItemId, orderId, invoiceCost, invoiceCostPersonalization, invoiceCostSubtotal, invoiceCostTotal, orderProductId, taxDue, totalCharity, weight, weightUnits } = input;
		if(input.invoiceItemId > 0) {
			await knex('invoiceItems').update(input).where({ invoiceItemId: input.invoiceItemId });
			return Response(true,"Saved");
		} else {
			// if this item is created from Add an Adjustment form on the invoice details page, then we need to get the orderId using the petReferenceNumber that is passed in. Then omit that variable from the input insert and add in the orderId we find.
			if(input.petReferenceNumber) {
				const Order = await knex('orders').where({ petReferenceNumber: input.petReferenceNumber }).first();

				// Remove the petReferenceNumber from the input, since this is not a column in the invoiceItems table
				const tempInput = _.omit(input,["petReferenceNumber"]);

				// Save and add found orderId to input
				await knex('invoiceItems').insert({...tempInput, orderId: Order.orderId});
			} else {
				await knex('invoiceItems').insert(input);
			}
			return Response(true,"Saved");
		}

	},

	// This is called for the Single Company Invoice functionality.
	async invoiceSave(root, {input}, context) {
		const knex = context.knex;

		if(input.invoiceId > 0) {
			await knex('invoices')
				.where({ invoiceId: input.invoiceId })
				.update(_.omit(input,["invoiceId"]));

			return Response(true,"Saved");
		} else {
			// Create the invoice record, and then create the invoiceItems

			// Get the distinct orderIds for all of the orderProductIds passed in as the list of orderProductIds, parsing the comma list into an array that can be passing into the whereIn
			const OrderProductIds = JSON.parse("[" + input.orderProductIds + "]");

			const OrdersProducts = await knex('ordersProducts')
				.distinct('orderId')
				.whereIn('orderProductId', OrderProductIds);

			// OrdersProducts is going to be an array of objects like { orderId: 56 }, and we just need an array of those integers
			const OrderIds = OrdersProducts.map((OrdersProduct) => (OrdersProduct.orderId));

			// Get the distinct companyIds for the orders - each invoice is for a unique company, and can have many orders
			const CompanyIds = await knex('orders')
				.distinct('companyId')
				.whereIn('orderId', OrderIds);

			// Loop through the companyIds, creating an invoice for each, then add the invoiceItems
			let i;
			for(i = 0; i < CompanyIds.length; i++) {
				// FUTURE NOTE: IF Canada wants to be able to select individual adjustments made on Orders from the Create Single Invoice page, the next two lines of NOTES will need to be accounted for.
				// FUTURE NOTE: Canada only: For the Create Single Company Invoice functionality, we also have to account for the addition of Adjustments made via the Order Details, which are already in the invoiceItems table, connected to the companyId and orderId, but without an invoiceId.
				// FUTURE NOTE: Canada only: So passing the InvoiceItemIds here we can check each to see if it is connected to this company/order, then update the invoiceId within this createInvoice function.
				const newInvoiceId = await createInvoice(root, {companyId: CompanyIds[i].companyId, OrderIds, OrderProductIds}, context);

				// Get the invoiceCostSubtotal, invoiceCostTotal, and taxDue and add those to the existing values for the invoiceId in the invoice table.
				const InvoiceItems = await knex('invoiceItems')
					.where({invoiceId: newInvoiceId})

				// Loop through the invoiceItems result and add up the subtotal, taxDue, and Total
				let tempNewInvoiceSubtotal = 0;
				let tempNewInvoiceTaxDue = 0;
				let tempNewInvoiceTotalDue = 0;
				let j;
				for(j = 0; j < InvoiceItems.length; j++) {
					tempNewInvoiceSubtotal = Math.add(InvoiceItems[j].invoiceCostSubtotal, tempNewInvoiceSubtotal).toFixed(2);
					tempNewInvoiceTaxDue = Math.add(InvoiceItems[j].taxDue, tempNewInvoiceTaxDue).toFixed(2);
					tempNewInvoiceTotalDue = Math.add(InvoiceItems[j].invoiceCostTotal, tempNewInvoiceTotalDue).toFixed(2);
				}

				await Mutations.invoiceSave(root, {input: {subtotal: tempNewInvoiceSubtotal, invoiceId: newInvoiceId, taxDue: tempNewInvoiceTaxDue, totalDue: tempNewInvoiceTotalDue}}, context);
			}

			return Response(true,"Saved");
		}
	},
	async invoiceSaveAndSend(root, { input }, context) {
		const knex = context.knex;

		const {
			dateInvoice,
			emailedTo,
			invoiceId,
			sendEmail=true
		} = input;

		const payload = JSON.stringify({
			template: "invoice",
			invoiceId,
			emailedTo,
			sendEmail
		});

		await knex("invoices").update({
			dateInvoice,
			dateInvoiceSent: knex.fn.now(),
			emailedTo,
			fileId: null
		}).where({ invoiceId });

		//check if this is for Banfield and, if so, create a spreadsheet instead
		const invoice = await context.knex('invoices')
			.select('invoices.*', 'companies.companyName', 'files.fileId', 'files.mimeType')
			.join('companies', 'companies.companyId', 'invoices.companyId')
			.leftJoin('files', 'files.fileId', 'invoices.fileId')
			.where({'invoices.accountId': context.Account.accountId, 'invoices.invoiceId': invoiceId})
			.first();

		if(invoice && invoice.companyName && invoice.companyName.substring(0,8) === "Banfield") {
			// Do not create invoice for this.
			await createBanfieldExcelInvoice(invoiceId, context);

			return Response(true,`Saved File`, { Invoice: { invoiceId,	emailedTo,	dateInvoice, fileId: invoice.fileId, jobId: null } });
		} else {
			const [jobId] = await knex("jobs").insert({
				accountId: context.Account.accountId,
				payload,
				queue: "pdf",
				status: "pending"
			});

			// Use the headers to send in the account URL so the worker can get the proper context.
			await enqueueMessage("pdf", payload, { appId: String(jobId), headers: { folder:"invoices", filename: `${invoiceId}_invoice.pdf`, accountId: String(context.Account.accountId), url: context.Account.url  } } );

			// As the worker will be producing a new file, we will just return and empty fieldId for now so that the button goes away.
			return Response(true,`Submitted: ${jobId}`, { Invoice: { invoiceId,	emailedTo,	dateInvoice, fileId: null, jobId } });
		}
	}
}
