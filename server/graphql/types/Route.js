export default `
	type Route {
		accountId: ID
		routeName: String
		routeId: ID
		pickupDays: String
		monday: Int
		tuesday: Int
		wednesday: Int
		thursday: Int
		friday: Int
		saturday: Int
		sunday: Int
		RouteStops: [CompanyAddress]
	}

	input RouteInput {
		accountId: ID
		routeName: String!
		routeId: ID
		pickupDays: String
		monday: Int
		tuesday: Int
		wednesday: Int
		thursday: Int
		friday: Int
		saturday: Int
		sunday: Int
	}

	type RouteStopResult {
		Response: Response
		jobId: ID
	}

	input RouteReorderInput {
		companyAddressId: ID
		routeId: ID
		routeStopOrderOld: Int
		routeStopOrderNew: Int
	}

	input RouteStopInput {
		addressId: ID
		companyId: ID
		driverId: ID
		orders: [OrderInput]
		orderStatusId: ID
		routeId: ID
		signatureData: String
		routeStopType: String
	}

	type RouteResponse {
		Route: Route
		Routes: [Route]
		Response: Response
	}

	type RouteReorderResponse {
		RouteStops: [CompanyAddress]
		Response: Response
	}

	extend type RootQuery {
		Route(routeId: ID): Route
		Routes: [Route]
		getRouteAddresses(routeId: ID): [CompanyAddress]
	}

	extend type RootMutation {
		completeRouteStop(input: RouteStopInput): RouteStopResult
		RouteReorder(input: RouteReorderInput!): RouteReorderResponse
		RouteSave(input: RouteInput!): RouteResponse
	}
`;
