import React from 'react';
import { compose } from 'react-apollo';
import { renderToStaticMarkup } from 'react-dom/server';

import { GetTranslationSetupQuery } from './translations_graphql';
import { LocalizeProvider, Translate, withLocalize } from 'react-localize-redux';
import { queryWithLoading } from '../utilities/IWDDb';


//**************************************************
// Some functions to turn on/off sitewide translation debugging
function setDebug(on) {
	if (on === undefined) {
		on = !debuggingEnabled();
	}
	window.sessionStorage.setItem('debugTranslations', on);
}

function debuggingEnabled() {
	return (window.sessionStorage.getItem('debugTranslations') === "true");
}

window.toggleTranslationDebugging = setDebug;
//**************************************************


// note, languages needs to be in the same order as the languages provided to initialize. Otherwise, this will put phrases in the wrong languages
function createTranslationStructureFromList(languages, translations, options) {
	// create map to easily get order of languages later
	let languageOrder = {};
	languages.forEach((lang, ind) => { languageOrder[lang.languageId] = ind; });

	// react-localize-redux requires that there be a translated phrase for each language, and that the order must match
	// To comply, create an empty array with empty phrases for all languages, and then fill the phrases as we go.
	let emptyList = languages.map(() => undefined);
	let translation_config = translations.reduce((agg, trans) => {
		let { phraseKey, phrase, language } = trans;
		let phraseList;
		// initialize phraseList if necessary
		if (agg.hasOwnProperty(phraseKey)) {
			phraseList = agg[phraseKey];
		} else {
			phraseList = [...emptyList];
		}
		// add phrase to list
		let languageIdx = languageOrder[language.languageId];
		phraseList[languageIdx] = phrase;
		// update phraselist in agg
		agg[phraseKey] = phraseList;
		return agg;
	}, {});

	let language_config = languages.map((l) => ({name: l.languageLabel, code: l.languageCode}));

	if (options === undefined) {
		options = {
			renderToStaticMarkup, // required by react-localize-redux when using Translate in browser.
			ignoreTranslateChildren: true, // tells react-localize-redux to ignore children in Translate tags (<Translate>{children}</Translate>)
			defaultLanguage: 'en' // this is not required, since the defaultLanguage should default to the first language provided in the list.
		}
	}

	// required
	if (!options.hasOwnProperty('renderToStaticMarkup')) {
		options.renderToStaticMarkup = renderToStaticMarkup;
	}

	return {
		translation: translation_config,
		languages: language_config,
		options
	};
}

/* might be useful in the near future.
// using this function as the onMissingTranslation option will change the behavior of the Translate tags to render children when translation not found
function handleMissingTranslation({defaultTranslation, translationId, languageCode}) {
	console.log("handleMissingTranslation: ", {defaultTranslation, translationId, languageCode});
	if (defaultTranslation) return defaultTranslation;
	// this is the default message, provided by library
	return `Missing translationId: ${ translationId } for language: ${ languageCode }`;
}
*/

class LocalizeInitializer extends React.Component {
	constructor(props) {
		super(props);

		props.initialize(props.config);
	}
	render() {
		return (
			<React.Fragment>
				{this.props.children}
			</React.Fragment>
		);
	}
};

const IWDLocalizeInitializer = withLocalize(LocalizeInitializer);


// this component is meant to create config struct for initializing LocalizeProvider. It's set up to create config when constructed, so don't render it without initial values
class LocalizeProviderContent extends React.Component {
	// sets up this.state.config. Only ever takes initial prop values, so don't render without correct values
	constructor(props) {
		super(props);

		let translation_list = [];
		let data = props.data || {};
		if (data.TranslationGroup) {
			translation_list = data.TranslationGroup.translations;
		}
		let languages = data.LanguageList;

		let config = createTranslationStructureFromList(languages, translation_list);
		this.state = { config };
	}

	render () {
		return (
			<LocalizeProvider>
				<IWDLocalizeInitializer config={this.state.config}>
					{this.props.children}
				</IWDLocalizeInitializer>
			</LocalizeProvider>
		);
	}
}

// Provider for translate data -- wrap top-level app in this to enable localization
const IWDLocalizeProvider = compose(
	queryWithLoading({gqlString: GetTranslationSetupQuery})
)(LocalizeProviderContent);


// A wrapper to enable debugging, not necessary in prod
const DevTranslate = (props) => {
	if (typeof props.children === 'function') {
		let f = props.children;
		props = {...props, children: (...args) => {
			let result = f.apply(null, args);
			if (debuggingEnabled()) {
				return `TR: ${result}`;
			}
			return result;
		}}
	} else if ((!props || !props.options || !props.options.onMissingTranslation)) {
		props = {
			...props,
			options: {
				...(props.options||{}),
				onMissingTranslation: ({translationId}) => (debuggingEnabled() ? `!!NT!! {${translationId}}` : translationId)
			}
		}
	}
	return (
		<React.Fragment>
		{debuggingEnabled() && typeof props.children !== 'function' && "TR: "}
			<Translate {...props}>{props.children}</Translate>
		</React.Fragment>
	)
}

function withTranslateMissingTranslation({translationId}) {
	// built-in version would return:
	// return `Missing translationId: ${ translationId } for language: ${ languageCode }`;
	//console.log("withTranslateMissingTranslation")
	let result = translationId;
	if (debuggingEnabled()) {
		return `!!NT!! {${result}}`;
	}
	return result;
}

function wrapTranslate(translate_func) {
	return function(id, data, options) {
		let override_options = options || {};
		// all we want to do is inject a custom missing translation handler
		// TODO: consider merging current function with override
		override_options.onMissingTranslation = withTranslateMissingTranslation;

		let result = translate_func.call(null, id, data, override_options);
		if (debuggingEnabled()) {
			return `TR: ${result}`;
		}
		return result;
	}
}

// Injects "translate" function into component's props. Look at react-localize-redux documentation for more info
// Wraps translate function to inject an override
function withTranslate(Component) {
	return (props) => {
		let {children, ...component_props} = props;
		return (
			<Translate>
				{({translate}) => {
					/* TODO: This needs to have a default option, to replace TranslateDefault */
					// Also, props aren't working for react-localize-redux, so need to wrap translate function and give options there
					translate = wrapTranslate(translate);
					let merged_props = {...component_props, translate};
					return <Component {...merged_props}>{children}</Component>
				}}
			</Translate>
		);
	}
}

// Overrides ignoreTranslateChildren option for a Translate tag. could also be achieved using <Translate options={{ignoreTranslateChildren=false}}></Translate>
const TranslateDefault = (props) => {
	let {id, data={}, options={}, children=null, ...translate_props} = props || {};
	options.ignoreTranslateChildren = false;
	return (
		<Translate {...translate_props}>
		{({activeLanguage, languages, translate}) => {
			let result = translate(id, data, options);
			if (result.includes('Missing translationId') && result.includes('for language')) {
				result = children;
			}
			if (debuggingEnabled()) {
				return `!!NT!! {${result}}`;
			}
			return result;
		}}
		</Translate>
	)
}

export { DevTranslate as Translate, TranslateDefault, IWDLocalizeProvider, withLocalize, withTranslate };