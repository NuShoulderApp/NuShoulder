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

// The main goal of this query was to provide an endpoint for UI to grab relevant translations, in a format that would mesh well with the UI needs.
// The format here is currently similar to FilteredTranslations, so they could be merged, but it might be easier having separate endpoints.

// main Translation types and inputs to be exported
const TranslationGroupTypes = `
	type TranslationGroup {
		#active: Int
		#groupName: String
		language: Language

		# can't have a *null* translation; list must be [], not null
		translations: [Translation!]!
	}

	extend type RootQuery {
		TranslationGroup(languageId: ID): TranslationGroup
	}

	#extend type RootMutation {
		#addTranslationGroup(groupName: String!): TranslationGroup
		#addTranslationToGroup(translationId: ID!, groupId: ID!): Translation
	#}
`;

export default TranslationGroupTypes
