import ScoreCategories from './ScoreCategories.js';
import ScoreMetrics from './ScoreMetrics.js';
import ScoreSources from './ScoreSources.js';
import Users from './Users.js';
// IMPORTANT: When adding a new type here, also add it to the id_type_map in the index.js file on the Client to make it work with the Apollo cache
const typeDefs = [
	`scalar Date`,
	`scalar DateTime`,
	`scalar JSON`,
	`
		schema {
			query: RootQuery,
            mutation: RootQuery
		}
	`,
    // Put these into schema object above when they become used
			// mutation: RootMutation
			// subscription: RootSubscription
	// "type RootMutation",
	"type RootQuery",
	// "type RootSubscription",
	// IMPORTANT: When adding a new type here, also add it to the id_type_map in the index.js file on the Client to make it work with the Apollo cache
    ScoreCategories,
    ScoreMetrics,
    ScoreSources,
	Users

]

// IMPORTANT: When adding a new type here, also add it to the id_type_map in the index.js file on the Client to make it work with the Apollo cache

export default typeDefs
