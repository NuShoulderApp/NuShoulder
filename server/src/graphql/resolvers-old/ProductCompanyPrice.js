import { Response } from "../../utilities/helpers";

// MUTATIONS
export const Mutations = {
	// input is a productCategory object with the data to insert or update
	async productCompanyPriceSave(root, { input }, context) {
		const knex = context.knex;

		const { productCompanyPriceId } = input;

		if(productCompanyPriceId > 0) {
			await knex("productsCompaniesPrices")
				.where({ productCompanyPriceId })
				.update( input );

			// Return the response, with a code of 1 to indicate an update.
			return Response( true, "Product Company Prices Updated", { ProductCompanyPrice: await knex("productsCompaniesPrices").where({ productCompanyPriceId }).first() }, 1);
		} else {
			const { accountId } = await knex("companies").where("companyId", input.companyId).first();

			const [newproductCompanyPriceId] =  await knex("productsCompaniesPrices").insert({...input, accountId });

			// Return the response, with a code of 2 to indicate an insert.
			return Response(true,"Product Company Prices Updated", { ProductCompanyPrice: await knex("productsCompaniesPrices").where({ productCompanyPriceId: newproductCompanyPriceId }).first() }, 2);
		}
	}
}
