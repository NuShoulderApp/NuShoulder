import gql from 'graphql-tag';

const announcementFields = `
	accountId
	active
	announcement
	announcementId
	dateCreated
	dateEnd
	dateStart
	dateUpdated
	title
	userIdCreated
	userIdUpdated
`;

// GET ONE ANNOUNCEMENT
export const getAnnouncementQuery = gql`
    query Announcement($announcementId: ID) {
		Announcement (announcementId: $announcementId) {
			${announcementFields}
		}
	}
`;

// GET ARRAY OF ANNOUNCEMENTS
export const getAnnouncementsQuery = gql`
    query Announcements($onlyActive: Boolean, $onlyCurrent: Boolean) {
		Announcements (onlyActive: $onlyActive, onlyCurrent: $onlyCurrent) {
			${announcementFields}
		}
	}
`;

// ANNOUNCEMENT SAVE
export const AnnouncementSaveMutation = gql`
	mutation AnnouncementSave($input: AnnouncementInput!) {
		AnnouncementSave (input: $input) {
            Announcement {
				${announcementFields}
			}
			Announcements {
				${announcementFields}
			}
			Response {
				success
				message
			}
		}
	}
`;

// ANNOUNCEMENT DELETE
export const AnnouncementRemoveMutation = gql`
	mutation AnnouncementRemove($announcementId: ID!) {
		AnnouncementRemove (announcementId: $announcementId) {
			Response{
				success
				message
			}
		}
	}
`;
