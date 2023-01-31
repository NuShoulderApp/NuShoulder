export default`
	type Job {
		jobId: ID!
		accountId: ID!
		dateCreated: DateTime!
		dateUpdated: DateTime!
		error: String
		fileId: ID
		File: File
		payload: String
		printableId: ID
		queue: String
		result: String
		status: String
	}

	type GenerateJobResponse {
		Job: Job
	}

	input GenerateJobInput {
		deliveryLogId: ID
		invoiceId: ID
		jobId: ID
		orderId: ID
		orderIds: String
		orderProductId: ID
		printableName: String
		sendEmail: Boolean
	}

	extend type RootQuery {
		Job(jobId: ID, orderId: ID, orderProductId: ID, printableName: String): Job
	}

	extend type RootMutation {
		generateJob(input: GenerateJobInput!): GenerateJobResponse
	}

`;
