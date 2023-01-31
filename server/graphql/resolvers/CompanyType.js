// NOTE: use camelCase for fields and PascalCase for types and objects

// QUERIES
const CompanyTypeRootResolvers = {
	async CompanyTypes(root, args, context) {
		const knex = context.knex;

		return await knex('companyTypes');
	}
}


// EXPORT
export { CompanyTypeRootResolvers }
