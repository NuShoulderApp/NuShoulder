import { PhoneMutations } from './Phone.js';
import { Response } from "../../utilities/helpers";

const CompanyPhoneSubResolvers = {
	// OPTIONAL: after running the getUcompany or getcompanies, we can run a secondary query here to get another linked object like a company_address
}

// QUERIES
const CompanyPhoneRootResolvers = {
	// Get CompanyPhone - gets an array and then returns the .first() entry
	async CompanyPhones(root, {companyId, userId}, context) {
		const knex = context.knex;

		if(companyId > 0) {
			return await knex('companiesPhones')
				.join('phones', 'companiesPhones.phoneId', 'phones.phoneId')
				.join('phoneTypes', 'phones.phoneTypeId', 'phoneTypes.phoneTypeId')
				.where({ companyId })
		} else if(userId > 0) {
			return await knex('companiesPhones')
				.join('phones', 'companiesPhones.phoneId', 'phones.phoneId')
				.join('phoneTypes', 'phones.phoneTypeId', 'phoneTypes.phoneTypeId')
				.join("users", "companiesPhones.companyId", "users.companyId")
				.where({ userId })
		}
	}
}

// MUTATIONS
const CompanyPhoneMutations = {
	// input is an object with the data to insert or update
	// Insert into CompaniesPhones
	async companyPhoneSave(root, { input }, context) {
		const knex = context.knex;

		const { companyId, companyPhoneId } = input;

		// if there is a companyPhoneId > 0, do an update, otherwise do an insert.
		if(companyPhoneId > 0) {
			await PhoneMutations.PhoneSave(root, { input }, context) // returns the CompanyQueries.Company object for the companyId just inserted with the new inserted ID

			return Response(true,"Company Phone Successfully Saved", { CompanyPhone: input } );
		} else {
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const phoneInsert = await PhoneMutations.PhoneSave(root, { input }, context)

			const [companyPhoneId] = await knex('companiesPhones').insert({ accountId: context.Account.accountId, phoneId: phoneInsert.phoneId, companyId });

			return Response(true,"Company Phone Successfully Saved",{CompanyPhone: {...input, phoneId: phoneInsert.phoneId, companyPhoneId}});
		}
	},

	async companyPhoneRemove( root, { companyPhoneId }, context ) {
		const knex = context.knex;

		if ( companyPhoneId ) {
			const removed = await knex("companiesPhones").delete().where({ companyPhoneId });
			if( removed ) {
				return Response(true,"Company Phone removed");
			} else {
				return Response(false,"Company Phone not found, could not be removed");
			}
		} else {
			return Response(false,"Company Phone could not be removed");
		}
	}
}

// EXPORT
export { CompanyPhoneSubResolvers, CompanyPhoneMutations, CompanyPhoneRootResolvers }
