// Order is at vet, awaiting pickup
const ORDER_AWAITING_PICKUP = 1;
// Order is at crematory, awaiting delivery
const ORDER_AWAITING_DELIVERY = 9;
const ORDER_DELIVERY_COMPLETED = 4; // completed and delivered back to the vet hospital

// "Pickup Completed" means order is at crematory, ready to be processed. It's actually the 'at crematory' status
const ORDER_PICKUP_COMPLETED = 5;

// status ids for pet on delivery truck
const ORDER_OUT_FOR_DELIVERY = 8;
const ORDER_EN_ROUTE_TO_CREMATORY = 7;

//TODO: update theses ids

// orderStatusIds for orders that have been scanned at pickup/dropoff location, but the delivery
// has not been completed (completed means all pets accounted and signed for, or explicitly skipped)
const ORDER_DELIVERY_SCANNED_AT_VET = 10;
const ORDER_DELIVERY_SCANNED_AT_CREMATORY = 11;
const ORDER_PICKUP_SCANNED_AT_CREMATORY = 12;
const ORDER_PICKUP_SCANNED_AT_VET = 13;

// statuses that should be shown in pickup UI
const PICKUP_ORDER_STATUSES = [ ORDER_AWAITING_PICKUP, ORDER_PICKUP_SCANNED_AT_VET, ORDER_PICKUP_SCANNED_AT_CREMATORY ];
// statuses that should be shown in delivery UI
const DELIVERY_ORDER_STATUSES = [ ORDER_AWAITING_DELIVERY, ORDER_DELIVERY_SCANNED_AT_CREMATORY, ORDER_OUT_FOR_DELIVERY, ORDER_DELIVERY_SCANNED_AT_VET ];

// transitional statuses, used when a pet has been scanned in the process of delivering
export const SCANNED_ORDER_STATUSES = [ ORDER_PICKUP_SCANNED_AT_CREMATORY, ORDER_PICKUP_SCANNED_AT_VET, ORDER_DELIVERY_SCANNED_AT_CREMATORY, ORDER_DELIVERY_SCANNED_AT_VET ]

// Convert the status array into strings for easier comparison.
export const STR_PICKUP_ORDER_STATUSES = PICKUP_ORDER_STATUSES.map((i) => i.toString());
export const STR_DELIVERY_ORDER_STATUSES = DELIVERY_ORDER_STATUSES.map((i) => i.toString());
export const STR_SCANNED_ORDER_STATUSES = SCANNED_ORDER_STATUSES.map((i) => i.toString());

// DELIVERIES - FROM CREMATORY TO VET
// 11	ORDER_DELIVERY_SCANNED_AT_CREMATORY   -> 	8	ORDER_OUT_FOR_DELIVERY
// 10	ORDER_DELIVERY_SCANNED_AT_VET   -> 	4	Completed (Delivered) to the vet
//
// PICKUPS - FROM VET TO CREAMTORY
// 13	ORDER_PICKUP_SCANNED_AT_VET	-> 	7	ORDER_EN_ROUTE_TO_CREMATORY
// 12 ORDER_PICKUP_SCANNED_AT_CREMATORY -> 5 	ORDER_PICKUP_COMPLETED and at the crematory to start work


// Map for the classes, status label and new status when clicking the checkbox.
export const statusMap = {
	[ORDER_AWAITING_PICKUP] : {	orderClass: "danger", orderStatus: "Awaiting Pickup", nextStatusId: ORDER_PICKUP_SCANNED_AT_VET, previousStatusId: 0 },
	[ORDER_AWAITING_DELIVERY]: { orderClass: "danger", orderStatus: "Awaiting Delivery", nextStatusId: ORDER_DELIVERY_SCANNED_AT_CREMATORY, previousStatusId: 0 },
	[ORDER_OUT_FOR_DELIVERY]: {	orderClass: "danger", orderStatus: "Out For Delivery", nextStatusId: ORDER_DELIVERY_SCANNED_AT_VET, previousStatusId: 0 },
	[ORDER_EN_ROUTE_TO_CREMATORY]: { orderClass: "danger", orderStatus: "Returning to Crematory", nextStatusId: ORDER_PICKUP_SCANNED_AT_CREMATORY, previousStatusId: 0 },
	[ORDER_DELIVERY_COMPLETED]: { orderClass: "success", orderStatus: "Delivered" },
	[ORDER_PICKUP_COMPLETED]: {	orderClass: "danger", orderStatus: "Pickup Completed" },
	[ORDER_PICKUP_SCANNED_AT_CREMATORY]: { orderClass: "warning", orderStatus: "Scanned", nextStatusId: ORDER_PICKUP_COMPLETED, previousStatusId: ORDER_EN_ROUTE_TO_CREMATORY },
	[ORDER_PICKUP_SCANNED_AT_VET]: { orderClass: "warning", orderStatus: "Scanned", nextStatusId: ORDER_EN_ROUTE_TO_CREMATORY, previousStatusId: ORDER_AWAITING_PICKUP },
	[ORDER_DELIVERY_SCANNED_AT_CREMATORY]: { orderClass: "warning", orderStatus: "Scanned", nextStatusId: ORDER_OUT_FOR_DELIVERY, previousStatusId: ORDER_AWAITING_DELIVERY },
	[ORDER_DELIVERY_SCANNED_AT_VET]: { orderClass: "warning", orderStatus: "Scanned", nextStatusId: ORDER_DELIVERY_COMPLETED, previousStatusId: ORDER_OUT_FOR_DELIVERY }
};

export function getStatusClasses(order) {
	const statusId = parseInt(order.orderStatusId, 10);

	if(statusMap.hasOwnProperty(statusId)) {
		return statusMap[statusId];
	} else {
		return {
			orderClass: "danger",
			orderStatus: ""
		}
	}
}