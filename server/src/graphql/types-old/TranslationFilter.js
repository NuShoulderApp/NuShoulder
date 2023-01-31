// import { ResponseFields } from "./Response" // Consistent set of fields for the status of a Query or Mutation to be sent back with every response from the graphql server

/*
const FilteredTranslationsFields = `
	active: Int
	accountId: ID
	dateCreated: Date
	phrase: String
	phraseKey: String
`
*/

// TODO: search by phrase?
const TranslationFilterFields = `
	languageId: ID
	phraseKey: String
	phrase: String
`

// main Translation types and inputs to be exported
const FilteredTranslationsTypes = `
	type TranslationList {
		filterValues: TranslationFilter
		list: [Translation]!
	}

	type TranslationFilter {
		${TranslationFilterFields}
	}

	# Same as above, except as input argument.
	input TranslationFilterInput {
		${TranslationFilterFields}
	}

	extend type RootQuery {
		FilteredTranslations(filterValues: TranslationFilterInput): TranslationList
	}

	#extend type RootMutation {
		#addTranslation(translation: TranslationInput): TranslationResponse
		#removeTranslation(translation: TranslationInput): TranslationResponse
		#editTranslation(translationId: ID, translation: TranslationInput): TranslationResponse
	#}
`;

export default FilteredTranslationsTypes
