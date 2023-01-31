
// main Memorial types and inputs to be exported
export default`
	type MemorialImage {
		memorialImageId: ID
		accountId: ID
		active: Int
		dateCreated: DateTime
		caption: String
		fullImage: File
		mediumImage: File
		smallImage: File
		tinyImage: File
		memorialId: ID
	}

	type MemorialImageUploadResponse {
		# Response
		Response: Response!

		# Memorial Image data
		memorialImage: MemorialImage
	}

	extend type RootMutation {
		uploadMemorialImage(file: Upload!): MemorialImageUploadResponse!
	}
`;


