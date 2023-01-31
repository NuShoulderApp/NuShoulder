import _ from "lodash";
import { Response } from "../../utilities/helpers";

// QUERIES
const ProductOptionValueRootResolvers = {
	ProductOptionValues: (root, args, context) => {
		return context.knex('productOptionValues')
			.where({accountId: context.Account.accountId})
			.orderBy('valueLabel');
	}
}

export const Mutations = {
	async productOptionValueSave(root, { input }, context) {
		const knex = context.knex;

		const {
			productOptionValueId,
			valueLabel
		} = input;

		let tempProductOptionValueId = productOptionValueId;
		if(productOptionValueId > 0) {
			// Save any changes to the productOptionValue record
			await knex('productOptionValues')
				.where({ accountId: context.Account.accountId, productOptionValueId })
				.update(_.omit(input,["productOptionValueId"]))
		} else {
			const [newProductOptionValueId] = await knex('productOptionValues')
				.insert({accountId: context.Account.accountId, valueLabel})

			tempProductOptionValueId = newProductOptionValueId;
		}

		return Response(true,"Saved", {  productOptionValueId: tempProductOptionValueId });
	},


	async productOptionValuesReorder(root, { input }, context) {
		const knex = context.knex;

		const {
			productOptionId,
			productOptionValueId,
			sortOrderProductOptionValueOld,
			sortOrderProductOptionValueNew
		} = input;

		// Update all of the records in the productOptionsProductOptionValues that match this productOptionId
		if (sortOrderProductOptionValueOld > sortOrderProductOptionValueNew) {
			await knex('productOptionsProductOptionValues')
				.where({ productOptionId: productOptionId, accountId: context.Account.accountId })
				.andWhere('sortOrderProductOptionValues', '>=', sortOrderProductOptionValueNew)
				.andWhere('sortOrderProductOptionValues', '<', sortOrderProductOptionValueOld)
				.increment('sortOrderProductOptionValues', 1);
		} else if (sortOrderProductOptionValueOld < sortOrderProductOptionValueNew) {
			await knex('productOptionsProductOptionValues')
				.where({ productOptionId: productOptionId, accountId: context.Account.accountId })
				.andWhere('sortOrderProductOptionValues', '<=', sortOrderProductOptionValueNew)
				.andWhere('sortOrderProductOptionValues', '>', sortOrderProductOptionValueOld)
				.decrement('sortOrderProductOptionValues', 1);
		}

		// update all of the productOptionId matches for this product to sortOrderProductOptionValueNew
		await knex('productOptionsProductOptionValues')
			.where({ accountId: context.Account.accountId, productOptionId: productOptionId, productOptionValueId: productOptionValueId })
			.update({sortOrderProductOptionValues: sortOrderProductOptionValueNew})

		// Return Updated ProductOptionValues
		const ProductOptionValues = await knex('productOptionValues')
			.join('productOptionsProductOptionValues', 'productOptionsProductOptionValues.productOptionValueId', 'productOptionValues.productOptionValueId')
			.where('productOptionsProductOptionValues.productOptionId', productOptionId)
			.andWhere('productOptionsProductOptionValues.accountId', context.Account.accountId)
			.orderBy('productOptionsProductOptionValues.sortOrderProductOptionValues', 'asc');

		return Response(true,"Personalization Product Options Order Saved", {ProductOptionValues});
	}

}

// EXPORT
export { ProductOptionValueRootResolvers as RootResolvers}
