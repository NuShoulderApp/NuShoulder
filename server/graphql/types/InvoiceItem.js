const InvoiceItemFields = `
	invoiceItemId: ID
	accountId: ID
	companyId: ID
	dateCreated: Date
	deleted: Boolean
	deletedByUserId: ID
	deletedReason: String
	invoiceId: ID
	invoiceItemDescriptionPrivate: String
	invoiceItemDescription: String
	invoiceItemType: String
	invoiceCost: String
	invoiceCostPersonalization: String
	invoiceCostSubtotal: String
	invoiceCostTotal: String
	orderId: ID
	orderProductId: ID
	taxDue: String
	taxRate: String
	totalCharity: String
`;
// unitWeightInvoiceCost
// unitWeightPriceInterval
// unitWeightPriceIntervalUnits
// unitWeightPriceMax
// unitWeightPriceMin
// weight
// weightInvoiceCost
// weightUnit

const InvoiceFields = `
	invoiceId: ID
	accountId: ID
	commissionType: String
	companyAddressId: ID
	companyId: ID
	companyName: String
	dateCreated: Date
	dateInvoiceDue: Date
	dateInvoicePaid: Date
	dateInvoiceSent: Date
	emailedTo: String
	paymentTerms: String
	taxDue: String
	totalCharity: String
	totalDue: String
`

// type Invoice {
// 	${InvoiceFields}
// 	InvoiceItems: [InvoiceItem]
// }

export default `
	type Invoice {
		${InvoiceFields}
		InvoiceItems: [InvoiceItem]
	}

	type InvoiceItem {
		${InvoiceItemFields}
		accountDescriptionLong: String
		accountDescriptionShort: String
		accountProductName: String
	}

	type InvoiceListCursor {
		after: ID
	}

	type InvoiceList {
		invoices: [Invoice]!
		cursor: InvoiceListCursor!
	}


	type InvoiceResponse {
		Response: Response
	}

	input InvoiceInput {
		invoiceId: ID
		orderProductIds: String
	}

	input InvoiceItemInput {
		${InvoiceItemFields}
	}

	input InvoiceListCursorInput {
		after: ID
	}

	extend type RootQuery {
		Invoice(invoiceId: ID!): Invoice
        Invoices(cursor: InvoiceListCursorInput): InvoiceList
	}

	extend type RootMutation {
		invoiceItemSave(input: InvoiceItemInput!): InvoiceResponse!
	}

`;

// extend type RootQuery {
// 	Orders(orderStatusId: ID, cursor: OrderListCursorInput, orderQueue: String): OrderList!
// }
