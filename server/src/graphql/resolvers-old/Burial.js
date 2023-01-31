import { Response } from "../../utilities/helpers";

const BurialSubResolvers = {
	// OPTIONAL: get linked items in subresolvers

}

// QUERIES
const BurialRootResolvers = {
	// Get Burial - gets an array and then returns the .first() entry
	async Burial(root, { burialId }, context) {
		const knex = context.knex;

		return await knex('burials')
			.where('burials.burialId', burialId)
			.first();
	},
	
	// Get Burials, given a burialLogId, get all the burials on that log
	async Burials(root, { burialLogId }, context) {
		const knex = context.knex;

		if(burialLogId > 0) {
			return await knex('burials')
				.where('burials.burialLogId', burialLogId);
		} 
	}
}

// MUTATIONS
const BurialMutations = {
	// input is an object with the data to insert or update
	// Insert into burials table
	async burialSave(root, { input }, context) {
		const knex = context.knex;

		const {
			burialLogId,
			burialId,
			orderId,
			orderProductId,
			petReferenceNumber
		} = input;

		let accountId = context.Account.accountId;
		input = { ...input, accountId };

		// if there is a burialId > 0, do an update, otherwise do an insert.
		if(burialId > 0) {
			await knex('burials')
				.where({ burialId })
				.update({ accountId, burialLogId, orderId, orderProductId, petReferenceNumber });
			return Response(true, "Burial successfully saved", { Burial: input });
		} else {
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const [burialId] = await knex('burials').insert({ accountId, burialLogId, orderId, orderProductId, petReferenceNumber });

			return Response(true, "Burial successfully created", { Burial: {...input, burialId} } );
		}
	},
	async burialRemove( root, { burialId }, context ) {
		const knex = context.knex;

		if ( burialId ) {
			// Run the multiple deletes in a transaction.
			const removed = await knex.transaction(async (trx) => {
				const burialRemoved = await trx("burials").delete().where({ burialId });
				return burialRemoved;
			});

			if( removed ) {
				return Response(true,"Burial removed");
			} else {
				return Response(false,"Burial not found, could not be removed");
			}
		} else {
			return Response(false,"Burial could not be removed");
		}
	}
}

// EXPORT
export { BurialSubResolvers, BurialMutations, BurialRootResolvers }
