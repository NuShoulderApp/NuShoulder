import gql from 'graphql-tag';


// CREMATION LOGS ARE FOR ONE CREMATION EVENT, THEY CONTAIN ONE OR MORE PET CREMATIONS BEING DONE TOGETHER
const cremationFields = `
	accountId
	cremationEndScheduledMinutes
	cremationId
	cremationType
	dateCremationEnd
	dateCremationStart
	machineColumn
	machineRow
	orderId
	orderProductId
	petReferenceNumber
	petWeight
	petWeightUnits
	userIdEnd
	userIdStart
`;

const cremationLogFields = `
	accountId
	cremationEndScheduledMinutes
	cremationLogId
	cremationType
	dateCremationLogEnd
	dateCremationLogStart
	machineId
	performedByUserId
`;

// GET ONE CREMATION
export const getCremationQuery = gql`
    query getCremation($cremationId: ID) {
		Cremation (cremationId: $cremationId) {
			${cremationFields}
			firstName
			lastName
			machineName
			Order {
				companyName
				dateCreated
				deliveryAddressId
				deliveryMethodName
				deliveryMethodProductId
				memorialization
				orderId
				orderServiceStatus
				orderServiceStatusId
				orderStatus
				orderStatusId
				orderTypeId
				ownerEmail
				ownerFirstName
				ownerLastName
				ownerPhoneNumber
				petBreed
				petColor
				petFirstName
				petLastName
				petReferenceNumber
				pickupAddressId
				sex
				species
				speciesId
				weight
				weightUnits
			}
			UserEnd {
				userId
				firstName
				lastName
			}
			UserStart {
				userId
				firstName
				lastName
			}
		}
	}
`;

// GET CREMATION INFORMATION FOR THE ORDER DETAILS
export const getCremationOrderDetailsQuery = gql`
    query getCremationOrderDetails($orderId: ID!) {
		CremationOrderDetails (orderId: $orderId) {
			${cremationFields}
			cremationLogId
			machineName
			UserEnd {
				userId
				firstName
				lastName
			}
			UserStart {
				userId
				firstName
				lastName
			}
		}
	}
`;

// GET ARRAY OF CREMATIONS
export const getCremationsQuery = gql`
    query getCremations($cremationLogId: ID, $onlyOpenCremations: Boolean) {
		Cremation (cremationLogId: $cremationLogId, onlyOpenCremations: $onlyOpenCremations) {
			${cremationFields}
		}
	}
`;

export const getOpenCremationsQuery = gql`
    query getOpenCremations {
		OpenCremations {
			${cremationFields}
		}
	}
`;

// GET ARRAY OF CREMATIONS
export const getCremationsListQuery = gql`
    query getCremationsList($dateEnd: Date!, $dateStart: Date!, $machineIds: String) {
		CremationsList (dateEnd: $dateEnd, dateStart: $dateStart, machineIds: $machineIds) {
			${cremationFields}
			cremationType
			machineName
			petFirstName
		}
	}
`;

// GET ONE CREMATION LOG W/ ARRAY OF CREMATIONS
export const getCremationLogQuery = gql`
	query getCremationLog($cremationLogId: ID!) {
		CremationLog (cremationLogId: $cremationLogId) {
			${cremationLogFields}
			Cremations {
				${cremationFields}
				Order {
					companyName
					dateCreated
					deliveryAddressId
					deliveryMethodName
					deliveryMethodProductId
					memorialization
					orderId
					orderServiceStatus
					orderServiceStatusId
					orderStatus
					orderStatusId
					orderTypeId
					ownerEmail
					ownerFirstName
					ownerLastName
					ownerPhoneNumber
					petBreed
					petColor
					petFirstName
					petLastName
					petReferenceNumber
					pickupAddressId
					sex
					species
					speciesId
					weight
					weightUnits
				}
				UserEnd {
					userId
					firstName
					lastName
				}
				UserStart {
					userId
					firstName
					lastName
				}
			}
			Machine {
				active
				columns
				doCommunal
				doIndividual
				doPrivate
				isMultiChamber
				machineId
				machineName
				rows
			}
			User {
				firstName
				lastName
				userId
			}
		}
		Machines {
			active
			columns
			cremationLogId
			doCommunal
			doIndividual
			doPrivate
			isMultiChamber
			machineId
			machineName
			rows
		}
	}
`;

