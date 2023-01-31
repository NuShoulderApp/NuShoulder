import gql from 'graphql-tag';

export const LogCrematoryGasMeterSave = gql`
	mutation logCrematoryGasMeterSave($input: LogCrematoryGasMeterInput!) {
		logCrematoryGasMeterSave (input: $input) {
			Response {
				success
				message
			}
			LogCrematoryGasMeterLogs {
				logCrematoryGasMeterId
				dateCreated
				measured
				loggedInUserId
			}
		}
	}
`;

export const LogCrematoryGasMeterLogs = gql`
	query banana {
		LogCrematoryGasMeterLogs {
			logCrematoryGasMeterId
			dateCreated
			measured
			loggedInUserId
		}
	}
`;
