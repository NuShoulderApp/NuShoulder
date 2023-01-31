// set of fields for both Order and OrderInput for Query and Mutation to use
const OrderFields = `
	allowHomeMemorialization: Int
	bypassPaymentRequirement: Int
	communalPawPrintAllowed: String
	companyId: ID
	companyDepartmentId: ID
	companyName: String
	companyNameLegal: String
	companyType: String
	companyTypeId: ID
	courierDeliveryOffered: Int
	creatorInitials: String
	crematoryPickupOffered: Int
	cremationTypesOffered: String
	dateCreated: DateTime
	dateExpectedDelivery: DateTime
	dateMemorializationEnds: DateTime
	dateNextFollowUpCall: DateTime
	deliveryAddressId: ID
	deliveryMethodName: String
	deliveryMethodProductId: ID
	expeditedCremation: Boolean
	expeditedCremationAllowed: Int
	familyFriendPet: Int
	hardwareFound: String
	homeMemorializationsEditCremation: Int
	hospitalDeliveryOffered: Int
	memorialization: String
	memorializationCheckedOut: Int
	orderComment: String
	orderCommentInternal: Int
	orderCompletedIndicator: Boolean
	orderId: ID
	orderServiceStatus: String
	orderServiceStatusId: ID
	orderStatus: String
	orderStatusId: ID
	orderType: String
	orderTypeId: Int
	originallyCommunalCremation: Int
	originallyIndividualCremation: Int
	originallyPrivateCremation: Int
	ownerAddressId: Int
	ownerEmail: String
	ownerFirstName: String
	ownerLastName: String
	ownerPhoneNumber: String
	payAtPickupOffered: Int
	payByCreditCardOffered: Int
	paymentAlternativeOffered: Int
	paymentTerms: String
	petBreed: String
	petColor: String
	petFirstName: String
	petLastName: String
	petReferenceNumber: String
	pickupAddressId: ID
	routeId: ID
	servicePet: Int
	sex: String
	specialInstructions: String
	species: String
	speciesId: ID
	staffEmployeePet: Int
	requireInitialsEditOrderDetails: Int
	tabCremationServicesOpen: Int
	tabDeliveryOpen: Int
	tabJewelryOpen: Int
	tabKeepsakesOpen: Int
	tabMemorializationOpen: Int
	tabPawPrintsOpen: Int
	tabSpecialServicesOpen: Int
	tabUrnsOpen: Int
	trackingDisk: String
	productId: ID
	vetSupplyOrder: Int
	visitationAllowed: Int
	weight: String
	weightUnits: String
`;

// main Order types and inputs to be exported
//IMPORTANT: The reason that we name ProductOrder differently than the actual db table OrdersProducts name is that you cannot have the same name for a Root Resolver and a Sub Resolver - this causes issues with the types and schema errors.

