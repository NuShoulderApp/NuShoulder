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

export const getCompanyRouteQuery = gql`
    query getCompanyAddresses($companyId: ID) {
		CompanyAddresses (companyId: $companyId) {
            Route {
				pickupDays
			}
		}
	}
`

// GET SINGLE DELIVERY LOG
export const getDeliveryLogQuery = gql`
    query getDeliveryLogQuery($deliveryLogId: ID) {
		DeliveryLog(deliveryLogId: $deliveryLogId) {
			companyId
			dateCreated
			deliveryLogId
			DeliveryLogOrder {
				deliveryLogOrderId
				deliveryLogId
				deliveryType
				Order {
					orderId
					ProductOptions {
					    optionName
					    orderProductId
					    orderProductProductOptionId
					    productAttributeId
					    productOptionId
					    productOptionValueId
					    textString
					    valueLabel
					}
					ProductsOrder {
						orderProductId
						productModel
						productName
					}
				}
			}
			deliveryType
			routeId
		}
	}
`;

// GET SINGLE ORDER DELIVERY LOGs
export const getDeliveryLogOrderDetailsQuery = gql`
    query getDeliveryLogOrderDetailsQuery($orderId: ID) {
		DeliveryLogOrderDetails(orderId: $orderId) {
			dateCreated
			deliveryLogId
			deliveryLogOrderId
			deliveryType
			firstName
			lastName
			routeName
			signatureData
			signatureFirstName
			signatureLastName
		}
	}
`;

// GET ARRAY OF DELIVERY LOGS
export const getDeliveryLogsQuery = gql`
    query getDeliveryLogsQuery($companyIds: String, $dateEnd: Date, $dateStart: Date, $routeIds: String) {
		DeliveryLogs(companyIds: $companyIds, dateEnd: $dateEnd, dateStart: $dateStart, routeIds: $routeIds) {
			companyId
			dateCreated
			deliveryLogId
			DeliveryLogOrder {
				deliveryLogOrderId
				deliveryLogId
				deliveryType
			}
			deliveryType
			routeId
		}
	}
`;

// GET COMPANIES WHICH HAVE DELIVERY LOGS FOR THE ACCOUNT
export const getDeliveryLogCompaniesQuery = gql`
    query getDeliveryLogCompaniesQuery {
		DeliveryLogCompanies {
			companyId
			companyName
		}
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
