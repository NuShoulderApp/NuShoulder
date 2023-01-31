const LogOrderActivtyFields = `
	logOrderActivityId: ID
	accountId: ID
	activity: String
	activityType: String
	dateCreated: DateTime
	dbField: String
	dbTable: String
	loggedInUserId: Int
	loggedInUserFirstName: String
	loggedInUserLastName: String
	orderId: ID
	showVet: Int
	userInitials: String
	valueNew: String
	valueOld: String
`;

export default `
	type LogOrderActivity {
		${LogOrderActivtyFields}
	}

	type DistinctColumnValues {
		activity: String
		activityType: String
		dbField: String
		dbTable: String
	}

	input LogOrderActivityInput {
		${LogOrderActivtyFields}
	}

	type LogOrderActivityResponse {
		LogOrderActivity: LogOrderActivity
		Response: Response
	}

	extend type RootMutation {
		logOrderActivitySave(input: LogOrderActivityInput!): LogOrderActivityResponse
	}

	extend type RootQuery {
		LogOrderActivities(userId: ID, dateEnd: String, dateStart: String, limit: Int): [LogOrderActivity]
		LogOrderActivitiesAtCrematory(orderQueue: String): [LogOrderActivity]
		LogOrderActivitiesDistinctColumnValues(columnName: String): [DistinctColumnValues]
	}
`;
