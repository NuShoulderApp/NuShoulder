const CremationLogFields = `
    accountId: ID
	cremationEndScheduledMinutes: Int
	cremationLogId: ID
	cremationType: String
	dateCremationLogEnd: DateTime
	dateCremationLogStart: DateTime
	machineId: ID
	performedByUserId: ID
`;

export default `
	type CremationLog {
		${CremationLogFields}
		Cremations(onlyOpenCremations: Boolean): [Cremation]
		Machine: Machine
		Machines: [Machine]
		User: User
	}

	type CremationLogsItem {
		${CremationLogFields}
		firstName: String
		lastName: String
		machineName: String
	}

    type CremationLogCreate {
        ${CremationLogFields}
    }

	input CremationLogInput {
		cremationLogId: ID
		cremationType: String
		machineId: ID
	}

    type CremationLogCreateResponse {
        CremationLogCreate: CremationLogCreate
		Response: Response
	}

    type CremationLogSaveResponse {
		CremationLog: CremationLog,
		Response: Response
	}

	extend type RootMutation {
        CremationLogCreate(input: CremationLogInput!): CremationLogCreateResponse
		CremationLogSave(input: CremationLogInput!): CremationLogSaveResponse
	}

    extend type RootQuery {
		CremationLogs: [CremationLogsItem]
		CremationLog(cremationLogId: ID!): CremationLog
        OpenCremationLogs(onlyOpenCremations: Boolean, machineId: ID): [CremationLog]
    }

`;
