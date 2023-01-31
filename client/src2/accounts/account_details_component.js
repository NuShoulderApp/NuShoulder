import React from 'react';
import { compose } from "react-apollo";
import { Link } from "react-router-dom";
import { withFormik, Form, Field } from "../utilities/IWDFormik";

import * as Yup from "yup";

import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withMutation } from '../utilities/IWDDb';

import { AccountSaveMutation } from './accounts_graphql';

// FORMS GOES HERE
export const AccountFormContent = (props) => {
	const {
	  errors,
	  isSubmitting,
	  Response,
	  touched,
	  dirty
	} = props;

	return (
		<React.Fragment>
			{/*  Display a resulting status message.  */}
			{ Response && <div className="alert alert-success">{Response.message}</div> }

			<Form>
				<div>
					<Translate id="Account Name"/>
					<Field showError={true} name="accountName" placeholder={props.translate("Account Name Placeholder")} className={`form-control ${errors.accountName && touched.accountName && 'is-invalid'}`} />
				</div>
				<div>
					<Translate id="Account Prefix"/>
					<Field name="accountPrefix" placeholder={props.translate("Account Prefix Placeholder")} className={`form-control ${errors.accountPrefix && touched.accountPrefix && 'is-invalid'}`} />
				</div>
				<div>
					URL
					<Field showError={true} name="url" placeholder={props.translate("Account URL Placeholder")} className={`form-control ${errors.url && touched.url && 'is-invalid'}`} />
				</div>
				<div>
					<Translate id="Active"/>
					<Field component="select" name="active" className={`form-control ${errors.active && touched.active && 'is-invalid'}`}>
						<option value="1" key="1">{props.translate('Active')}</option>
						<option value="0" key="0">{props.translate('In-Active')}</option>
					</Field>
				</div>

				<div className="mt-1">
					<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
					</button>
					{/* If there is not a cancelFrom supplied, it means that we are adding a new Account here, so simply link cancel back to the account page */}
					{ !props.cancelForm &&
						<Link to="/accounts" className="btn btn-default ml-2">
							<Translate id="Cancel"/>
						</Link>
					}
					{/* If cancelForm was supplied, show the cancel button that resets the editing state */}
					{ props.cancelForm && <button className="btn btn-default ml-2" disabled={isSubmitting} onClick={props.cancelForm}><Translate id="Cancel"/></button> }

				</div>
			</Form>
		</React.Fragment>
	);
};

export const AccountForm = compose (
	withMutation(AccountSaveMutation, "AccountSave"),
	withFormik({
		enableReinitialize: true,
		handleSubmit: async ( input, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result into  accountPhoneSave
			const { data: { accountSave }} = await FormikForm.props.AccountSave({ input });

			FormikForm.props.setResponse(accountSave.Response);

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.editButtonClickHandler("demographics", accountSave.Account.accountId);
		},
		// Require Phone and Type
		validationSchema: () => Yup.object().shape({
			accountName: Yup.string().required("Account name is required"),
			url: Yup.string().required("URL is required")
		})
	}),
	withTranslate
)(AccountFormContent);
