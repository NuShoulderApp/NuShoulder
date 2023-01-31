import { CompanyAddressRootResolvers } from "./CompanyAddress";
import { CompanyDepartmentRootResolvers } from "./CompanyDepartment";
import { CompanyPhoneRootResolvers } from "./CompanyPhone";
import { Response } from "../../utilities/helpers";

import { getProductsByAccountId } from "./Product";

const CompanySubResolvers = {
	CompanyAddresses(Company, args, context) {
		return CompanyAddressRootResolvers.CompanyAddresses(Company, {companyId: Company.companyId}, context);
	},
	CompanyDepartments(Company, args, context) {
		return CompanyDepartmentRootResolvers.CompanyDepartments(Company, {companyId: Company.companyId}, context);
	},
	CompanyPhones(Company, args, context) {
		return CompanyPhoneRootResolvers.CompanyPhones(Company, {companyId: Company.companyId}, context);
	},
	async Users({ companyId }, args, context) {
		return await context.knex("users").where({ companyId });
	},
	async Products({ accountId }, args, context) {
		return getProductsByAccountId(accountId, context);
	}
}

// QUERIES
const CompanyRootResolvers = {
	// Get Company - gets an array and then returns the .first() entry
	// Set this function as async so we can wait on the knex calls.
	Company: async (root, {companyId, companyTypeId}, context) => {
		const knex = context.knex;

		let accountId = context.Account.accountId;
		
		let query = knex('companies')
			.where('companies.accountId', accountId);
		
		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		if(companyId) {
			query.where('companies.companyId', companyId );
		}
		if(companyTypeId) {
			query.where('companies.companyTypeId', companyTypeId );
		}
		query.first();

		let company = await query;
		return company;
	},

	// Get Companies
	// Set this function as async so we can wait on the knex calls.
	// Companies: async (root, {accountId}, context) => {
	// 	const knex = context.knex;

	// 	accountId = context.Account.accountId;
	// 	// TODO: update this in the case where users should be able to override accountId
	// 	return await knex('companies').where({ accountId }).orderBy("companyName");
	// },

	async Companies(root, {accountId=0}, context) {
		const knex = context.knex;
		let tempAccountId = accountId > 0 ? accountId : context.Account.accountId;
		return await knex('companies').where({ accountId: tempAccountId }).orderBy("companyName");
	},


	// Get the distinct list of companies that have invoiceable products
	InvoiceableCompanies(root, args, context) {
		const knex = context.knex;

		// NOTE: There is a resolver in the OrderProduct.js that gets the list of invoiceable Order Products which are going to get sent in invoices - it uses the same where conditions, so if you update them here, also update them there.
		const InvoiceableCompanies = knex('orders')
			.distinct()
			.select('companies.companyId', 'companies.companyName')
			.join('companies', 'companies.companyId', 'orders.companyId')
			.join('ordersProducts', 'ordersProducts.orderId', 'orders.orderId')
			.join('orderStatuses', 'orderStatuses.orderStatusId', 'orders.orderStatusId')
			.join('products', 'products.productId', 'ordersProducts.productId')
			.join('productsAccounts', 'productsAccounts.productId', 'ordersProducts.productId')
			.whereNotIn('ordersProducts.orderProductId', function() {
				this.select('orderProductId')
					.from('invoiceItems')
					.where({'deleted': 0})
					.whereNotNull('orderProductId')
					.distinct()
			})
			.andWhere('orderStatuses.orderCompletedIndicator', 1)
			.andWhere('productsAccounts.accountId', context.Account.accountId)
			.andWhere('companies.accountId', context.Account.accountId)
			.andWhere('orders.accountId', context.Account.accountId)
			.whereNotNull('orders.dateCompleted')
			.whereNull('ordersProducts.dateDeleted')
			.whereNull('ordersProducts.dateRefunded')
			.orderBy('companies.companyName', 'asc')

		return InvoiceableCompanies;
	}

}

// MUTATIONS
const CompanyMutations = {
	// input is a Company object with the data to insert or update
	async companySave(root, { input }, context) {
		const knex = context.knex;

		const {
			accountId,
			accountNumber,
			allowHomeMemorialization,
			bccHospitalForCustomerEmails,
			communalPawPrintAllowed,
			companyId,
			companyName,
			companyNameLegal,
			companyDescription,
			companyIconId,
			companyLogoId,
			companyTypeId,
			courierDeliveryOffered,
			crematoryPickupOffered,
			cremationTypesOffered,
			defaultDiscount,
			defaultUnits,
			expeditedCremationAllowed,
			homeMemorializationsEditCremation=0,
			hoursOfOperation,
			hospitalDeliveryOffered,
			invoiceEmail,
			payAtPickupOffered,
			payByCreditCardOffered,
			payVetOrderByCreditCardOffered,
			paymentTerms,
			petReferenceNumberAutoGenerate,
			requireInitialsEditOrderDetails,
			sendOwnerEmailCompletedDelivered,
			visitationAllowed
		} = input;

		if(companyId > 0) {
			await knex('companies')
				.where({ companyId })
				.update({accountNumber, allowHomeMemorialization, bccHospitalForCustomerEmails, communalPawPrintAllowed, companyName, companyNameLegal, companyDescription, companyIconId, companyLogoId,
					companyTypeId, courierDeliveryOffered, crematoryPickupOffered, cremationTypesOffered, defaultDiscount, defaultUnits, expeditedCremationAllowed, homeMemorializationsEditCremation,
					hoursOfOperation, hospitalDeliveryOffered, invoiceEmail, payAtPickupOffered, payByCreditCardOffered, payVetOrderByCreditCardOffered, paymentTerms, petReferenceNumberAutoGenerate, requireInitialsEditOrderDetails, sendOwnerEmailCompletedDelivered, visitationAllowed });

			return Response(true,"Company Successfully Saved",  { Company: await knex("companies").where({ companyId }).first() });
		} else {
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const [companyId] = await knex('companies')
				.insert({accountId, accountNumber, allowHomeMemorialization, bccHospitalForCustomerEmails, communalPawPrintAllowed, companyName, companyNameLegal, companyDescription,
					companyIconId, companyLogoId, companyTypeId, courierDeliveryOffered, crematoryPickupOffered, cremationTypesOffered,
					defaultDiscount, defaultUnits, expeditedCremationAllowed, homeMemorializationsEditCremation, hoursOfOperation, hospitalDeliveryOffered, invoiceEmail,
					payAtPickupOffered, payByCreditCardOffered, payVetOrderByCreditCardOffered, paymentTerms, petReferenceNumberAutoGenerate, requireInitialsEditOrderDetails, sendOwnerEmailCompletedDelivered, visitationAllowed});

			return Response(true,"Company Successfully Saved", { Company: await knex("companies").where({ companyId }).first() });
		}
	}
}

// EXPORT
export { CompanySubResolvers, CompanyMutations, CompanyRootResolvers }
