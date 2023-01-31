import gql from 'graphql-tag';

const routeFields = `
	accountId	
	routeId
	routeName
	pickupDays
	monday
	tuesday
	wednesday
	thursday
	friday
	saturday
	sunday
	RouteStops {
		addressName
		address1
		address2
		addressTypeId
		city
		companyAddressId
		companyId
		companyName
		countryId
		deliveryInstructions
		postalCode
		state
		stateId
		routeId
		routeStopOrder
	}
`;

// GET ONE ROUTE
export const getDeliveryRouteQuery = gql`
    query Route($routeId: ID) {
		Route (routeId: $routeId) {
			${routeFields}
		}
	}
`;

// GET ARRAY OF ROUTES
export const getDeliveryRoutesQuery = gql`
    query getRoutesQuery {
		Routes {
			${routeFields}
		}
	}
`;

// ROUTE SAVE
export const DeliveryRouteSaveMutation = gql`
	mutation RouteSave($input: RouteInput!) {
		RouteSave (input: $input) {
            Route {
				${routeFields}
			}
			Routes {
				${routeFields}
			}
			Response {
				success
				message
			}
		}
	}
`;

// ROUTE DELETE
export const DeliveryRouteRemoveMutation = gql`
	mutation RouteRemove($routeId: ID!) {
		RouteRemove (routeId: $routeId) {
			Response{
				success
				message
			}
		}
	}
`;

// ROUTE STOP REORDER SAVE
export const DeliveryRouteReorderMutation = gql`
	mutation RouteReorder($input: RouteReorderInput!) {
		RouteReorder (input: $input) {
            RouteStops {
				addressName
				address1
				address2
				addressTypeId
				city
				companyAddressId
				companyId
				companyName
				countryId
				deliveryInstructions
				postalCode
				state
				stateId
				routeId
				routeStopOrder
			}
			Response {
				success
				message
			}
		}
	}
`;