export default `
	type Order {
		CompanyDepartments: [CompanyDepartment]
		dateScannedAtCrematory: DateTime
		DeliveryAddress: OrderAddress
		ItemsInvoice: [InvoiceItem]
		LogOrderActivities: [LogOrderActivity]
		OrderComments: [OrderComment]
		OrderHold: [OrderHold]
		OwnerAddress: Address
		PickupAddress: OrderAddress
		PrintablesLogs: [PrintableLog]
		PrintablesOrders: [PrintableOrder]
		ProductOptions: [OrderProductProductOption]
		ProductsCompanyPrice: [ProductCompanyPrice]
		ProductCompanyPromotion: [ProductCompanyPromotion]
		ProductsOrder(includeDeleted: Boolean): [ProductOrder]
		${OrderFields}
		payVetOrderByCreditCardOffered: Int
		statusAtCrematory: Int
	}

	# same as Address type, with routeId added
	type OrderAddress {
		companyAddressId: ID
		accountId: ID
		addressId: ID
		address1: String
		address2: String
		addressName: String
		addressTypeId: ID
		city: String
		countryId: ID
		deliveryInstructions: String
		ownerName: String
		postalCode: String
		routeName: String
		routeId: ID
		pickupDays: String
		state: String
		stateId: ID
	}

	type GeneratePackingSlipResponse {
		PrintableOrder: PrintableOrder,
		Response: Response
	}

	type PetReferenceNumberCheckResponse {
		Order: Order,
		Response: Response
	}

	type PetReferenceNumberCompareResponse {
		Order: Order,
		Response: Response
	}

	type ProductOrder {
		active: Int
		accountDescriptionLong: String
		accountDescriptionShort: String
		accountProductName: String
		canUseKeepsakeStand: Int
		companyName: String
		creditCardChargeId: ID
		dateDeleted: DateTime
		dateRefunded: DateTime
		deletedFirstName: String
		deletedLastName: String
		deletedReason: String
		descriptionLong: String
		descriptionShort: String
		editable: Int
		familyFriendPet: Int
		height: Int
		invoiceCost: String
		invoiceCostCharged: String
		invoiceCostChargedPersonalization: String
		invoiceCostPersonalization: String
		invoiceCostSubtotal: String
		invoiceCostTotal: String
		invoiceItemDescription: String
		invoiceItemId: ID
		invoiceItemType: String
		invoiceVet: Int
		length: Int
		orderId: ID
		orderProductCreated: DateTime
		orderProductId: ID
		parentCategory: String
		payAtPickup: Int
		payAtPickupOffered: Int
		paymentCompletedAlternative: Int
		paymentCompletedAlternativeMethod: String
		paymentCompletedPetOwner: Int
		paymentCompletedVetOrder: Int
		personalizeProduct: Int
		personalizationAllowed: Int
		personalizationConfirmed: Int
		petReferenceNumber: String
		isPawPrint: String
		isFurClipping: String
		requiresPawPrint: String
		priceCharged: String
		priceChargedPersonalization: String
		productAccountActive: Int
		productCategory: String
		productCategoryId: ID
		productId: ID
		productMaterialId: ID
		productModel: String
		productName: String
		productSpeciesId: ID
		productType: String
		productTypeId: ID
		refundedFirstName: String
		refundedLastName: String
		refundedReason: String
		servicePet: Int
		speciesId: ID
		staffEmployeePet: Int
		statusCompletedAndPackaged: Int
		statusConfirmed: Int
		statusConfirmedIndicator: Int
		statusFurClippingCompleted: Int
		statusIsBurial: Int
		statusIsCremation: Int
		statusIsDelivery: Int
		statusIsFurClipping: Int
		statusIsPawPrint: Int
		statusIsVisitation: Int
		statusOrdered: Int
		statusOrderedIndicator: Int
		statusPawPrintCompleted: Int
		statusPawPrintTaken: Int
		statusRemainsFilled: Int
		statusRemainsFilledIndicator: Int
		statusRequiresPawPrint: Int
		stockAvailable: String
		stockCheck: Int
		taxCharged: String
		taxChargedInvoice: String
		taxDue: String
		taxRate: Float
		unitWeightInvoiceCost: String
		unitWeightPriceRetail: String
		unitWeightPriceInterval: Int
		unitWeightPriceIntervalUnits: String
		unitWeightPriceMax: Int
		unitWeightPriceMin: Int
		weight: String
		weightUnits: String
		width: Int
	}

	type OrderDelete {
		orderDeleteReason: String
		orderId: ID
		orderStatusId: ID
	}

	type OrderDeleteResponse {
		OrderDelete: OrderDelete
		Response: Response
	}

	type OrderResponse {
		jobId: ID
		Order: Order
		Response: Response
	}

	type OrderCremationResponse {
		jobId: ID
		OrderCremation: Order
		Response: Response
	}
	type PetReferencenumber {
		petReferenceNumber: String
	}

	type ProductOrderDuplicateCremationOrderResponse {
		orderId: ID
		petReferenceNumber: String
	}
	
	input GeneratePackingSlipInput {
		orderId: ID
	}

	input PetReferenceNumberCheckInput {
		petReferenceNumber: String
	}

	input OrderDeleteInput {
		orderDeleteReason: String
		orderId: ID
		orderStatusId: ID
	}

	input OrderInput {
		${OrderFields}
		generateNewCremationTag: Boolean
		newOrderType: String
		payAtPickup: Int
		selectedFurClippingProductId: Int
		selectedPawPrintProductId: Int
		selectedUrnProductId: Int
		userInitials: String
	}

	input OrderListCursorInput {
		after: ID
	}

	type OrderListCursor {
		after: ID
	}

	type OrderQueue {
		orders: [Order]!
		cursor: OrderListCursor!
		orderQueue: String
	}

	input OrderSearchInput {
		limit: Int
		orderStatusId: ID
		orderQueue: String
		ownerPhoneNumber: String
		petName: String
		petReferenceNumber: String
		companyIds: [ID]
		orderServiceStatusIds: [ID]
		orderStatusIds: [ID]
		memorialization: [String]
		orderTypeIds: [ID]
		productIds: [ID]
	}

	input SendOwnerEmailInput {
		orderIds: String
		orderStatusId: ID
	}

	type OrderList {
		orders: [Order]!
		cursor: OrderListCursor!
	}

	extend type RootQuery {
		OpenOrders(companyId: ID!): [Order]
		Orders(OrderSearchInput: OrderSearchInput, orderQueue: String, cursor: OrderListCursorInput): OrderList!
		OrdersInProcess(companyId: ID!, orderTypeId: ID!): [Order]
		OrdersWithStatus(companyId: ID!, orderStatusId: ID!): [Order]
		OrderWorkQueue(cursor: OrderListCursorInput, orderQueue: String, orderStatusIds: [ID]): OrderQueue
		Order(includeDeleted: Boolean, orderId: ID, petReferenceNumber: String): Order
	}

	extend type RootMutation {
		generatePackingSlip(input: GeneratePackingSlipInput!): GeneratePackingSlipResponse
		petReferenceNumberCheck(input: PetReferenceNumberCheckInput!): PetReferenceNumberCheckResponse!
		petReferenceNumberCompare(input: PetReferenceNumberCheckInput!): PetReferenceNumberCompareResponse!
		productOrderDuplicateCremationOrder(input: OrderInput): ProductOrderDuplicateCremationOrderResponse!
		orderCremationSave(input: OrderInput!): OrderCremationResponse!
		orderDelete(input: OrderDeleteInput!): OrderDeleteResponse!
		orderSave(input: OrderInput!): OrderResponse!
		orderStatusUpdate(input: OrderInput!): OrderResponse!
		sendOwnerEmail(input: SendOwnerEmailInput!): OrderResponse
	}

	extend type RootSubscription {
		OrderUpdateSubscription: Order!
	}
`;
