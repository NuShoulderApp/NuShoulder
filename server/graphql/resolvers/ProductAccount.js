import _ from "lodash";
import { Response } from "../../utilities/helpers";

export const Mutations = {
	async productAccountSave(root, { input }, context) {
		const knex = context.knex;
		const { productId } = input;

		await knex('productsAccounts')
			.update(_.omit(input,["productId"]))
			.where({
				accountId: context.Account.accountId,
				productId: productId
			});

		return Response(true,"Saved");
	}
}
