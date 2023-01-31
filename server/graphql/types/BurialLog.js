const BurialLogFields = `
    accountId: ID
	burialLogId: ID
	burialType: String
	cemetaryPlot: String
	companyId: ID
	companyAddressId: ID
	dateBurial: Date
	orderId: ID
    orderProductId: ID
    performedByUserId: ID
`;

export default `
	type BurialLog {
		${BurialLogFields}
		Burials: [Burial]
		User: [User]
	}

	input BurialLogInput {
		${BurialLogFields}
	}

	extend type RootMutation {
		BurialLogSave(input: BurialLogInput!): BurialLog
	}

    extend type RootQuery {
		BurialLogs: [BurialLog]
		BurialLog(burialLogId: ID!): BurialLog
	}
	
`;