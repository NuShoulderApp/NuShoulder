import React from 'react';
import { Form, Field, withFormik } from "../utilities/IWDFormik";	// for wrapping forms
import _ from "lodash";
import {  compose } from "react-apollo";

import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withMutation } from "../utilities/IWDDb";
import * as Yup from "yup";

// GRAPHQL QUERY
import { AccountSettingOverrideSaveMutation } from './accounts_graphql';

// GRAPHQL QUERY
const AccountSettingFormContent = (props)  => {
	const {
		errors,
		cancelForm,
		dirty,
		initialValues,
		isSubmitting,
		touched,
		Response
	} = props;

	return (
		<React.Fragment>
			{/* Display the heading if there is one. */}
			{ props.heading && <h5>{props.heading}</h5> }

			{/*  Display a resulting status message.  */}
			{ Response &&	<div className="alert alert-success">{Response.message}</div> }

			<Form>
				<div>
					<Translate id="Setting Name"/>: <strong>{_.startCase(initialValues.name)}</strong>
				</div>
				<div>
					<Translate id="Description"/>: <strong>{initialValues.description}</strong>
				</div>
				<div>
					<Translate id="Default Value"/>: <strong>{initialValues.defaultValue}</strong>
				</div>

				<div>
					<Translate id="Account Setting Value"/> *
					<Field name="value" placeholder={props.translate("Account Setting Value Placeholder")} className={`form-control ${errors.value && touched.value && 'is-invalid'}`} />
						{errors.value && <div className="invalid-feedback">{props.translate(errors.value)}</div>}
				</div>

				<div className="mt-1">
					<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
					</button>
					<button className="btn btn-default ml-1" onClick={cancelForm}>
						<Translate id="Cancel"/>
					</button>
				</div>
			</Form>
		</React.Fragment>
	);
};

export const AccountSettingForm = compose(
	withMutation(AccountSettingOverrideSaveMutation, "AccountSettingSaveMutate", ["getAccount"]),
	withFormik({
		handleSubmit: async ( AccountSettingInputValues, FormikForm) => {
			// Set up the proper input values
			const input = _.pick(AccountSettingInputValues, ["accountId", "accountSettingId", "accountSettingOverrideId", "value" ]);

			// Call the mutation.
			const { data: { accountSettingOverrideSave: { Response, Setting } } } = await FormikForm.props.AccountSettingSaveMutate({ input });

			// Notify the UI of the response.
			FormikForm.props.setResponse(Response);

			// "Click" the edit button on the parent, this ensures we will switch from "new/insert" to "update/save" modes (based on the value of accountSettingOverrideId).
			FormikForm.props.editButtonClickHandler("setting", { ...AccountSettingInputValues, accountSettingOverrideId: Setting.accountSettingOverrideId });
		},
		validationSchema: () => Yup.object().shape({
			value: Yup.string().required("Account Setting Value is required")
		})
	}),
	withTranslate
)(AccountSettingFormContent);
