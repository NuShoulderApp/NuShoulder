const InvoiceItemFields = `
	invoiceItemId: ID
	accountId: ID
	companyId: ID
	dateCreated: DateTime
	deleted: Boolean
	deletedByUserId: ID
	deletedReason: String
	familyFriendPet: Int
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
	petReferenceNumber: String
	servicePet: Int
	staffEmployeePet: Int
	taxDue: String
	taxRate: String
	totalCharity: String
`;

const InvoiceFields = `
	invoiceId: ID
	accountId: ID
	commissionType: String
	companyAddressId: ID
	companyId: ID
	companyName: String
	dateCreated: Date
	dateInvoice: Date
	dateInvoiceDue: Date
	dateInvoicePaid: Date
	dateInvoiceSent: DateTime
	emailedTo: String
	paymentTerms: String
	taxDue: String
	totalCharity: String
	totalDue: String
`;

export default `
	type Invoice {
		${InvoiceFields}
		File: File
		ItemsInvoice: [InvoiceItem]
		jobId: ID
	}

	type InvoiceItem {
		${InvoiceItemFields}
		accountDescriptionLong: String
		accountDescriptionShort: String
		accountProductName: String
		productName: String
	}

	type InvoiceForecast {
		companyId: ID
		dateCreated: DateTime
		invoiceCost: String
		invoiceCostCharged: String
		invoiceCostChargedPersonalization: String
		invoiceCostPersonalization: String
		invoiceCostSubtotal: String
		invoiceCostTotal: String
		invoiceVet: Int
		isFurClipping: String
		isPawPrint: String
		memorialization: String
		orderDate: DateTime
		orderId: ID
		orderProductId: ID
		orderServiceStatusId: ID
		orderStatusId: ID
		orderType: String
		orderTypeId: Int
		personalizeProduct: Int
		petFirstName: String
		petReferenceNumber: String
		priceCharged: String
		priceChargedPersonalization: String
		productCategory: String
		productCategoryId: ID
		productId: ID
		productName: String
		productType: String
		productTypeId: ID
		statusIsCremation: Int
		statusIsDelivery: Int
		statusIsFurClipping: Int
		statusIsPawPrint: Int
		taxCharged: String
		taxChargedInvoice: String
		taxDue: String
		taxRate: Float
		vetSupplyOrder: Int
	}

	type InvoiceItemForecast {
		adjustmentInvoiceCostSubtotal: String
		adjustmentInvoiceCostTotal: String
		adjustmentInvoiceItemDescription: String
		adjustmentInvoiceItemDescriptionPrivate: String
		adjustmentInvoiceItemType: String
		adjustmentOrderId: ID
		adjustmentTaxDue: String
	}

	type InvoiceResponse {
		Response: Response
		Invoice: Invoice
	}

	input InvoiceForecastFiltersInput {
		clinicId: ID
		dateEnd: String
		dateStart: String
	}

	input InvoiceGeneralAllInput {
		dateEnd: String
		dateStart: String
	}

	input InvoiceInput {
		dateInvoiceSent: Date
		emailedTo: String
		invoiceId: ID
		orderProductIds: String
	}

	input InvoiceItemInput {
		${InvoiceItemFields}
	}

	input InvoiceSaveAndSendInput {
		invoiceId: ID!
		emailedTo: String
		dateInvoice: String
		sendEmail: Boolean
	}

	input InvoiceListCursorInput {
		after: ID
	}

	extend type RootQuery {
		Invoice(invoiceId: ID!, orderId: ID): Invoice
		InvoiceableAdjustments(companyId: ID, dateEnd: Date, dateStart: Date): [ProductOrder]
		InvoiceableOrdersProducts(companyId: ID, dateEnd: Date, dateStart: Date): [ProductOrder]
		InvoiceForecasting(clinicId: ID, dateEnd: String, dateStart: String, filterOrderTypeDate: String): [InvoiceForecast]
		InvoiceItemsForecasting(clinicId: ID, dateEnd: String, dateStart: String): [InvoiceItemForecast]
		Invoices(accountId: ID, companyId: ID): [Invoice]
	}

	extend type RootMutation {
		invoiceGenerateAll(input: InvoiceGeneralAllInput): InvoiceResponse!
		invoiceSave(input: InvoiceInput!): InvoiceResponse!
		invoiceItemDelete(input: InvoiceItemInput!): InvoiceResponse!
		invoiceItemSave(input: InvoiceItemInput!): InvoiceResponse!
		invoiceSaveAndSend(input: InvoiceSaveAndSendInput): InvoiceResponse!
	}
`;
