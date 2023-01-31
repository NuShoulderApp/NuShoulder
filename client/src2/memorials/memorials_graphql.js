import gql from 'graphql-tag';

// get a single memorial -- for view page
export const GetMemorial = gql`
query ($memorialId: ID!) {
	Memorial(memorialId: $memorialId) {
		memorialId
		authorEmail
		breed
		dateBorn
		dateDied
		images {
			memorialImageId
			fullImage {
				location
			}
			mediumImage {
				location
			}
			smallImage {
				location
			}
			tinyImage {
				location
			}
		}
		memorial
		petName
		petId
		petSpecies {
			species
			speciesId
		}
	}
}`;

// get list of memorials (for current account) -- for showcase page
export const GetMemorials = gql`
query MemorialList ($cursor: MemorialListCursorInput) {
	Memorials (cursor: $cursor) {
		memorials {
			memorialId
			authorEmail
			breed
			dateBorn
			dateDied
			images {
				memorialImageId
				fullImage {
					location
				}
				mediumImage {
					location
				}
				smallImage {
					location
				}
				tinyImage {
					location
				}
			}
			memorial
			petName
			petId
			petSpecies {
				species
				speciesId
			}
		}
		cursor {
			after
		}
	}
}`;

// get list of memorials with provided status (for current account) -- unused
export const GetMemorialsByStatus = gql`
query MemorialList ($memorialStatusId: ID, $cursor: MemorialListCursorInput) {
	Memorials (memorialStatusId: $memorialStatusId, cursor: $cursor) {
		memorials {
			memorialId
			authorEmail
			breed
			dateBorn
			dateDied
			images {
				memorialImageId
				fullImage {
					location
				}
				mediumImage {
					location
				}
				smallImage {
					location
				}
				tinyImage {
					location
				}
			}
			memorial
			petName
			petId
			petSpecies {
				species
				speciesId
			}
		}
		cursor {
			after
		}
	}
}`;

// get list of memorials with provided status (for current account) -- unused
export const GetPublishedMemorials = gql`
query MemorialList ($cursor: MemorialListCursorInput) {
	Memorials (memorialStatusId: 3, cursor: $cursor) {
		memorials {
			memorialId
			authorEmail
			breed
			dateBorn
			dateDied
			images {
				memorialImageId
				fullImage {
					location
				}
				mediumImage {
					location
				}
				smallImage {
					location
				}
				tinyImage {
					location
				}
				caption
			}
			memorial
			petName
			petId
			petSpecies {
				species
				speciesId
			}
		}
		cursor {
			after
		}
	}
}`;

// get list of memorials with  -- for showcase page
export const GetPendingMemorials = gql`
query MemorialList ($cursor: MemorialListCursorInput) {
	Memorials (memorialStatusId: 1, cursor: $cursor) {
		memorials {
			memorialId
			authorEmail
			breed
			dateBorn
			dateDied
			images {
				memorialImageId
				fullImage {
					location
				}
				mediumImage {
					location
				}
				smallImage {
					location
				}
				tinyImage {
					location
				}
				caption
			}
			memorial
			petName
			petId
			petSpecies {
				species
				speciesId
			}
		}
		cursor {
			after
		}
	}
}`;


// upload image for memorial -- for create page
export const UploadMemorialImage = gql`
mutation ($file: Upload!) {
	uploadMemorialImage(file: $file) {
		Response {
			success
			message
		}
		memorialImage {
			memorialImageId
			caption
			fullImage {
				location
				filename
				encoding
				bucket
				mimeType
			}
			mediumImage {
				location
				filename
				encoding
				bucket
				mimeType
			}
			smallImage {
				location
				filename
				encoding
				bucket
				mimeType
			}
			tinyImage {
				location
				filename
				encoding
				bucket
				mimeType
			}
		}
	}
}`;

// create memorial out of submitted data + images -- for create page
export const CreateMemorial = gql`
mutation ($memorial_data: MemorialInput!) {
	memorialCreate(input: $memorial_data) {
		Memorial {
			memorial
			memorialId
			memorialStatusId
		}
		Response {
			message
			success
		}
	}
}`;