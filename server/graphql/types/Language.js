// import { ResponseFields } from "./Response" // Consistent set of fields for the status of a Query or Mutation to be sent back with every response from the graphql server

// set of fields for both Language and LanguageInput for Query and Mutation to use
const LanguageFields = `
	active: Int
	accountId: Int
	dateCreated: Date
	languageLabel: String!
	languageCode: String!
`

// main Language types and inputs to be exported
const LanguageTypes = `
	type Language {
		languageId: Int
		${LanguageFields}
	}

	extend type RootQuery {
		Language(languageId: ID!): Language
		LanguageList(languageLabel: String): [Language!]!
	}

	extend type RootMutation {
		languageAdd(input: LanguageInput): LanguageResponse
	}

	type LanguageResponse {
		language: Language
		Response: Response!
	}

	input LanguageInput {
		${LanguageFields}
	}
`;

export default LanguageTypes;
