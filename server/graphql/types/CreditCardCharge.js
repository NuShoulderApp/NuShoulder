// set of fields for both CreditCardCharge and CreditCardChargeInput for Query and Mutation to use
const CreditCardChargeFields = `
    amount: Float
    chargeId: String
    creditCardChargeId: ID
    creditCardId: ID
    customerId: String
    invoiceId: ID
    orderId: ID
    status: String
    stripeToken: String
`;

// main CreditCardCharge types and inputs to be exported
export default `
	type CreditCardCharge {
		${CreditCardChargeFields}
	}

    type CreditCardChargeResponse {
		CreditCardCharge: CreditCardCharge
		Response: Response
	}

	input CreditCardChargeInput {
		${CreditCardChargeFields}
	}

    extend type RootMutation {
		creditCardChargeSave(input: CreditCardChargeInput!): CreditCardChargeResponse
	}


`;


// extend type RootQuery {
//     CreditCardCharges: [CreditCardCharge]
// }
