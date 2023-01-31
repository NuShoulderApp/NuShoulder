import { PhoneMutations } from './Phone.js';
import { Response } from "../../utilities/helpers";

// QUERIES
const UserPhoneRootResolvers = {
	// Get UserPhone - gets an array and then returns the .first() entry
	async UserPhones(root, { userId }, context ) {
		return await context.knex('usersPhones')
			.join('phones', 'usersPhones.phoneId', 'phones.phoneId')
			.join('phoneTypes', 'phones.phoneTypeId', 'phoneTypes.phoneTypeId')
			.where({ userId });
	},

	async UserCompanyPhones(root, { userId }, context ) {
		return await context.knex('usersCompanyPhones')
			.join('companiesPhones', 'usersCompanyPhones.companyPhoneId', 'companiesPhones.companyPhoneId')
			.join('phones', 'companiesPhones.phoneId', 'phones.phoneId')
			.join('phoneTypes', 'phones.phoneTypeId', 'phoneTypes.phoneTypeId')
			.where({ userId });
	}
}

// MUTATIONS
const UserPhoneMutations = {
	// input is an object with the data to insert or update
	// Insert into UsersPhones
	async userCompanyPhoneSave(root, { input }, context) {
		const { userId, companyPhoneId } = input;

		const [userCompanyPhoneId] = await context.knex('usersCompanyPhones').insert({ companyPhoneId, userId });

		return Response(true,"Company Phone Successfully linked", {UserCompanyPhone:  {...input, userCompanyPhoneId } });
	},

	async userCompanyPhoneRemove( root, { userCompanyPhoneId }, context ) {
		if ( userCompanyPhoneId ) {
			// Run the multiple deletes in a transaction.
			const removed = await context.knex.transaction(async (trx) => {
				// Delete the users comapny phones record.
				const userCompanyPhoneRemoved = await trx("usersCompanyPhones").delete().where({ userCompanyPhoneId });

				return userCompanyPhoneRemoved;
			});

			if( removed ) {
				return Response(true,"Company Phone removed");
			} else {
				return Response(false,"Company Phone not found, could not be removed");
			}
		} else {
			return Response(false,"Company Phone could not be removed");
		}
	},

	// Insert into UsersPhones
	async userPhoneSave(root, { input }, context) {
		const { userId, userPhoneId } = input;

		// if there is a userPhoneId > 0, do an update, otherwise do an insert.
		if(userPhoneId > 0) {
			await PhoneMutations.PhoneSave(root, { input }, context);

			return Response(true,"User Phone Successfully Saved", { UserPhone: input } );
		} else {
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const phoneInsert = await PhoneMutations.PhoneSave(root, { input }, context);

			const [userPhoneId] = await context.knex('usersPhones').insert({ accountId: context.Account.accountId, phoneId: phoneInsert.phoneId, userId });

			return Response(true,"User Phone Successfully Saved", {UserPhone:  {...input, phoneId: phoneInsert.phoneId, userPhoneId} });
		}
	},

	async userPhoneRemove( root, { userPhoneId }, context ) {
		const knex = context.knex;

		if ( userPhoneId ) {
			// Run the multiple deletes in a transaction.
			const removed = await knex.transaction(async (trx) => {
				// Get the phoneId from the linked user phone.
				const { phoneId } = await trx("usersPhones").select("phoneId").first().where({ userPhoneId });

				// Delete the users phone record.
				const userPhoneRemoved = await trx("usersPhones").delete().where({ userPhoneId });

				// Delete the phones record.
				const PhoneRemoved = await trx("phones").delete().where({ phoneId });

				return userPhoneRemoved && PhoneRemoved;
			});

			if( removed ) {
				return Response(true,"User Phone removed");
			} else {
				return Response(false,"User Phone not found, could not be removed");
			}
		} else {
			return Response(false,"User Phone could not be removed");
		}
	}
}

// EXPORT
export { UserPhoneMutations, UserPhoneRootResolvers }
