import _ from 'lodash';

export function filterTranslations({languageId='', phraseKey='', phrase=''}, context) {
	let query = context.knex('translations')
		.join('languages', 'languages.languageId', 'translations.languageId');
	if (languageId) {
		query = query.where('translations.languageId', languageId);
	}
	if (phraseKey) {
		query = query.whereRaw('phraseKey LIKE ?', `%${phraseKey}%`)
	}
	if (phrase) {
		query = query.whereRaw('phrase LIKE ?', `%${phrase}%`)
	}
	return query
		// TODO: account_ID check
		.andWhere('translations.active', 1)
		.orderBy('phraseKey')
		.orderBy('languages.languageId')
}

function createFilter(filterValues) {
	let acceptedFilters = ['phraseKey', 'phrase', 'languageId'];
	let defaults = {
		phraseKey: '',
		phrase: '',
		languageId: ''
	}
	// get filters listed in acceptedFilters out of filterValues, using defaults to specify default value for 'filter' if filterValues[filter] does not exist
	return _.defaults(_.pick(filterValues, acceptedFilters), defaults);
}

// QUERIES
const FilteredTranslationsRootResolvers = {
	//FilteredTranslations resolver
	async FilteredTranslations(root, args, context) {
		//console.log('FilteredTranslations', {root, args});

		let filter = createFilter(args.filterValues || {});
		// get translation_list from db
		let translation_list = await filterTranslations(filter, context);

		return {
			filterValues: filter,
			list: translation_list
		};
	}
}

// EXPORT
export { FilteredTranslationsRootResolvers }
