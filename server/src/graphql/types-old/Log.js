export default `
	type LogCrematoryGasMeter {
		logCrematoryGasMeterId: ID
    accountId: ID
    companyId: ID
    dateCreated: DateTime 
    loggedInUserId: ID
    measured: String
    units: String
	}

	input LogCrematoryGasMeterInput {
		measured: String
	}

	type LogCrematoryGasMeterResponse {
		Response: Response
    LogCrematoryGasMeterLogs: [LogCrematoryGasMeter]
	}

	extend type RootMutation {
		logCrematoryGasMeterSave(input: LogCrematoryGasMeterInput!): LogCrematoryGasMeterResponse
	}

  extend type RootQuery {
		LogCrematoryGasMeterLogs: [LogCrematoryGasMeter]
	}

`;
