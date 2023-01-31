import _ from "lodash";
import db from '../../models/index.js';

const ScoreCategoriesSubResolvers = {
}

// QUERIES
const ScoreCategoriesRootResolvers = {
    score_categories: async() => db.score_categories.findAll(),
}

// MUTATIONS
const ScoreCategoriesMutations = {
}

// EXPORT
export { ScoreCategoriesSubResolvers, ScoreCategoriesMutations, ScoreCategoriesRootResolvers }
