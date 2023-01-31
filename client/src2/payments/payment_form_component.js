import React from 'react';
import {CardElement, injectStripe} from 'react-stripe-elements';
import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';	// IMPORTANT: Add any icons you want to use to the index.js import { ... } from '@fortawesome/free-solid-svg-icons' AND library.add(...)
import { withRouter } from "react-router-dom";
import { withState } from "react-state-hoc";

import { withFormik, Field } from "../utilities/IWDFormik";
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import { withTranslate, Translate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import { CreditCardChargeSaveMutation, CreditCardSaveMutation, getCreditCardsQuery, PaymentProcessingMutation } from './payments_graphql';

const PaymentFormContent = (props) => {
    const {
        allowSaveCard,
        amount,
        cardName,
        cardNameError,
        // cardNickname,
        cardOption,
        CreditCardChargeSave,
        CreditCardSave,
        // customerId,
        data: {
            CreditCards
        },
        description, 
        errors,
        formSubmitting,
        getPaymentResponse,
        invoiceId,
        orderId,
        paymentButtonText,
        PaymentProcessing,
        processingMessage,
        processingSuccessful,
        // Response,
        saveCard,
        setState,
        // status,
        stripe,
        // stripeToken,
        // submitForm,
        touched,
        // values,
        vetOrderPaid=false
    } = props;

    console.log({props})
    async function handleSubmitForm() {
        // Validate the CardName, this is currently the only data we collect for cards, so its all we validate.
        let tempCardNameError = cardOption === 'new' && cardName === '' ? true : false;

        // Update the formSubmitting state variable so that the loading icon will appear on the payment button when the Card Name is not blank
        setState({
            cardNameError: tempCardNameError,
            formSubmitting: tempCardNameError === true ? false : true
        }, async () => {
            // Also submit the form
            if(tempCardNameError === false) {
                //const { amount, cardOption, description, saveCard } = input;

                // Option 1: Use New CC, DO NOT save card for later use
                if(cardOption === 'new' && saveCard === 'false') {
                    // result is an object with sinlge key, either 'error' and 'token'
                    let result = await stripe.createToken({name: cardName});
                    console.log({result})
                    if(result.error) {
                        setState({formSubmitting: false, processingSuccessful: false, processingMessage: "Unable to confirm this credit card's credentials"})
                    } else if(result.token) {
                        // If we receive a token, save the result into the creditCards table
                        // Async/Await Perform the mutation (to the server) and decompose the result.
                        const { data: { creditCardSave }} = await CreditCardSave({ input: {
                            cardName: cardName,
                            stripeToken: result.token.id
                        }});
                        console.log({creditCardSave})
                        // If save into creditCards db worked, then continue with the charge of the CC
                        const { data: { paymentProcessing }} = await PaymentProcessing({ input: {amount: parseFloat(amount), description, invoiceId, orderId, token: result.token.id} })
                        console.log({paymentProcessing})
                        // Only save the chargeId if the payment was successful, otherwise there is not a chargeId coming from stripe
                        const chargeId = paymentProcessing.Response.success === true ? paymentProcessing.Payment.chargeId : '0';

                        // Save the charge attempt
                        const { data: { creditCardChargeSave: { CreditCardCharge }}} = await CreditCardChargeSave({ input: {
                            amount: parseFloat(amount),
                            chargeId: chargeId,
                            creditCardId: parseInt(creditCardSave.CreditCard.creditCardId),
                            invoiceId: invoiceId,
                            orderId: orderId,
                            status: paymentProcessing.Response.message,
                            stripeToken: result.token.id
                        }});
                        console.log({CreditCardCharge})

                        // Display success message if payment went through.
                        if(paymentProcessing.Response.message === 'Succeeded') {
                            getPaymentResponse({success: true, message: 'Payment processing was successful', creditCardChargeId: CreditCardCharge.creditCardChargeId, vetOrderPaid }); // callback function from parent component
                            setState({formSubmitting: false, processingSuccessful: true, processingMessage: 'Payment processing was successful'});
                        } else if(paymentProcessing.Response.success === false) {
                            // Differeniate between 'StripeIdempotencyError' and other errors
                            if(paymentProcessing.Response.message === 'StripeIdempotencyError') {
                                getPaymentResponse({success: false, message: 'Stripe Idempotency Error', creditCardChargeId: 0, vetOrderPaid}); // callback function from parent component
                                setState({formSubmitting: false, processingSuccessful: false, processingMessage: 'Stripe Idempotency Error'})
                            } else {
                                getPaymentResponse({success: false, message: 'Unable to Process Message', creditCardChargeId: 0, vetOrderPaid}); // callback function from parent component
                                setState({formSubmitting: false, processingSuccessful: false, processingMessage: 'Unable to Process Message'})
                            }
                        }
                    }
                }
            }
        })
    }
    
    if(processingSuccessful === true && processingMessage !== "") {
        return (
            <div className="alert alert-success"><Translate id={processingMessage} /></div>
        );
    } else {
        return (
            <div className="checkout">
                {processingSuccessful === false && processingMessage !== "" &&
                    <div className="alert alert-danger"><Translate id={processingMessage} /></div>
                }
                {CreditCards.length > 0 &&
                    <Field component="select" name="cardOption" className="form-control">
                        <option value="new">{props.translate("Use New Credit Card")}</option>
                        <option value="saved">{props.translate("Use Saved Credit Card")}</option>
                    </Field>
                }
                {cardOption === 'new' &&
                    <React.Fragment>
                        <Translate id="Name on card"/> *
                        <Field name="cardName" onChange={(event) => setState({cardName: event.target.value, cardNameError: event.target.value !== '' ? false : true})} className={`form-control ${cardNameError && 'is-invalid'}`} />
                        <div className="mt-2 border p-3">
                            <CardElement />
                        </div>
                        <div className="row m-0 mt-2 p-0">
                            <div className="col-12 h6 pl-0">Safe and Secure SSL Encrypted</div>
                            <div className="col-3 m-0 p-0">
                                <img src={process.env.PUBLIC_URL + "/images/logos/visa.png"} alt="Visa" style={{maxWidth: 100 + '%'}} />
                            </div>
                            <div className="col-3 m-0 p-0">
                                <img src={process.env.PUBLIC_URL + "/images/logos/mastercard.png"} alt="Mastercard" style={{maxWidth: 100 + '%'}} />
                            </div>
                            <div className="col-3 m-0 p-0">
                                <img src={process.env.PUBLIC_URL + "/images/logos/americanexpress.png"} alt="American Express" style={{maxWidth: 100 + '%'}} />
                            </div>
                            <div className="col-3 m-0 p-0">
                                <img src={process.env.PUBLIC_URL + "/images/logos/discover.png"} alt="Discover" style={{maxWidth: 100 + '%'}} />
                            </div>
                        </div>
                        {props.Session.LoggedIn === true && allowSaveCard === true &&
                            <React.Fragment>
                                <div className="mt-4 mb-2">
                                    <Field component="select" name="saveCard" className="form-control">
                                        <option value="true">{props.translate("Save card for future use")}</option>
                                        <option value="false">{props.translate("DO NOT Save card")}</option>
                                    </Field>
                                </div>
                                {saveCard === 'true' &&
                                    <div className="mb-2">
                                        <Translate id="Card Nickname"/> *
                                        <Field name="cardNickname" showError={true} className={`form-control ${errors.cardNickname && touched.cardNickname && 'is-invalid'}`} />
                                    </div>
                                }
                            </React.Fragment>
                        }
                    </React.Fragment>
                }
                {cardOption === 'saved' &&
                    <div className="mt-2 mb-2">
                        <Translate id="Saved Cards" />
                        <Field component="select" showError={true} name="customerId" className={`form-control ${errors.customerId && touched.customerId && 'is-invalid'}`}>
                            <option key={0} value="">Select Card</option>
                            {CreditCards.map((CreditCard) => {
                                return (
                                    <option key={CreditCard.creditCardId} value={CreditCard.customerId}>{CreditCard.cardNickname}</option>
                                )
                            })}
                        </Field>
                    </div>
                }
                { formSubmitting === false && <button type="button" onClick={() => handleSubmitForm()} className={`btn btn-success rounded btn-addon mt-2 ${cardName === '' && 'disabled'}`}><FontAwesomeIcon icon="dollar-sign" /> <Translate id={paymentButtonText} /></button>}
                { formSubmitting === true && <button type="button" className="btn btn-default btn-addon mt-2 rounded border-success"><FontAwesomeIcon icon="dollar-sign" color="green" className="border-success" /> <span className="text-success"><Translate id="Processing Payment" />...</span></button>}
            </div>
        );
    }
};

const PaymentForm = compose(
    queryWithLoading({
        gqlString: getCreditCardsQuery
    }),
    withMutation(CreditCardChargeSaveMutation, "CreditCardChargeSave"),
    withMutation(CreditCardSaveMutation, "CreditCardSave"),
    withMutation(PaymentProcessingMutation, "PaymentProcessing", ["getInvoice"]),
	withFormik({
		handleSubmit: async ( input, { props: { CreditCardChargeSave, CreditCardSave, data: { CreditCards }, getPaymentResponse, PaymentProcessing, setResponse, setState, stripe, vetOrderPaid=false } } ) => {
            // const { amount, cardOption, description, saveCard } = input;
            //         console.log('Payment form component handleSubmit, line 115: ', vetOrderPaid)

            // // Option 1: Use New CC, DO NOT save card for later use
            // if(cardOption === 'new' && saveCard === 'false') {
            //     // result is an object with sinlge key, either 'error' and 'token'
            //     let result = await stripe.createToken({name: input.cardName});

            //     if(result.error) {
            //         setResponse({success: false, message: "Unable to confirm this credit card's credentials"})
            //     } else if(result.token) {
            //         // If we receive a token, save the result into the creditCards table
            //         // Async/Await Perform the mutation (to the server) and decompose the result.
        	// 		const { data: { creditCardSave }} = await CreditCardSave({ input: {
            //             cardName: input.cardName,
            //             stripeToken: result.token.id
        	// 		}});

            //         // If save into creditCards db worked, then continue with the charge of the CC
            //         const { data: { paymentProcessing }} = await PaymentProcessing({ input: {amount: parseFloat(amount), description, invoiceId: input.invoiceId, orderId: input.orderId, token: result.token.id} })

            //         // Only save the chargeId if the payment was successful, otherwise there is not a chargeId coming from stripe
            //         const chargeId = paymentProcessing.Response.success === true ? paymentProcessing.Payment.chargeId : '0';

            //         // Save the charge attempt
            //         const { data: { creditCardChargeSave: { CreditCardCharge }}} = await CreditCardChargeSave({ input: {
            //             amount: parseFloat(amount),
            //             chargeId: chargeId,
            //             creditCardId: parseInt(creditCardSave.CreditCard.creditCardId),
            //             invoiceId: input.invoiceId,
            //             orderId: input.orderId,
            //             status: paymentProcessing.Response.message,
            //             stripeToken: result.token.id
            //         }});

            //         // Display success message if payment went through.
            //         if(paymentProcessing.Response.message === 'Succeeded') {
            //             getPaymentResponse({success: true, message: 'Payment processing was successful', creditCardChargeId: CreditCardCharge.creditCardChargeId, vetOrderPaid }); // callback function from parent component
            //             setResponse({success: true, message: 'Payment processing was successful'});
            //         } else if(paymentProcessing.Response.success === false) {
            //             // Differeniate between 'StripeIdempotencyError' and other errors
            //             if(paymentProcessing.Response.message === 'StripeIdempotencyError') {
            //                 getPaymentResponse({success: false, message: 'Stripe Idempotency Error', creditCardChargeId: 0, vetOrderPaid}); // callback function from parent component
            //                 setResponse({success: false, message: 'Stripe Idempotency Error'})
            //             } else {
            //                 getPaymentResponse({success: false, message: 'Unable to Process Message', creditCardChargeId: 0, vetOrderPaid}); // callback function from parent component
            //                 setResponse({success: false, message: 'Unable to Process Message'})
            //             }
            //         }
            //     }
            // }
            // // Option 2: Use New CC, save card for later use
            // else if(cardOption === 'new' && saveCard === 'true') {
            //     // result is an object with sinlge key, either 'error' and 'token'
            //     let result = await stripe.createToken({name: input.cardName});

            //     if(result.error) {
            //         setResponse({success: false, message: "Unable to confirm this credit card's credentials"})
            //     } else if(result.token) {
            //         // If we receive a token, save the result into the creditCards table. Passing 'saveCard:true' will create a stripe customerId that we save in the creditCards table and use that id for charges instead of the token. The token is needed to create the customerId.
            //         // Async/Await Perform the mutation (to the server) and decompose the result.
        	// 		const { data: { creditCardSave }} = await CreditCardSave({ input: {
            //             cardName: input.cardName,
            //             cardNickname: input.cardNickname,
            //             invoiceId: input.invoiceId,
            //             orderId: input.orderId,
            //             saveCard: true,
            //             stripeToken: result.token.id
        	// 		}});

            //         // If save into creditCards db worked, then continue with the charge of the CC. Passing in the customerId to use for charging instead of useing the token
            //         const { data: { paymentProcessing }} = await PaymentProcessing({ input: {amount: parseFloat(amount), customerId: creditCardSave.CreditCard.customerId, description, invoiceId: input.invoiceId, orderId: input.orderId, token: result.token.id} })

            //         // Only save the chargeId if the payment was successful, otherwise there is not a chargeId coming from stripe
            //         const chargeId = paymentProcessing.Response.success === true ? paymentProcessing.Payment.chargeId : '0';

            //         // Save the charge attempt
            //         await CreditCardChargeSave({ input: {
            //             amount: parseFloat(amount),
            //             chargeId: chargeId,
            //             creditCardId: parseInt(creditCardSave.CreditCard.creditCardId),
            //             customerId: creditCardSave.CreditCard.customerId,
            //             invoiceId: input.invoiceId,
            //             orderId: input.orderId,
            //             status: paymentProcessing.Response.message,
            //             stripeToken: result.token.id
            //         }});

            //         // Display success message if payment went through.
            //         if(paymentProcessing.Response.message === 'Succeeded') {
            //             getPaymentResponse({success: true, message: 'Payment processing was successful', vetOrderPaid}); // callback function from parent component
            //             setResponse({success: true, message: 'Payment processing was successful'});
            //         } else if(paymentProcessing.Response.success === false) {
            //             // Differeniate between 'StripeIdempotencyError' and other errors
            //             if(paymentProcessing.Response.message === 'StripeIdempotencyError') {
            //                 getPaymentResponse({success: false, message: 'Stripe Idempotency Error', vetOrderPaid}); // callback function from parent component
            //                 setResponse({success: false, message: 'Stripe Idempotency Error'})
            //             } else {
            //                 getPaymentResponse({success: false, message: 'Unable to Process Message', vetOrderPaid}); // callback function from parent component
            //                 setResponse({success: false, message: 'Unable to Process Message'})
            //             }
            //         }
            //     }
            // }
            // // Option 3: Use Saved CC
            // else if(cardOption === 'saved') {
            //     // Charge the card on file using the customerId. Do not need to pass in a token since that is not used, and we did not create one.
            //     const { data: { paymentProcessing }} = await PaymentProcessing({ input: {amount: parseFloat(amount), customerId: input.customerId, description, invoiceId: input.invoiceId, orderId: input.orderId } })

            //     // Get the creditCardId using the customerId
            //     const creditCardId = CreditCards.find((CreditCard) => CreditCard.customerId === input.customerId).creditCardId;

            //     // Save the charge attempt
            //     await CreditCardChargeSave({ input: {
            //         amount: parseFloat(amount),
            //         chargeId: paymentProcessing.Payment.chargeId,
            //         creditCardId: parseInt(creditCardId),
            //         customerId: input.customerId,
            //         invoiceId: input.invoiceId,
            //         orderId: input.orderId,
            //         status: paymentProcessing.Response.message
            //     }});

            //     // Display success message if payment went through.
            //     if(paymentProcessing.Response.message === 'Succeeded') {
            //         getPaymentResponse({success: true, message: 'Payment processing was successful', vetOrderPaid}); // callback function from parent component
            //         setResponse({success: true, message: 'Payment processing was successful'});
            //     } else if(paymentProcessing.Response.success === false) {
            //         // Differeniate between 'StripeIdempotencyError' and other errors
            //         if(paymentProcessing.Response.message === 'StripeIdempotencyError') {
            //             getPaymentResponse({success: false, message: 'Stripe Idempotency Error', vetOrderPaid}); // callback function from parent component
            //             setResponse({success: false, message: 'Stripe Idempotency Error'})
            //         } else {
            //             getPaymentResponse({success: false, message: 'Unable to Process Message', vetOrderPaid}); // callback function from parent component
            //             setResponse({success: false, message: 'Unable to Process Message'})
            //         }
            //     }
            // }
		}
	}),
	withRouter,
    withState({
        cardName: '',
        cardNameError: false,
        cardNickname: '',
        cardOption: 'new',
        customerId: '',
        formSubmitting: false,
        processingMessage: '',
        processingSuccessful: false,
        responseReceived: false,
        saveCard: 'false',
        status: '',
        stripeToken: ''
    }),
	withTranslate
)(PaymentFormContent)

class PaymentClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state= {

		}
	}

	render () {
		return (
			<React.Fragment>
				<PaymentForm
                    allowSaveCard={this.props.allowSaveCard}
                    amount={this.props.amount}
                    description={this.props.description}
                    getPaymentResponse={this.props.getPaymentResponse}
                    invoiceId={this.props.invoiceId}
                    orderId={this.props.orderId}
                    paymentButtonText={this.props.paymentButtonText}
                    stripe={this.props.stripe}
                    vetOrderPaid={this.props.vetOrderPaid}
				/>
			</React.Fragment>
		)
	}
}

export default injectStripe(PaymentClass);
