// set of fields for both CreditCard and CreditCardInput for Query and Mutation to use
const CreditCardFields = `
    accountId: ID
    active: Int
    cardName: String
    cardNickname: String
    companyId: ID
    customerId: String
    creditCardId: ID
    dateCreated: DateTime
    dateDeactivated: DateTime
    stripeToken: String
`;

// main CreditCard types and inputs to be exported
export default `
	type CreditCard {
		${CreditCardFields}
	}

    type CreditCardResponse {
		CreditCard: CreditCard
		Response: Response
	}

	input CreditCardInput {
		${CreditCardFields}
        invoiceId: ID
        orderId: ID
        saveCard: Boolean
	}

    extend type RootMutation {
		creditCardSave(input: CreditCardInput!): CreditCardResponse
	}

    extend type RootQuery {
        CreditCards: [CreditCard]
    }

`;
