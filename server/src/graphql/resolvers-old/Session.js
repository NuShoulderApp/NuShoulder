// QUERIES
const SessionRootResolvers = {
	Session(root, _, context) {
		// Return the session object that is in the context.
		return context.Session;
	}
}

// EXPORT
export { SessionRootResolvers }
