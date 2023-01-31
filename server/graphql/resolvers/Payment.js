import Math from 'mathjs';
import { Response } from "../../utilities/helpers";
import { CreditCardChargeMutations } from './CreditCardCharge';
// NOTE: use camelCase for fields and PascalCase for types and objects


// MUTATIONS
const PaymentMutations = {
	async paymentProcessing(root, {input}, context) {
		const knex = context.knex;

		const { amount, customerId='', description, invoiceId, orderId, token } = input;

		// Note: To only authorize a charge, but not to capture it right now, use the "capture: false" parameter.
		// Note: amount is the integer number of cents

		// Create the idempotency_key using the orderId, and a concat string of the orderProductIds for this order, and the amount charged.
		const OrderProducts = await knex('ordersProducts').where({orderId}).whereNull('dateDeleted');

		let orderProductsIds = '';
		OrderProducts.forEach((product) => {
			// First time through the array just set to the orderProductId
			if(orderProductsIds === '') {
				orderProductsIds = product.orderProductId;
			} else {
				// Separate each orderProductId with 'X'
				orderProductsIds = `${orderProductsIds}X${product.orderProductId}`;
			}
		})

		const idempotency_key = `${orderId}X${orderProductsIds}X${Math.multiply(amount,100).toFixed(0)}`;
		const stripeSecretKey = context.Account.Settings.getSettingValue("stripeSecretKey");
		// This is our secret key from Stripe
		const stripe = require("stripe")(stripeSecretKey);

		let Charge = {};
		// If this is a saved card, use the customerId that is passed in. Otherwise create a one-time charge using the token.
		if(customerId !== '') {
			try {
				// Charge the Customer instead of the card:
				Charge = await stripe.charges.create({
					amount: Math.multiply(amount,100).toFixed(0),
					currency: 'usd',
					customer: customerId,
					description: description,
					metadata: {invoiceId: invoiceId, orderId: orderId}
				}, {
					idempotency_key: idempotency_key
				});

				//console.log({Charge})
				if(Charge.status === 'succeeded') {
					// Update the invoice or order that it has been paid
					if(invoiceId > 0) {
						knex('invoices').where({invoiceId}).update('dateInvoicePaid', knex.fn.now());
					}
					return Response(true, "Succeeded", { Payment: { chargeId: Charge.id } });
				} else {
					return Response(false, Charge.status, { Payment: { chargeId: Charge.id } });
				}
			}
			catch(error) {
				// This should only hit if the idempotency_key errors, meaning that they tried to charge the same card twice for the same payment
				//console.log({error})
				return Response(false,error.type, { Payment: { chargeId: 0 } });
			}

		} else {
			try {
				Charge = await stripe.charges.create({
					amount: Math.multiply(amount,100).toFixed(0),
					currency: 'usd',
					description: description,
					source: token,
					metadata: {invoiceId: invoiceId, orderId: orderId}
				}, {
					idempotency_key: idempotency_key
				});

				if(Charge.status === 'succeeded') {
					return Response(true, "Succeeded", { Payment: { chargeId: Charge.id } });
				} else {
					return Response(false, Charge.status, { Payment: { chargeId: Charge.id } });
				}
			}
			catch(error) {
				// This should only hit if the idempotency_key errors, meaning that they tried to charge the same card twice for the same payment
				return Response(false,error.type, { Payment: { chargeId: 0 } });
			}
		}
	},

	async refundPayment(root, {input}, context) {
		const { amount, creditCardChargeId, orderId, orderProductId } = input;

		const stripeSecretKey = context.Account.Settings.getSettingValue("stripeSecretKey");
		// This is our secret key from Stripe
		const stripe = require("stripe")(stripeSecretKey);

		const [CreditCardCharge] = await context.knex('creditCardCharges').where({creditCardChargeId})

		let Refund = {};
		try {
			Refund = await stripe.refunds.create({
				amount: Math.multiply(amount,100).toFixed(0),
				charge: CreditCardCharge.chargeId,
				metadata: {amount: amount, creditCardChargeId: creditCardChargeId, orderId: orderId, orderProductId: orderProductId}
			});
			await CreditCardChargeMutations.creditCardChargeSave(null, { input: {
				amount,
				creditCardId: CreditCardCharge.creditCardId,
				customerId: CreditCardCharge.customerId,
				dateCreated: context.knex.fn.now(),
				orderId,
				refundedCreditCardChargeId: CreditCardCharge.creditCardChargeId,
				refundId: Refund.id,
				status: Refund.status
			}}, context);

			if(Refund.status === 'succeeded') {
				return Response(true, "Succeeded", { Payment: { refundId: Refund.id } });
			} else {
				return Response(false, Refund.status, { Payment: { refundId: Refund.id } });
			}
		}
		catch(error) {
			return Response(false,error.type, { Payment: { refundId: 0 } });
		}

	}
}

// EXPORT
export { PaymentMutations as Mutations }
