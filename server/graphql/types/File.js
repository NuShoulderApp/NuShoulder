export default`
	type File {
		fileId: ID!
		bucket: String!
		dateCreated: DateTime
		filename: String!
		mimeType: String!
		encoding: String!
		location: String
	}

	input FileInput {
		documentDisplayName: String
		fileName: String
		mimeType: String
	}

	extend type RootQuery {
		File(fileId: ID): File
		uploads: [File]
	}

	extend type RootMutation {
		singleUpload(file: Upload!): File!
	}

`;
