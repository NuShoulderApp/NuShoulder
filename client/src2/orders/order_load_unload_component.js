import { compose, graphql } from 'react-apollo';
import { Field, withFormik } from "../utilities/IWDFormik";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PrintButton } from './pdf_print_button_component';
import moment from 'moment';
import { NavLink } from "react-router-dom";
import React from 'react';
import { Translate, withTranslate } from "../translations/IWDTranslation";
import withState from "react-state-hoc";
import { withMutation, queryWithLoading } from "../utilities/IWDDb";
import { withSession } from "../utilities/session";

import { getStatusClasses, SCANNED_ORDER_STATUSES, statusMap, STR_SCANNED_ORDER_STATUSES } from "./orders_constants";

// GRAPHQL QUERY
import {
	getOrderStatusesQuery,
	GetRoutes,
	GetRoutesOrderQueue,
	GetRouteAddresses,
	OrderUpdateSubscription,
	OrderSaveMutation,
	completeRouteStopMutation,
} from "./orders_graphql";

/*
	Load Status Path:	ORDER_AWAITING_DELIVERY 9 ->		ORDER_DELIVERY_SCANNED_AT_CREMATORY 11 	->	ORDER_OUT_FOR_DELIVERY 8
	Unload Status Path: ORDER_EN_ROUTE_TO_CREMATORY 7 ->	ORDER_PICKUP_SCANNED_AT_CREMATORY	12 ->	ORDER_PICKUP_COMPLETED 5
*/

// This function handles the filtering of orders for Unload. Each filter input is a state variable, and onChange, there is a setState to update that value, which causes a rerender of the function. So there is no need for a filter button.
function OrderFilterContent(props) {
	const {
		cremationType,
		furClippingNeeded,
		memorializationStatus,
		message,
		Orders,
		pawPrintNeeded,
		routeStopType,
		title
	} = props;

	let FilteredOrders = Orders;

	// MEMORIALIZATION STATUS
	if(memorializationStatus === 'Open') {
		FilteredOrders = FilteredOrders.filter((order) => order.memorializationCheckedOut === null || order.memorializationCheckedOut === 0);
	} else if(memorializationStatus === 'Closed') {
		FilteredOrders = FilteredOrders.filter((order) => order.memorializationCheckedOut === 1);
	}

	// CREMATION TYPE
	if(cremationType === 'Communal') {
		FilteredOrders = FilteredOrders.filter((order) => order.ProductsOrder.findIndex((product) => product.productCategory === 'Cremations' && product.productName === 'Communal Cremation') > -1);
	} else if(cremationType === 'Individual') {
		FilteredOrders = FilteredOrders.filter((order) => order.ProductsOrder.findIndex((product) => product.productCategory === 'Cremations' && product.productName === 'Individual Cremation') > -1);
	} else if(cremationType === 'Private') {
		FilteredOrders = FilteredOrders.filter((order) => order.ProductsOrder.findIndex((product) => product.productCategory === 'Cremations' && product.productName === 'Private Cremation') > -1);
	}

	// PAW PRINT NEEDED
	if(pawPrintNeeded === 'Yes') {
		FilteredOrders = FilteredOrders.filter((order) => order.ProductsOrder.findIndex((product) => product.statusIsPawPrint === 1) > -1);
	} else if(pawPrintNeeded === 'No') {
		FilteredOrders = FilteredOrders.filter((order) => order.ProductsOrder.findIndex((product) => product.statusIsPawPrint === 1) === -1);
	}

	// FUR CLIPPING NEEDED
	if(furClippingNeeded === 'Yes') {
		FilteredOrders = FilteredOrders.filter((order) => order.ProductsOrder.findIndex((product) => product.statusIsFurClipping === 1) > -1);
	} else if(furClippingNeeded === 'No') {
		FilteredOrders = FilteredOrders.filter((order) => order.ProductsOrder.findIndex((product) => product.statusIsFurClipping === 1) === -1);
	}

	return (
		<React.Fragment>
			{/* Filtering for Unloading */}
			{/* {
				FilteredOrders.length > 0 &&
				<div className="row mt-3 mb-3">
					<div className="col-auto">
						<Translate id="Memorialization Status" />
						<Field component="select" name="memorializationStatus" onChange={(event) => setState({memorializationStatus: event.target.value})} value={memorializationStatus}>
							<option value="All">{props.translate('All')}</option>
							<option value="Open">{props.translate('Open')}</option>
							<option value="Closed">{props.translate('Closed')}</option>
						</Field>
					</div>
					<div className="col-auto">
						<Translate id="Cremation Type" />
						<Field component="select" name="cremationType" onChange={(event) => setState({cremationType: event.target.value})} value={cremationType}>
							<option value="All">{props.translate('All')}</option>
							<option value="Communal">{props.translate('Communal')}</option>
							<option value="Individual">{props.translate('Individual')}</option>
							<option value="Private">{props.translate('Private')}</option>
						</Field>
					</div>
					<div className="col-auto">
						<Translate id="Paw Print Needed" />
						<Field component="select" name="pawPrintNeeded" onChange={(event) => setState({pawPrintNeeded: event.target.value})} value={pawPrintNeeded}>
							<option value="All">{props.translate('All')}</option>
							<option value="Yes">{props.translate('Yes')}</option>
							<option value="No">{props.translate('No')}</option>
						</Field>
					</div>
					<div className="col-auto">
						<Translate id="Fur Clipping Needed" />
						<Field component="select" name="furClippingNeeded" onChange={(event) => setState({furClippingNeeded: event.target.value})} value={furClippingNeeded}>
							<option value="All">{props.translate('All')}</option>
							<option value="Yes">{props.translate('Yes')}</option>
							<option value="No">{props.translate('No')}</option>
						</Field>
					</div>
				</div>
			} */}
			<OrderList
				message={message}
				Orders={FilteredOrders}
				routeStopType={routeStopType}
				title={title}
			/>
		</React.Fragment>
	)
}

