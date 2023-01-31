// This file is a wrapper for formik.  It should export everything from formik and enhance anything needed.
import React from 'react';
import _ from "lodash";
import { compose } from "react-apollo";
import { ErrorMessage, Field, Form, withFormik, Formik, FieldArray, FastField } from 'formik';	// for wrapping forms
import { withState } from "react-state-hoc";

import { TranslateDefault } from '../translations/IWDTranslation';

// Helper function to show an error, from the Yup schema, properly translated.
const ShowError = (name) => (
	<ErrorMessage  name={name}>
		{(messsage) => (
			<div style={{display: 'inline'}} className="invalid-feedback">
				<TranslateDefault id={messsage}>
					{messsage}
				</TranslateDefault>
			</div>
		)}
	</ErrorMessage>
);

// Enhance the Field component to allow displaying a default error message with a prop flag.
const IWDField = (props) => {
	const { showError, ...propsToPass } = props;

	// If the showError prop is true, we will include ShowError.
	if (showError === true) {
		return (
			<React.Fragment>
				<Field
					className={`form-control`}
					{...propsToPass}
				/>

				{ShowError(propsToPass.name)}
			</React.Fragment>
		);
	} else {
		return (
			<Field
				className={`form-control`}
		 		{...propsToPass}
			 />
		);
	}
};

// Wrapped HOC to add any some default props in. If a prop that has a default is supplied by the caller, the callers version will be used.
const IWDwithFormik = (props) => compose (
	// We add a state system to allow response messages.
	withState({ Response: null }, { setResponse: (Response) => ({ Response })}),
	withFormik({
		// When the props given to the compnent change, the form will reinitialize
		enableReinitialize: true,
		// Map the supplied initialValues structure to make sure no values are undfined.
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		...props
	})
);

export {
	// Formik passthroughs.
	ErrorMessage,
	FastField,
	FieldArray,
	Form,
	Formik,

	// IWD Enhanced Versions.
	IWDwithFormik as withFormik,
	IWDField as Field,

	// IWD only exports
	ShowError
}
