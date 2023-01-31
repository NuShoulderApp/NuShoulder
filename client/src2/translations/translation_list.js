import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';	// IMPORTANT: Add any icons you want to use to the index.js import { ... } from '@fortawesome/free-solid-svg-icons' AND library.add(...)
import { compose } from "react-apollo";

import { GetTranslationListQuery } from './translations_graphql';
import { TranslationFilter, createFilter } from './translation_filter';
import { queryWithLoading } from '../utilities/IWDDb';

import { Translate } from './IWDTranslation';

// layout for a list item
const TranslationListItem = (props) => {
	let { phraseKey, phrase, language } = props.translation;
	return (
		<React.Fragment>
			<div className='row border m-1 p-2'>
				<div className="col">
					{phraseKey}
				</div>
				<div className="col">
					{phrase}
				</div>
				<div className="col">
					{language.languageLabel} ({language.languageCode})
				</div>
				<div className="col">
					<button onClick={props.onRedirect}><Translate id="Details"/></button>
				</div>
			</div>
		</React.Fragment>
	);
}

// layout for list + get list data
const TranslationListContent = (props) => {
	let { refetch, ...data } = props.data;

	// get translation_list (called 'list' in query), filterValues vars form FilteredTranslations query
	let { list:translation_list=[], filterValues={} } = (data.FilteredTranslations || {});
	let filter = createFilter(filterValues);
	return (
		<React.Fragment>
			<TranslationFilter
				filterValues={filter}
				onSubmit={(newFilterValues) => {
					let variables = { filterValues: newFilterValues };
					// refetch translation list with new filter variables
					return refetch(variables);
				}}
				/>
			{/* Header for translations table */}
			<div className="row m-1">
				<div className="col">
					<h3><Translate id="Phrase Key"/></h3>
				</div>
				<div className="col">
					<h3><Translate id="Phrase"/></h3>
				</div>
				<div className="col">
					<h3><Translate id="Language"/></h3>
				</div>
				<div className="col">
					<Link to="/translations/add">
						<button className="btn btn-info mr-1"><FontAwesomeIcon icon="plus" className="mr-1"/><Translate id="Add"/></button>
					</Link>
				</div>
			</div>
			{/* Render table or empty list alert */}
			{translation_list.length > 0 && translation_list.map((translation) => {
				return (
					<TranslationListItem
						key={translation.translationId}
						translation={translation}
						onRedirect={() => props.history.push(`${props.match.path}/${translation.translationId}`)}
					/>
				)
			})}
			{translation_list.length === 0 &&
				<div className="row m-t alert alert-info">
					<Translate id="No Translations Found"/>{/*No matching translations found.*/}
				</div>
			}
		</React.Fragment>
	);
};

const TranslationList = compose(
	// get TranslationList, FilterValues from apollo
	queryWithLoading({gqlString: GetTranslationListQuery, variablesFunction: (props) => (props.searchParams || {})}),
	// renders list + form to edit list
)(TranslationListContent);

export { TranslationList };
