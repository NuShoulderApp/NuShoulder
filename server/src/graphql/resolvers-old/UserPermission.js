import { Response } from "../../utilities/helpers";
import _ from "lodash";

const permissionLevelString = ["No Access", "Read Access", "Write Access", "Edit Access", "Delete Access"];

// QUERIES
const UserPermissionSubResolver = {
	Permission(root) {
		return root
	},
	permissionLevelString(root) {
		return permissionLevelString[root.permissionLevel];
	}
}

const UserPermissionMutations = {
	async userPermissionSave(root, { input: UserPermission }, context) {
		const knex = context.knex;

		// If a user permission ID was supplied, it will be an update (or delete).
		if ( UserPermission.userPermissionId > 0 ) {
			// Get the default permission level for the given user type/permission
			const defaultLevel = await knex("users")
				.join("permissionsDefaults", "users.userTypeId", "permissionsDefaults.userTypeId")
				.where("users.userId", UserPermission.userId)
				.andWhere("permissionsDefaults.permissionId", UserPermission.permissionId)
				.select("permissionsDefaults.permissionLevel")
				.first();

			// If the permission levels are the same, delete the user permission.
			if( defaultLevel.permissionLevel === UserPermission.permissionLevel ) {
				await knex("usersPermissions").del().where("userPermissionId", UserPermission.userPermissionId);
			} else {
				await knex("usersPermissions").update(UserPermission).where("userPermissionId", UserPermission.userPermissionId);
			}

			return Response(true,"User Permission Successfully Saved",  { UserPermission });
		} else {
			const [userPermissionId] = await knex("usersPermissions").insert(_.omit(UserPermission, "userPermissionId"));

			return Response(true,"User Permission Successfully Saved", { UserPermission : {...UserPermission, userPermissionId }} );
		}
	}
}

export { UserPermissionSubResolver, UserPermissionMutations }
