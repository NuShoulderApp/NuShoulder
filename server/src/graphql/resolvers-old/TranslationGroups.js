import { filterTranslations } from './TranslationFilter';
import { getLanguageByID } from './Language';


async function getDefaultLanguage(context) {
	// TODO: use account_ID to get default language
	// TODO: use user's individual settings to get default language
	let lang_result = await context.knex('accountsSettings')
		.join('languages', 'accountsSettings.value', 'languages.languageId')
		.select('languages.*')
		.where('name', 'defaultLanguage');
	if (! lang_result.length > 0) {
		throw new Error('default language not found');
	}
	return lang_result[0];
}

// QUERIES
const TranslationGroupRootResolvers = {
	// return a TranslationGroup
	async TranslationGroup(root, {languageId}, context) {
		// TODO: decide whether there's a hardcoded 'default' group, or if groupName = '' would be default group, etc.
		// TODO: decide how to get multiple groups at once

		// could also allow user to filter using groupname and language
		let language;

		// If no language is specified, try to get it out of the context.
		if(languageId === undefined) {
			// Look into the settings to find the default.
			const defaultLanguage = context.Account.Settings.find(({name}) => name ===  "defaultLanguage");

			// If we found a default language setting, get the value otherwise set it to 0
			languageId = defaultLanguage !== undefined ? defaultLanguage.value : 0;
		}

		// If we have a valid languageId, get that language, otherwise get the default.
		if (languageId > 0) {
			language = await getLanguageByID(languageId, context);
		} else {
			language = await getDefaultLanguage(context);
		}
		//console.log("TranslationGroup: ", {language});
		let translation_list = filterTranslations({languageId: language.languageId}, context);

		return {
			translations: translation_list,
			language
		}
	}
}

// EXPORT
export { TranslationGroupRootResolvers }
