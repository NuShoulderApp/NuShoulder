import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import React from 'react';
import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withRouter, NavLink } from "react-router-dom";
import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component

import {
	OrderCremationSaveMutation,
	PetReferenceNumberCheckMutation
} from './orders_graphql';

import {
	getAccountQuery
} from '../accounts/accounts_graphql';

const PetReferenceCheckFormContent = (props) => {
	const {
		dirty,
		errors,
		isSubmitting,
		Response,
		touched
	} = props;

	let responseAlertClass = Response && Response.success === false ? 'alert-danger' : 'alert-success';

	return (
		<React.Fragment>
			<div className="container text-center">
				<div className="row justify-content-md-center">
					<div className="col-md-9 bg-light p-5">
						<Form>
							{/*  Display a resulting status message.  */}
							<h3 className="text-left"><Translate id="Memorialize"/></h3>
							{ Response && dirty === false && <div className="row"><div className={`col-12 alert ${responseAlertClass}`} >{props.translate(Response.message)}</div></div> }
							<div>
								{props.Account.accountPrefix === "loyalpaws" && <div className="text-left">
									<p>Our unique online memorialization system allows you the ability to purchase optional cremation services, an urn, and other memorial products – all from the comfort of your home. Any purchases that you make while in the memorialize area will be automatically recorded on your pet’s pet record. This service is available for <strong>48 hours</strong> after the passing of your pet (if you require more time, please <NavLink to={`/info/contact`}>contact us</NavLink> so we can assist you).</p>
									<p>Your pet reference number can be found on the last page of the Loyal Paws brochure that was provided to you at your veterinary clinic. If you do not have your pet reference number and have arranged cremation at your veterinary clinic – please contact them as soon as possible to obtain one. Alternatively, you can contact us at <a href="tel:800-969-9523">1-800-969-9523</a> and we can try to assist you as best we can.</p>
								</div>}
								<Translate id="Pet Reference Number"/> *
								<Field name="petReferenceNumber"  showError={true} className={`form-control ${errors.petReferenceNumber && touched.petReferenceNumber && 'is-invalid'}`} />
							</div>
							<button type="submit" className="btn btn-addon btn-default" disabled={isSubmitting || dirty === false}><FontAwesomeIcon icon="paw" /> <Translate id="Memorialize"/></button>
						</Form>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
};

const PetReferenceCheckForm = compose (
	withMutation(OrderCremationSaveMutation, "OrderCremationSave", ["getOrderProducts"]),
	withMutation(PetReferenceNumberCheckMutation, "PetReferenceNumberCheck"),
	withFormik({
		handleSubmit: async ( input, { props: { Account, handlePetReferenceNumberSubmit, history, OrderCremationSave, PetReferenceNumberCheck, setResponse, }} ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			const { data: { petReferenceNumberCheck }} = await PetReferenceNumberCheck({ input });

			if(petReferenceNumberCheck.Response.success === false) {
				// re-initialize the form - the reference number entered is wrong
				handlePetReferenceNumberSubmit(input.petReferenceNumber);
				setResponse(petReferenceNumberCheck.Response);
			} else if(petReferenceNumberCheck.Order.memorialization === 'clinic'){
				// re-initialize the form - this is an In Clinic memorialization
				handlePetReferenceNumberSubmit(input.petReferenceNumber);
				// show warning that this memorialization is being done at the Vet office.
				setResponse({message: "Pet Reference Number Warning", success: false});
			} else if(petReferenceNumberCheck.Order.memorialization === 'home'){
				// check to see if the dateMemorializationEnds is in the past
				if(moment().diff(moment(petReferenceNumberCheck.Order.dateMemorializationEnds)) > 0) {
					// Show a warning if the Account Setting for autoCloseMemorialization is 1, otherwise allow the pet owner to go continue to add products
					if(parseInt(Account.Settings.find((setting) => setting.name === 'autoCloseMemorialization').value) === 1) {
						// re-initialize the form to be able to see error message
						handlePetReferenceNumberSubmit(input.petReferenceNumber);
						// show warning that this memorialization window has closed
						setResponse({message: "Memorialization Window Closed Warning", success: false});
					} else {
						// push to the memorialization process, this is a good reference number and memorialization is to be completed at home - because autoCloseMemorialization = 0, they can still add products until they complete the memorialization checkout
						history.push(`/memorialization/referenceNumber/${input.petReferenceNumber}`)
					}
				} else if(moment(petReferenceNumberCheck.Order.dateMemorializationEnds).diff(moment(), 'minutes') < 60) {
					// if the dateMemorializationEnds is within the next hour, add an extra hour on to it so that they have more time when they get to the memorialization page;
					const newdateMemorializationEnds = moment(petReferenceNumberCheck.Order.dateMemorializationEnds).add(1, 'hours').format();

					// update the dateMemorializationEnds
					await OrderCremationSave({ input: { orderId: petReferenceNumberCheck.Order.orderId, dateMemorializationEnds: newdateMemorializationEnds } });

					// push to the memorialization process, this is a good reference number and memorialization is to be completed at home
					history.push(`/memorialization/referenceNumber/${input.petReferenceNumber}`)
				} else {
					// push to the memorialization process, this is a good reference number and memorialization is to be completed at home
					history.push(`/memorialization/referenceNumber/${input.petReferenceNumber}`)
				}
			}
		},
		validationSchema: () => Yup.object().shape({
			petReferenceNumber: Yup.string().required("Enter a Pet Reference Number")
	   })
	}),
	withTranslate
)(PetReferenceCheckFormContent);

class PetReferenceCheckClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			petReferenceNumber: ''
		}
	}

	handlePetReferenceNumberSubmit = (petReferenceNumber) => this.setState({petReferenceNumber});

	render () {
		return <PetReferenceCheckForm
					Account={this.props.Account}
					handlePetReferenceNumberSubmit={this.handlePetReferenceNumberSubmit}
					history={this.props.history}
					initialValues={{
						petReferenceNumber: this.state.petReferenceNumber
					}}
				/>
	}
}

export const PetReferenceCheck = compose(
	queryWithLoading({
		gqlString: getAccountQuery,
		variablesFunction: (props) => ({accountId: props.Account.accountId})
	}),
	withRouter,
	withTranslate
)(PetReferenceCheckClass)
