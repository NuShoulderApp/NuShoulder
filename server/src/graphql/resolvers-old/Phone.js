// import standard database connection object
// MUTATIONS
const PhoneMutations = {
	// input is an object with the data to insert or update
	async PhoneSave(root, { input }, context) {
		const knex = context.knex;

		const {  phone, phoneId, phoneLabel, phoneTypeId } = input;

		if(phoneId > 0) {
			await knex('phones')
				.where({ phoneId })
				.update({ phone, phoneLabel, phoneTypeId });

			return input;
		} else {
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const [phoneId] = await knex('phones').insert({ accountId: context.Account.accountId, phone, phoneLabel, phoneTypeId })

			return {...input, phoneId};
		}
	}
}

// EXPORT
export { PhoneMutations }
