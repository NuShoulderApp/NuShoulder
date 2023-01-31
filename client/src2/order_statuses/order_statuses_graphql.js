import gql from 'graphql-tag';

const orderStatusFields = `
	active
	barcode
	defaultSortOrder
	editable
	orderStatus
	orderStatusId
	orderCompletedIndicator
	visibleOrderUpdater
	sortOrder
	statusAtCrematory
	statusAtVet
	statusInTransit
`;

// GET ONE ROUTE
export const getOrderStatusQuery = gql`
    query OrderStatus($orderStatusId: ID) {
		OrderStatus (orderStatusId: $orderStatusId) {
			${orderStatusFields}
		}
	}
`;

// GET ARRAY OF ROUTES
export const getOrderStatusesQuery = gql`
    query getOrderStatusesQuery {
		OrderStatuses {
			${orderStatusFields}
		}
	}
`;

// ROUTE SAVE
export const OrderStatusSaveMutation = gql`
	mutation OrderStatusSave($input: OrderStatusInput!) {
		OrderStatusSave (input: $input) {
            OrderStatus {
				${orderStatusFields}
			}
			OrderStatuses {
				${orderStatusFields}
			}
			Response {
				success
				message
			}
		}
	}
`;

// ROUTE DELETE
export const OrderStatusRemoveMutation = gql`
	mutation OrderStatusRemove($orderStatusId: ID!) {
		OrderStatusRemove (orderStatusId: $orderStatusId) {
			Response{
				success
				message
			}
		}
	}
`;

// ROUTE STOP REORDER SAVE
export const OrderStatusReorderMutation = gql`
	mutation OrderStatusReorder($input: OrderStatusReorderInput!) {
		OrderStatusReorder (input: $input) {
            OrderStatuses {
				${orderStatusFields}
			}
			Response {
				success
				message
			}
		}
	}
`;