// GET CREMATION LOG ARRAY
export const getCremationLogsQuery = gql`
    query getCremationLogs {
		CremationLogs {
			${cremationLogFields}
			firstName
			lastName
			machineId
			machineName
		}
	}`;

// GET CREMATION LOG ARRAY - only ones that are still open
export const getOpenCremationLogsQuery = gql`
    query getOpenCremationLogs($onlyOpenCremations: Boolean, $machineId: ID) {
		OpenCremationLogs(onlyOpenCremations: $onlyOpenCremations, machineId: $machineId) {
			${cremationLogFields}
			Cremations(onlyOpenCremations: $onlyOpenCremations) {
				${cremationFields}
				Order {
					companyName
					dateCreated
					deliveryAddressId
					deliveryMethodName
					deliveryMethodProductId
					memorialization
					orderId
					orderServiceStatus
					orderServiceStatusId
					orderStatus
					orderStatusId
					orderTypeId
					ownerEmail
					ownerFirstName
					ownerLastName
					ownerPhoneNumber
					petBreed
					petColor
					petFirstName
					petLastName
					petReferenceNumber
					pickupAddressId
					sex
					species
					speciesId
					weight
					weightUnits
				}
				UserEnd {
					userId
					firstName
					lastName
				}
				UserStart {
					userId
					firstName
					lastName
				}
			}
			Machine {
				active
				columns
				cremationLogId
				doCommunal
				doIndividual
				doPrivate
				isMultiChamber
				machineId
				machineName
				rows
			}
			User {
				firstName
				lastName
				userId
			}
		}
}`;

// CREMATION SAVE
export const CremationSaveMutation = gql`
	mutation cremationSave($input: CremationInput!) {
		CremationSave (input: $input) {
			Cremation {
				${cremationFields}
			}
			CremationLog {
				${cremationLogFields}
				Cremations {
					${cremationFields}
					Order {
						companyName
						dateCreated
						deliveryAddressId
						deliveryMethodName
						deliveryMethodProductId
						memorialization
						orderId
						orderServiceStatus
						orderServiceStatusId
						orderStatus
						orderStatusId
						orderTypeId
						ownerEmail
						ownerFirstName
						ownerLastName
						ownerPhoneNumber
						petBreed
						petColor
						petFirstName
						petLastName
						petReferenceNumber
						pickupAddressId
						sex
						species
						speciesId
						weight
						weightUnits
					}
					UserEnd {
						userId
						firstName
						lastName
					}
					UserStart {
						userId
						firstName
						lastName
					}
				}
				Machine {
					active
					columns
					cremationLogId
					doCommunal
					doIndividual
					doPrivate
					isMultiChamber
					machineId
					machineName
					rows
				}
				User {
					firstName
					lastName
					userId
				}
			}
			Response {
				success
				message
			}
		}
	}
`;

export const CremationCancelMutation = gql`
	mutation cremationCancel($cremationId: ID!) {
		CremationCancel (cremationId: $cremationId) {
			cremationLogClosed
			Response {
				success
				message
			}
		}
	}
`;
export const CremationCancelLogMutation = gql`
	mutation cremationCancelLog($cremationId: ID!) {
		CremationCancelLog (cremationId: $cremationId) {
			CremationLog {
				${cremationLogFields}
				Cremations {
					${cremationFields}
					Order {
						companyName
						dateCreated
						deliveryAddressId
						deliveryMethodName
						deliveryMethodProductId
						memorialization
						orderId
						orderServiceStatus
						orderServiceStatusId
						orderStatus
						orderStatusId
						orderTypeId
						ownerEmail
						ownerFirstName
						ownerLastName
						ownerPhoneNumber
						petBreed
						petColor
						petFirstName
						petLastName
						petReferenceNumber
						pickupAddressId
						sex
						species
						speciesId
						weight
						weightUnits
					}
					UserEnd {
						userId
						firstName
						lastName
					}
					UserStart {
						userId
						firstName
						lastName
					}
				}
				Machine {
					active
					columns
					doCommunal
					doIndividual
					doPrivate
					isMultiChamber
					machineId
					machineName
					rows
				}
				User {
					firstName
					lastName
					userId
				}
			}
			cremationLogClosed
			Response {
				success
				message
			}
		}
	}
`;

