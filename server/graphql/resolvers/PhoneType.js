// QUERIES
const PhoneTypeRootResolvers = {
	async PhoneTypes(root, args, context) {
		return await context.knex('phoneTypes')
	}
}


// EXPORT
export { PhoneTypeRootResolvers }
