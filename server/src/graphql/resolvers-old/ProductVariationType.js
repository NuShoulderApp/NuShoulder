import _ from "lodash";
import { Response } from "../../utilities/helpers";
4
export const RootResolvers = {
	ProductVariationTypes: async (root, args, context) => {
		return await context.knex("productVariationTypes")
			.orderBy("productVariationTypes.productVariationType");
	}
}

export const Mutations = {
	async productVariationTypeSave(root, {input}, context) {
		const {
			productVariationTypeId=0,
			productVariationType=''
		} = input;

		let tempProductVariationTypeId; // To be used in the shared functionality for inserts and updates

		if(productVariationTypeId > 0) {
			// Save any changes to the productVariationType record
			await context.knex('productVariationTypes')
				.where({ productVariationTypeId })
				.update({productVariationType})
        
			tempProductVariationTypeId = productVariationTypeId;
		} else {
			// Only save the accountId on insert, it should never be edited
			// input.accountId = context.Account.accountId;

			const [newProductVariationTypeId] = await context.knex('productVariationTypes')
				.insert(_.omit(input,["productVariationTypeId"]))

			tempProductVariationTypeId = newProductVariationTypeId;
		}

		//SHARED FUNCTIONALITY FOR INSERTS & UPDATES

		return Response(true,"Saved", {  productVariationTypeId: tempProductVariationTypeId, productVariationType });
	}

}
