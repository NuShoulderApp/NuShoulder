import React from 'react';
//import * as Yup from "yup";	// for form validation
import _ from "lodash";
import { Mutation, compose } from "react-apollo";
import { withFormik, Form, Field } from 'formik';	// for wrapping forms

// GRAPHQL QUERY
import { CompanyUserCreateMutation } from './companies_graphql';

import { Translate, withTranslate } from '../translations/IWDTranslation';

const CompanyUserLayout = (props) => {
	const {
		errors,
		isSubmitting,
		touched
	} = props;

	return (
		<React.Fragment>
			<Form>
				<div>
					<Field name="firstName" placeholder={props.translate("First Name Placeholder")} className={`form-control ${errors.firstName && touched.firstName && 'is-invalid'}`} />
						{errors.firstName && touched.firstName && <div className="invalid-feedback">{props.translate(errors.firstName)}</div>}
				</div>
				<div>
					<Field name="lastName" placeholder={props.translate("Last Name Placeholder")} className={`form-control ${errors.lastName && touched.lastName && 'is-invalid'}`} />
						{errors.lastName && touched.lastName && <div className="invalid-feedback">{props.translate(errors.lastName)}</div>}
				</div>
				<div>
					<Field name="email" placeholder={props.translate("Email Placeholder")} className={`form-control ${errors.email && touched.email && 'is-invalid'}`} />
						{errors.email && touched.email && <div className="invalid-feedback">{props.translate(errors.email)}</div>}
				</div>

				<div>
					<button type="submit" className="btn btn-outline-primary" disabled={isSubmitting}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
					</button>
				</div>

			</Form>
		</React.Fragment>
	);
}

const CompanyUserFormik = compose(
	withFormik({
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( input, FormikCompanyUserForm) => {
			await FormikCompanyUserForm.props.submitMutation({ variables: { input } });	// send the mutation to the server
			FormikCompanyUserForm.setSubmitting(false);
		}
		// ,
		// validationSchema: () => Yup.object().shape({
		// 	email: Yup.string().required("Previous password is required.")
		// })
	}),
	withTranslate
)(CompanyUserLayout);

const CompanyUserForm = (props) => {
	return (
		<Mutation mutation={CompanyUserCreateMutation}>
			{ (submitMutation, CompanyUserResult) => {
				return <CompanyUserFormik
					companyUser={{
						companyId: props.companyId,
						companyUserId: 0,
						email: "",
						firstName: "",
						lastName: ""
					}}
					submitMutation={submitMutation}
				/>
			}}
		</Mutation>
	);
};

export { CompanyUserForm }
