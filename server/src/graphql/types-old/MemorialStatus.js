// main MemorialStatus types and inputs to be exported
export default `
	type MemorialStatus {
		memorialStatusId: ID
		active: Int
		memorialStatus: String
	}

	extend type RootQuery {
		MemorialStatuses: [MemorialStatus]!
	}
`;