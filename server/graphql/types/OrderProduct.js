const OrderProductFields = `
    invoiceVet: Int
    orderId: ID
    orderProductId: ID
    petFirstName: String
    petLastName: String
    productCategoryId: ID
    productId: ID
    productName: String
    productTypeId: ID
`
export default `
    type DeletedCremationProduct {
        ${OrderProductFields}
        active: Int
        canUseKeepsakeStand: Int
        creditCardChargeId: ID
        dateDeleted: DateTime
        dateRefunded: DateTime
        deletedFirstName: String
        deletedLastName: String
        deletedReason: String
        descriptionLong: String
        descriptionShort: String
        editable: Int
        height: Int
        invoiceCost: String
        invoiceCostCharged: String
        invoiceCostPersonalization: String
        invoiceCostChargedPersonalization: String
        length: Int
        orderProductCreated: DateTime
        parentCategory: String
        payAtPickupOffered: Int
        paymentCompletedAlternative: Int
        paymentCompletedAlternativeMethod: String
        paymentCompletedPetOwner: Int
        petReferenceNumber: String
        isPawPrint: String
        isFurClipping: String
        requiresPawPrint: String
        priceCharged: String
        priceChargedPersonalization: String
        productCategory: String
        productMaterialId: ID
        productModel: String
        productSpeciesId: ID
        productType: String
        refundedFirstName: String
        refundedLastName: String
        refundedReason: String
        speciesId: ID
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

	type OrderProduct {
        ${OrderProductFields}
        accountDescriptionLong: String
        accountDescriptionShort: String
        accountProductName: String
	}

    type OrderProductResponse {
		OrderProduct: OrderProduct
        OrderProductProductOptions: [OrderProductProductOption]
		Response: Response
	}

    type OrderProductConfirmEngravingResponse {
		Response: Response
	}

    input OrderProductInput {
        alternativePaymentMade: Boolean
        creditCardChargeId: ID
        deletedReason: String
        invoiceCostCharged: String
        invoiceCostChargedPersonalization: String
        invoiceVet: Boolean
        orderId: ID
        orderProductId: ID
        orderProductIsDelivery: Boolean
        parentCategory: String
        paymentCompletedAlternative: Int
        paymentCompletedAlternativeMethod: String
        personalizeProduct: Boolean
        personalizationConfirmed: Int
        priceCharged: String
        priceChargedPersonalization: String
        pricingAlreadyCalculated: Boolean
        productCategory: String
        productId: ID
        productName: String
        returnProductOptions: Boolean
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
        taxCharged: String
        taxRate: Float
        vetOrderPaid: Boolean
        walkInItem: Boolean
    }

    type OrderProductsPersonalization {
        orderProductId: ID
    }

    input OrderProductRefundInput {
        amount: String
        creditCardChargeId: ID
        markOrderDeleted: Boolean
        orderId: ID
        orderProductId: ID
        paymentCompletedAlternative: Int
        refundingReasonOrderProduct: String
    }

	extend type RootQuery {
        DeletedCremationProduct(orderId: ID!): DeletedCremationProduct
        OrderProduct(orderProductId: ID!): OrderProduct
        OrderProducts(petReferenceNumber: String!): OrderProduct
        OrderProductsPersonalization(orderId: ID, orderIds: String): [OrderProductsPersonalization]
        OrderProductsPrintables(orderId: ID, orderIds: String): [OrderProduct]
	}

    extend type RootMutation {
        orderProductConfirmEngraving(input: OrderProductInput): OrderProductConfirmEngravingResponse
        orderProductDelete(input: OrderProductInput!): OrderProductResponse!
        orderProductRefund(input: OrderProductRefundInput!): OrderProductResponse!
        orderProductSave(input: OrderProductInput!): OrderProductResponse!
        orderProductsPaid(input: OrderProductInput!): OrderProductResponse
        orderProductRemove(input: OrderProductInput!): OrderProductResponse!
        orderProductUndelete(input: OrderProductInput!): OrderProductResponse!
    }

`;
