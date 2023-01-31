// QUERIES
const AddressRootResolvers = {
	// Get Address - gets an array and then returns the
	async Address(root, { addressId }, context) {
		const knex = context.knex;

		const [AddressResult] = await knex('addresses')
			.join('states', 'states.stateId', 'addresses.stateId')
			.where('addresses.addressId', addressId);

		return AddressResult
	}
}



// MUTATIONS
const AddressMutations = {
	// input is an object with the data to insert or update
	async AddressSave(root, { input }, context) {
		const knex = context.knex;

		const {
			addressId,
			addressTypeId,
			address1,
			address2,
			city,
			countryId=0,
			deliveryInstructions="",
			ownerName="",
			postalCode,
			stateId=0
		} = input;

		let accountId = context.Account.accountId;
		input = { ...input, accountId };

		// If the countryId was passed in as 0, get it from the states db
		let tempCountryId = countryId;
		if(parseInt(countryId) === 0 && parseInt(stateId) > 0) {
			const [State] = await knex('states')
				.where({stateId});

			tempCountryId = State ? State.countryId : countryId;
		}

		if(addressId > 0) {
			await knex('addresses')
				.where({ addressId })
				.update({ address1, address2, addressTypeId, city, countryId: tempCountryId, deliveryInstructions, ownerName, postalCode, stateId });

			return input;
		} else {
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const [addressId] = await knex('addresses').insert({ accountId, address1, address2, addressTypeId, city, countryId: tempCountryId, deliveryInstructions, ownerName, postalCode, stateId });

			return {...input, addressId};
		}
	}
}

// EXPORT
export { AddressMutations, AddressRootResolvers }