export const CremationEndMutation = gql`
	mutation cremationEnd($input: CremationInput!) {
		CremationEnd (input: $input) {
            Cremation {
				${cremationFields}
				UserEnd {
					userId
					firstName
					lastName
				}
				UserStart {
					userId
					firstName
					lastName
				}
			}
			cremationLogClosed
			Response {
				success
				message
			}
		}
	}
`;

export const CremationStartMutation = gql`
	mutation cremationStart($input: CremationInput!) {
		CremationStart (input: $input) {
            Cremation {
				${cremationFields}
				UserEnd {
					userId
					firstName
					lastName
				}
				UserStart {
					userId
					firstName
					lastName
				}
			}
			CremationLog {
				${cremationLogFields}
				Cremations {
					${cremationFields}
					Order {
						companyName
						dateCreated
						deliveryAddressId
						deliveryMethodName
						deliveryMethodProductId
						memorialization
						orderId
						orderServiceStatus
						orderServiceStatusId
						orderStatus
						orderStatusId
						orderTypeId
						ownerEmail
						ownerFirstName
						ownerLastName
						ownerPhoneNumber
						petBreed
						petColor
						petFirstName
						petLastName
						petReferenceNumber
						pickupAddressId
						sex
						species
						speciesId
						weight
						weightUnits
					}
					UserEnd {
						userId
						firstName
						lastName
					}
					UserStart {
						userId
						firstName
						lastName
					}
				}
				Machine {
					active
					columns
					cremationLogId
					doCommunal
					doIndividual
					doPrivate
					isMultiChamber
					machineId
					machineName
					rows
				}
				User {
					firstName
					lastName
					userId
				}
			}
			Response {
				success
				message
			}
		}
	}
`;


// CREMATION DELETE
export const CremationRemoveMutation = gql`
	mutation cremationRemove($cremationId: ID!) {
		CremationRemove (cremationId: $cremationId) {
			Response{
				success
				message
			}
		}
	}
`;

export const CremationLogCreateMutation = gql`
	mutation cremationLogCreate($input: CremationLogInput!) {
		CremationLogCreate (input: $input) {
			Response {
				success
				message
			}
			CremationLogCreate {
				cremationLogId
				cremationType
				dateCremationLogEnd
				dateCremationLogStart
				machineId
				performedByUserId
			}
		}
	}
`
// CREMATION LOG SAVE
export const CremationLogSaveMutation = gql`
	mutation cremationLogSave($input: CremationLogInput!) {
		CremationLogSave (input: $input) {
			Response {
				success
				message
			}
			CremationLog {
				${cremationLogFields}
				Cremations {
					${cremationFields}
					Order {
						companyName
						dateCreated
						deliveryAddressId
						deliveryMethodName
						deliveryMethodProductId
						memorialization
						orderId
						orderServiceStatus
						orderServiceStatusId
						orderStatus
						orderStatusId
						orderTypeId
						ownerEmail
						ownerFirstName
						ownerLastName
						ownerPhoneNumber
						petBreed
						petColor
						petFirstName
						petLastName
						petReferenceNumber
						pickupAddressId
						sex
						species
						speciesId
						weight
						weightUnits
					}
					UserEnd {
						userId
						firstName
						lastName
					}
					UserStart {
						userId
						firstName
						lastName
					}
				}
				Machine {
					active
					columns
					cremationLogId
					doCommunal
					doIndividual
					doPrivate
					isMultiChamber
					machineId
					machineName
					rows
				}
				User {
					firstName
					lastName
					userId
				}
			}
		}
	}
`;

// CREMATION LOG DELETE
export const CremationLogRemoveMutation = gql`
	mutation cremationLogRemove($cremationLogId: ID!) {
		CremationLogRemove (cremationLogId: $cremationLogId) {
			Response{
				success
				message
			}
		}
	}
`;

// CREMATION LIST PDF GENERATE
export const CremationsListPDFMutation = gql`
	mutation cremationsListPDF($input: CremationsListPDFInput!) {
		CremationsListPDF (input: $input) {
			jobId
		}
	}
`;
