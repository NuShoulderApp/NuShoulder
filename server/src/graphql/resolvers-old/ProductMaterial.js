import { Response } from "../../utilities/helpers";

// QUERIES
const ProductMaterialRootResolvers = {
	ProductMaterial(root, {productMaterialId}, context) {
		return context.knex('productMaterials')
			.where({ productMaterialId })
	},

	// Get Products
	ProductMaterials: (root, args, context) => {
		return context.knex('productMaterials')
			.where('productMaterials.accountId', context.Account.accountId)
			.orderBy("materialName", "asc");
	}
}

// MUTATIONS
const ProductMaterialMutations = {
	// input is a productMaterial object with the data to insert or update
	async productMaterialSave(root, { input }, context) {
		const knex = context.knex;

		const { productMaterialId } = input;

		if(productMaterialId > 0) {
			await knex('productMaterials')
				.where({ productMaterialId })
				.update( input );

			return Response(true,"Product Material Successfully Updated", {ProductMaterial: input});
		} else {
			const [newProductMaterialId] =  await knex('productMaterials')
				.insert({...input, accountId: context.Account.accountId });

			return Response(true,"Product Material Successfully Created", {ProductMaterial: { ...input, productMaterialId: newProductMaterialId }});
		}
	}
}

// EXPORT
export { ProductMaterialMutations as Mutations, ProductMaterialRootResolvers as RootResolvers}
