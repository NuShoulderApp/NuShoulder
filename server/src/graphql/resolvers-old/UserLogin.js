import argon2 from "argon2";
import uuid from "uuid/v4";

import { sendEmail } from "./Email";
import { Response } from "../../utilities/helpers";
import _ from "lodash";

// QUERIES
export const SubResolvers = {
	async updatedBy(UserLogin, args, context) {
		return await context.knex("users").where("userId", UserLogin.updatedBy).first();
	},
	async Account(UserLogin, args, context) {
		return await context.knex("accounts").where("accountId", UserLogin.accountId).first();
	}
}

// MUTATIONS
export const UserLoginMutations = {

	async usersLoginsSave(root, {input}, context) {
		const {
			active,
			userLoginId
		} = input;

		if(userLoginId > 0) {
			if(active === 0) {
				input.dateDeactivated = context.knex.fn.now();
			} else if(active === 1) {
				input.dateDeactivated = null;
			}

			input.updatedBy = context.Session.User.userId;

			await context.knex('usersLogins')
				.update(_.omit(input,["userLoginId"]))
				.where({userLoginId});

			return Response(true, 'User Login Updated');
		}
		return Response(false, 'User Login NOT Updated');
	},

	// Update UserLogin in usersLogins table
	async userLoginUpdate(root, { input }, context) {
		const {
			email,
			userEmailId,
			userId,
		} = input;

		// Update the email address.
		await context.knex('usersEmails')
			.where({userEmailId})
			.update({email});

		return Response(true, "Email Updated", {User: { userId, email } });
	},

	async temporaryPasswordCreate(root, { email, accountId, sendRecoveryEmail=false } , context) {
		const knex = context.knex;

		// If the user isn't a CC admin type (1) then we will fix the account Id to the context.
		if( context.Session.User === null || context.Session.User.userTypeId !== 1 || accountId === undefined ) {
			accountId = context.Account.accountId;
		}

		const User = await knex("users")
			.join("usersEmails","users.userId", "usersEmails.userId")
			.join("accounts","users.accountId", "accounts.accountId")
			.leftJoin(
				knex("accountsSettings")
					.leftJoin("accountsSettingsOverrides", "accountsSettings.accountSettingId", "accountsSettingsOverrides.accountSettingId")
					.where("accountsSettings.name","adminEmail")
					.select("accountsSettingsOverrides.value",
						"accountsSettingsOverrides.accountId")
					.as("settings"), "accounts.accountId", "settings.accountId")

			.select("users.userId", "usersEmails.email", "accounts.url", "settings.value")
			.where("usersEmails.email",email)
			.where("users.accountId", accountId)
			.first();

		if( User === undefined ) {
			return { success: true, message: "Temporary Password Created" };
		}

		const { userId, email: userEmailAddress, url, value: fromEmailAddress } = User;
		// Create a token with 7 uuids and strip out the dashes.
		const token = [...Array(7)].map(() => uuid()).join("").replace(/-/g,"");

		const updatedBy =  context.Session.LoggedIn ? context.Session.User.userId : 0;

		// Update the passord in the DB.
		await knex('usersLogins')
			.insert({
				token,
				userId,
				userLoginTypeId: 2,
				accountId,
				dateExpiration: knex.raw("now() + INTERVAL 1 DAY"),
				updatedBy
			});

		// Delete any expired temp logins.
		await knex("usersLogins").delete().where(knex.raw("dateExpiration < now()")).where({ userLoginTypeId: 2});

		let protocol = "https";
		let emailUrl = url;

		// B-CS 8/14/22 - this join is breaking when subdomains is blank, so commented it out and checked for it being blank below. Then did the join within the IF if it is needed.
		// const subDomains = context.Account.subDomains.join(".");

		// If there were any subdomains in the url, add them to the new one.
		if( context.Account.subDomains !== "") {
			emailUrl = context.Account.subDomains.join(".") + "." + url;
		}

		// In local, we want to add the port and adjust the protocol
		if(process.env.SERVER_ENV === "local") {
			emailUrl += ":3000";
			protocol = "http";
		}

		if( sendRecoveryEmail === true ) {
			const emailInput = {
				"from": fromEmailAddress,
				"to": userEmailAddress,
				"subject": "Password Recovery",
				"text": `This is a temporary login link. Go to ${protocol}://${emailUrl}/login/${token} to log into your account. You will need to enter your email to login.`,
				"html": `<h3>Temporary Login Link</h3><p>Click <a href="${protocol}://${emailUrl}/login/${token}">here</a> to log into your account.</p><p>You will need to enter your email to login.</p>`
			};

			await sendEmail(emailInput, context);
		}

		return { success: true, message: "Temporary Password Created", token: token };
	},
	// Update UserLogin in usersLogins table
	async userPasswordUpdate(root, { input }, context) {
		const knex = context.knex;

		let {
			passwordNew,
			passwordNewConfirm,
			userLoginId,
			userId
		} = input;

		// If the original password was sent, then we are doing a password update.
		if( passwordNew !== passwordNewConfirm ) {
			return Response( false, "New and confirm passwords do not match.");
		} else {
			// Hash the new password.
			const hashedPassowrd = await argon2.hash(passwordNew, { type: argon2.argon2id });

			if( userLoginId === undefined || userLoginId === "") {
				const { accountId } = await knex("users").select("accountId").first().where({userId});

				// Update the passord in the DB.
				userLoginId = await knex('usersLogins')
					.insert({
						password: hashedPassowrd,
						userId,
						userLoginTypeId: 1,
						accountId,
						passwordLastUpdated: knex.fn.now(),
						updatedBy: context.Session.User.userId
					});
			} else {
				// Update the passord in the DB.
				await knex('usersLogins')
					.where({userLoginId})
					.update({
						password: hashedPassowrd,
						passwordLastUpdated: knex.fn.now(),
						updatedBy: context.Session.User.userId
					});
			}

			return Response(true, "Password Successfully Saved", { UserLogin: await knex("usersLogins").where({userLoginId}).first() });
		}
	},

	async login(root, { email, password, token }, context) {
		const Session = context.Session;
		const knex = context.knex;

		if( password !== undefined ) {
			// Look for a user that matches the email has a password.
			const User = await knex("usersEmails")
				.join("usersLogins","usersEmails.userId", "usersLogins.userId")
				.where({ email })
				.where("usersEmails.accountId", context.Account.accountId)
				.whereNotNull("usersLogins.password")
				.first();

			// If no user was found throw Invalid Name/Password exception
			if( User === undefined ) {
				Session.LoggedIn = false;
				return Response(false, "Invalid Name/Password", { Session });
			}

			// Verified the given password matches the hashed password.
			const passwordVerified = await argon2.verify(User.password, password);

			// If the password doesn't match, throw Invalid Name/Password exception
			if( passwordVerified !== true ) {
				Session.LoggedIn = false;

				return Response(false, "Invalid Name/Password", { Session });
			}

			// Create a new session object indication LoggedIn is true.
			await Session.login(User.userId);

			// Return the new session object.
			return Response(true, "The user has been successfully logged in.", { Session });
		} else {
			// Look for a user that matches the email has a token.
			const User = await knex("usersEmails")
				.join("usersLogins","usersEmails.userId", "usersLogins.userId")
				.where({ email, token })
				.where("usersEmails.accountId", context.Account.accountId)
				.where(knex.raw("now() < dateExpiration"))
				.first();

			// If the user is found, log in the session and respond with success.
			if( User ) {
				await Session.login(User.userId);
				return Response(true, "The user has been successfully logged in.", { Session });
			} else {
				// No user found, respond with failure.
				return Response(false, "Invalid Name/Token", { Session });
			}
		}
	},

	async logout( root, _ , { Session }) {
		// Log out the session.
		Session.logout();

		// Return the Sesison object.
		// Return the new session object.
		return Response(true, "The user has been logged out", { Session });
	}
}
