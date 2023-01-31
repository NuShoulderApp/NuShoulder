import { Response } from "../../utilities/helpers";

// NOTE: use camelCase for fields and PascalCase for types and objects

const AccountSettingSubResolvers = { }

// QUERIES
const AccountSettingRootResolvers = {
	// // Get AccountSetting - gets an array and then returns the .first() entry
	// // Set this function as async so we can wait on the knex calls.
	async AccountSetting(root, { accountSettingId }, context) {
		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		return await context.knex('accountsSettings')
			.where('accountSettingId', accountSettingId )
			.first();
	},

	// Get AccountAccountSettings
	// Set this function as async so we can wait on the knex calls.
	async AccountSettings(root, args, context) {
		return await context.knex("accountsSettings");
	}
}

// MUTATIONS
const AccountSettingMutations = {
	// input is a Setting object with the data to insert or update
	async AccountSettingSave(root, { input }, context) {
		const knex = context.knex;

		const { accountSettingId, name, value, description, serverOnly } = input;

		if(accountSettingId > 0) {
			await knex('accountsSettings')
				.where({ accountSettingId })
				.update({ name, value, description, serverOnly });

			return Response(true,"Account Setting Successfully Saved", { AccountSetting: input });
		} else {
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const [accountSettingId] = await knex('accountsSettings').insert({ name, value, description, serverOnly });

			return Response(true,"Account Setting Successfully Saved", { AccountSetting: {...input, accountSettingId} });
		}
	}
}

// EXPORT
export { AccountSettingSubResolvers, AccountSettingMutations, AccountSettingRootResolvers }