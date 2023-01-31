export default`
	type PrintableOrder {
		dateCreated: DateTime
		filedId: ID
		File: File
		orderId: ID
		printableId: ID
		printableOrderId: ID
		statusCompleted: Int
	}

	input PrintableOrderGenerateInput {
		printableOrderId: ID
	}

	input PrintableOrderSaveInput {
		printableOrderId: ID
		statusCompleted: Int
	}

	type PrintableOrderGenerateResponse {
		jobId: ID
		PrintableLogs: [PrintableLog]
		PrintableOrders: [PrintableOrder]
		Response: Response
	}

	type PrintableOrderSaveResponse {
		PrintableOrder: PrintableOrder
		Response: Response
	}

	extend type RootQuery {
		PrintableOrder(printableOrderId: ID): PrintableOrder
		PrintableOrders(orderId: ID): [PrintableOrder]
	}

	extend type RootMutation {
		printableOrderGenerate(input: PrintableOrderGenerateInput!): PrintableOrderGenerateResponse!
		printableOrderSave(input: PrintableOrderSaveInput!): PrintableOrderSaveResponse!
	}
`;
