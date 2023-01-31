import { GetLanguages } from '../translations/translations_graphql';
import { createIWDSelectField } from '../utilities/IWDSelectField';

// a class that takes a list of languages as props, and lets user choose one.

// expected props:
//		- className: classes to add to output. starts with 'form-control' by default
//		- options: list of languages
//		- FieldProps: should be compliant with formik's field props
export const LanguageSelector = createIWDSelectField('languageId', 'languageLabel', 'Select a Language');

// tries to get LanguageList from apollo, using GetLanguages query.
export const ConnectedLanguageSelector = createIWDSelectField('languageId', 'languageLabel', 'Select a Language', GetLanguages, 'LanguageList');