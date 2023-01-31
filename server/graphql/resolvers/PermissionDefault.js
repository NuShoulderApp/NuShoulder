// QUERIES
export const PermissionDefaultSubResolvers = {
	async UserType(permissionDefault, args, context) {
		return await context.knex("userTypes").first().where({userTypeId: permissionDefault.userTypeId});
	}
}
