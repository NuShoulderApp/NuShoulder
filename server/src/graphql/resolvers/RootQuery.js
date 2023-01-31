import { ScoreCategoriesRootResolvers } from './ScoreCategories.js';
import { ScoreMetricsMutations, ScoreMetricsRootResolvers } from './ScoreMetrics.js';
import { ScoreSourcesMutations, ScoreSourcesRootResolvers } from './ScoreSources.js';
import { UserRootResolvers } from './Users.js';
import { mergeResolvers } from '@graphql-tools/merge';

const RootResolvers = [
    ScoreCategoriesRootResolvers,
    ScoreMetricsMutations,
    ScoreMetricsRootResolvers,
    ScoreSourcesMutations,
    ScoreSourcesRootResolvers,
	UserRootResolvers
];

export default mergeResolvers(RootResolvers);
// export default UserRootResolvers;
