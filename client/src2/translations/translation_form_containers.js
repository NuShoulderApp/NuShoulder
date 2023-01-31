import { compose, graphql } from "react-apollo";

import { AddTranslationMutation, EditTranslationMutation, GetLanguages, GetTranslationQuery } from './translations_graphql';
import { withLoading, withMutation } from '../utilities/IWDDb';


/*
	Translation form Containers!

	These are the containers for getting and editing, or for adding translations
	They are exported as HOC which will wrap a comoponent and inject data + mutation into it

	They will all currently inject LanguageList, and mutateTranslation into props.
*/

// generic query loading config for translation (add + edit) forms
const TranslationQueryConfig = {
	options: (props) => {
		return {
			displayName: 'TranslationQuery',
			variables: { translationId: props.match.params.translationId }
		};
	},
	props: ({data: query_data, ownProps:props}) => {
		let {loading, error, ...data} = query_data;
		// move the data directly into props; move loading/error into TranslationQueryStatus to comply with withLoading
		props = { ...props, ...data, TranslationQueryStatus: {loading, error} };
		return props;
	}
};


// HOC Wrapper that will get a translation using config above and inject translation data + Edit Translation Mutation

export const withTranslationEdit = compose(
	// get language list for select + translation data being edited
	graphql(GetTranslationQuery, TranslationQueryConfig),
	// stop component from rendering if still loading data
	withLoading('TranslationQueryStatus', true),
	// Setup the mutation for editing the permission.
	withMutation(EditTranslationMutation, 'mutateTranslation', ['TranslationSetup']),
);

// HOC Wrapper that will get language list using config above and inject language data + Add Translation Mutation
// This is similar to withTranslationEdit, but it does not inject props.Translation

export const withTranslationAdd = compose(
	// get language list for select -- no translation data because this is a new translation
	graphql(GetLanguages, TranslationQueryConfig),
	// stop component from rendering if still loading data
	withLoading('TranslationQueryStatus', true),
	// set up mutation for adding translation
	withMutation(AddTranslationMutation, 'mutateTranslation', ['TranslationList', 'TranslationSetup']),
);
