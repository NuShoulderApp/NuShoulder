export default `
	type DeliveryLogOrder {
		deliveryLogOrderId: ID
		deliveryLogId: ID
		Order: Order
		deliveryType: String
		newStatus: OrderStatus
	}
`;
