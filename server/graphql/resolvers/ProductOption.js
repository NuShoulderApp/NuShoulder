import _ from "lodash";
import { Response } from "../../utilities/helpers";

export const RootResolvers = {
	ProductOptions: async (root, args, context) => {
		return await context.knex("productOptions")
			.join('productOptionTypes', 'productOptionTypes.productOptionTypeId', 'productOptions.productOptionTypeId')
			.where('productOptions.accountId', context.Account.accountId )
			.orderBy("productOptions.optionName");
	}
}

export const SubResolvers = {
	ProductOptionValue: async (ProductOption, args, context) => {
		return await context.knex("productOptionValues")
			.join("productOptionsProductOptionValues", "productOptionValues.productOptionValueId", "productOptionsProductOptionValues.productOptionValueId" )
			.where("productOptionsProductOptionValues.productOptionId", ProductOption.productOptionId)
			.andWhere("productOptionValues.accountId", context.Account.accountId)
			.orderBy("productOptionsProductOptionValues.sortOrderProductOptionValues");
	}
}

export const Mutations = {
	async productOptionSave(root, {input}, context) {
		const {
			productOptionId=0,
			productOptionValueIds=''
		} = input;

		let tempProductOptionId; // To be used in the shared functionality for inserts and updates

		if(productOptionId > 0) {
			// Save any changes to the productOption record
			await context.knex('productOptions')
				.where({ productOptionId })
				.update(_.omit(input,["productOptionId", "productOptionValueIds"]))

			// Delete all of the old connections in the productOptionsProductOptionValues table for this productOptionId
			await context.knex("productOptionsProductOptionValues").del().where({accountId: context.Account.accountId, productOptionId});

			tempProductOptionId = productOptionId;
		} else {
			// Only save the accountId on insert, it should never be edited
			input.accountId = context.Account.accountId;

			const [newProductOptionId] = await context.knex('productOptions')
				.insert(_.omit(input,["productOptionId", "productOptionValueIds"]))

			tempProductOptionId = newProductOptionId;
		}

		//SHARED FUNCTIONALITY FOR INSERTS & UPDATES
		// Turn list into an array to map through for the insert
		const ProductOptionValueIds = JSON.parse("[" + productOptionValueIds + "]");

		if(productOptionValueIds !== '' && ProductOptionValueIds.length > 0) {
			// Save all of the connections
			await context.knex("productOptionsProductOptionValues").insert( ProductOptionValueIds.map((valueId, index) => ({
				accountId: context.Account.accountId,
				productOptionId: tempProductOptionId,
				productOptionValueId: valueId,
				sortOrderProductOptionValues: index+1
			})));
		}

		const ProductOptionValues = await SubResolvers.ProductOptionValue({productOptionId: tempProductOptionId}, null, context);

		return Response(true,"Saved", {  productOptionId: tempProductOptionId, ProductOptionValues });
	}

}
