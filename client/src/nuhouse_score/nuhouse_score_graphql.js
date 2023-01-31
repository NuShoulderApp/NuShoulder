import { gql } from '@apollo/client';

export const GetScoreCategories = gql`
    query GetScoreCategories {
        score_categories {
            score_category_ID,
            score_category_name,
            score_category_percentage,
            active,
            archived,
            creator_ID,
            archiver_ID,
            date_created,
            date_archived
        }
    }
`;

export const GetScoreMetrics = gql`
    query GetScoreMetrics {
        score_metrics {
            score_metric_ID,
            score_category_ID,
            score_metric_name,
            score_max,
            score_min,
            score_source_ID,
            passing_score,
            score_percentage_of_category,
            score_units,
            pass_fail,
            allow_partial_score,
            active,
            archived,
            creator_ID,
            archiver_ID,
            date_created,
            date_archived
        }
    }
`;

export const GetScoreSources = gql`
    query GetScoreSources {
        score_sources {
            score_source_ID,
            source_name
        }
    }
`;

export const SaveScoreMetric = gql`
	mutation scoreMetricSave($input: ScoreMetricInput) {
		scoreMetricSave (input: $input) {
            score_metric_ID
            score_category_ID
            score_metric_name
            score_max
            score_min
            score_category_ID
            passing_score
            score_percentage_of_category
            score_units
            pass_fail
            allow_partial_score
            active
            archived
            creator_ID
            archiver_ID
            date_created
            date_archived
		}
	}
`;

export const SaveScoreSource = gql`
	mutation scoreSourceSave($input: ScoreSourceInput) {
		scoreSourceSave (input: $input) {
            score_source_ID
            source_name
		}
	}
`;

			// Response {
			// 	success
			// 	message
			// }



