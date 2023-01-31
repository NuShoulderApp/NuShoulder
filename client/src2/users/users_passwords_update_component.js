import React from 'react';
import * as Yup from "yup";	// for form validation
import { compose } from "react-apollo";

import { withFormik, Form, Field } from "../utilities/IWDFormik";	// for wrapping forms

import { UserPasswordUpdateMutation } from './users_graphql';
import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withMutation } from '../utilities/IWDDb';

const UserPasswordContent = (props) => {
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
				<h5><Translate id="Update Password"/></h5>
				<div>
					<Translate id="New Password"/><br/>
					<Field autoComplete="new-password" showError={true} type="password" name="passwordNew" placeholder={props.translate("New Password Placeholder")} className={`form-control ${errors.passwordNew && touched.passwordNew && 'is-invalid'}`} />
				</div>
				<div>
					<Translate id="Confirm Password"/><br/>
					<Field autoComplete="new-password" showError={true} type="password" name="passwordNewConfirm" placeholder={props.translate("Confirm Password Placeholder")} className={`form-control ${errors.passwordNewConfirm && touched.passwordNewConfirm && 'is-invalid'}`} />
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

export const UserPasswordForm = compose(
	withMutation(UserPasswordUpdateMutation, "PasswordUpdate"),
	withFormik({
		handleSubmit: async ( input, FormikForm) => {
			// Send the mutation to the GraphQL server
			const { data: { userPasswordUpdate: { Response, UserLogin } } } = await FormikForm.props.PasswordUpdate({ input });

			// We need to reset the form here as the initialValues wont really change since we force them to empty strings.
			FormikForm.resetForm();

			// Reset the form to clear the save button and disable it.
			FormikForm.props.setResponse(Response);

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.editButtonClickHandler("password", UserLogin.userLoginId);
		},
		// Make sure the passwords match and are filled in.
		validationSchema: () => Yup.object().shape({
			passwordNew: Yup.string().required("New Password is required."),
			passwordNewConfirm: Yup.string().oneOf([Yup.ref('passwordNew')], "Passwords don't match").required('Confirm Password is required'),
		})
	}),
	withTranslate
)(UserPasswordContent);
