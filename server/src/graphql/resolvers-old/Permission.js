// QUERIES
const PermissionSubResolvers = {
	description(permission, args, context) {
		const knex = context.knex;

		if( permission.description ) {
			return permission.description;
		} else {
			return knex("permissions").select("description").where({permissionId: permission.permissionId}).first().then((result) => result.description);
		}
	},

	permission(permission, args, context) {
		const knex = context.knex;

		if( permission.permission ) {
			return permission.permission;
		} else {
			return knex("permissions").select("permission").where({permissionId: permission.permissionId}).first().then((result) => result.permission);
		}
	},
	permissionDefaults(permission, { userTypeId }, context) {
		const knex = context.knex;

		// Build initial query.
		const query = knex("permissionsDefaults")
			.where("permissionId", permission.permissionId);

		// If user type was specified, filter the query.
		if(userTypeId !== undefined) {
			query.andWhere("userTypeId", userTypeId);
		}

		// Call then to run the query.
		return query.then((result) => result);

	}
}

const PermissionRootResolvers = {
	async Permission(root, { permissionId }, context) {
		return await context.knex("permissions").where({permissionId}).first();
	},
	async Permissions(root, args, context){
		return await context.knex("permissions");
	}
}

export { PermissionSubResolvers, PermissionRootResolvers  }
