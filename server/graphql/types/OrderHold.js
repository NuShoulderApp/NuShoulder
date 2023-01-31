const OrderHoldFields = `
	companyTypeId: ID
	dateCreated: DateTime
	dateRemoved: DateTime
	firstName: String
	lastName: String
    orderHold: String
    orderHoldId: ID
    orderHoldReason: String
    orderHoldRemovedReason: String
    orderId: ID
    removerId: ID
    userId: ID
`

export default `
	type OrderHold {
        ${OrderHoldFields}
	}

    type OrdersHolds {
        orderId: ID
    }

    type OrderHoldResponse {
		OrderHold: OrderHold
		Response: Response
	}

	input OrderHoldInput {
		${OrderHoldFields}
	}

	extend type RootQuery {
        OrderHold(orderId: ID!): OrderHold
        OrdersHolds(companyId: ID!): [OrdersHolds]
	}

    extend type RootMutation {
        orderHoldSave(input: OrderHoldInput!): OrderHoldResponse!
    }

`;
