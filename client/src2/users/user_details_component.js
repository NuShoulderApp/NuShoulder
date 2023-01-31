import React from 'react';
import { compose } from "react-apollo";
import { withFormik, Form, Field } from "../utilities/IWDFormik";	// for wrapping forms

import * as Yup from "yup";

import { withMutation } from '../utilities/IWDDb';
import { Translate, withTranslate } from '../translations/IWDTranslation';

import { UserUpdateMutation } from './users_graphql';

// FORMS GOES HERE
const UserFormContent = (props) => {
	const {
	  errors,
	  isSubmitting,
	  touched,
	  dirty,
	  Response
	} = props;

	return (
		<React.Fragment>
			{/*  Display a resulting status message.  */}
			{ Response &&	<div className="alert alert-success">{props.translate(Response.message)}</div> }

			<Form>
				<h5><Translate id="User Information" /></h5>
				<div>
					<Translate id="Salutation"/>
					<Field name="salutation" placeholder={props.translate("Salutation Placeholder")} className={`form-control ${errors.salutation && touched.salutation && 'is-invalid'}`} />
						{errors.salutation && touched.salutation && <div className="invalid-feedback">{props.translate(errors.salutation)}</div>}
				</div>
				<div>
					<Translate id="First Name" />
					<Field name="firstName" placeholder={props.translate("First Name Placeholder")} className={`form-control ${errors.firstName && touched.firstName && 'is-invalid'}`} />
						{errors.firstName && touched.firstName && <div className="invalid-feedback">{props.translate(errors.firstName)}</div>}
				</div>
				<div>
					<Translate id="Middle Name" />
					<Field name="middleName" placeholder={props.translate("Middle Name Placeholder")} className={`form-control ${errors.middleName && touched.middleName && 'is-invalid'}`} />
						{errors.middleName && touched.middleName && <div className="invalid-feedback">{props.translate(errors.middleName)}</div>}
				</div>
				<div>
					<Translate id="Last Name" />
					<Field name="lastName" placeholder={props.translate("Last Name Placeholder")} className={`form-control ${errors.lastName && touched.lastName && 'is-invalid'}`} />
						{errors.lastName && touched.lastName && <div className="invalid-feedback">{props.translate(errors.lastName)}</div>}
				</div>
				<div className="mt-1">
					<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"} />
					</button>
					<button className="btn btn-default ml-2" disabled={isSubmitting} onClick={props.cancelForm}><Translate id="Cancel"/></button>
				</div>
			</Form>
		</React.Fragment>
	);
};

export const UserForm = compose (
	withMutation(UserUpdateMutation, "UserUpdate"),
	withFormik({
		handleSubmit: async ( input, { props: { UserUpdate, setResponse }} ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			const { data: { userUpdate }} = await UserUpdate({ input });

			setResponse(userUpdate.Response);
	   },
	   // Require Phone and Type
		validationSchema: () => Yup.object().shape({
			firstName: Yup.string().required("First name is required"),
			lastName: Yup.string().required("Last name is required")
	   })
	}),
	withTranslate
)(UserFormContent);
