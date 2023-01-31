// import { GraphQLDate, GraphQLDateTime } from 'graphql-iso-date'
// import GraphQLJSON from 'graphql-type-json'
import RootMutation from './RootMutation.js'
import RootQuery from './RootQuery.js'
import {UserSubResolvers} from './Users.js'
const resolvers = {
	// Date: GraphQLDate,
	// DateTime: GraphQLDateTime,
	// JSON: GraphQLJSON,
	// RootMutation: RootMutation,
	RootQuery,
	// RootSubscription: require('./RootSubscription').default,

	// (sub)Type specific resolvers.
	//User: UserSubResolvers
}

export default resolvers
