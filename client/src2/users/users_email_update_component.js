import React from 'react';
import * as Yup from "yup";	// for form validation
import { compose } from "react-apollo";
import { withFormik, Form, Field } from "../utilities/IWDFormik";	// for wrapping forms
import { withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import { UserLoginUpdateMutation } from './users_graphql';

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
			{ Response && <div className="alert alert-success">{props.translate(Response.message)}</div> }

			<Form>
				<h5><Translate id="Email Details"/></h5>
				<div>
					<Field autoComplete="current-password" name="email" placeholder={props.translate("Email Placeholder")} className={`form-control ${errors.email && touched.email && 'is-invalid'}`} />
						{errors.email && touched.email && <div className="invalid-feedback">{props.translate(errors.email)}</div>}
				</div>
				<div className="mt-1">
					<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
					</button>
					<button className="btn btn-default ml-2" disabled={isSubmitting} onClick={props.cancelForm}><Translate id="Cancel"/></button>
				</div>
			</Form>
		</React.Fragment>
	);
};

export const UserEmailForm = compose(
	withMutation(UserLoginUpdateMutation, "EmailUpdate"),
	withFormik({
		handleSubmit: async ( input, FormikForm) => {
			const result = await FormikForm.props.EmailUpdate({ input });

			FormikForm.props.setResponse(result.data.userLoginUpdate.Response);
		},
		validationSchema: () => Yup.object().shape({
			email: Yup.string().required("Email is required.")
		})
	}),
	withTranslate
)(UserFormContent);
