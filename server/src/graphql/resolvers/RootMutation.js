import { ScoreMetricsMutations } from './ScoreMetrics.js';
import { UserMutations } from './Users.js';

import { mergeResolvers } from '@graphql-tools/merge';

const RootMutations = [
    ScoreMetricsMutations,
	UserMutations
];

export default mergeResolvers(RootMutations);



