const PaymentFields = `
	amount: Float
	description: String
	token: String
`;

// chargeId is the ID that comes back from stripe for the charge
export default `
	type Payment {
		${PaymentFields}
		chargeId: String
	}

	type PaymentResponse {
		Payment: Payment
		Response: Response
	}

	input PaymentInput {
		${PaymentFields}
		creditCardChargeId: ID
		customerId: String
		invoiceId: ID
		orderId: ID
	}

	extend type RootMutation {
		paymentProcessing(input: PaymentInput!): PaymentResponse
		refundPayment(input: PaymentInput!): PaymentResponse
	}

`;
