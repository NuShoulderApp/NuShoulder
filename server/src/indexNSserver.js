import './env';	// must be first line of code, adds the env.js require before everything else

import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import express from "express";
import session from "express-session";
import typeDefs from './graphql/types';
import resolvers from './graphql/resolvers';
// import redis from "redis";
// import cors from "cors";

// create context for apollo server
// import { GetContext } from './utilities/Context';
// import { createIWDSubscriptionConfig } from './utilities/Subscriptions';

// Create the memory store for storing the session informaion.
// const redisStore = require("connect-redis")(session);
// const client = redis.createClient('6379',process.env.REDIS_HOST);

// Create the express object.
const app = express();

// create redisStore

// const IWDRedisStore = new redisStore({ client: client, ttl: 60 * 60 * 24 });

// Use express session.
app.use(session({
	//  Secret for hashing the cookie information.
	//secret: "1QxuFVjBpobaDsaIkdmoQWzN7rVAVdokT06pVnxSJaarqsLWJtJOyRbgzpFKC9BANfFrGwscZdO9V7VcM381CLTLIrXlePkRuyGZ",
	secret: process.env.COOKIE_SECRET_KEY,
	// Don't save cookie if nothing has changed.
	resave: false,
	// If a cookie was made, but nothing in it was changed, do not store it.
	saveUninitialized: false,
	// The store with a check for expiration time of one day in seconds
	store: IWDRedisStore
}));

// function corsOptionsDelegate(req, callback) {
// 	// If there is no origin, we are not in a cross origin mode, so return false for everything.
// 	if (req.headers.origin === undefined) {
// 		callback(null, { credentials: false, origin: false })
// 	} else {
// 		// We are in a cross origin situation.  We will make sure the origin and host string match (only the ports should be different.)

// 		// A regexp to find the protocol and ports in a string.
// 		const regexGetHost = /(https?:\/\/)|(:\d+)/g;

// 		// Get the host URL value - strip out the protocol and port
// 		const host = req.headers.host.replace(regexGetHost,"");

// 		// Get the origin URL value - strip out the protocol and port
// 		const origin = req.headers.origin.replace(regexGetHost,"");

// 		// The response value for credentials and origin will be the bool of whether origin === host
// 		const responseValue = origin === host;

// 		// Return the cors object with credentials and origin set to the responseValue
// 		callback(null, { credentials: responseValue, origin: responseValue });
// 	}
// }

// Use the cors options for the express preflights.
// app.use(cors(corsOptionsDelegate));

// Create the apollo server with the schema, endpoint, and context.
const server = new ApolloServer({
	typeDefs,
	resolvers,
	// subscriptions: createIWDSubscriptionConfig(IWDRedisStore),
	// introspection: process.env.GRAPHQL_PLAYGROUND === "true",
	// playground: process.env.GRAPHQL_PLAYGROUND === "true",
	graphqlPath: process.env.REACT_APP_GRAPHQL_PATH,
	// If the SHOW_ERRORS in the env is true, we will console.log all errors.
	formatError: (error) => {
		// errorReporting.report(error.originalError.stack); // report to Google Error Report
		console.log("handle error: ", error);
		console.error(error); // log the error
		// console.trace(); // log stack trace
		return error;
	},
	// Create context for graphQL resolvers
	context: (props) => GetContext(IWDRedisStore, props)
});

// Apply the middleware to the server with the proper corsOptions
server.applyMiddleware({app, path: process.env.REACT_APP_GRAPHQL_PATH, cors: corsOptionsDelegate});

// If the client build path is defined, we will be serving the client bundle from here.
if (process.env.CLIENT_BUILD_PATH) {
	console.log("Hosting Bundle at /", process.env.CLIENT_BUILD_PATH);

	// Serve the client build from the root. This will match an actual file in the build path.
	app.use("/", express.static(process.env.CLIENT_BUILD_PATH));

	// If any request has not been matched yet, we will return the main index.html file.
	app.use("*", express.static(`${process.env.CLIENT_BUILD_PATH}/index.html`));
}


// create an http server from the express app so that we can easily add subscriptions to it
const httpServer = createServer(app);
server.installSubscriptionHandlers(httpServer);

// Listen on the given port.
var processPort = process.env.PORT || process.env.REACT_APP_GRAPHQL_ENDPOINT_PORT;
./
httpServer.listen({ port: processPort },
	() => {
		console.log(`🚀  Server ready at ${server.graphqlPath} ${new Date()} ${processPort}`);
		console.log(`🚀  Subscription server ready at ${server.subscriptionsPath}`);
	}
);

// log uncaught exceptions and kill the server
process.on('uncaughtException', function (err) {
	console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
	console.error(err.stack);
	console.log((new Date).toUTCString() + ' uncaughtException:', err.message);
	console.log(err.stack);
	process.exit(1);
})