import React from 'react';
import { Formik, Field, Form } from 'formik';
import { withLocalize, Translate } from 'react-localize-redux';
//import { IWDLocalizeProvider } from './IWDTranslation';
import { ConnectedLanguageSelector } from '../languages/language_select';

/*
	Just a test page to preview/showcase/test Translate tag + configuration
*/

const LanguageChooser = withLocalize((props) => {
	return (
		<React.Fragment>
			<Formik
				initialValues={{ languageCode: props.defaultLanguage || 'en' }}
				onSubmit={(values, Form) => {
					if (typeof values.languageCode === 'string' && values.languageCode.length > 0) {
						props.setActiveLanguage(values.languageCode);
					}
					Form.setSubmitting(false);
				}}>
				{() => {
					let cur_lang = props.activeLanguage && props.activeLanguage.name ? `${props.activeLanguage.name} (${props.activeLanguage.code})` : `${JSON.stringify(props.activeLanguage)}`
					return (
						<Form>
							<p> <Translate id="Current Language"/>: {cur_lang} </p>
							<div className="row mt-3 mb-3">
								<div className="col">
									<Field component={ConnectedLanguageSelector} name={'languageCode'} targetValue={'languageCode'} />
								</div>
								<div className="col">
									<button type="submit" className='btn btn-danger mb-4'><Translate id="Update"/></button>
								</div>
							</div>
						</Form>
					);
				}}
			</Formik>
		</React.Fragment>
	);
});

// Show translation for user specified language + phraseKey
const TestForm = (props) => {
	return  (
		<React.Fragment>
			<h2>Test translations here:</h2>

			{/* just using formik to keep track of values, submit isn't needed. However, typing <Enter> in a text input will throw an error if onSubmit is not defined */}
			<Formik initialValues={{ languageCode: 'en', test_key: 'test_key' }} onSubmit={() => {}}>
				{({values}) => {
					return (
						<React.Fragment>
							{props.children}
							<Form>
								<div className='row mt-5'>
									<div className="col">
										<Field name="test_key" placeholder="(Enter key)" className='form-control' />
									</div>
									<div className="col">
										<label>Result:</label>
										<p>
											<Translate id={values.test_key}>Default Translation</Translate>
										</p>
									</div>
								</div>
							</Form>
						</React.Fragment>
					);
				}}
			</Formik>
		</React.Fragment>
	);
}

const TranslationTestWithoutWrapper = (props) => (
	<React.Fragment>
		<TestForm>
			<LanguageChooser />
		</TestForm>
	</React.Fragment>
)

export const TranslationTestComponent = withLocalize(TranslationTestWithoutWrapper);