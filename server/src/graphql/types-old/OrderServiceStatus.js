// main OrderServiceStatus types and inputs to be exported
export default `
	type OrderServiceStatus {
        orderServiceStatusId: ID
		orderServiceStatus: String
	}

	input OrderServiceStatusInput {
        orderServiceStatusId: ID
		orderServiceStatus: String
	}

	extend type RootQuery {
		OrderServiceStatuses: [OrderServiceStatus]
	}
`;
