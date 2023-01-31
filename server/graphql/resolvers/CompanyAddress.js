import { AddressMutations } from './Address.js';
import { Response } from "../../utilities/helpers";

const CompanyAddressSubResolvers = {
	// OPTIONAL: after running the getUcompany or getcompanies, we can run a secondary query here to get another linked object like a company_address
	async Route(CompanyAddress, args, context) {
		return context.knex('routes')
			.where({routeId: CompanyAddress.routeId});
	}
}

// QUERIES
const CompanyAddressRootResolvers = {
	// Get CompanyAddress - gets an array and then returns the .first() entry
	async CompanyAddresses(root, { companyId, returnAllAddresses=false, userId}, context) {
		const knex = context.knex;

		// Return all addresses is going to be used in the order details for getting the list of potential delivery locations. This will only be used for crematory users though.
		if(returnAllAddresses === true && context.Session.LoggedIn === true && (parseInt(context.Session.User.userTypeId) === 2 || parseInt(context.Session.User.userTypeId) === 3)) {
			return await knex('companiesAddresses')
				.join('addresses', 'companiesAddresses.addressId', 'addresses.addressId')
				.join('addressTypes', 'addresses.addressTypeId', 'addressTypes.addressTypeId')
				.join('states', 'addresses.stateId', 'states.stateId')
				.join('companies', 'companies.companyId', 'companiesAddresses.companyId')
				.where('companiesAddresses.accountId', context.Account.accountId)
				.andWhere('companies.active', 1)
				.andWhere('companiesAddresses.active', 1)
				.orderBy('companies.companyName');
		} else if(companyId > 0) {
			return await knex('companiesAddresses')
				.join('addresses', 'companiesAddresses.addressId', 'addresses.addressId')
				.join('addressTypes', 'addresses.addressTypeId', 'addressTypes.addressTypeId')
				.join('states', 'addresses.stateId', 'states.stateId')
				.join('companies', 'companies.companyId', 'companiesAddresses.companyId')
				.where('companiesAddresses.companyId', companyId)
				.andWhere('companies.active', 1)
				.andWhere('companiesAddresses.active', 1);
		} else if(userId > 0) {
			return await knex('companiesAddresses')
				.join('addresses', 'companiesAddresses.addressId', 'addresses.addressId')
				.join('addressTypes', 'addresses.addressTypeId', 'addressTypes.addressTypeId')
				.join('states', 'addresses.stateId', 'states.stateId')
				.join("users", "companiesAddresses.companyId", "users.companyId")
				.where({ userId })
				.andWhere('companiesAddresses.active', 1);
		}
	}
}

// MUTATIONS
const CompanyAddressMutations = {
	// input is an object with the data to insert or update
	// Insert into CompaniesAddresses
	async companyAddressSave(root, { input }, context) {
		const knex = context.knex;

		let {
			addressName,
			billingCode=null,
			companyId,
			companyAddressId,
			routeId
		} = input;

		// Get the accountId of the corresponding company.
		const { accountId } = await knex("companies").select("accountId").where({ companyId }).first();

		input = { ...input, accountId };

		// Query to get the new stop order in case the route is changing.
		const newStopOrderQuery = knex("companiesAddresses")
			// Get the max routeStopOrder and add one.
			.select(knex.raw("coalesce(max(routeStopOrder)+1,1) newStopOrder"))
			.where({ routeId })
			.as("newStopOrder");

		// if there is a companyAddressId > 0, do an update, otherwise do an insert.
		if( companyAddressId > 0 ) {
			// Query for checking to see if we are changing routes and to get the new sort order.
			const result = await knex("companiesAddresses")
				.join(newStopOrderQuery,knex.raw(`1=1`))
				.where({ companyAddressId })
				.select("billingCode", "routeId", "newStopOrder")
				.first();

			// If billingCode was passed in, then update it, otherwise use the value from the db
			const tempBillingCode = billingCode !== null ? billingCode : result.billingCode;

			// Update the base address table.
			await AddressMutations.AddressSave(root, { input }, context);

			if( parseFloat(routeId) !== result.routeId ) {
				// The route is changing, we will update it and the stop order.
				await knex('companiesAddresses')
					.where({ companyAddressId })
					.update({
						addressName,
						billingCode: tempBillingCode,
						routeId,
						routeStopOrder: result.newStopOrder
					});
			} else {
				// The route is not changes, we only update the address name.
				await knex('companiesAddresses')
					.where({ companyAddressId })
					.update({ addressName, billingCode: tempBillingCode });
			}

			return Response(true, "Address successfully saved", { CompanyAddress: input });
		} else {
			const { newStopOrder: routeStopOrder } = await newStopOrderQuery.first();

			// clean up unassigned route to zero
			if (routeId === "") {
				routeId = 0;
			}

			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const addressInsert = await AddressMutations.AddressSave(root, { input }, context);
			const [companyAddressId] = await knex('companiesAddresses').insert(
				{
					accountId,
					addressId: addressInsert.addressId,
					addressName,
					billingCode,
					companyId,
					routeId,
					routeStopOrder
				}
			);

			return Response(true, "Address successfully created", { CompanyAddress: {...input, addressId: addressInsert.addressId, addressName, companyAddressId} } );
		}
	},
	async companyAddressRemove( root, { companyAddressId }, context ) {
		const knex = context.knex;

		if ( companyAddressId ) {
			// Run the multiple deletes in a transaction.
			const removed = await knex.transaction(async (trx) => {
				// Get the addressId from the linked user address.
				const { addressId } = await trx("companiesAddresses").select("addressId").first().where({ companyAddressId });

				// Delete the users phone record.
				const companyAddressRemoved = await trx("companiesAddresses").delete().where({ companyAddressId });

				// Delete the phones record.
				const addressRemoved = await trx("addresses").delete().where({ addressId });

				return companyAddressRemoved && addressRemoved;
			});

			if( removed ) {
				return Response(true,"Company Address removed");
			} else {
				return Response(false,"Company address not found, could not be removed");
			}
		} else {
			return Response(false,"Company address could not be removed");
		}
	}
}

// EXPORT
export { CompanyAddressSubResolvers, CompanyAddressMutations, CompanyAddressRootResolvers }
