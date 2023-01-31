import uuid from "uuid/v4";
import { UserSubResolvers }  from "../graphql/resolvers/User";

// Helper class to for keeping track of the session state.
export class SessionObject {
	constructor(session, knex) {
		this.knex = knex;

		// If the session was supplied update this and return.
		if(typeof session === "object") {
			Object.assign(this, session);
			return this;
		} else {
			// Creating a totally new session.
			this.sessionId = uuid();

			// Store the time this object was created.
			this.created_at = new Date();

			// Logged in or not.
			this.LoggedIn = false;

			// The matching user after logging in.
			this.User = null;
		}
	}

	async login(userId) {
		this.LoggedIn = true;
		this.User = await this.knex('users').where({ userId }).first();

		// Use the user sub resolvers to get the permissions.
		this.User.Permissions = await UserSubResolvers.Permissions(this.User, null, { knex: this.knex,  });
	}

	logout() {
		this.LoggedIn = false;
		this.User = null;
	}

	isLoggedIn() {
		// Do the compare here just in case the value gets wiped out.
		return this.LoggedIn === true;
	}

	hasPermission(requiredPermission, requiredPermissionLevel) {
		if( requiredPermission === undefined) {
			// No required permission was supplied, assume the user has permission
			return true;
		} else 	if( this.User === null ) {
			// There is a requiredPermission but no user, assume the user does not have the permission.
			return false;
		} else {
			if ( typeof requiredPermission === "object" ) {
				requiredPermissionLevel = requiredPermission.value;
				requiredPermission = requiredPermission.permission;
			}

			// There is a requiredPermission and a user, check to see if the user has that permission.
			return this.User.Permissions.some( ({ permission, permissionLevel }) => permission === requiredPermission && permissionLevel >= requiredPermissionLevel );
		}
	}
}