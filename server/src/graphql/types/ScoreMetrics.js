// import { ResponseFields } from "./Response" // Consistent set of fields for the status of a Query or Mutation to be sent back with every response from the graphql server
const ScoreMetricFields = `
    score_metric_ID: ID
    score_category_ID: Int
    score_metric_name: String
    score_source_ID: Int
    score_max: Float
    score_min: Float
    passing_score: Float
    score_percentage_of_category: Float
    score_units: String
    pass_fail: Int
    allow_partial_score: Int
    active: Int
    archived: Int
    creator_ID: Int
    archiver_ID: Int
    date_created: DateTime
    date_archived: DateTime
`;

export default`
	type ScoreMetric {
        score_metric_ID: ID
        score_category_ID: Int
        score_metric_name: String
        score_source_ID: Int
        score_max: Float
        score_min: Float
        passing_score: Float
        score_percentage_of_category: Float
        score_units: String
        pass_fail: Int
        allow_partial_score: Int
        active: Int
        archived: Int
        creator_ID: Int
        archiver_ID: Int
        date_created: DateTime
        date_archived: DateTime
	}

	input ScoreMetricInput {
        score_metric_ID: ID
        score_category_ID: Int
        score_metric_name: String
        score_source_ID: Int
        score_max: Float
        score_min: Float
        passing_score: Float
        score_percentage_of_category: Float
        score_units: String
        pass_fail: Int
        allow_partial_score: Int
        active: Int
        archived: Int
        creator_ID: Int
        archiver_ID: Int
        date_created: DateTime
        date_archived: DateTime
	}

	extend type RootQuery {
		score_metrics: [ScoreMetric]
		scoreMetricSave(input: ScoreMetricInput): ScoreMetric
	}


`;

