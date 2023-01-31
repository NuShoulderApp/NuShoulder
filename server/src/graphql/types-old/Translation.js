// import { ResponseFields } from "./Response" // Consistent set of fields for the status of a Query or Mutation to be sent back with every response from the graphql server

// set of fields for both Language and LanguageInput for Query and Mutation to use
const TranslationFields = `
	active: Int
	accountId: ID
	dateCreated: Date
	phrase: String
	phraseKey: String
`

// main Translation types and inputs to be exported
const TranslationTypes = `
	type Translation {
		translationId: ID
		language: Language
		${TranslationFields}
	}

	type TranslationResponse {
		translation: Translation
		Response: Response!
	}

	extend type RootQuery {
		Translation(translationId: ID, languageId: ID, phraseKey: String): Translation
	}

	extend type RootMutation {
		addTranslation(translation: TranslationInput): TranslationResponse
		# intentionally removed
		#removeTranslation(translation: TranslationInput): TranslationResponse
		editTranslation(translationId: ID, translation: TranslationInput): TranslationResponse
	}

	input TranslationInput {
		${TranslationFields}
		languageId: ID
	}
`;

export default TranslationTypes
