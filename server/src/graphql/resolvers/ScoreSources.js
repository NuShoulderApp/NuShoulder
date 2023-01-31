import _ from "lodash";
import db from '../../models/index.js';

const ScoreSourcesSubResolvers = {
}

// QUERIES
const ScoreSourcesRootResolvers = {
    score_sources: async() => db.score_sources.findAll(),
}

// MUTATIONS
const ScoreSourcesMutations = {
	async scoreSourceSave(root, {input}, context) {
        console.log("save input: ", input)
        const ScoreSource = await db.score_sources.update(
            { 
                score_source_ID: input.score_source_ID,
                source_name: input.source_name, 
            },
            { where: { score_source_ID: input.score_source_ID }}
        );
        console.log({ScoreSource})
        //return ScoreSource;
		//return Response(true, "User Successfully Added", {action: returnAction, User: {...user, email: input.email }});

	},

}

// EXPORT
export { ScoreSourcesSubResolvers, ScoreSourcesMutations, ScoreSourcesRootResolvers }
