import { UserMutations } from './User.js';

const CompanyUserSubResolvers = {
	// OPTIONAL: after running the getUcompany or getcompanies, we can run a secondary query here to get another linked object like a company_address
}

// QUERIES
const CompanyUserRootResolvers = {
	// Get CompanyUser - gets an array and then returns
	async CompanyUsers(root, {companyId}, context) {
		const knex = context.knex;

		return await knex('companiesUsers')
			.join('users', 'companiesUsers.userId', 'users.userId')
			.where({ companyId });
	}
}

// MUTATIONS
const CompanyUserMutations = {
	// input is an object with the data to insert or update
	// Insert into CompaniesAddresses
	async companyUserCreate(root, { input }, context) {
		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		return await UserMutations.userCreate(root, { input }, context)
	}
}

// EXPORT
export { CompanyUserSubResolvers, CompanyUserMutations, CompanyUserRootResolvers }
