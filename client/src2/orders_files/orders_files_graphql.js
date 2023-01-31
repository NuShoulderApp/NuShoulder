import gql from "graphql-tag";

export const getOrderFilesQuery = gql`
	query getOrderFiles($orderId: ID!) {
		OrderFiles(orderId: $orderId) {
            documentDisplayName
			File {
				dateCreated
				fileId
				mimeType
			}
			fileId
			firstName
			lastName
			orderFileId
		}
	}`;

export const OrderFileSaveMutation = gql`
	mutation orderFileSave($input: OrderFileSaveInput!) {
		orderFileSave (input: $input) {
			orderFileId
			fileId
            orderId
		}
	}
`;
