import { AddressMutations } from './Address.js';
import { Response } from "../../utilities/helpers";

// QUERIES
const UserAddressRootResolvers = {
	// Get UserAddress - gets an array and then returns the .first() entry
	async UserAddresses(root, {userId}, context) {
		return await context.knex('usersAddresses')
			.join('addresses', 'usersAddresses.addressId', 'addresses.addressId')
			.join('addressTypes', 'addresses.addressTypeId', 'addressTypes.addressTypeId')
			.join('states', 'addresses.stateId', 'states.stateId')
			.where({ userId });
	},

	async UserCompanyAddresses(root, {userId}, context) {
		return await context.knex('usersCompanyAddresses')
			.join('companiesAddresses', 'usersCompanyAddresses.companyAddressId', 'companiesAddresses.companyAddressId')
			.join('addresses', 'companiesAddresses.addressId', 'addresses.addressId')
			.join('addressTypes', 'addresses.addressTypeId', 'addressTypes.addressTypeId')
			.join('states', 'addresses.stateId', 'states.stateId')
			.where({ userId });
	}
}

// MUTATIONS
const UserAddressMutations = {
	// input is an object with the data to insert or update
	// Insert into UsersAddresses
	async userAddressSave(root, { input }, context) {
		const knex = context.knex;
		const { userId, userAddressId } = input;

		// if there is a userAddressId > 0, do an update, otherwise do an insert.
		if(userAddressId > 0) {
			await AddressMutations.AddressSave(root, { input }, context) // returns the UserQueries.User object for the userId just inserted with the new inserted ID

			return Response(true,"User Address Successfully Saved", { UserAddress: input} );
		} else {
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const addressInsert = await AddressMutations.AddressSave(root, { input }, context);

			const [userAddressId] = await knex('usersAddresses').insert({ accountId: context.Account.accountId, addressId: addressInsert.addressId, userId });

			return Response(true,"User Address Successfully Saved", { UserAddress: {...input, addressId: addressInsert.addressId, userAddressId}} );
		}
	},
	async userAddressRemove( root, { userAddressId }, context) {
		const knex = context.knex;

		if ( userAddressId ) {
			// Run the multiple deletes in a transaction.
			const removed = await knex.transaction(async (trx) => {
				// Get the addressId from the linked user address.
				const { addressId } = await trx("usersAddresses").select("addressId").first().where({ userAddressId });

				// Delete the users phone record.
				const userAddressRemoved = await trx("usersAddresses").delete().where({ userAddressId });

				// Delete the phones record.
				const addressRemoved = await trx("addresses").delete().where({ addressId });

				return userAddressRemoved && addressRemoved;
			});

			if( removed ) {
				return Response(true,"User Address removed");
			} else {
				return Response(false,"User address not found, could not be removed");
			}
		} else {
			return Response(false,"User address could not be removed");
		}
	},

	async userCompanyAddressSave(root, { input }, context) {
		const { userId, companyAddressId } = input;

		const [userCompanyAddressId] = await context.knex('usersCompanyAddresses').insert({ companyAddressId, userId });

		return Response(true,"Company Address Successfully linked", { UserCompanyAddress: {...input, userCompanyAddressId}} );
	},

	async userCompanyAddressRemove( root, { userCompanyAddressId }, context ) {
		const knex = context.knex;

		if ( userCompanyAddressId ) {
			// Run the multiple deletes in a transaction.
			const removed = await knex.transaction(async (trx) => {
				// Delete the users comapny Addresses record.
				const userCompanyAddressRemoved = await trx("usersCompanyAddresses").delete().where({ userCompanyAddressId });

				return userCompanyAddressRemoved;
			});

			if( removed ) {
				return Response(true,"Company Address removed");
			} else {
				return Response(false,"Company Address not found, could not be removed");
			}
		} else {
			return Response(false,"Company Address could not be removed");
		}
	}


}

// EXPORT
export { UserAddressMutations, UserAddressRootResolvers }