const OrderFilter = compose(
	withState({
		cremationType: 'All',
		furClippingNeeded: 'All',
		memorializationStatus: 'All',
		pawPrintNeeded: 'All'
	}),
	withTranslate
)(OrderFilterContent);


function PickupsDeliveriesContent(props) {
	let { activeOrders } = props;

	const {
		history,
		match: {
			params: {
				routeId = 1
			}
		},
		message,
		Orders: {
			OrderWorkQueue: {
				orders
			}
		},
		RouteAddresses: {
			getRouteAddresses
		},
		Routes: {
			Routes
		}
	} = props;

	const load = props.LoadUnload === "Load";

	// Get the active orders, exclued order on hold, Check the proper address to make sure they are part of the route.
	// -1 is Expedited Routes
	if(parseInt(routeId) === -1) {
		// In order to sort by if there is an expedited cremation on the order, we will do a forEach and add a 'hasExpeditedCremation' flag to each order, then sort on that.
		orders.forEach((order => {
			const expeditedIndex = order.ProductsOrder.findIndex((product) => product.productName === 'Expedited Cremation');
			if(expeditedIndex > -1) {
				order.hasExpeditedCremation = 1;
			} else {
				order.hasExpeditedCremation = 0;
			}
		}))
		// Do the same filtering as on a normal route, except only do orders with expedited cremation as a product
		activeOrders = orders
			.filter((order) => (order.OrderHold.length === 0 || (order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved !== null)) && order.hasExpeditedCremation === 1)
			.filter(( { deliveryAddressId, pickupAddressId } ) => getRouteAddresses.some(( { addressId } ) => addressId === (load ? deliveryAddressId : pickupAddressId) ) );
	} else {
		activeOrders = orders
			.filter((order) => order.OrderHold.length === 0 || (order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved !== null))
			.filter(( { deliveryAddressId, pickupAddressId } ) => getRouteAddresses.some(( { addressId } ) => addressId === (load ? deliveryAddressId : pickupAddressId) ) );
	}

	// let width = window.innerWidth;
	// let mediumWidth = 768;

	// handler for submitting mutation to update statuses and save signature
	return (
		<div className="w-100">
			<div className="p-3">
				<div className="mb-3">
					{/* Select a route to display pickup/delivery information */}
					<Field component="select" name="routeId" onChange={(e) => history.push(props.match.path.replace("/:routeId?","") + "/" + e.target.value)} value={routeId}>
						<option value="0" key="0">{props.translate('Select a Route')}</option>
						{/* <option value="-1" key="-1">{props.translate('Expedited Route')}</option> */}
						{Routes.map((route) => {
							return <option value={route.routeId} key={route.routeId}>{props.translate(route.routeName)}</option>
						})}
					</Field>
				</div>
				{
					props.LoadUnload === 'Unload' &&
					<OrderFilter
						message={message}
						Orders={activeOrders}
						routeStopType={props.LoadUnload}
						title={`Orders to ${props.LoadUnload}`}
					/>
				}
				{
					props.LoadUnload === 'Load' &&
					<OrderList
						message={message}
						Orders={activeOrders}
						routeStopType={props.LoadUnload}
						title={`Orders to ${props.LoadUnload}`}
					/>
				}

				{/*
					routeId !== 0 && activeOrders.length === 0 &&
					<div>There are no orders to {props.LoadUnload.toLowerCase()} for this route.</div>
				*/}
			</div>
		</div>
	);
}

