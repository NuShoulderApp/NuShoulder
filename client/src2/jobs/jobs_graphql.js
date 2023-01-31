import gql from 'graphql-tag';

export const getJobQuery = gql`
    query getJob($jobId: ID, $orderId: ID, $orderProductId: ID, $printableName: String) {
		Job (jobId: $jobId, orderId: $orderId, orderProductId: $orderProductId, printableName: $printableName) {
			jobId
			accountId
            dateCreated
            dateUpdated
			error
			fileId
			File {
				location
			}
			payload
			queue
			result
			status
		}
	}`;

export const GenerateJobMutation = gql`
	mutation generateJob($input: GenerateJobInput!) {
		generateJob (input: $input) {
			Job {
                jobId
    			accountId
                dateCreated
                dateUpdated
    			error
    			fileId
    			payload
                printableId
    			queue
    			result
    			status
			}
		}
	}
`;
