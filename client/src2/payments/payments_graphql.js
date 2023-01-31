import gql from 'graphql-tag';

export const getCreditCardsQuery = gql`
	query getCreditCards {
        CreditCards {
            active
            cardName
            cardNickname
            companyId
            creditCardId
            customerId
            stripeToken
        }
	}`;


export const CreditCardChargeSaveMutation = gql`
    mutation creditCardChargeSave($input: CreditCardChargeInput!) {
		creditCardChargeSave (input: $input) {
			CreditCardCharge {
				creditCardChargeId
				creditCardId
				status
				stripeToken
			}
			Response {
				success
				message
			}
		}
	}
`;

export const CreditCardSaveMutation = gql`
    mutation creditCardSave($input: CreditCardInput!) {
		creditCardSave (input: $input) {
			CreditCard {
				cardName
                cardNickname
				creditCardId
                customerId
				stripeToken
			}
			Response {
				success
				message
			}
		}
	}
`;

export const PaymentProcessingMutation = gql`
    mutation paymentProcessing($input: PaymentInput!) {
		paymentProcessing (input: $input) {
            Payment {
                chargeId
            }
			Response {
				success
				message
			}
		}
	}
`;
