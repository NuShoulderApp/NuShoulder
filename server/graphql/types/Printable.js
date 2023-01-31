export default`
	type Printable {
		printableId: ID!
		accountId: ID
		accountPrintableName: String
		active: Int
		allowCache: Int
		printableImageFileId: ID
		printableName: String
		printableTemplate: String
		printableType: String
		statusCompletedIndicator: Int
		statusQuestionPrompt: Int
	}

	extend type RootQuery {
		Printable(printableName: String): Printable
		Printables: [Printable]
	}
`;
