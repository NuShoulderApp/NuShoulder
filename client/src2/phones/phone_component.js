import React from 'react';
import { Form, Field } from 'formik';	// for wrapping forms
import { withModalState } from "../utilities/withModal";
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { compose } from "react-apollo";

import { queryWithLoading } from '../utilities/IWDDb';
import { Translate, withTranslate } from '../translations/IWDTranslation';

import { PhoneTypes } from "./phones_graphql";

const PhoneFormComponent = (props) => {
	const {
		dirty,
		errors,
		initialValues,
		isSubmitting,
		phoneNumberDisabled,
		phoneTypes: {
			PhoneTypes
		},
		previousResponse,
		showRemove,
		touched
	} = props;

	return (
		<React.Fragment>
			{/*  Display a resulting status message.  */}
			{ previousResponse &&	<div className="alert alert-success">{props.translate(previousResponse.message)}</div> }

			<Form>
				<h5><Translate id={props.heading} /></h5>
				<div>
					<Translate id="Phone Number"/> *
					<Field
						component={Phone}
						disabled={phoneNumberDisabled}
						name="phone"
						placeholder={props.translate("Phone Number Placeholder")}
						className={`form-control ${errors.phone && touched.phone && 'is-invalid'}`}
						type="text"
					/>
					{errors.phone && touched.phone && <div className="invalid-feedback">{props.translate(errors.phone)}</div>}
				</div>
				<div>
					<Translate id="Phone Type"/> *
					<Field component="select" name="phoneTypeId" className={`form-control ${errors.phoneTypeId && touched.phoneTypeId && 'is-invalid'}`}>
						{/* This render to Static Markup is required because options don't like React children as the label */}
						<option value="">{props.translate("Select Type")}</option>
						{PhoneTypes.map((type) => {
							return <option value={type.phoneTypeId} key={type.phoneTypeId}>{props.translate(type.phoneType)}</option>
						})}
					</Field>
					{errors.phoneTypeId && touched.phoneTypeId && <div className="invalid-feedback">{props.translate(errors.phoneTypeId)}</div>}
				</div>
				<div>
					<Translate id="Phone Label"/>{/*Label (Optional)*/}
					<Field name="phoneLabel" placeholder={props.translate("Phone Label Placeholder")} className={`form-control ${errors.phoneLabel && touched.phoneLabel && 'is-invalid'}`} />
						{errors.phoneLabel && touched.phoneLabel && <div className="invalid-feedback">{props.translate(errors.phoneLabel)}</div>}
				</div>
				<div className="mt-1">
					<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false }>
						{isSubmitting ? <Translate id="SAVING..."/> : <Translate id="SAVE"/>}
					</button>
					{/* If cancelForm was supplied, show the cancel button */}
					{ props.cancelForm && <button className="btn btn-default ml-2" disabled={isSubmitting} onClick={props.cancelForm}><Translate id="Cancel"/></button> }
					{
						// If the remove button has been requested, show it.
						showRemove &&
							<React.Fragment>
								<button className="btn btn-danger float-right" onClick={props.modal.toggleModal}><Translate id="Remove"/></button>
								{/* Modal requires state, use withModal (in compose below) if needed. */}
								<Modal isOpen={props.modal.modalOpen} toggle={props.modal.toggleModal}>
									<ModalHeader><Translate id="Remove Phone Number"/></ModalHeader>
									<ModalBody>
										{/*Are you sure you want to remove the Phone {formatPhone(initialValues.phone)} ({initialValues.phoneLabel}) for {props.entityName}.*/}
										<Translate
											id="Phone Remove Modal Confirmation"
											data={{
												phone: `${formatPhone(initialValues.phone)} (${initialValues.phoneLabel})`,
												entityName: props.entityName
											}} />
									</ModalBody>
									<ModalFooter>
										<button onClick={() => props.removePhone(initialValues).then(props.cancelForm)} className="btn btn-danger"><Translate id="Remove Phone"/></button>
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

// Custom Phone Component for formatting the string in the UI but not in the actual values.
export const Phone = (props) => {
	const {
		field,
		form,
		...originalProps
	} = props;

	// Internal onChange handler to clean out the dashes from the inputted value.
	function onChange (event) {
		// Filter out anything that is not a number and update the target value..
		event.target.value = event.target.value.replace(/[^\d]/g, "");

		// Now send the real value to the field.
		field.onChange(event);
	}

	// Return a standard text input, pass down the original props.
	return (
		<input {...originalProps}
			name={field.name}
			onChange={onChange}
			onBlur={props.field.onBlur}
			// Add the phone dashes to the display value.
			value={formatPhone(field.value)}
		/>
	);
}

// Format function for phone numbers.
export function formatPhone(value) {
	// If the value is null/undefined just return
	if (!value) {
	  return value;
	}

	// Strip out anyting but digits.
	value = value.replace(/[^\d]/g, "");

	if(value.length > 6) {
		// The length is greater than six, so add the first and second dashes in.  Limit the length to 10
		return value.slice(0, 3) + "-" + value.slice(3, 6) + "-" + value.slice(6, 10);
	} else if( value.length > 3) {
		// The length is less than six but greater than 3, add the first dash in.
		return value.slice(0, 3) + "-" + value.slice(3, 6);
	} else {
		// The length is less than three, return the value.
		return value;
	}
 }

 export const PhoneFormContent = compose(
	withModalState,
	queryWithLoading({ gqlString: PhoneTypes, name: "phoneTypes" }),
	withTranslate
)(PhoneFormComponent);
