import _ from "lodash";
import db from '../../models/index.js';

const ScoreMetricsSubResolvers = {
}

// QUERIES
const ScoreMetricsRootResolvers = {
    score_metrics: async() => db.score_metrics.findAll(),
}

// MUTATIONS
const ScoreMetricsMutations = {
	async scoreMetricSave(root, {input}, context) {
        console.log("save input: ", input)
        const ScoreMetric = await db.score_metrics.update(
            { 
                score_category_ID: input.score_category_ID,
                score_metric_name: input.score_metric_name, 
                score_max: input.score_max,
                score_min: input.score_min,
                score_source_ID: input.score_source_ID,
                passing_score: input.passing_score,
                score_percentage_of_category: input.score_percentage_of_category,
                score_units: input.score_units,
                pass_fail: input.pass_fail,
                allow_partial_score: input.allow_partial_score
            },
            { where: { score_metric_ID: input.score_metric_ID }}
        );
        console.log({ScoreMetric})
        //return ScoreMetric;
		//return Response(true, "User Successfully Added", {action: returnAction, User: {...user, email: input.email }});

	},

}

// EXPORT
export { ScoreMetricsSubResolvers, ScoreMetricsMutations, ScoreMetricsRootResolvers }
