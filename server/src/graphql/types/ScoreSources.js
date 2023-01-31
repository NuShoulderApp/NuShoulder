// import { ResponseFields } from "./Response" // Consistent set of fields for the status of a Query or Mutation to be sent back with every response from the graphql server

export default`
	type ScoreSource {
        score_source_ID: ID
        source_name: String
	}

	input ScoreSourceInput {
        score_source_ID: ID
        source_name: String
	}

	extend type RootQuery {
		score_sources: [ScoreSource]
		scoreSourceSave(input: ScoreSourceInput): ScoreSource
	}


`;

