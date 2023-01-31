const OrderProductProductOptionFields = `
    optionName: String
    orderProductId: ID
    orderProductProductOptionId: ID
    productAttributeId: ID
    productOptionId: ID
    productOptionValueId: String
    sortOrderProductOption: Int
    textString: String
    valueLabel: String
`;

//IMPORTANT: The reason that we name ProductOption differently than the actual db table OrderProductProductOptions name is that you cannot have the same name for a Root Resolver and a Sub Resolver - this causes issues with the types and schema errors.

export default `
	type OrderProductProductOption {
        ${OrderProductProductOptionFields}
	}

    type OrderProductProductOptionResponse {
		OrderProductProductOption: OrderProductProductOption
		Response: Response
	}

    input OrderProductProductOptionInput {
        ${OrderProductProductOptionFields}
    }

    extend type RootMutation {
        orderProductProductOptionSave(input: OrderProductProductOptionInput!): OrderProductProductOptionResponse!
    }

`;
