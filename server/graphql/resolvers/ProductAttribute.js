// import Math from 'mathjs';
import { Response } from "../../utilities/helpers";

export function getProductAttributes(productId, context) {
	return context.knex('productAttributes')
		.select(
			'productAttributes.productAttributeId',
			'productAttributes.productId',
			'productAttributes.sortOrderProductOption',
			'productOptions.maxLength',
			'productOptions.minLength',
			'productOptions.optionName',
			'productOptions.productOptionId',
			'productOptions.isRequired as productOptionRequired',
			'productOptionTypes.typeName',
			'productOptionValues.productOptionValueId',
			'productOptionValues.valueLabel',
			'productOptionsProductOptionValues.sortOrderProductOptionValues'
		)
		.join('productOptions', 'productOptions.productOptionId', 'productAttributes.productOptionId')
		.join('productOptionTypes', 'productOptionTypes.productOptionTypeId', 'productOptions.productOptionTypeId')
		.join('productOptionsProductOptionValues', 'productOptionsProductOptionValues.productOptionId', 'productOptions.productOptionId')
		.join('productOptionValues', 'productOptionValues.productOptionValueId', 'productOptionsProductOptionValues.productOptionValueId')
		.where('productAttributes.productId', productId)
		.andWhere('productAttributes.accountId', context.Account.accountId)
		.orderBy('productAttributes.sortOrderProductOption', 'asc')
		.orderBy('productOptionsProductOptionValues.sortOrderProductOptionValues', 'asc')

}

// QUERIES
export const RootResolvers = {
	async ProductAttributes(root, input, context) {
		return await getProductAttributes(input.productId, context);
	}
}

export const Mutations = {
	async productAttributesSave(root, { input }, context) {
		const knex = context.knex;
		const { productId, productOptionIds } = input;

		if( productId ) {
			const ProductOptionIds = JSON.parse("[" + productOptionIds + "]");

			await knex("productAttributes").del().where({accountId: context.Account.accountId, productId});

			await knex("productAttributes").insert( ProductOptionIds.map((option, index) => ({
				accountId: context.Account.accountId,
				productId,
				productOptionId: option,
				sortOrderProductOption: index+1,
			})));

			// Get the new productAttributes after updating the sortOrderProductOption
			const ProductAttributesCorrectlySorted = await getProductAttributes(productId, context);

			return Response(true,"Saved", {ProductAttributes: ProductAttributesCorrectlySorted});
		} else {
			return Response(false,"Not Saved");
		}

	},

	async productOptionsReorder(root, { input }, context) {
		const knex = context.knex;

		const {
			productId,
			productOptionId,
			sortOrderProductOptionOld,
			sortOrderProductOptionNew
		} = input;

		// Update all of the records in the productAttributes that match this productId
		if (sortOrderProductOptionOld > sortOrderProductOptionNew) {
			await knex('productAttributes')
				.where({ productId: productId, accountId: context.Account.accountId })
				.andWhere('sortOrderProductOption', '>=', sortOrderProductOptionNew)
				.andWhere('sortOrderProductOption', '<', sortOrderProductOptionOld)
				.increment('sortOrderProductOption', 1);
		} else if (sortOrderProductOptionOld < sortOrderProductOptionNew) {
			await knex('productAttributes')
				.where({ productId: productId, accountId: context.Account.accountId })
				.andWhere('sortOrderProductOption', '<=', sortOrderProductOptionNew)
				.andWhere('sortOrderProductOption', '>', sortOrderProductOptionOld)
				.decrement('sortOrderProductOption', 1);
		}

		// update all of the productOptionId matches for this product to sortOrderProductOptionNew
		await knex('productAttributes')
			.where({ accountId: context.Account.accountId, productOptionId: productOptionId, productId: productId })
			.update({sortOrderProductOption: sortOrderProductOptionNew})

		// Return Updated ProductAttributes
		const ProductAttributes = await getProductAttributes(productId, context);

		return Response(true,"Personalization Product Options Order Saved", {ProductAttributes});
	}

}
