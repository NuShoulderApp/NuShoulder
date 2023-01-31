import React from 'react';
import {Elements, StripeProvider} from 'react-stripe-elements';
import PaymentClass from './payment_form_component';

export const Payment = (props) => {
	const {
		Account,
		allowSaveCard=true,
		amount,
		description="",
		getPaymentResponse=() => {},
		invoiceId=0,
		paymentButtonText="Process Payment",
		orderId=0,
		vetOrderPaid=false
	} = props;
    console.log('Payment component, line 17: ', vetOrderPaid)

	const stripePublishableKey = Account.getSettingValue("stripePublishableKey");

	return (
		<StripeProvider apiKey={stripePublishableKey}>
			<div className="example">
				<Elements>
					<PaymentClass
						allowSaveCard={allowSaveCard}
						amount={amount}
						description={description}
						getPaymentResponse={getPaymentResponse}
						invoiceId={invoiceId}
						paymentButtonText={paymentButtonText}
						orderId={orderId}
						vetOrderPaid={vetOrderPaid}
					/>
				</Elements>
			</div>
		</StripeProvider>
	);
};
