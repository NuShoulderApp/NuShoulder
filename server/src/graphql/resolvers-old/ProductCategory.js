// import standard database connection object
import { Response } from "../../utilities/helpers";

// NOTE: use camelCase for fields and PascalCase for categories and objects

// QUERIES
const ProductCategoryRootResolvers = {
	async ProductCategory(root, { ProductCategoryId }, context) {
		return await context.knex("productCategories")
			.select('productCategories.*', context.knex.raw(`IF( accountId = ${context.Account.accountId}, true, false) as editable`))
			.where({ ProductCategoryId }).first();
	},

	// Get Products
	async ProductCategories (root, args, context) {
		return context.knex('productCategories')
			.select('productCategories.*', context.knex.raw(`IF( accountId = ${context.Account.accountId}, true, false) as editable`))
			.whereIn('accountId', [1, context.Account.accountId])  // either on accountId 1 or current account
			.orderBy("productCategory", "asc");
	}
}

// MUTATIONS
const ProductCategoryMutations = {
	// input is a productCategory object with the data to insert or update
	async productCategorySave(root, { input }, context) {
		const knex = context.knex;

		const { productCategoryId } = input;

		if(productCategoryId > 0) {
			await knex('productCategories')
				.where({ productCategoryId })
				.update( input );

			return Response(true,"Product Category Successfully Updated", {ProductCategory: input});
		} else {
			const [newProductCategoryId] =  await knex('productCategories')
				.insert({...input, accountId: context.Account.accountId });

			return Response(true,"Product Category Successfully Created", {ProductCategory: { ...input, productCategoryId: newProductCategoryId }});
		}
	}
}

// EXPORT
export { ProductCategoryMutations as Mutations, ProductCategoryRootResolvers as RootResolvers}
