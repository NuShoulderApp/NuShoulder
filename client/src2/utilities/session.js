import React from "react";

import { AccountQuery, SessionQuery } from "../auth/auth_graphql";
import { graphql, compose } from "react-apollo";

// Create a local client session object to give us the proper session information.
function clientSessionObject(SessionQueryResult) {
	// Make a new object with the given struct as the prototype.
	const NewSession = Object.create(SessionQueryResult || { LoggedIn: false});

	// A function for knowing if the user is logged in or not.
	NewSession.isLoggedIn = function () {
		return this.LoggedIn;
	}

	// Return true if the user has the given permission at a level greater then or equal to the given permissionLevel.
	NewSession.hasPermission = function (requiredPermission) {
		/*
			Required permission should be an object with:
				permission = the permission to check for.
				requiredLevel = the level of the permission needed.
				userTypeId = required user type Id.
		*/

		// If no needed permission were defined, then return true.
		if(requiredPermission === undefined) {
			return true;
		}

		// If the user object is not empty then check the permissions.
		if( this.User !== null ) {
			// If needed Permission is an object, we will break it up into its parts of permission and permissionLevel.

			// hasPermission will return true if they didn't include a permission to check for.
			let hasPermission = true;
			if (requiredPermission.hasOwnProperty("permissionLevel") && requiredPermission.hasOwnProperty("permission") ) {
				// Look for a matching permission with a value greater than or equal to the neededValue.
				hasPermission = this.User.Permissions.some( ({ Permission: { permission }, permissionLevel })  => permission === requiredPermission.permission && requiredPermission.permissionLevel <= permissionLevel );
			}

			// If they included the userTypeId, make sure it matches too.
			if ( requiredPermission.hasOwnProperty("userTypeId") ) {
				return hasPermission && requiredPermission.userTypeId === parseInt(this.User.userTypeId);
			} else {
				return hasPermission;
			}
		} else {
			// No user, no permission.
			return false;
		}
	}

	return NewSession;
}


function clientAccountObject(AccountQueryResult) {
	// Make a new object with the given struct as the prototype.
	const NewAccount = Object.create(AccountQueryResult || {});

	// Add a function to easily get a setting.
	NewAccount.getSettingValue = function (setting_name) {
		const setting = this.Settings.find((s) => s.name === setting_name) || { json: 0 };

		if( setting.json === 1 ) {
			try {
				return JSON.parse(setting.value);
			} catch(e) {
				return setting.value;
			}
		} else {
			return setting.value;
		}
	};

	return NewAccount;
}

// Start with the actual session and account queries, then run them proper processing to get them on the main props as Session and Account.
export const withSession = compose(
	graphql(SessionQuery, { name: "Session" }),
	graphql(AccountQuery, { name: "Account" }),
	(WrappedComponent) => (props) => <WrappedComponent {...props} Account={clientAccountObject(props.Account.Account)} Session={clientSessionObject(props.Session.Session)} />
);
