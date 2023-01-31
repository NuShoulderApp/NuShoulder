import gql from 'graphql-tag';

export const getPrintableLogsQuery = gql`
	query getPrintableLogs($orderId: ID!) {
		PrintableLogs (orderId: $orderId) {
            datePrinted
    		fileId
    		orderId
    		printableId
    		printableLogId
    		userId
    		firstName
    		lastName
        }
    }
`;
