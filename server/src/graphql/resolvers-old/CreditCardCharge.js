import { Response } from "../../utilities/helpers";

// QUERIES
const CreditCardChargeRootResolvers = {
	// Set this function as async so we can wait on the knex calls.
	// CreditCardCharge(root, {creditCardId}, context) {
	// 	const knex = context.knex;
	//
	// 	let accountId = context.Account.accountId;
	// 	// // We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
	// 	// return knex('companies')
	// 	// 	.where('companies.companyId', companyId )
	// 	// 	.where('companies.accountId', accountId)
	// 	// 	.first();
	// }
}

// MUTATIONS
const CreditCardChargeMutations = {
	async creditCardChargeSave(root, { input }, context) {
		const knex = context.knex;

		// chargeId is the response ID from stripe when a charge goes through
		const {
			amount,
			chargeId=null,
			creditCardId,
			customerId=null,
			invoiceId,
			orderId,
			refundedCreditCardChargeId=null,
			refundId=null,
			status,
			stripeToken
		} = input;

		// Save charge record
		const [creditCardChargeId] = await knex('creditCardCharges')
			.insert({
				amount,
				chargeId,
				creditCardId,
				customerId,
				invoiceId,
				orderId,
				refundedCreditCardChargeId,
				refundId,
				status,
				stripeToken
			});

		return Response(true,"CC Charge Successfully Saved", { CreditCardCharge: {...input, creditCardChargeId} });
	}
}

// EXPORT
export { CreditCardChargeMutations, CreditCardChargeRootResolvers }
