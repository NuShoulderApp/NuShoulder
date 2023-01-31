import { SessionObject } from '../utilities/SessionStore';
import { GetAccountContext } from '../utilities/AccountContext';
import { createSubscriptionContext } from '../utilities/Subscriptions';

const { debug } = require('./loggers').getLoggers('IWDContext');


// Update session in redis by directly referencing store interface
async function updateUserSession(store, {req, connection, context}) {
	// if req exists, we can use express-session to directly update session
	if (req) {
		req.session.Session = context.Session;
	} else {
		// if req doesn't exist, we need to directly manipulate the session store
		await new Promise((resolve, reject) =>
			store.set(connection.context.sid, context.Session, (error) => error ? reject(error) : resolve())
		);
	}
}

export async function GetContext(store, {req, res, connection}) {
	let contextArgs;
	// First step in creating context is getting necessary information out of connection/request info.
	if (connection) {
		contextArgs = await createArgsForSubscription(connection);
	} else {
		contextArgs = await createArgsDefault({req, res});
	}

	// now, update context to include generic info, common to all context objects (doesn't depend on req or connection)
	const context = await createContext(contextArgs);

	// finally, since we've re-created the session, update the store
	updateUserSession(store, {req, connection, context});
	return context;
}

// Generic function to create context. This actually creates the context from a generic set of arguments
async function createContext({host, Session}) {
	debug(`Creating context`);
	const Account = await GetAccountContext(host);

	/*
		Express session will only store things as serialized strings.  So while in use, we run the JSON through
		ths SessionObject to get a functioning object.  When it is saved it will be serialized.
	*/
	const sessionObj = new SessionObject(Session, Account.knex);

	return {
		Account,
		Session: sessionObj,
		knex: Account.knex,
		subscriptions: createSubscriptionContext()
	}
}

// extract context information from subscription (websocket) connection
async function createArgsForSubscription(connection) {
	return {
		host: connection.context.host,
		Session: connection.context.Session
	}
}

// extract context information from query/mutation (regular web request)
async function createArgsDefault({req}) {
	return {
		Session: req.session.Session,
		host: req.headers.host
	}
}