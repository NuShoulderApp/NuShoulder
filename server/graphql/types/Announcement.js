export default `
	type Announcement {
		accountId: ID
		active: Int
		announcement: String
		announcementId: ID
		dateCreated: DateTime
		dateEnd: Date
		dateStart: Date
		dateUpdated: DateTime
		title: String
		userIdCreated: ID
		userIdUpdated: ID
	}

	input AnnouncementInput {
		active: Int
		announcement: String
		announcementId: ID
		dateEnd: Date
		dateStart: Date
		title: String
	}

	type AnnouncementResponse {
		Announcement: Announcement
		Announcements: [Announcement]
		Response: Response
	}

	extend type RootQuery {
		Announcement(announcementId: ID): Announcement
		Announcements(onlyActive: Boolean, onlyCurrent: Boolean): [Announcement]
	}

	extend type RootMutation {
		AnnouncementSave(input: AnnouncementInput!): AnnouncementResponse
	}
`;
