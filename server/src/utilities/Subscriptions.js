import cookie from 'cookie';
import signer from 'cookie-signature';
import { PubSub } from 'graphql-subscriptions';

// The PubSub interface provides an easy way to incorporate Publish/Subscribe events. Events are used to notify subscriptions when it's time to broadcast updates.
// The PubSub system uses "topic" strings to differentiate between subscribed clients.
// i.e.
//	Deliveries = pubsub.asyncIterator('Deliveries');
//	Orders = pubsub.asyncIterator('Orders');
export const pubsub = new PubSub();

async function getSessionFromStore(store, sid) {

	let session = await new Promise((resolve, reject) => {
		store.get(sid, (error, session) => (error ? reject(error) : resolve(session)));
	}).catch((error) => {
		console.log("error retrieving session", {error})
	});

	if (!session) {
		// abort connection
		throw new Error ('Session Not Found');
	}

	return session;
}

// wrapper for pubsub.asyncIterator, to avoid unnecesary code changes
function subscribeToTopic(topic) {
	return pubsub.asyncIterator(topic);
}

// wrapper for pubsub.publish, to avoid unnecesary code changes
function broadcastTopic(topic, payload) {
	return pubsub.publish(topic, payload);
}

// Create object to add to context for GQL resolvers
export function createSubscriptionContext() {
	// This wouldn't be a bad place to add functionality to our subscription management
	return {
		broadcast: broadcastTopic,
		subscribe: subscribeToTopic
	}
}

// parse info out of connectionParams and context. info will be used when creating Session object
async function onConnect(store, connectionParams, webSocket, context) {
	console.log(`Client connected to subscription endpoint`);

	let host = context.request.headers.host;
	// Parse cookies out of the request headers
	let cookieObj = cookie.parse(context.request.headers.cookie);
	let signedSid = cookieObj['connect.sid'];
	if (signedSid.substr(0, 2) === 's:') {
		signedSid = signedSid.slice(2);
	}
	let sid = signer.unsign(signedSid, process.env.COOKIE_SECRET_KEY);

	let Session;
	if (sid) {
		// Get session out of session store. Will throw error if no session found.
		Session = await getSessionFromStore(store, sid);
	}
	return {
		sid,
		host,
		Session
	}
}

async function onDisconnect() {
	console.log(`Client disconnected from subscription endpoint`);
	return;
}

// Config object, will be used by ApolloServer interface
// More info at https://www.apollographql.com/docs/apollo-server/api/apollo-server.html
export function createIWDSubscriptionConfig(store) {
	return {
		path: '/graphql/subscriptions',
		// called when a client tries to connect to subscription server
		// Can return a Promise and reject the connection by throwing an exception. Resolved return value will be appended to GQL context of subscriptions.
		// From docs, "All GraphQL subscriptions are delayed until the connection has been fully authenticated and your onConnect callback returns a truthy value", so don't return falsy value if you want a successful connection
		onConnect: onConnect.bind(null, store),
		// called when client disconnects, good place to clean up state if necessary
		onDisconnect
	}
}