export const LoadUnloadComponent = compose(
	queryWithLoading({ gqlString: GetRoutes, name: "Routes"}),
	queryWithLoading({ gqlString: GetRoutesOrderQueue, name: "Orders", variablesFunction: ({ LoadUnload }) => ({ orderQueue: LoadUnload === "Unload" ? "DELIVERIES_TO_UNLOAD" : "DELIVERIES_TO_LOAD" })}),
	queryWithLoading({ gqlString: GetRouteAddresses, name: "RouteAddresses", variablesFunction: ({ match: { params: { routeId = 1 } }}) => ({ routeId})}),
	// Attach the subscription.  Will update the cache automatically.
	graphql(OrderUpdateSubscription),
	withFormik(),
	withTranslate
)(PickupsDeliveriesContent);


const OrderList = compose(
	queryWithLoading({ gqlString: getOrderStatusesQuery, name: "OrderStatuses"}),
	withState({
		jobId: 0,
		message: '',
		petReferenceNumber: '',
		orderStatusId: "5",
		showOrders: false,
		signatureData: "",
		success: ''
	}),
	withSession,
	withMutation(OrderSaveMutation, "orderSave", ["OrderQueue"]),
	withMutation(completeRouteStopMutation, "completeRouteStop", ["OrderQueue"])
)(OrderListContent);

