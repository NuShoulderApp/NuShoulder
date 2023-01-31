//import { BurialRootResolvers } from "./Burial";
import { Response } from "../../utilities/helpers";
import { BurialRootResolvers } from "./Burial";

const BurialLogSubResolvers = {
	Burials(BurialLog, args, context) {
		return BurialRootResolvers.Burials(BurialLog, {burialLogId: BurialLog.burialLogId}, context);
	},
	async User({ performedByUserId }, args, context) {
		return await context.knex("users").where({ performedByUserId }).first();
	}
}

// QUERIES
const BurialLogRootResolvers = {
	// Get BurialLog - gets an array and then returns the .first() entry
	// Set this function as async so we can wait on the knex calls.
	BurialLog(root, {burialLogId}, context) {
		const knex = context.knex;

		let accountId = context.Account.accountId;
		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		return knex('burialLogs')
			.where('burialLogs.burialLogId', burialLogId )
			.where('burialLogs.accountId', accountId)
			.first();
	},

	// Get BurialLogs
	// Set this function as async so we can wait on the knex calls.
	BurialLogs: async (root, {accountId}, context) => {
		const knex = context.knex;
		accountId = context.Account.accountId;
		return await knex('burialLogs').where({ accountId }).orderBy("dateBurial");
	}
}

// MUTATIONS
const BurialLogMutations = {
	// input is a BurialLog object with the data to insert or update
	async burialLogSave(root, { input }, context) {
		const knex = context.knex;

		const {
			burialLogId,
			burialType,
			cemetaryPlot,
			companyId,
			companyAddressId,
			dateBurial,
			orderId,
			orderProductId,
			performedByUserId
		} = input;

		let accountId = context.Account.accountId;

		if(burialLogId > 0) {
			await knex('burialLogs')
				.where({ burialLogId })
				.update({burialType, cemetaryPlot, companyId, companyAddressId, dateBurial, orderId, orderProductId, performedByUserId });

			return Response(true,"Burial Log Successfully Saved",  { BurialLog: await knex("burialLogs").where({ burialLogId }).first() });
		} else {
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const [burialLogId] = await knex('burialLogs')
				.insert({accountId, burialType, cemetaryPlot, companyId, companyAddressId, dateBurial, orderId, orderProductId, performedByUserId});

			return Response(true,"Burial Log Successfully Saved", { BurialLog: await knex("burialLogs").where({ burialLogId }).first() });
		}
	}
}

// EXPORT
export { BurialLogSubResolvers, BurialLogMutations, BurialLogRootResolvers }
