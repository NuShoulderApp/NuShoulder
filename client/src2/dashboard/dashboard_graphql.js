import gql from 'graphql-tag';

// Get all of the open orders for a given company. Specifically the cremation type orders that have memorializationCheckedOut != 1
export const getOpenOrdersQuery = gql`
	query getOpenOrders($companyId: ID!) {
		OpenOrders (companyId: $companyId) {
			orderId
		}
	}
`;

// Get all of the orders that are on hold for a given company.
export const getOrdersHoldsQuery = gql`
	query getOrdersHolds($companyId: ID!) {
		OrdersHolds (companyId: $companyId) {
			orderId
		}
	}
`;

// Get the orders for a given company with the given orderTypeId that are still not completed
export const getOrdersInProcessQuery = gql`
	query getOrdersInProcess($companyId: ID!, $orderTypeId: ID!) {
		OrdersInProcess (companyId: $companyId, orderTypeId: $orderTypeId) {
			orderId
		}
	}
`;

// Get all of the orders that have a given status for a given company.
export const getOrdersWithStatusQuery = gql`
	query getOrdersWithStatus($companyId: ID!, $orderStatusId: ID!) {
		OrdersWithStatus (companyId: $companyId, orderStatusId: $orderStatusId) {
			orderId
		}
	}
`;
