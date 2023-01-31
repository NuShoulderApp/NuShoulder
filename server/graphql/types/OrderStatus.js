// main OrderStatus types and inputs to be exported
export default `
	type OrderStatus {
		orderStatusId: ID
		active: Int
		barcode: String
		defaultSortOrder: Int
		editable: Int
		orderCompletedIndicator: Int
		orderStatus: String
		sortOrder: Int
		visibleOrderUpdater: Int
		statusAtCrematory: Int
		statusAtVet: Int
		statusInTransit: Int
	}

	type OrderStatusResponse {
		Response: Response!
		OrderStatuses: [OrderStatus]
		OrderStatus: OrderStatus
	}

	type OrderStatusReorderResponse {
		OrderStatuses: [OrderStatus]
		Response: Response
	}

	input OrderStatusInput {
		orderStatusId: ID
		active: Int
		barcode: String
		orderStatus: String
		visibleOrderUpdater: Int
	}

	input OrderStatusReorderInput {
		orderStatusId: ID
		sortOrderOld: Int
		sortOrderNew: Int
	}

	extend type RootMutation {
		OrderStatusSave(input: OrderStatusInput!): OrderStatusResponse
		OrderStatusReorder(input: OrderStatusReorderInput!): OrderStatusReorderResponse
	}

	extend type RootQuery {
		OrderStatus(orderStatusId: ID): OrderStatus
		OrderStatuses: [OrderStatus]
	}
`;
