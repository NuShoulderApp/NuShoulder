import gql from 'graphql-tag';

export const LogOrderActivitySaveMutation = gql`
	mutation logOrderActivitySave($input: LogOrderActivityInput!) {
		logOrderActivitySave (input: $input) {
			LogOrderActivity {
                logOrderActivityId
				accountId
				activity
				activityType
				dateCreated
				dbField
				dbTable
				loggedInUserId
				loggedInUserFirstName
				loggedInUserLastName
				orderId
				showVet
				userInitials
				valueNew
				valueOld
			}
		}
	}
`;

export const GetLogOrderActivities = gql`
	query LogOrderActivities($userId: ID, $dateEnd: String, $dateStart: String, $limit: Int){
		LogOrderActivities (dateEnd: $dateEnd, dateStart: $dateStart, limit: $limit, userId: $userId) {
			logOrderActivityId
			accountId
			activity
			activityType
			dateCreated
			dbField
			dbTable
			loggedInUserId
			loggedInUserFirstName
			loggedInUserLastName
			orderId
			showVet
			userInitials
			valueNew
			valueOld
		}
	}
`;

export const GetLogOrderActivitiesAtCrematory = gql`
	query LogOrderActivitiesAtCrematory($orderQueue: String) {
		LogOrderActivitiesAtCrematory(orderQueue: $orderQueue) {
			logOrderActivityId
			accountId
			activity
			activityType
			dateCreated
			dbField
			dbTable
			loggedInUserId
			loggedInUserFirstName
			loggedInUserLastName
			orderId
			showVet
			userInitials
			valueNew
			valueOld
		}
	}
`;

export const GetLogOrderActivitiesDistinctColumnValues = gql`
	query LogOrderActivitiesDistinctColumnValues($columnName: String){
		LogOrderActivitiesDistinctColumnValues (columnName: $columnName) {
			activity
			activityType
			dbField
			dbTable
		}
	}
`;



