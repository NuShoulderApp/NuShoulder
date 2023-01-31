import React from 'react';
import * as Yup from "yup";
import { compose } from "react-apollo";
import { withFormik, Form, Field, ErrorMessage } from 'formik';	// for wrapping forms
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';	// IMPORTANT: Add any icons you want to use to the index.js import { ... } from '@fortawesome/free-solid-svg-icons' AND library.add(...)

import { LanguageSelector } from '../languages/language_select';

import { Translate, TranslateDefault, withTranslate } from './IWDTranslation';

const ShowError = (name) => (
	<ErrorMessage name={name}>
		{msg => (
			<div className="invalid-feedback" style={{display: 'inline'}}>
				<TranslateDefault id={msg}>{msg}</TranslateDefault>
			</div>
		)}
	</ErrorMessage>
);

const ShowStatus = (props) => {
	if (props.status) {
		let { message='', success='' } = props.status;

		let alertType = '';
		if (success !== '' && success) {
			message = message || "Success";
			alertType = 'success';
		} else if (success !== '') {
			message = message || "Error";
			alertType = 'danger';
		}
		return (
			<div className={`alert alert-${alertType}`}><TranslateDefault id={message}>{message}</TranslateDefault></div>
		)

	}
	return false;
}

//specify layout for TranslationForm
const TranslationFormContent = (props) => {
	let {
		onCancel,
		status,
		errors,
		touched,
		isSubmitting,
		heading,
		LanguageList, // use connected language selector and this will be unnecessary, and we can also then remove the LanguageList query in the containers
	} = props;

	if (typeof onCancel !== 'function') {
		onCancel = () => undefined;
	}

	if (heading === undefined) {
		heading = <Translate id="Translation" />
	}

	return (
		<Form>
			<h5>{heading}</h5>
			<ShowStatus status={status} />
			<div>
				<label> <Translate id="Phrase Key"/>
					<Field name="phraseKey" placeholder={props.translate('Phrase Key Placeholder')} className={`form-control ${(errors.phraseKey && touched.phraseKey && 'is-invalid') || ''}`} />
					{ShowError("phraseKey")}
				</label>
			</div>
			<div>
				<div>
				<label> <Translate id="Phrase"/>
					<Field component="textarea" name="phrase" placeholder={props.translate("Phrase Placeholder")} className={`form-control ${(errors.phrase && touched.phrase && 'is-invalid') || ''}`} />
					{ShowError("phrase")}
				</label>
				</div>
				<div>
				<label> <Translate id="Language"/>
				<Field component={LanguageSelector} name="languageId" className={(errors.languageId && touched.languageId && 'is-invalid') || ''} options={LanguageList} />
					{ShowError("languageId")}
				</label>
				</div>
			</div>
			<div className="mt-1">
				<div className="row">
					<div className="col-2">
						<button className="btn btn-default mr-1" disabled={isSubmitting} onClick={onCancel} type="button">
							<FontAwesomeIcon icon="bars" className="mr-1"/><Translate id="Cancel"/>
						</button>
					</div>
					<div className="col">
						<button type="submit" className="btn btn-success pull-right" disabled={isSubmitting || Object.keys(errors).length}>
							<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
						</button>
					</div>
				</div>
			</div>
		</Form>
	);
};

// generic formik config for translation (add + edit) forms
const FormikOptions = {
	mapPropsToValues: (props) => {
		let { phrase='', phraseKey='', language={} } = props.Translation || {};
		let values = { phrase, phraseKey, languageId: language.languageId };
		return values;
	},
	// meant to submit for adds and edits
	handleSubmit: async ( values, Form ) => {
		// try to get translationId. If it doesn't exist, this is an add and we don't need it
		let Translation = Form.props.Translation || {};
		let translationId = Translation.translationId || undefined;
		let { ...input } = values;
		let variables = { input };

		// if this is edit, add translationId to identify which translation to update
		if (translationId && translationId > 0) {
			variables.id = translationId;
		}

		// submit new data and process result
		Form.props.mutateTranslation({ ...variables }).then(({data, errors}) => {
			if (data && data.TranslationResponse && data.TranslationResponse.Response) {
				Form.setStatus(data.TranslationResponse.Response);
			} else {
				let message = 'Error';
				if (errors) {
					Form.setStatus({errors});
				} else {
					Form.setStatus({message: "Unknown error occurred"});
					//throw new Error("Unknown error");
				}
				// error response
				Form.setStatus({message});
			}
		}).finally(() => {
			// reset form's submitting state
			if (typeof Form.props.onSubmit === 'function') {
				// call provided onSubmit
				Form.props.onSubmit();
			}
			Form.setSubmitting(false);
		});
	},
	// Require permissionId and permissionLevel
	validationSchema: () => Yup.object().shape({
		phraseKey: Yup.string().required("Phrase Key is required"),
		phrase: Yup.string().required("Phrase is required"),
		languageId: Yup.string().required("Language is required")
	})
}

// translation form for editing existing translation
export const TranslationForm = compose(
	// Set up the formik parameters.
	withFormik(FormikOptions),
	// add translation
	withTranslate,
	// render the translation form
)(TranslationFormContent);
