import _ from "lodash";
import { Response } from "../../utilities/helpers";

export const RootResolvers = {
	ProductGroups: async (root, args, context) => {
		return await context.knex("productGroups")
			.orderBy("productGroups.productGroup");
	},
	ProductGroupsMemorializations: async (root, args, context) => {
		return await context.knex("productGroups")
			.select('productGroups.*', 'productVariationTypes.*', 'productVariationValues.*', 'products.productId', 'products.productName', 'productsAccounts.accountProductName', 'productsVariations.productVariationValueId')
			.join('products', 'products.productGroupId', 'productGroups.productGroupId')
			.join('productsAccounts', 'productsAccounts.productId', 'products.productId')
			.join('productsVariations', 'productsVariations.productId', 'products.productId')
			.join('productVariationValues', 'productVariationValues.productVariationValueId', 'productsVariations.productVariationValueId')
			.join('productVariationTypes', 'productVariationTypes.productVariationTypeId', 'productVariationValues.productVariationTypeId')
			.where('productsAccounts.accountId', context.Account.accountId)
			.andWhere('productsAccounts.active', 1)
			.orderBy("productGroups.productGroup");
	}
}

export const Mutations = {
	async productGroupSave(root, {input}, context) {
		const {
			productGroupId=0,
			productGroup=''
		} = input;

		let tempProductGroupId; // To be used in the shared functionality for inserts and updates

		if(productGroupId > 0) {
			// Save any changes to the productGroup record
			await context.knex('productGroups')
				.where({ productGroupId })
				.update({productGroup})
        
			tempProductGroupId = productGroupId;
		} else {
			// Only save the accountId on insert, it should never be edited
			// input.accountId = context.Account.accountId;

			const [newProductGroupId] = await context.knex('productGroups')
				.insert(_.omit(input,["productGroupId"]))

			tempProductGroupId = newProductGroupId;
		}

		//SHARED FUNCTIONALITY FOR INSERTS & UPDATES

		return Response(true,"Saved", {  productGroupId: tempProductGroupId, productGroup });
	}

}