// Needs to filter orders by queue, then render
function OrderListContent(props) {
	const {
		jobId,
		message,
		Orders,
		orderStatusId,
		OrderStatuses: { OrderStatuses },
		petReferenceNumber,
		setState,
		success,
		title="Orders",
		orderSave,
		routeStopType
	} = props;

	async function completeStop() {
		let completeRouteStop = {
			orders: scannedItems.map(({ orderId, orderStatusId }) => ({ orderId, orderStatusId })),
			driverId: props.Session.User.userId,
			routeStopType
		};

		// For the Unload Pickups, we give the option to select what the orderStatusId is updated to in the completeRouteStop mutation
		if(routeStopType === 'Unload') {
			completeRouteStop = {...completeRouteStop, orderStatusId};
		}

		const { data: {completeRouteStop: {jobId}}} = await props.completeRouteStop({ input: completeRouteStop });

		setState({jobId, orderStatusId: "5", showOrders: false})
	}

	const scannedItems = Orders.filter(({ orderStatusId }) => STR_SCANNED_ORDER_STATUSES.includes(orderStatusId) );
	// scannedOrderIds is used for the Print Product Stickers button next to the save button.
	const scannedOrderIds = scannedItems.map(({orderId}) => (orderId));

	let width = window.innerWidth;
	let mediumWidth = 768;

	let alertStatusClass = '';
	if(success === true) {
		alertStatusClass = 'alert alert-success';
	} else if(success === false) {
		alertStatusClass = 'alert alert-danger';
	}

	// Order has been scanned or checked/unchecked. Update order status accordingly
	async function onClick(checked, order, barcode=false) {
		const statusId = parseInt(order.orderStatusId, 10);
		// Choose the next status based on current status.
		// Should only toggle scanned state, shouldn't proceed to next delivery step.
		// This will update the checkbox's checked state as well as the status badge
		const nextStatusId = statusMap.hasOwnProperty(statusId) ?	statusMap[statusId].nextStatusId: statusId;
		const previousStatusId = statusMap.hasOwnProperty(statusId) ?	statusMap[statusId].previousStatusId: statusId;
		if(order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved === null) {
			setState({jobId: 0, message: 'This order currently has a hold placed on it.', success: false});
		} else if(barcode===true) {
			// If the current state is not a scanned state, then we will move to the next status.
			if(STR_SCANNED_ORDER_STATUSES.includes(order.orderStatusId) === false) {
				const orderSaveResponse = await orderSave({ input: { orderId: order.orderId, orderStatusId: nextStatusId }});
				if(orderSaveResponse.data.orderSave.Response.success === true) {
					return {message: `${order.petReferenceNumber} Scanned Successfully`, success: true};
				} else {
					return orderSaveResponse.data.orderSave.Response;
				}
			} else {
				// If they rescan the same barcode or enter the same pet reference number, let them know that no action was taken.
				return { message: 'This order already scanned.', success: true };
			}
		} else {
			// If the checkbox is clicked, go to the next status, otherwise go to the previous.
			const newStatusId = checked ? nextStatusId : previousStatusId;

			if (newStatusId !== statusId) {
				setState({jobId: 0, message: 'Order Updated.', success: true});
				await orderSave({ input: { orderId: order.orderId, orderStatusId: newStatusId }});
			}
		}
	}

	async function handlePetReferenceNumberChange(value) {
		let tempValue = value.trim();
		// Always clear out any of the success/warning messages when the input value is updated
		setState({message: '', petReferenceNumber: tempValue, success: ''});
		// When the value is 7 characters long, check to see if it matches any of the orders that are at this location
		if(tempValue.length === 7 || tempValue.length === 8) {
			// See if this pet reference number matches any in the Order for this area.
			const order = Orders.find((order) => order.petReferenceNumber.toUpperCase() === tempValue.toUpperCase());

			if(order) {
				if(order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved === null) {
					setState({message: 'This order currently has a hold placed on it.', success: false})
				} else {
					// Perform the save action as if the checkbox were clicked - calling from this function will only check the box, it will not uncheck it
					let onClickResponse = await onClick(true, order, true);
					// If successful, then also clear out the petReferenceNumber
					if(onClickResponse.success === true) {
						setState({jobId: 0, message: onClickResponse.message, petReferenceNumber: '', success: onClickResponse.success});
					} else {
						setState({message: onClickResponse.message, success: onClickResponse.success});
					}
				}
			} else {
				setState({message: 'Pet Reference Number does not match any pickups or deliveries for this location.', success: false});
			}
		}
	}

	// Filter Order Statuses down to ones that are flagged orderCompletedIndicator=0 and statusAtCrematory=1
	const filteredOrderStatuses = OrderStatuses.filter((status) => status.statusAtCrematory === 1 && status.orderCompletedIndicator === 0 && status.visibleOrderUpdater === 1);

	///////////////////////// IMPORTANT!!!!!!!!!!!! ////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////
	// ANY CHANGES MADE IN THE TOP IF NEED TO ALSO BE MADE IN THE ELSE.
	if (width >= mediumWidth) {
		return (
			<React.Fragment>
				<div className="row">
					<div className="col">
						{
							Orders.length > 0 &&
							<div className="p-2 bg-secondary mb-0">
								{/* INPUT TO SCAN BARCODES INTO FOR THIS ORDER */}
								<div className="form-inline float-right w-50 mt-n-1 text-right">
									<div className="input-group ml-auto w-100">
										<input type="text" className="form-control" placeholder="Scan / Enter Pet Reference Number" name="petReferenceNumber" value={petReferenceNumber} onChange={(event) => handlePetReferenceNumberChange(event.target.value)} autoComplete="off" autoCorrect="off"  autoCapitalize="none" spellCheck="false" />
									</div>
								</div>
								<span className="h4 text-white">{title}</span>
							</div>
						}
						{message !== '' &&
							<div className={alertStatusClass}>{message}</div>
						}
						<table className="table table-striped">
							<thead>
								<tr>
									<th></th>
									<th>Order Date</th>
									<th>Reference #</th>
									<th>Pet Name</th>
									<th>Order Status</th>
									<th>Order Info</th>
								</tr>
							</thead>
							<tbody>
								{ Orders.map((order) => {
									const {
										orderClass,
										orderStatus
									} =	getStatusClasses(order);

									// if the pet's order status indicates that its barcode has been scanned, make sure the badge and checkbox match
									const checked = SCANNED_ORDER_STATUSES.includes(parseInt(order.orderStatusId, 10));

									const cremationProduct = order.ProductsOrder.find((product) => product.productCategory === 'Cremations');
									const expeditedCremationProduct = order.ProductsOrder.find((product) => product.productName === 'Expedited Cremation');
									const visitationProduct = order.ProductsOrder.find((product) => product.productName === 'Visitation & Viewing');
									const pawPrintProduct = order.ProductsOrder.find((product) => (parseInt(product.isPawPrint) === 1 || parseInt(product.requiresPawPrint) === 1));
									const furClippingProduct = order.ProductsOrder.find((product) => parseInt(product.isFurClipping) === 1);

									// Is Memorialization Time Open, Time Closed, Manually Completed, Reopened by Crematory?
									let memorializationOpen = true;			// memorialization is still available
									let memorializationCompleted = true;	// memorialization manually completed in clinic or at home
									let memorializationReopened = true;		// memorialization is available again
									// if Reopened by Staff - OPEN
									if(order.tabMemorializationOpen === 1) {
										memorializationOpen = true;
										memorializationCompleted = false;
										memorializationReopened = true;
									}
									// else if Manually Completed - COMPLETED at ____
									else if (order.memorializationCheckedOut === 1) {
										memorializationOpen = false;
										memorializationCompleted = true;
										memorializationReopened = false;
									}
									// else if Time Closed - CLOSED
									else if (moment().diff(moment(order.dateMemorializationEnds)) > 0) {
										memorializationOpen = false;
										memorializationCompleted = false;
										memorializationReopened = false;
									}
									// else if Time Open - OPEN
									else if (moment().diff(moment(order.dateMemorializationEnds)) <= 0) {
										memorializationOpen = true;
										memorializationCompleted = false;
										memorializationReopened = false;
									}

									return (
										<tr key={order.orderId}>
											<td>
												<div className="pretty p-default p-pulse mr-0">
													<input className="form-check-input" type="checkbox" checked={checked} disabled={!checked} onChange={({ target: { checked } }) => onClick(checked, order)} />
													<div className="state p-primary form-check-label"><label>&nbsp;</label></div>
												</div>
											</td>
											<td>{moment(order.dateCreated).format('MMM DD, YYYY h:mm A')}
												<br />{order.companyName}
											</td>
											<td><h5 className="m-0"><NavLink to={`/orders/orderId/${order.orderId}`} activeClassName="active">{order.petReferenceNumber}</NavLink></h5></td>
											<td>{order.petFirstName} {order.petLastName} <small className="text-muted">({order.weight} {order.weightUnits})</small></td>
											<td>
												<span className="h5 m-0">
													<span className={`badge badge-${orderClass} p-2 text-uppercase`}>{orderStatus}</span>
													{order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved === null &&
														<span className={`badge badge-warning p-2 ml-2 text-uppercase`}>On Hold</span>
													}
													{ order.orderTypeId === 2 && routeStopType === 'Unload' && <React.Fragment>
														<br />
														{ order.memorialization === 'none' && <span className="h5 m-0"><span className="badge badge-success p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id="No Memorialization" /></span><br /></span> }

														{ order.memorialization !== 'none' && <React.Fragment>
															{memorializationOpen === true && memorializationCompleted === false && <React.Fragment>

																	{memorializationReopened === false && <span className="badge badge-danger p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Open" /></span>}
																	{memorializationReopened === true && <span className="badge badge-danger p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Reopened" /></span>}

															</React.Fragment>}
															{memorializationOpen === false && memorializationCompleted === false && <span className="h5 m-0">
																<span className="badge badge-warning p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Closed" /></span>
															</span>}
															{memorializationOpen === false && memorializationCompleted === true && <span className="h5 m-0">
																<span className="badge badge-success p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Completed at" /> {order.memorialization}</span>
															</span>}
														</React.Fragment>}
													</React.Fragment>}

												</span>
											</td>
											<td>
												{cremationProduct !== undefined && cremationProduct.productName === "Communal Cremation" && <span className="fa-layers fa-2x">
														<FontAwesomeIcon icon="circle" color={"black"} />
														<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
														<strong className="fa-layers-text small">C</strong>
													</span>}
												{cremationProduct !== undefined && cremationProduct.productName === "Individual Cremation" && <span className="fa-layers fa-2x">
														<FontAwesomeIcon icon="circle" color={"black"} />
														<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
														<strong className="fa-layers-text small">I</strong>
													</span>}
												{cremationProduct !== undefined && cremationProduct.productName === "Private Cremation" && <span className="fa-layers fa-2x">
														<FontAwesomeIcon icon="circle" color={"black"} />
														<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
														<strong className="fa-layers-text small">P</strong>
													</span>}
												{expeditedCremationProduct !== undefined && <span className="fa-layers fa-2x">
														<FontAwesomeIcon icon="circle" color={"black"} />
														<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
														<strong className="fa-layers-text small">E</strong>
													</span>}
												{visitationProduct !== undefined && <span className="fa-layers fa-2x">
														<FontAwesomeIcon icon="circle" color={"black"} />
														<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
														<strong className="fa-layers-text small">V</strong>
													</span>}
												{pawPrintProduct !== undefined && <span className="fa-layers fa-2x">
														<FontAwesomeIcon icon="circle" color={"black"} />
														<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
														<FontAwesomeIcon icon="paw" transform="shrink-8" />
													</span>}
												{furClippingProduct !== undefined && <span className="fa-layers fa-2x">
														<FontAwesomeIcon icon="circle" color={"black"} />
														<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
														<FontAwesomeIcon icon="cut" transform="shrink-8" />
													</span>}

											</td>
										</tr>
									)
									})
								}
								{
									Orders.length === 0 &&
									<tr>
										<td colSpan="5">There are no {title} for this address.</td>
									</tr>
								}
							</tbody>
						</table>
					</div>
				</div>
				{routeStopType === 'Unload' && Orders.length > 0 &&
					<div className="row">
						<div className="col-auto">
							<Translate id="Update Order Status To" />:
							<Field value={orderStatusId} name="orderStatusId" component="select" className="form-control" onChange={(event) => setState({orderStatusId: event.target.value})}>
								{filteredOrderStatuses.map((status) => {
									return <option value={status.orderStatusId} key={status.orderStatusId}>{status.orderStatus}</option>
								})}
							</Field>
						</div>
					</div>
				}
				<div className="mt-1">
					<button type="button" disabled={scannedOrderIds.length === 0 || jobId > 0} onClick={completeStop} className="btn btn-success btn-addon mr-2">
						<FontAwesomeIcon icon="check" />
						{routeStopType === 'Unload' && <Translate id="SAVE and PRINT" />}
						{routeStopType === 'Load' && <Translate id="SAVE" />}
					</button>
					{parseInt(jobId) > 0 &&
						<PrintButton disableButton={false} jobId={jobId} orderId={0} printableName="Pre Cremation Product Stickers" />
					}
				</div>
			</React.Fragment>
		);
	} else{
		return (
			<div className="row">
				<div className="col">
					{/* INPUT TO SCAN BARCODES INTO FOR THIS ORDER */}
					<div className="form-inline w-100 mb-3">
						{
							Orders.length > 0 &&
							<div className="input-group ml-auto w-100">
								<input type="text" className="form-control" placeholder="Scan / Enter Pet Reference Number" name="petReferenceNumber" value={petReferenceNumber} onChange={(event) => handlePetReferenceNumberChange(event.target.value)} autoComplete="off" autoCorrect="off"  autoCapitalize="none" spellCheck="false" />
							</div>
						}
						{message !== '' &&
							<div className={alertStatusClass}>{message}</div>
						}
					</div>
					{ Orders.map((order) => {
						const {
							orderClass,
							orderStatus
						} =	getStatusClasses(order);

						// if the pet's order status indicates that its barcode has been scanned, make sure the badge and checkbox match
						const checked = SCANNED_ORDER_STATUSES.includes(parseInt(order.orderStatusId, 10));

						const cremationProduct = order.ProductsOrder.find((product) => product.productCategory === 'Cremations');
						const expeditedCremationProduct = order.ProductsOrder.find((product) => product.productName === 'Expedited Cremation');
						const visitationProduct = order.ProductsOrder.find((product) => product.productName === 'Visitation & Viewing');
						const pawPrintProduct = order.ProductsOrder.find((product) => (parseInt(product.isPawPrint) === 1 || parseInt(product.requiresPawPrint) === 1));
						const furClippingProduct = order.ProductsOrder.find((product) => parseInt(product.isFurClipping) === 1);

						// Is Memorialization Time Open, Time Closed, Manually Completed, Reopened by Crematory?
						let memorializationOpen = true;			// memorialization is still available
						let memorializationCompleted = true;	// memorialization manually completed in clinic or at home
						let memorializationReopened = true;		// memorialization is available again
						// if Reopened by Staff - OPEN
						if(order.tabMemorializationOpen === 1) {
							memorializationOpen = true;
							memorializationCompleted = false;
							memorializationReopened = true;
						}
						// else if Manually Completed - COMPLETED at ____
						else if (order.memorializationCheckedOut === 1) {
							memorializationOpen = false;
							memorializationCompleted = true;
							memorializationReopened = false;
						}
						// else if Time Closed - CLOSED
						else if (moment().diff(moment(order.dateMemorializationEnds)) > 0) {
							memorializationOpen = false;
							memorializationCompleted = false;
							memorializationReopened = false;
						}
						// else if Time Open - OPEN
						else if (moment().diff(moment(order.dateMemorializationEnds)) <= 0) {
							memorializationOpen = true;
							memorializationCompleted = false;
							memorializationReopened = false;
						}

						return (
							<div key={order.orderId} className="border-bottom pb-3 mb-3">
								<h5 className="clearfix"><span className="float-right mt-n-2">
										{cremationProduct !== undefined && cremationProduct.productName === "Communal Cremation" && <span className="fa-layers fa-2x">
												<FontAwesomeIcon icon="circle" color={"black"} />
												<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
												<strong className="fa-layers-text small">C</strong>
											</span>}
										{cremationProduct !== undefined && cremationProduct.productName === "Individual Cremation" && <span className="fa-layers fa-2x">
												<FontAwesomeIcon icon="circle" color={"black"} />
												<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
												<strong className="fa-layers-text small">I</strong>
											</span>}
										{cremationProduct !== undefined && cremationProduct.productName === "Private Cremation" && <span className="fa-layers fa-2x">
												<FontAwesomeIcon icon="circle" color={"black"} />
												<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
												<strong className="fa-layers-text small">P</strong>
											</span>}
										{expeditedCremationProduct !== undefined && <span className="fa-layers fa-2x">
												<FontAwesomeIcon icon="circle" color={"black"} />
												<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
												<strong className="fa-layers-text small">E</strong>
											</span>}
										{visitationProduct !== undefined && <span className="fa-layers fa-2x">
												<FontAwesomeIcon icon="circle" color={"black"} />
												<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
												<strong className="fa-layers-text small">V</strong>
											</span>}
										{pawPrintProduct !== undefined && <span className="fa-layers fa-2x">
												<FontAwesomeIcon icon="circle" color={"black"} />
												<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
												<FontAwesomeIcon icon="paw" transform="shrink-8" />
											</span>}
										{furClippingProduct !== undefined && <span className="fa-layers fa-2x">
												<FontAwesomeIcon icon="circle" color={"black"} />
												<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
												<FontAwesomeIcon icon="cut" transform="shrink-8" />
											</span>}
									</span>
									<div className="pretty p-default p-pulse mr-0">
										<input className="form-check-input" type="checkbox" checked={checked} disabled={!checked} onChange={({ target: { checked } }) => onClick(checked, order)} />
										<div className="state p-primary form-check-label"><label><span className="text-dark">{order.petFirstName} {order.petLastName}</span> <small className="text-muted">({order.weight} {order.weightUnits})</small></label></div>
									</div>
								</h5>
								<p className="mb-0">
									<span className="h5"><NavLink to={`/orders/orderId/${order.orderId}`} className="float-right" activeClassName="active">{order.petReferenceNumber}</NavLink></span>
									<span className={`badge badge-${orderClass} p-2 text-uppercase`}>{orderStatus}</span>

									{order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved === null && <React.Fragment>
										<br /><span className={`badge badge-warning p-2 ml-2 text-uppercase`}>On Hold</span>
									</React.Fragment>}
									{ order.orderTypeId === 2 && routeStopType === 'Unload' && <React.Fragment>
										<br />
										{ order.memorialization === 'none' && <p className="m-0"><span className="badge badge-success p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id="No Memorialization" /></span><br /></p> }

										{ order.memorialization !== 'none' && <React.Fragment>
											{memorializationOpen === true && memorializationCompleted === false && <React.Fragment>
												<p className="m-0">
													{memorializationReopened === false && <span className="badge badge-danger p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Open" /></span>}
													{memorializationReopened === true && <span className="badge badge-danger p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Reopened" /></span>}
												</p>
											</React.Fragment>}
											{memorializationOpen === false && memorializationCompleted === false && <p className="m-0">
												<span className="badge badge-warning p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Closed" /></span>
											</p>}
											{memorializationOpen === false && memorializationCompleted === true && <p className="m-0">
												<span className="badge badge-success p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Completed at" /> {order.memorialization}</span>
											</p>}
										</React.Fragment>}
									</React.Fragment>}
								</p>
								<p className="mb-0 text-muted small">Order Date: {moment(order.dateCreated).format('MMM DD, YYYY h:mm A')}
									<br />{order.companyName}</p>
							</div>
						)
						})
					}
					{
						Orders.length === 0 &&
						<div>
							<p className="alert alert-info">There are no {title} for this address.</p>
						</div>
					}

					{routeStopType === 'Unload' &&
						<div className="row">
							<div className="col-auto">
								<Translate id="Update Order Status To" />:
								<Field value={orderStatusId} name="orderStatusId" component="select" className="form-control" onChange={(event) => setState({orderStatusId: event.target.value})}>
									{filteredOrderStatuses.map((status) => {
										return <option value={status.orderStatusId} key={status.orderStatusId}>{status.orderStatus}</option>
									})}
								</Field>
							</div>
						</div>
					}

					<div className="mt-1">
						<button type="button" onClick={completeStop} className="btn btn-success">
							<Translate id="SAVE"/>
						</button>
					</div>
				</div>
			</div>
		);
	}
}
