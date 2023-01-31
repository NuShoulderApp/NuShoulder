import React from 'react';
import _ from "lodash";
import { Form, Field, withFormik } from "../utilities/IWDFormik";	// for wrapping forms

import {  compose } from "react-apollo";

import { withState } from "react-state-hoc";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from "react-router-dom";

import { Translate, withTranslate } from '../translations/IWDTranslation';
import { queryWithLoading, withMutation, castNumerics } from "../utilities/IWDDb";

// GRAPHQL QUERY
import {
	CompanyDepartmentSaveMutation
} from './companies_graphql';
import {
	getCompanyQuery
} from './companies_graphql';

const CompanyDepartmentFormContent = (props)  => {
	const {
		dirty,
		errors,
		initialValues,
		isSubmitting,
		previousResponse,
		touched,
		values: {
			active,
			departmentName
		},
		values
	} = props;

	return (
		<React.Fragment>
			<h5><Translate id="Department Information"/></h5>

			{/*  Display a resulting status message.  */}
			{ previousResponse &&	<div className="alert alert-success">{props.translate(previousResponse.message)}</div> }

			<Form>
				<div className="row">
					<div className="col-md">
						<Translate id="Department Name"/> *
						<Field name="departmentName" placeholder={props.translate("Department Name Placeholder")} className={`form-control ${errors.departmentName && touched.departmentName && 'is-invalid'}`} />
							{errors.departmentName  && <div className="invalid-feedback">{props.translate(errors.departmentName)}</div>}
					</div>
					
				</div>
				<div className="row">
					<div className="col-md">
						<Translate id="Active"/>
						<Field component="select" name="active" showError={true} className={`form-control ${errors.active && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
				</div>

				<div className="mt-1">
					<button type="button" onClick={props.handleSubmit} className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
					</button>
					<button className="btn btn-default ml-2" disabled={isSubmitting} onClick={props.cancelForm}> <Translate id="Cancel"/> </button>
				</div>
			</Form>
		</React.Fragment>
	);
};

export const CompanyDepartmentForm = compose(
	withTranslate,
	withMutation(CompanyDepartmentSaveMutation, "CompanyDepartmentSaveMutate", ["getCompany"]),
	withFormik({
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( CompanyDepartmentInputValues, FormikForm) => {
			let castCompanyDepartmentInputValues = castNumerics(CompanyDepartmentInputValues,"active");

			const { data: { companyDepartmentSave: { Response, CompanyDepartment } } } = await FormikForm.props.CompanyDepartmentSaveMutate({ input: castCompanyDepartmentInputValues });

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.editButtonClickHandler("companyDepartment", CompanyDepartment.companyDepartmentId, Response);

			// Reset the form to get the new initial values.
			FormikForm.resetForm();
		},
		validate: (values) => {
			let errors = {};
			// If value is blank, create error struct key with message, else delete the struct key
			if(values.departmentName === '') { errors.departmentName = 'Company Department name is required'; } else { delete errors.departmentName; };

			return errors
		}
	})
)(CompanyDepartmentFormContent);
