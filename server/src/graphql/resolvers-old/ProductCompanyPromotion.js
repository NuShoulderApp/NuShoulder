
import _ from "lodash";

import { Response } from "../../utilities/helpers";

export const SubResolvers = {
	async ProductCategory({ productCategoryId }, args, context) {
		return await context.knex("productCategories").where({ productCategoryId }).first();
	},
	async Products( { productCompanyPromotionId }, args, context ) {
		return await context.knex("productsCompaniesPromotionsProducts")
			.join("products","productsCompaniesPromotionsProducts.productId","products.productId")
			.where({ productCompanyPromotionId });
	}
}

export const RootResolvers = {
	async ProductCompanyPromotions (root, { companyId, productId }, context) {
		return await context.knex("productsCompaniesPromotions").where({ companyId, productId });
	},

	async ProductCompanyPromotionsCremations (root, { companyId }, context) {
		let Promotions = await context.knex("productsCompaniesPromotions")
			.select(
				'productsCompaniesPromotions.productCompanyPromotionId', 
				'productsCompaniesPromotions.productCategoryId AS productCategoryId', 
				'productsCompaniesPromotions.amountDiscount', 
				'productsCompaniesPromotions.productId AS productId',
				'productCategories.productCategory')
			.join('productCategories', 'productCategories.productCategoryId', 'productsCompaniesPromotions.productCategoryId')
			.where('productsCompaniesPromotions.companyId', context.Session.User.companyId );

		return Promotions
	},

	async ProductCompanyPromotionsProducts (root, {}, context) {
		let PromotionsProducts = await context.knex("productsCompaniesPromotionsProducts")
			.select('productsCompaniesPromotionsProducts.productCompanyPromotionId', 'productsCompaniesPromotionsProducts.productId AS promotionalProductId', 'products.productName', 'products.isFurClipping', 'products.isPawPrint')
			.join('products', 'products.productId', 'productsCompaniesPromotionsProducts.productId')

		return PromotionsProducts
	}

}

export const Mutations = {
	async productCompanyPromotionRemove(root, { productCompanyPromotionId }, context) {
		await context.knex("productsCompaniesPromotions").delete().where( { productCompanyPromotionId } );

		return Response(true,"Promotion Successfully Removed");
	},

	async productCompanyPromotionSave(root, { input }, context) {
		const knex = context.knex;

		const {
			companyId,
			productCompanyPromotionId
		} = input;

		const { accountId } = await knex("companies").select("accountId").where({ companyId }).first();

		if(productCompanyPromotionId > 0) {
			await knex("productsCompaniesPromotions")
				.where({ productCompanyPromotionId })
				.update(_.omit(input,"productIds"));

			await knex("productsCompaniesPromotionsProducts").del().where({ productCompanyPromotionId });

			await knex("productsCompaniesPromotionsProducts").insert( input.productIds.map((productId) => ( { productId, productCompanyPromotionId, accountId  } )) );

			return Response(true,"Product Promotion Successfully Updated", { ProductCompanyPromotion: input }, 1);
		} else {

			const [ productCompanyPromotionId ] = await knex("productsCompaniesPromotions").insert({ ..._.omit(input,"productIds"), accountId });

			const ProductCompanyPromotion = {
				...input,
				accountId,
				productCompanyPromotionId
			};

			await knex("productsCompaniesPromotionsProducts").insert( input.productIds.map((productId) => ( { productId, productCompanyPromotionId, accountId  } )) );

			return Response(true,"Product Promotion Successfully Updated", { ProductCompanyPromotion }, 2);
		}
	}
}
