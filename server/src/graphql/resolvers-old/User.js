import _ from "lodash";

import { UserAddressRootResolvers } from "./UserAddress";
import { UserPhoneRootResolvers } from "./UserPhone";
import { AuthenticationError } from 'apollo-server';
import { Response } from "../../utilities/helpers";

const UserSubResolvers = {
	UserAddresses(User, args, context) {
		return UserAddressRootResolvers.UserAddresses(null, {userId: User.userId}, context);
	},

	UserCompanyAddresses(User, args, context) {
		return UserAddressRootResolvers.UserCompanyAddresses(null, {userId: User.userId}, context);
	},

	UserCompanyPhones(User, args, context) {
		return UserPhoneRootResolvers.UserCompanyPhones(null, {userId: User.userId}, context);
	},

	UserPhones(User, args, context) {
		return UserPhoneRootResolvers.UserPhones(null, {userId: User.userId}, context);
	},
	async UserLogin( { userId }, args, context) {
		if( userId === undefined ) {
			return null;
		} else {
			return await context.knex("usersLogins").where({ userId }).orderBy('userLoginTypeId', 'asc').orderBy('userLoginId', 'desc');
		}
	},
	async Permissions(User, args, context) {
		const knex = context.knex;

		// Start with the permissions and left join defaults and usersPermissions
		return await knex("permissions")
			.leftJoin("permissionsDefaults",
				(builder) => builder.on("permissions.permissionId", "permissionsDefaults.permissionId")
					.andOn("permissionsDefaults.userTypeId", User.userTypeId))
			.leftJoin("usersPermissions",
				(builder) => builder.on("permissions.permissionId", "usersPermissions.permissionId")
					.andOn("usersPermissions.userId", User.userId))
			// Get the permissionId from the permissions table.
			.select("permissions.permissionId", "usersPermissions.userPermissionId", "permissions.permission")
			.select(knex.raw(`${User.userId} as userId`))
			// Coalesce the permission level on userPermission first, the defaults, 0 if nothing is found.
			.select(knex.raw(`coalesce(usersPermissions.permissionLevel, permissionsDefaults.permissionLevel, 0) as permissionLevel, permissionsDefaults.permissionLevel as defaultPermissionLevel`))
			.orderBy("permissions.permissionId")
	}
}


// QUERIES
const UserRootResolvers = {
	// Get User - gets an array and then returns the .first() entry
	// Set this function as async so we can wait on the knex calls.
	async User(root, {userId}, context) {
		const knex = context.knex;

		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		return await knex('users')
			.leftJoin('usersEmails', 'users.userId', 'usersEmails.userId')
			.where('users.userId', userId )
			.first();
	},

	// check for a user based on firstName and lastName, or email
	// Set this function as async so we can wait on the knex calls.
	async UserCheck(root, { input }, context) {
		const knex = context.knex;
		const { email, firstName, lastName } = input;

		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		const user = await knex('users')
			.join('usersEmails', 'users.userId', 'usersEmails.userId')
			.where({ firstName, lastName })
			.andWhere({ email })
			.first();

		// if there is a matching record, then we know that this user definitely exists, so return that userId
		if(user && user.userId > 0) {
			return {action: 'exactMatch', User: user};
		} else {
			// since there is not an exact match, check to see if this email is already in our system, so we can get a warning message saying so.
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const userEmail = await knex('usersEmails')
				.join('users', 'usersEmails.userId', 'users.userId')
				.where({ email })
				.select("users.*");

			// if there is a matching email, then give a warning that this email is already in the system
			if(userEmail.length > 0) {
				return { action: 'emailMatch', User: input, Users: userEmail };
			} else {
				// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
				const users = await knex('users').where({ firstName, lastName });

				// if there are any users that match the first and last name, return them, otherwise create the new user
				if(users.length > 0) {
					return {action: "nameMatch", User: input,  Users: users};
				} else {
					// add the user
					return { action: "noMatch" };
				}
			}
		}
	},

	// Get Users
	// Set this function as async so we can wait on the knex calls.
	Users: async (root, { accountId, userTypeId, companyId }, context) => {
		const knex = context.knex;

		let query = knex('users').orderBy("lastName", "firstName");

		// If the user isn't a CC admin type (1) then we will fix the account Id to the context.
		if( context.Session.User === null || context.Session.User.userTypeId !== 1 || accountId === undefined ) {
			// Filter the list of users based on the accountId in the context.
			query.where("accountId",context.Account.accountId);
		} else {
			query.where({ accountId });
		}

		if( companyId !== undefined) {
			query.where({ companyId });
		}

		if(userTypeId !== undefined) {
			query.whereIn("userTypeId", userTypeId);
		}

		return await query;
	}
}

// MUTATIONS
const UserMutations = {
	// input is a User object with the data to insert or update
	// Insert User
	// Set this function as async so we can wait on the knex calls.
	async userCreate(root, { input }, context) {
		const knex = context.knex;

		/*
			This mutation is called from attempting to add a new user with inputs first name, last name, email.
			Or if there are already user(s) in the db with similar parameters, we can verify that we actually
			want to create the new user, in which case we pass in the action 'forceAddUser';
		*/

		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		// If we are not force adding the user, check to see if the data matches another record in the system.
		const UserCheck = input.action !== 'forceAddUser' ? await UserRootResolvers.UserCheck(root, { input }, context): {action: ''};

		// if the UserCheck returns an 'action' of 'noMatch', then we know this is a new unique user, and we can create the user and Email
		if(input.action == 'forceAddUser' || UserCheck.action == 'noMatch') {
			// remove the 'action' variable from the input, so we can save the remaining variables in the input object
			const [userId] = await knex('users').insert(_.omit(input,["action", "email"]));

			// using the userId that was just created, save the Email
			await knex('usersEmails').insert({email: input.email, userId, accountId: input.accountId });

			const user = await UserRootResolvers.User(root, { userId }, context) // returns the UserQueries.User object for the userId just inserted with the new inserted ID

			// we use the same user create functionality for setting up an account, where we create an account admin. Send back a unique action if that is the case.
			const returnAction = input.action === 'createAccountAdmin' ? 'accountAdminCreated' : 'userCreated';

			// add the email to the user object so we can update it if needed on the next step.
			// here we are return 'users' because that is the variable in the UserCreate type that needs to be matched to
			return Response(true, "User Successfully Added", {action: returnAction, User: {...user, email: input.email }});
		} else {
			// send the object result back and let the client determine what to do based on the 'matchLevel'
			return Response(false, "User Not Added", UserCheck);
		}
	},

	// Update User
	// Set this function as async so we can wait on the knex calls.
	async userUpdate(root, { input }, context) {
		const knex = context.knex;

		// Verify that the user is logged in.
		if( context.Session.isLoggedIn() !== true ) {
			throw new AuthenticationError("User not logged in.");
		// Verify that the user has users permissions of level 4.
		} else if ( context.Session.hasPermission("users", 4) === false ) {
			throw new AuthenticationError("User does not have required permissions");
		} else {
			await knex('users')
				.where({ userId: input.userId })
				.update(input);

			// Return the response and the current data values.
			return Response(true,"User Successfully Saved", { User: UserRootResolvers.User(root, { userId: input.userId }, context) });
		}
	}
}

// EXPORT
export { UserSubResolvers, UserMutations, UserRootResolvers }
