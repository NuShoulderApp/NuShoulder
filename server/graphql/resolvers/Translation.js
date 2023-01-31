import { getLanguageByID } from './Language';
import { Response } from '../../utilities/helpers';

async function searchTranslations({languageId, phraseKey}, case_sensitive=false, context) {
	let query = context.knex('translations')
		.leftJoin('languages', 'languages.languageId', 'translations.languageId');

	if (case_sensitive) {
		query = query.whereRaw('to_base64(translations.phraseKey) = to_base64(?)', phraseKey)
			.andWhere('translations.languageId', languageId);
	} else {
		query = query.where({
			'translations.languageId': languageId,
			phraseKey
		});
	}
	//.where('translations.translationId', translationId )
	// TODO: account_ID check
	return await query.andWhere('translations.active', 1).first();
}

async function fetchTranslationByID(translationId, context) {
	// guarantee translationId exists
	if (!translationId) throw new Error(`Invalid Translation ID ${translationId}`);
	return await context.knex('translations')
		.join('languages', 'languages.languageId', 'translations.languageId')
		//.where('translations.translationId', translationId )
		.where({
			'translations.translationId': translationId,
		})
		// TODO: account_ID check
		.andWhere('translations.active', 1)
		.first();
}

// save new or existing translation data. gets ID out of data -- new record for id = 0, update for id>0
async function saveTranslation(data, context) {
	const knex = context.knex;

	let result = { translationId: null, msg: '' };
	// TODO: validate data ?
	if (data.hasOwnProperty('accountId') == false) {
		// TODO: don't do this, could get it from context
		data.accountId = 0;
	}
	// handles null, undefined, missing, and empty string ('').
	if (! data.hasOwnProperty('phraseKey') || !data.phraseKey) {
		result.msg = `Invalid phraseKey "${data.phraseKey || ''}"`;
		return result;
		//throw new UserInputError(`Invalid phraseKey "${data.phraseKey || ''}"`);
	}
	// if translation provided, update
	if (data.hasOwnProperty('translationId') && data.translationId > 0) {
		let invalid_phrase = await knex('translations')
			.whereNot({'translations.translationId': data.translationId})
			.where({
				'translations.phraseKey': data.phraseKey || '',
				'translations.languageId': data.languageId
			});
		if (invalid_phrase.length) {
			result.msg = `Invalid args: phrase key "${data.phraseKey || ''}" already in use for selected language`;
			return result;
			//throw new Error(`Invalid args: phrase key "${data.phraseKey || ''}" already in use`);
		}

		// update_result is just # updated records.
		let update_result = await knex('translations')
			.where({'translations.translationId': data.translationId})
			.update(data);
		if (update_result > 0) {
			result.translationId = data.translationId;
			return result;
		} else {
			result.msg = 'Invalid translationId';
			return result;
			//throw new Error('Invalid translationId');
		}
	// translationId not provided, do an insert
	} else {
		let [id] = await knex('translations').insert(data);
		result.translationId = id;
		return result;
	}
}

const TranslationSubResolvers = {
	Translation: {
		async language( { translationId=null, languageId, languageLabel, languageCode }, args, context) {
			if (!translationId) {
				return await getLanguageByID(languageId, context);
			}
			return {
				languageId,
				languageLabel,
				languageCode
			}
		}
	}
}

// QUERIES
const TranslationRootResolvers = {
	// Get User - gets an array and then returns the .first() entry
	// Set this function as async so we can wait on the knex calls.
	async Translation(root, args, context) {
		let translation = null;
		// prefer getting tranlsation by id
		if (args.translationId) {
			translation = await fetchTranslationByID(args.translationId, context);
		}
		// if id is not provided, try using other args to search
		else if (args.languageId !== undefined && args.phraseKey !== undefined) {
			translation = await searchTranslations(args, true, context);
		}
		// if other args not provided, we can't choose a translation.
		// This is here because there's not a good way to require one of (translationId) OR (languageId, phraseKey).
		// Could be split up into separate endpoints -- i.e. Translation(id), TranslationSearch(other args)
		else {
			throw new Error("Get Translation -- invalid args");
		}

		return translation;
	}
}

// MUTATIONS
const TranslationMutations = {
	async addTranslation(root, {translation}, context) {
		// translation is translationInput Type
		// return translationResponse
		let existing_translation = await searchTranslations(translation, true, context);
		if (existing_translation) {
			return Response(false, 'Cannot create duplicate translation', {translation: null});
			//throw new Error('Cannot create duplicate translation');
		}
		let { translationId, msg } = await saveTranslation(translation, context);
		if (msg) {
			return Response(false, msg, {translation: null});
		}
		let save_translation = await fetchTranslationByID(translationId, context);
		return Response(true, 'Successfully added translation', {translation: save_translation});
	},
	/*
	async removeTranslation(root, {translation}, context) {
		// translation is translationInput Type
		// return translationResponse
	},
	*/
	async editTranslation(root, {translationId, translation}, context) {
		// translation is translationInput Type
		// return translationResponse
		// add translationId to data for save
		let data = { ...translation, translationId };
		if (! (translationId > 0)) {
			return Response(false, `Invalid translationId, ${translationId}`, {translation: null});
		}

		let { msg } = await saveTranslation(data, context);
		if (msg) {
			return Response(false, msg, {translation: null});
		}
		let new_translation = await fetchTranslationByID(translationId, context);
		return Response(true, 'Successfully Updated Translation', {translation: new_translation});
	},
}

// EXPORT
export { TranslationSubResolvers, TranslationMutations, TranslationRootResolvers }
