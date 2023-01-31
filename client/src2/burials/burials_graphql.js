import gql from 'graphql-tag';

// BURIAL LOGS ARE FOR ONE BURIAL EVENT, THEY CONTAIN ONE OR MORE PET BURIALS BEING DONE TOGETHER
const burialFields = `
	accountId
	burialId
	burialLogId
	orderId
	orderProductId
	petReferenceNumber
`;

const burialLogFields = `
	accountId
	burialLogId
	burialType
	cemetaryPlot
	companyId
	companyAddressId
	dateBurial
	orderId
	orderProductId
	performedByUserId
`;

// GET ONE BURIAL
export const getBurialQuery = gql`
    query getBurial($burialId: ID) {
		Burial (burialId: $burialId) {
			${burialFields}
		}
	}
`;

// GET ARRAY OF BURIALS
export const getBurialsQuery = gql`
    query getBurials($burialLogId: ID) {
		Burial (burialLogId: $burialLogId) {
			${burialFields}
		}
	}
`;

// GET ONE BURIAL LOG W/ ARRAY OF BURIALS
export const getBurialLogQuery = gql`
	query getBurialLog($burialLogId: ID!) {
		BurialLog (burialLogId: $burialLogId) {
			${burialLogFields}
			Burials {
				${burialFields}
			}
			User {
				firstName
				lastName
				userId
			}
		}
	}
`;

// GET BURIAL LOG ARRAY
export const getBurialLogsQuery = gql`
    query getBurialLogs {
		BurialLogs {
			${burialLogFields}
			Burials {
				${burialFields}
			}
			User {
				firstName
				lastName
				userId
			}
		}
	}`;


// BURIAL SAVE
export const BurialSaveMutation = gql`
	mutation burialSave($input: BurialInput!) {
		burialSave (input: $input) {
            Burial {
				${burialFields}
			}
			Response {
				success
				message
			}
		}
	}
`;

// BURIAL DELETE
export const BurialRemoveMutation = gql`
	mutation burialRemove($burialId: ID!) {
		burialRemove (burialId: $burialId) {
			Response{
				success
				message
			}
		}
	}
`;

// BURIAL LOG SAVE
export const BurialLogSaveMutation = gql`
	mutation burialLogSave($input: BurialLogInput!) {
		burialLogSave (input: $input) {
			Response {
				success
				message
			}
			BurialLog {
				${burialLogFields}
			}
		}
	}
`;

// BURIAL LOG DELETE
export const BurialLogRemoveMutation = gql`
	mutation burialLogRemove($burialLogId: ID!) {
		burialLogRemove (burialLogId: $burialLogId) {
			Response{
				success
				message
			}
		}
	}
`;

