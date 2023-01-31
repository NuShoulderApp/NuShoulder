// import { ResponseFields } from "./Response" // Consistent set of fields for the status of a Query or Mutation to be sent back with every response from the graphql server

export default`
	type ScoreCategory {
        score_category_ID: ID
        score_category_name: String
        score_category_percentage: Float
        active: Boolean
        archived: Boolean
        creator_ID: Int
        archiver_ID: Int
        date_created: DateTime
        date_archived: DateTime
	}

	extend type RootQuery {
		score_categories: [ScoreCategory]
	}
`;

