import { defaultImage, images } from './Image';

export const SubResolvers = {
	// resolve a productImage object based on provided root.defaultImage
	defaultImage,
	images,
	async ProductCompanyPromotion({ productCompanyPromotionId }, args, context) {
		if(productCompanyPromotionId !== undefined)	{
			return context.knex("productsCompaniesPromotions").where({ productCompanyPromotionId }).first();
		} else {
			return null;
		}
	}
}
