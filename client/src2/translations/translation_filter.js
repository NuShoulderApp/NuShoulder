import React from 'react';
import _ from 'lodash';
import { Form, Field, Formik } from 'formik';	// for wrapping forms

import { Translate, withTranslate } from './IWDTranslation';

import { ConnectedLanguageSelector } from '../languages/language_select';

export function createFilter(filterValues) {
	let acceptedFilters = ['phraseKey', 'phrase', 'languageId'];
	let defaults = {
		phraseKey: '',
		phrase: '',
		languageId: ''
	}
	// get filters listed in acceptedFilters out of filterValues, using defaults to specify default value for 'filter' if filterValues[filter] does not exist
	return _.defaults(_.pick(filterValues, acceptedFilters), defaults);
}

//specify layout for TranslationForm
const TranslationFilterContent = (props) => {
	let {
		filterValues,
		heading,
		onSubmit
	} = props;
	if (heading === undefined) {
		heading = 'Search';
	}
	// create object to hold filter values
	let filter = createFilter(filterValues);
	return (
		<Formik
			onSubmit={async (values, Form) => {
				await onSubmit(values);
			}}
			initialValues={filter}
			>
			{() => (
				<Form>
					<div className="row">
						<div className="col">
							<h5>{heading}</h5>
						</div>
					</div>
					<div className="row">
						<div className="col">
							<label> <Translate id="Phrase Key"/>
								<Field name="phraseKey" placeholder={props.translate("Phrase Key Placeholder")} className='form-control' />
							</label>
						</div>
						<div className="col">
							<label> <Translate id="Phrase"/>
								<Field name="phrase" placeholder={props.translate("Phrase Placeholder")} className='form-control' />
							</label>
						</div>
						<div>
							<label> <Translate id="Language"/>
								<Field component={ConnectedLanguageSelector} name="languageId" />
							</label>
						</div>
						<div className="col-4">
							<button type="submit" className="btn btn-success ml-4 mt-4"><Translate id="Filter"/></button>
						</div>
					</div>
				</Form>
			)}
		</Formik>
	);
};

export const TranslationFilter = withTranslate(TranslationFilterContent);