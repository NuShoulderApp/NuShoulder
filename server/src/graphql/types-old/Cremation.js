const CremationFields = `
    accountId: ID
    cremationEndScheduledMinutes: Int
	cremationId: ID
	cremationLogId: ID
    cremationType: String
	dateCremationEnd: DateTime
	dateCremationStart: DateTime
	machineColumn: Int
	machineRow: Int
	orderId: ID
	orderProductId: ID
	petReferenceNumber: String
    petWeight: String
	petWeightUnits: String
	userIdEnd: ID
	userIdStart: ID
	UserEnd: User
	UserStart: User
`;

export default `
	type Cremation {
		${CremationFields}
		Order: Order
	}

    type CremationList {
        ${CremationFields}
        machineName: String
        petFirstName: String
    }

    type CremationOrderDetail {
        ${CremationFields}
		machineName: String
		Order: Order
    }

    input CremationInput {
        autoStartCommunal: Boolean
        calledFromCremationsPerform: Boolean
        column: Int
        cremationEndScheduledMinutes: Int
		cremationLogId: ID
		cremationId: ID
        doCommunal: Int
        doIndividual: Int
        doPrivate: Int
        machineId: Int
		petReferenceNumber: String
        row: Int
	}

    input CremationsListPDFInput {
		dateEnd: String
        dateStart: String
        machineIds: String
	}

	type CremationSaveResponse {
		Cremation: Cremation,
		CremationLog: CremationLog,
        cremationLogClosed: Boolean,
		Response: Response
	}

    type CremationsListPDFResponse {
        jobId: Int
    }

	extend type RootMutation {
		CremationSave(input: CremationInput!): CremationSaveResponse
		CremationCancel(cremationId: ID!): CremationSaveResponse
		CremationCancelLog(cremationId: ID!): CremationSaveResponse
        CremationEnd(input: CremationInput!): CremationSaveResponse
        CremationRemove(input: CremationInput!): CremationSaveResponse
        CremationsListPDF(input: CremationsListPDFInput!): CremationsListPDFResponse
        CremationStart(input: CremationInput!): CremationSaveResponse
	}

    extend type RootQuery {
        Cremation(cremationId: ID!): Cremation
        CremationOrderDetails(orderId: ID!): CremationOrderDetail
        Cremations(cremationLogId: ID!, onlyOpenCremations: Boolean): [Cremation]
        CremationsList(dateEnd: Date!, dateStart: Date!, machineIds: String): [CremationList]
        OpenCremations: [Cremation]
    }

`;
