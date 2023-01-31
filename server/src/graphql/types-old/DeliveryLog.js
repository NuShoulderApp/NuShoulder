export default `
	type DeliveryLog {
		Company: Company
		CompanyAddress: CompanyAddress
		companyId: ID
		dateCreated: DateTime
		deliveryLogId: ID
		DeliveryLogOrder: [DeliveryLogOrder]
		deliveryType: String
		Driver: User
		Orders: [Order]
		Route: Route
		routeId: ID
		Signature: Signature
	}

	type DeliveryLogCompanies {
		companyId: ID
		companyName: String
	}

	type DeliveryLogOrderDetails {
		dateCreated: DateTime
		deliveryLogId: ID
		deliveryLogOrderId: ID
		deliveryType: String
		firstName: String
		lastName: String
		routeName: String
		signatureData: String
		signatureFirstName: String
		signatureLastName: String
	}
	extend type RootQuery {
		DeliveryLog(deliveryLogId: ID): DeliveryLog
		DeliveryLogCompanies: [DeliveryLogCompanies]
		DeliveryLogOrderDetails(orderId: ID): [DeliveryLogOrderDetails]
		DeliveryLogs(companyIds: String, dateEnd: Date, dateStart: Date, routeIds: String): [DeliveryLog]
	}
`;
