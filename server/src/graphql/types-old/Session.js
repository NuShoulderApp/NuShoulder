// main User types and inputs to be exported
export const Session = `
	type Session {
		LoggedIn: Boolean
		sessionId: ID
		User: User
	}

	extend type RootQuery {
		Session: Session
	}
`;