import _ from "lodash";
import { Response } from "../../utilities/helpers";
4
export const RootResolvers = {
	ProductVariationValues: async (root, args, context) => {
		return await context.knex("productVariationValues")
			.orderBy("productVariationValues.productVariationValue");
	}
}

export const Mutations = {
	async productVariationValueSave(root, {input}, context) {
		const {
			productVariationValueId=0,
			productVariationValue=''
		} = input;

		let tempProductVariationValueId; // To be used in the shared functionality for inserts and updates

		if(productVariationValueId > 0) {
			// Save any changes to the productVariationValue record
			await context.knex('productVariationValues')
				.where({ productVariationValueId })
				.update({productVariationValue})
        
			tempProductVariationValueId = productVariationValueId;
		} else {
			// Only save the accountId on insert, it should never be edited
			// input.accountId = context.Account.accountId;

			const [newProductVariationValueId] = await context.knex('productVariationValues')
				.insert(_.omit(input,["productVariationValueId"]))

			tempProductVariationValueId = newProductVariationValueId;
		}

		//SHARED FUNCTIONALITY FOR INSERTS & UPDATES

		return Response(true,"Saved", {  productVariationValueId: tempProductVariationValueId, productVariationValue });
	}

}
