import gql from "graphql-tag";

export const getSignedUrl = gql`
	query getSignedUrl ($fileId: ID!) {
		File(fileId: $fileId) {
			location
		}
	}
`;

export const SingleUploadMutation = gql`
	mutation singleUpload($file: Upload!) {
		singleUpload (file: $file) {
			fileId
			bucket
			dateCreated
			filename
			mimeType
			encoding
			location
		}
	}
`;
