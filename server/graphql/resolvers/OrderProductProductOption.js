import { Response } from "../../utilities/helpers";
// NOTE: use camelCase for fields and PascalCase for types and objects

// MUTATIONS
const OrderProductProductOptionsMutations = {
	// input is a OrderProductProductOption object with the data to insert or update
	async orderProductProductOptionSave(root, { input }, context) {
		const knex = context.knex;

		if(parseInt(input.orderProductProductOptionId) > 0) {
			await knex('orderProductProductOptions').update({textString: input.textString}).where({orderProductProductOptionId: input.orderProductProductOptionId});

			return Response(true,"", {OrderProductProductOption: {input}});
		} 
		else {
			const [newOrderProductProductOptionId] = await knex('orderProductProductOptions')
				.insert({...input});
			
			return Response(true,"", {OrderProductProductOption: {...input, orderProductProductOptionId: newOrderProductProductOptionId}});
		}

	},
}

// EXPORT
export { OrderProductProductOptionsMutations as Mutations }
