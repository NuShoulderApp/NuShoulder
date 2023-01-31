import { Response } from "../../utilities/helpers";

// QUERIES
const CreditCardRootResolvers = {
	// Set this function as async so we can wait on the knex calls.
	async CreditCards(root, input, context) {
		const knex = context.knex;

		if(context.Session.LoggedIn === true) {
			return knex('creditCards')
				.whereNotNull('customerId')
				.andWhere({
					accountId: context.Account.accountId,
					active: 1,
					companyId: context.Session.User.companyId
				});
		} else {
			return [];
		}
	}
}

// MUTATIONS
const CreditCardMutations = {
	async creditCardSave(root, { input }, context) {
		const knex = context.knex;

		const {
			cardName,
			cardNickname=null,
			invoiceId,
			orderId,
			saveCard=false,
			stripeToken
		} = input;

		const stripeSecretKey = context.Account.Settings.getSettingValue("stripeSecretKey");
		// Create Stripe object using our Secret Key - need to replaced that value with the Live Production Secret Key when we start
		var stripe = require("stripe")(stripeSecretKey);

		// If we save the card, then stripe creates a customerId for us to use for charging instead of a token. Token's are single use, customerId is multi-use.
		let customerId = null;

		if(saveCard === true) {
			let email = '';
			// Get the email associated with this invoice to save with the card.
			if(invoiceId > 0) {
				const [Invoice] = await knex('invoices').where({invoiceId: invoiceId});
				email = Invoice.emailedTo !== null ? Invoice.emailedTo : '';
			}
			if(orderId > 0) {
				// TODO: Put order query here
			}
			// Create a Customer:
			const customer = await stripe.customers.create({
				source: stripeToken,
				email: email,
				metadata: {companyId: context.Session.User.companyId}
			});
			customerId = customer.id;
		}

		// If the user is logged in, then we will save their companyId. Otherwise, if they are logged out they are a pet owner, and they will not have a companyId.
		const companyId = context.Session.LoggedIn === true ? context.Session.User.companyId : 0;

		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		const [creditCardId] = await knex('creditCards')
			.insert({
				accountId: context.Account.accountId,
				active: 1,
				cardName,
				cardNickname,
				companyId,
				customerId,
				stripeToken
			});

		return Response(true,"CC Successfully Saved", { CreditCard: {...input, creditCardId, customerId} });
	}
}

// EXPORT
export { CreditCardMutations, CreditCardRootResolvers }
