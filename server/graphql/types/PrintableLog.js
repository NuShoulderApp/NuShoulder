export default`
	type PrintableLog {
		datePrinted: DateTime
		fileId: ID
		File: File
		orderId: ID
		printableId: ID
		printableLogId: ID
		userId: ID
		firstName: String
		lastName: String
	}

	type PrintableLogResponse {
		PrintableLog: PrintableLog
	}

	input PrintableLogInput {
		fileId: ID
		orderId: ID
		printableId: ID
	}

	extend type RootQuery {
		PrintableLog(printableLogId: ID): PrintableLog
		PrintableLogs(orderId: ID): [PrintableLog]
	}

	extend type RootMutation {
		printableLogSave(input: PrintableLogInput!): PrintableLogResponse
	}

`;
