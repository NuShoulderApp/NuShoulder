import { Response } from "../../utilities/helpers";

// MUTATIONS
const Mutations = {
	async logCrematoryGasMeterSave(root, { input }, context) {
		const knex = context.knex;

		await knex("logCrematoryGasMeter")
      .insert({
        accountId: context.Account.accountId,
        companyId: context.Session.User.companyId,
        loggedInUserId: context.Session.User.userId,
        measured: input.measured
      });

    const LogCrematoryGasMeterLogs = await RootResolvers.LogCrematoryGasMeterLogs(root, {}, context);

		return Response(true, "Gas meter log saved", {LogCrematoryGasMeterLogs});
	}
}

// QUERIES
const RootResolvers = {
	async LogCrematoryGasMeterLogs(root, {}, context) {
		const knex = context.knex;

    if(context.Session.User.userTypeId === 2) {
      return await knex('logCrematoryGasMeter')
        .where('accountId', context.Account.accountId)
        .orderBy('dateCreated', 'desc')
    } else {
      return await knex('logCrematoryGasMeter')
        .where('accountId', context.Account.accountId)
        .orderBy('dateCreated', 'desc')
        .limit(5)
    }
	}
}



// EXPORT
export { Mutations, RootResolvers }
