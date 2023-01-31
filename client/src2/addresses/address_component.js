import React from 'react';
import { Form, Field } from "../utilities/IWDFormik";
import { withModalState } from "../utilities/withModal";
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { compose } from "react-apollo";

import { queryWithLoading } from '../utilities/IWDDb';
import { Translate, withTranslate } from '../translations/IWDTranslation';
import { getAddressTypes } from "./address_graphql";

const AddressForm = (props) => {
	const {
		addressTypes: {
			AddressTypes,
			Countries
		},
		allowEditAddressType=true,
		dirty,
		errors,
		includeHomeAddressType=true,
		initialValues,
		isSubmitting,
		orderDetails=false,
		previousResponse,
		showAddressName=true,
		showBillingCode=false,
		showDeliveryInstructions=false,
		showDeliveryRoutes=false,
		showOwnersName=false,
		showRemove,
		touched,
		values
	} = props;

	// If the user is logged out, we can assume that it is a pet owner, so we only want them to be able to create 'Home' addresses.
	if( props.Session.LoggedIn === false ) {
		values.addressTypeId = 3;
	} else if(allowEditAddressType === false) {
		// this is only false when this component is called from company_component.js as a Vet Staff user.
		values.addressTypeId = AddressTypes.find((type) => type.addressType === 'Vet') ? AddressTypes.find((type) => type.addressType === 'Vet').addressTypeId : values.addressTypeId;
	}

	return (
		<React.Fragment>
			{/* Display the heading if there is one. */}
			{ props.heading && <h5>{props.translate(props.heading)}</h5> }

			{/*  Display a resulting status message.  */}
			{ previousResponse &&	<div className="alert alert-success">{props.translate(previousResponse.message)}</div> }


			<Form>
				{showAddressName === true &&
					<div>
						<Translate id="Address Name" /> *
						<Field name="addressName" placeholder={props.translate("Address Name Placeholder")} className={`form-control ${errors.addressName && touched.addressName && 'is-invalid'}`} />
							{errors.addressName && touched.addressName && <div className="invalid-feedback">{props.translate(errors.addressName)}</div>}
					</div>
				}
				{showBillingCode === true &&
					<div>
						<Translate id="Billing Code" />
						<Field name="billingCode" className="form-control" />
					</div>
				}
				{showOwnersName === true &&
					<div>
						<Translate id="Name" /> *
						<Field name="ownerName" className={`form-control ${errors.ownerName && touched.ownerName && 'is-invalid'}`} />
							{errors.ownerName && touched.ownerName && <div className="invalid-feedback">{props.translate(errors.ownerName)}</div>}
					</div>
				}
				<div>
					<Translate id="Address Line 1" />
					<Field name="address1" placeholder={props.translate("Address Placeholder")} className={`form-control ${errors.address1 && touched.address1 && 'is-invalid'}`} />
						{errors.address1 && touched.address1 && <div className="invalid-feedback">{props.translate(errors.address1)}</div>}
				</div>
				<div>
					<Translate id="Address Line 2" />
					<Field name="address2" placeholder={props.translate("Address Placeholder")} className={`form-control ${errors.address2 && touched.address2 && 'is-invalid'}`} />
						{errors.address2 && touched.address2 && <div className="invalid-feedback">{props.translate(errors.address2)}</div>}
				</div>
				<div className="form-row">
					<div className="col-md">
						<Translate id="City"/> *
						<Field name="city" placeholder={props.translate("City Placeholder")} className={`form-control ${errors.city && touched.city && 'is-invalid'}`} />
							{errors.city && touched.city && <div className="invalid-feedback">{props.translate(errors.city)}</div>}
					</div>
					<div className="col-md-auto">
						{/* LOCALIZE TODO: this whole piece of the address is probably going to need to change */}
						<Translate id="State"/> *
						<Field component="select" name="stateId" className={`form-control ${errors.stateId && touched.stateId && 'is-invalid'}`}>
							<option>{props.translate("Select State")}</option>
							{Countries.map((country) => (
								<optgroup key={country.countryId} label={props.translate(country.country)}>
									{country.States.map((state) => (<option value={state.stateId} key={state.stateId}>{props.translate(state.state)}</option>))}
								</optgroup>
							))}
						</Field>
						{errors.stateId && touched.stateId && <div className="invalid-feedback">{props.translate(errors.stateId)}</div>}
					</div>
					<div className="col-md-auto">
						<Translate id="Postal Code"/> *
						<Field name="postalCode" placeholder={props.translate("Postal Code Placeholder")} className={`form-control form-control-num ${errors.postalCode && touched.postalCode && 'is-invalid'}`} />
							{errors.postalCode && touched.postalCode && <div className="invalid-feedback">{props.translate(errors.postalCode)}</div>}
					</div>
				</div>
				{props.Session.LoggedIn === true && allowEditAddressType &&
					<div>
						<Translate id="Address Type"/> *
						<Field component="select" name="addressTypeId" className={`form-control ${errors.addressTypeId && touched.addressTypeId && 'is-invalid'}`}>
							<option value="0" key="0">{props.translate("Select Type")}</option>
							{AddressTypes.filter((type) => includeHomeAddressType === true || type.addressType !== "Home").map((type) => (
								<option value={type.addressTypeId} key={type.addressTypeId}> {props.translate(type.addressType)} </option>
							))}
						</Field>
						{errors.addressTypeId && touched.addressTypeId && <div className="invalid-feedback">{props.translate(errors.addressTypeId)}</div>}
					</div>
				}
				{
					showDeliveryInstructions &&
					<div>
						<Translate id="Delivery Instructions"/>
						<Field name="deliveryInstructions" className={`form-control ${errors.deliveryInstructions && touched.deliveryInstructions && 'is-invalid'}`}/>
					</div>
				}

				{
					showDeliveryRoutes &&
					<div>
						<Translate id="Delivery Route"/>
						<Field component="select" showError={true} name="routeId" className={`form-control ${errors.routeId && touched.routeId && 'is-invalid'}`}>
							<option value="0" key="0">{props.translate("Select Delivery Route")}</option>
							{props.DeliveryRoutes.Routes.map((route) => (
								<option value={route.routeId} key={route.routeId}> {route.routeName} {route.pickupDays} </option>
							))}
						</Field>

					</div>
				}

				<div className="mt-1">
					{orderDetails === false &&
						<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
							<Translate id={isSubmitting ? "SAVING..." : "SAVE"} />
						</button>
					}
					{/* orderDetails === true indicates that this address form is being called for the delivery form which is used from within the Order Details */}
					{orderDetails === true &&
						<div className="row">
							<div className="col-auto">
								<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
									<Translate id={isSubmitting ? "SAVING..." : "SAVE"} />
								</button>
							</div>
							<div className="col-auto alert alert-warning"><Translate id="Order Details Courier Warning" /></div>
						</div>
					}
					{/* If cancelForm was supplied, show the cancel button */}
					{ props.cancelForm && <button className="btn btn-default ml-2" disabled={isSubmitting} onClick={props.cancelForm}><Translate id="Cancel"/></button> }
					{
						// If the remove button has been requested, show it.
						showRemove &&
							<React.Fragment>
								<button className="btn btn-danger float-right" onClick={props.modal.toggleModal}><Translate id="Remove" /></button>
								{/* Modal requires state, use withModal (in compose below) if needed. */}
								<Modal isOpen={props.modal.modalOpen} toggle={props.modal.toggleModal}>
									<ModalHeader><Translate id="Remove Address"/></ModalHeader>
									<ModalBody>
										<Translate id="Remove Address Confirmation" />{/*Are you sure you want to remove the Address:.*/}
									</ModalBody>
									<ModalFooter>
										<button onClick={() => props.removeAddress(initialValues).then(props.cancelForm)} className="btn btn-danger"><Translate id="Remove Address"/></button>
										<button onClick={props.modal.toggleModal} className="btn btn-default ml-3"><Translate id="Cancel"/></button>
									</ModalFooter>
								</Modal>
							</React.Fragment>
					}
				</div>
			</Form>
		</React.Fragment>
	);
};

export const AddressFormContent = compose(
	withModalState,
	queryWithLoading({ gqlString: getAddressTypes, name: "addressTypes"}),
	withTranslate
)(AddressForm);
