import _ from "lodash";
import { Response } from "../../utilities/helpers";

export const Mutations = {
	async productViewSave(root, { input }, context) {
		const knex = context.knex;

		const {
      orderId,
      productGroupId,
      productId
		} = input;

    let tempLoggedIn = context.Session.LoggedIn ? 1 : 0;

    await knex('productsViews')
			.insert({
        accountId: context.Account.accountId, 
        loggedIn: tempLoggedIn,
        orderId,
        productGroupId,
        productId
      })

		return Response(true,"Saved", { });
	}
}
