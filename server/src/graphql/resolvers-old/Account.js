import { Response } from "../../utilities/helpers";

const AccountSubResolvers = {
	async Settings(Account, args, context) {
		const knex = context.knex;

		return  knex("accountsSettings")
			.leftJoin("accountsSettingsOverrides",
				knex.raw(`accountsSettings.accountSettingId = accountsSettingsOverrides.accountSettingId AND accountsSettingsOverrides.accountId = ${Account.accountId}`))
			.where("accountsSettings.serverOnly", 0)
			.where((builder) => builder.whereNull("accountsSettingsOverrides.accountId")
				.orWhere("accountsSettingsOverrides.accountId", Account.accountId))
			.select(
				"accountsSettings.accountSettingId",
				"accountsSettings.value as defaultValue",
				"accountsSettings.description",
				"accountsSettings.name",
				"accountsSettings.json",
				"accountsSettingsOverrides.accountSettingOverrideId",
				"accountsSettingsOverrides.value as value"
			).map((setting) => ({ ...setting, value: setting.value === null ?  setting.defaultValue : setting.value}));
	},
	async Companies(Account, args, context) {
		const knex = context.knex;

		return await knex("companies").where("accountId", Account.accountId);
	},
	async AccountAdmins(Account, args, context) {
		const knex = context.knex;

		return await knex("users").where({"accountId": Account.accountId, userTypeId: 2 });
	},
	async Timezone(Account, args, context) {
		const knex = context.knex;

		const [[result]] = await knex.raw(`SELECT @@SESSION.time_zone AS tz`);

		return await result.tz
	}
}


// QUERIES
const AccountRootResolvers = {
	// Set this function as async so we can wait on the knex calls.
	async Account(root, { accountId }, context) {
		const knex = context.knex;

		// If the account Id was not supplied, get it out of the context.
		if (accountId === undefined) {
			accountId = context.Account.accountId;
		}

		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		return await knex('accounts')
			.where('accounts.accountId', accountId )
			.first();
	},

	// Get Accounts
	// Set this function as async so we can wait on the knex calls.
	Accounts: async (root, args, context) => await context.knex('accounts').orderBy("accountName")
}

// MUTATIONS
const AccountMutations = {
	// input is a Account object with the data to insert or update
	// Insert Account
	// Set this function as async so we can wait on the knex calls.
	async accountSave(root, { input }, context) {
		if(context.Session.User.userTypeId === 1) {
			const knex = context.knex;

			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			if(input.accountId > 0) {
				await knex('accounts')
					.where({ accountId: input.accountId })
					.update(input);

				// Return the response and the current data values.
				return Response(true,"Account Successfully Saved", { Account: AccountRootResolvers.Account(root, { accountId: input.accountId }, context) });
			} else {
				// insert new record into accounts table
				const [accountId] = await knex('accounts').insert(input);

				const account = await AccountRootResolvers.Account(root, { accountId }, context) // returns the AccountQueries.Account object for the accountId just inserted with the new inserted ID

				// setup basic account configuration - core products, order statuses
				// copy productsAccounts rows with accountId = 1 to new account
				await knex('productsAccounts')
					.where({accountId: 1})
					.map((products) => {
						const tempProduct = {...products, accountId: accountId, productAccountId: null}
						return knex('productsAccounts').insert({...tempProduct})
					});

				// create orderStatusesAccounts for all orderStatuses with accountID = 1
				await knex('orderStatusesAccounts')
					.where({accountId: 1})
					.map((orderStatus) => {
						const tempOrderStatus = {...orderStatus, accountId: accountId, orderStatusAccountId: null}
						return knex('orderStatusesAccounts').insert({...tempOrderStatus})
					});

				return Response(true, "Account Successfully Added", {action: 'accountCreated', Account: account});
			}
		} else {
			return Response(false,"Please Login as a Crematory Software Admin", {action: 'accountCreated', Account: {}});
		}
	},
	async accountSettingOverrideSave(root, { input }, context) {
		if(context.Session.User.userTypeId === 1) {
			const knex = context.knex;

			// Get the default value to make sure we are actually overriding.
			const accountSetting = await knex("accountsSettings").select("accountSettingId", "value as defaultValue","name").where("accountSettingId", input.accountSettingId).first();

			// Check to see if we already have an override.
			if(input.accountSettingOverrideId !== "") {
				// If the value to update to is the default, we will remove the override.
				if( accountSetting.defaultValue === input.value) {
					await knex("accountsSettingsOverrides").delete().where("accountSettingOverrideId", input.accountSettingOverrideId);
				} else {
					await knex("accountsSettingsOverrides").update("value", input.value).where("accountSettingOverrideId", input.accountSettingOverrideId);
				}
			} else if( accountSetting.defaultValue !== input.value) {
				// The new value is not the default, we will insert a new override.
				await knex("accountsSettingsOverrides").insert({ accountSettingId: input.accountSettingId, value: input.value, accountId: input.accountId });
			}

			const Setting = await AccountSubResolvers.Settings(input, null, context).then((Settings) => Settings.find(({accountSettingId}) => accountSettingId === parseInt(input.accountSettingId) ));

			return Response(true, "Account Setting Override Successfully Saved", { Setting });
		} else {
			return Response(false,"Please Login as a Crematory Software Admin", {Setting: {}});
		}
	}
}

// EXPORT
export { AccountSubResolvers, AccountMutations, AccountRootResolvers }
