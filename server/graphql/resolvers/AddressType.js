// NOTE: use camelCase for fields and PascalCase for types and objects

// QUERIES
const AddressTypeRootResolvers = {
	async AddressTypes(root, args, context) {
		return await context.knex('addressTypes');
	}
}


// EXPORT
export { AddressTypeRootResolvers }
