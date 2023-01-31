import gql from 'graphql-tag';

export const GetTranslationQuery = gql`
query ($translationId: ID) {
	Translation(translationId: $translationId) {
		phrase
		phraseKey
		translationId
		language {
			languageId
			languageLabel
			languageCode
		}
	}
	LanguageList {
		languageId
		languageLabel
		languageCode
	}
}`

export const GetLanguages = gql`
query {
	LanguageList {
		languageId
		languageCode
		languageLabel
	}
}
`

export const AddTranslationMutation = gql`
mutation ($input: TranslationInput!) {
	TranslationResponse: addTranslation(translation: $input) {
		Response {
			success
			message
		}
		translation {
			translationId,
			language {
				languageId
				languageLabel
				languageCode
			}
		}
	}
}
`

export const EditTranslationMutation = gql`
mutation ($input: TranslationInput!, $id:ID) {
	TranslationResponse: editTranslation(translation: $input, translationId:$id) {
		Response {
			message
			success
		}
		translation {
			translationId
			phrase
			phraseKey
			language {
				languageId
				languageLabel
				languageCode
			}
		}
	}
}`

export const GetTranslationListQuery = gql`
query TranslationList($filterValues: TranslationFilterInput){
	FilteredTranslations(filterValues: $filterValues) {
		filterValues {
			languageId
			phraseKey
			phrase
		}
		list {
			translationId
			phraseKey
			phrase
			language {
				languageId
				languageLabel
				languageCode
			}
		}
	}
}`

export const GetTranslationSetupQuery = gql`
query TranslationSetup($overrideLanguageId: ID) {
	# get translations for currently active language
	TranslationGroup (languageId: $overrideLanguageId) {
		translations {
			translationId
			phraseKey
			phrase
			language {
				languageId
				languageLabel
				languageCode
			}
		}
	}
	# get available languages
	LanguageList {
		languageId
		languageLabel
		languageCode
	}
}
`