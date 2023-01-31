import React from 'react';
import { Field, withFormik } from "../utilities/IWDFormik";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { compose, graphql } from 'react-apollo';
import { NavLink } from "react-router-dom";
import Math from 'mathjs';
import moment from 'moment';
import withState from "react-state-hoc";

import { withMutation, queryWithLoading } from "../utilities/IWDDb";

import { withSession } from "../utilities/session";
import { SignatureInput } from "./signatures";
import { Translate, withTranslate } from "../translations/IWDTranslation";

import {
	getStatusClasses,
	statusMap,
	SCANNED_ORDER_STATUSES,
	STR_PICKUP_ORDER_STATUSES,
	STR_DELIVERY_ORDER_STATUSES,
	STR_SCANNED_ORDER_STATUSES
} from "./orders_constants";

// GRAPHQL QUERY
import {
	getCompanyAddressesQuery
} from "../companies/companies_graphql";

import {
	GetRoutes,
	GetRoutesOrderQueue,
	GetRouteAddresses,
	OrderSaveMutation,
	OrderUpdateSubscription,
	completeRouteStopMutation
} from "./orders_graphql";

function PickupsDeliveriesContent(props) {
	const {
		CompanyAddresses: {
			CompanyAddresses
		},
		history,
		match: {
			params: {
				routeId = 1
			},
			url
		},
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
		},
		Session: {
			User: {
				userTypeId
			}
		}
	} = props;

	let FilteredRoutes = Routes;
	// If the user loggedIn is a vet, filter everything to only show things that apply for their company
	if(parseInt(userTypeId) === 5) {
		FilteredRoutes = FilteredRoutes.filter((route) => CompanyAddresses.findIndex((address) => parseInt(address.routeId) === parseInt(route.routeId)) > -1);
		// If this is the first time coming to this page, and there is only a single route for the companyAddresses (there could be separate routes if there are multiple addresses for this companyId), then push to that route.
		if(url === "/orders/orderQueue/routes" && FilteredRoutes.length === 1) {
			history.push("/orders/orderQueue/routes/" + FilteredRoutes[0].routeId)
		}
	}

	// Get all of the orders that are pickups.
	const pickups = orders.filter(({ orderStatusId } ) => STR_PICKUP_ORDER_STATUSES.includes(orderStatusId));

	// Create a tempPickups array that has filtered out any orders that are currently On Hold for the purposes of getting a count
	let tempPickups = [];
	if(parseInt(routeId) === -1) { // -1 is the expedited route selection
		// In order to sort by if there is an expedited cremation on the order, we will do a forEach and add a 'hasExpeditedCremation' flag to each order, then sort on that.
		pickups.forEach((order => {
			const expeditedIndex = order.ProductsOrder.findIndex((product) => product.productName === 'Expedited Cremation');
			if(expeditedIndex > -1) {
				order.hasExpeditedCremation = 1;
			} else {
				order.hasExpeditedCremation = 0;
			}
		}))
		// Do the same filtering as on a normal route, except only do orders with expedited cremation as a product
		tempPickups = pickups.filter((order) => (order.OrderHold.length === 0 || (order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved !== null)) && order.hasExpeditedCremation === 1);
	} else {
		tempPickups = pickups.filter((order) => order.OrderHold.length === 0 || (order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved !== null));
	}

	// Reduce to a structure of addressId and the count of pickups for it.
	const pickupsAddresses = tempPickups.reduce((acc, { pickupAddressId }) => {
		acc[pickupAddressId] = (acc[pickupAddressId] || 0) + 1;
		return acc;
	}, {});

	// Get all of the orders that are deliveries.
	const deliveries = orders.filter(({ orderStatusId } ) => STR_DELIVERY_ORDER_STATUSES.includes(orderStatusId));

	// Create a tempDeliveries array that has filtered out any orders that are currently On Hold for the purposes of getting a count
	let tempDeliveries = [];
	if(parseInt(routeId) === -1) { // -1 is the expedited route selection
		// In order to sort by if there is an expedited cremation on the order, we will do a forEach and add a 'hasExpeditedCremation' flag to each order, then sort on that.
		deliveries.forEach((order => {
			const expeditedIndex = order.ProductsOrder.findIndex((product) => product.productName === 'Expedited Cremation');
			if(expeditedIndex > -1) {
				order.hasExpeditedCremation = 1;
			} else {
				order.hasExpeditedCremation = 0;
			}
		}))
		// Do the same filtering as on a normal route, except only do orders with expedited cremation as a product
		tempDeliveries = deliveries.filter((order) => (order.OrderHold.length === 0 || (order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved !== null)) && order.hasExpeditedCremation === 1);
	} else {
		tempDeliveries = deliveries.filter((order) => order.OrderHold.length === 0 || (order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved !== null));
	}

	// Reduce to a structure of addressId and the count of deliveries for it.
	const deliveriesAddresses = tempDeliveries.reduce((acc, { deliveryAddressId }) => {
		acc[deliveryAddressId] = (acc[deliveryAddressId] || 0) + 1;
		return acc;
	}, {});

	// Filter the address based on if there is a pickup/delivery order for it or not.
	const routeAddresses = getRouteAddresses.filter(({ addressId }) => pickupsAddresses[addressId] || deliveriesAddresses[addressId]);

	// handler for submitting mutation to update statuses and save signature
	return (
		<div className="w-100">
			<div className="p-3">
				{/* Select a route to display pickup/delivery information */}
				<Field component="select" name="routeId" onChange={(e) => history.push("/orders/orderQueue/routes/" + e.target.value)} value={routeId}>
					<option value="0" key="0">{props.translate('Select a Route')}</option>
					{/* <option value="-1" key="-1">{props.translate('Expedited Route')}</option> */}
					{FilteredRoutes.map((route) => {
						return <option value={route.routeId} key={route.routeId}>{props.translate(route.routeName)}</option>
					})}
				</Field>

				{
					routeId !== "" && routeAddresses.map((companyAddress) => (
						<CompanyAddressOrders
							key={companyAddress.companyAddressId}
							pickups = {pickups}
							deliveries = {deliveries}
							companyAddress={companyAddress}
							deliveryCount={deliveriesAddresses[companyAddress.addressId] || 0}
							pickupCount={pickupsAddresses[companyAddress.addressId] || 0}
						/>)
					)
				}

				{
					routeId !== "" && routeId !== "0" && routeAddresses.length === 0 &&
					<div className="alert alert-secondary mt-2">There are no current pickup or deliveries for the route.</div>
				}
			</div>
		</div>
	);
}

export const PickupsDeliveries = compose(
	queryWithLoading({ gqlString: getCompanyAddressesQuery, name: "CompanyAddresses", variablesFunction: (props) => ({ companyId: props.Session && props.Session.User ? props.Session.User.companyId : 0 })}),
	queryWithLoading({ gqlString: GetRoutes, name: "Routes"}),
	queryWithLoading({ gqlString: GetRoutesOrderQueue, name: "Orders", variablesFunction: () => ({ orderQueue:"routes" })}),
	queryWithLoading({ gqlString: GetRouteAddresses, name: "RouteAddresses", variablesFunction: ({ match: { params: { routeId = 1 } }}) => ({ routeId}) }),
	// Attach the subscription.  Will update the cache automatically.
	graphql(OrderUpdateSubscription),
	withFormik(),
	withTranslate
)(PickupsDeliveriesContent);

const CompanyAddressOrdersContent = (props) => {
	const {
		companyAddress,
		deliveries,
		deliveryCount,
		message,
		petReferenceNumber,
		pickups,
		orderSave,
		setState,
		showOrders,
		signatureData,
		success
	} = props;

	// Order has been scanned or checked/unchecked. Update order status accordingly
	async function onClick(checked, order, barcode=false) {
		const statusId = parseInt(order.orderStatusId, 10);

		// Choose the next status based on current status.
		// Should only toggle scanned state, shouldn't proceed to next delivery step.
		// This will update the checkbox's checked state as well as the status badge
		const nextStatusId = statusMap.hasOwnProperty(statusId) ?	statusMap[statusId].nextStatusId: statusId;
		const previousStatusId = statusMap.hasOwnProperty(statusId) ?	statusMap[statusId].previousStatusId: statusId;

		if(order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved === null) {
			setState({message: 'This order currently has a hold placed on it.', success: false})
		} else if(barcode===true) {
			// If the current state is not a scanned state, then we will move to the next status.
			if(STR_SCANNED_ORDER_STATUSES.includes(order.orderStatusId) === false) {
				const orderSaveResponse = await orderSave({ input: { orderId: order.orderId, orderStatusId: nextStatusId }});
				if(orderSaveResponse.data.orderSave.Response.success === true) {
					return{message: `${order.petReferenceNumber} Scanned Successfully`, success: true};
				} else {
					return orderSaveResponse.data.orderSave.Response;
				}
			} else {
				// If they rescan the same barcode or enter the same pet reference number, let them know that no action was taken.
				return {message: 'This order already scanned.', success: true}
			}
		} else {
			// If the checkbox is clicked, go to the next status, otherwise go to the previous.
			const newStatusId = checked ? nextStatusId : previousStatusId;

			if (newStatusId !== statusId) {
				setState({message: 'Order Updated.', success: true})
				await orderSave({ input: { orderId: order.orderId, orderStatusId: newStatusId }});
			}
		}
	}

	// Get the Deliveries and Pickups for this address
	const companyAddressDeliveries = deliveries.filter(({ deliveryAddressId }) => companyAddress.addressId === deliveryAddressId);
	const companyAddressPickups = pickups.filter(({ pickupAddressId }) => companyAddress.addressId === pickupAddressId);

	// Get the number of Private and Communals, and Communals that have PP
	const pickupsPrivate = companyAddressPickups.filter((pickup) => pickup.ProductsOrder.findIndex((product) => parseInt(product.productId) === 27) > -1);
	const pickupsCommunal = companyAddressPickups.filter((pickup) => pickup.ProductsOrder.findIndex((product) => parseInt(product.productId) === 26) > -1);
	const pickupsCommunalPP = pickupsCommunal.filter((pickup) => pickup.ProductsOrder.findIndex((product) => parseInt(product.isPawPrint) === 1) > -1);

	const pickupsPrivateCount = pickupsPrivate.length;
	const pickupsCommunalCount = pickupsCommunal.length;
	const pickupsCommunalPPCount = pickupsCommunalPP.length;

	const scannedItems = companyAddressDeliveries.concat(companyAddressPickups).filter(({ orderStatusId }) => STR_SCANNED_ORDER_STATUSES.includes(orderStatusId) );

	function completeStop() {
		const completeRouteStop = {
			signatureData,
			orders: scannedItems.map(({ orderId, orderStatusId }) => ({ orderId, orderStatusId })),
			driverId: props.Session.User.userId,
			companyId: companyAddress.companyId,
			addressId: companyAddress.addressId,
			routeId: companyAddress.routeId
		};

		setState({ showOrders: false });

		props.completeRouteStop({ input: completeRouteStop });
	}

	let width = window.innerWidth;
	let signatureHeight = 200;
	let signatureWidth = width - 60;

	if(width >= 768){
		signatureWidth = width - 210;
	}

	// Set flag for if this stop is only pickups, no deliveries, and all of the pickups are for communal cremation. This is incase the driver is in a rush they can skip this stop for the day.
	let onlyCommunalCremations = false;
	if(companyAddressDeliveries.length === 0 && companyAddressPickups.length > 0) {
		// Loop through all of the pickups and see if they are all communal
		onlyCommunalCremations = true;
		companyAddressPickups.forEach((pickup) => {
			// filter down to only the cremation product
			pickup.ProductsOrder.filter((product) => product.productCategory === "Cremations").forEach((product) => {
				if(product.productName !== 'Communal Cremation') {
					onlyCommunalCremations = false;
				}
			})
		})
	}

	return (
		<React.Fragment>
			<div className="border border-secondary bg-light text-dark text-bold rounded p-2 mt-2" onClick={() => setState({ showOrders:  showOrders === false, signatureData: "" })}>
				{showOrders === false && <FontAwesomeIcon icon="caret-right" className="mr-2" />}
				{showOrders === true && <FontAwesomeIcon icon="caret-down" className="mr-2" />}
				{companyAddress.addressName !== null && <span className="mr-3">{companyAddress.addressName}</span>} {companyAddress.address1} {companyAddress.address2}, {companyAddress.city}
					{/* <span className="fa-layers fa-2x ml-3">
						<FontAwesomeIcon icon="circle" color={"white"} />
						<FontAwesomeIcon icon="circle" color={"black"} transform="shrink-1" />
						<strong className="fa-layers-text small">C</strong>
					</span> */}
				{
					onlyCommunalCremations === true &&
					<strong className="ml-5">(Only Communals)</strong>
				}
				{
					width >= 768 && 
					<React.Fragment>
						<span className="float-md-right ml-3" style={{width: 120+'px'}}>
							Deliveries - { deliveryCount }
						</span>
						<span className="float-md-right ml-3" style={{width: 220+'px'}}>
							Pickups - P: {pickupsPrivateCount} C: {Math.subtract(pickupsCommunalCount, pickupsCommunalPPCount)} CPP: {pickupsCommunalPPCount}
						</span>
					</React.Fragment>
				}
				{
					width < 768 && 
					<p className="m-0 ml-3">
						<span className="mr-4">
							Deliveries: { deliveryCount }
						</span> 
						Pickups - P: {pickupsPrivateCount} C: {Math.subtract(pickupsCommunalCount, pickupsCommunalPPCount)} CPP: {pickupsCommunalPPCount}
					</p>
				}
			</div>
			{
				showOrders &&
				<React.Fragment>
					<OrderList
						message={message}
						Orders={companyAddressPickups}
						OrdersOther={companyAddressDeliveries}
						onClick={onClick}
						petReferenceNumber={petReferenceNumber}
						setState={setState}
						success={success}
						title={"Orders to Pickup"}
					/>

					<OrderList
						companyAddress={companyAddress}
						message={message}
						petReferenceNumber={petReferenceNumber}
						Orders={companyAddressDeliveries}
						OrdersOther={companyAddressPickups}
						onClick={onClick}
						setState={setState}
						success={success}
						title={"Orders to Deliver"}
					/>

					<h4>Signature Input</h4>
					<SignatureInput
						signatureData={signatureData}
						height={signatureHeight}
						width={signatureWidth}
						onChange={(signatureData) => setState({signatureData})}
					/>

					<div className="mt-1">
						<button type="button" disabled={ signatureData === "" || scannedItems.length === 0 } onClick={completeStop} className="btn btn-success btn-addon">
							<FontAwesomeIcon icon="check" />
							<Translate id="SAVE"/>
						</button>

						<button type="button" className="btn btn-default ml-2" onClick={() => setState({signatureData: ""})}>
							Clear
						</button>
					</div>
				</React.Fragment>
			}
		</React.Fragment>
	);
}

const CompanyAddressOrders = compose(
	withState({
		message: '',
		petReferenceNumber: '',
		showOrders: false,
		signatureData: "",
		success: ''
	}),
	withSession,
	withMutation(OrderSaveMutation, "orderSave", ["OrderQueue"]),
	withMutation(completeRouteStopMutation, "completeRouteStop", ["OrderQueue"])
)(CompanyAddressOrdersContent);

// Needs to filter orders by queue, then render
function OrderList(props) {
	const {
		message,
		Orders,
		OrdersOther,
		onClick,
		petReferenceNumber,
		setState,
		success,
		title="Orders",
	} = props;

	let width = window.innerWidth;
	let mediumWidth = 768;

	let alertStatusClass = '';
	if(success === true) {
		alertStatusClass = 'alert alert-success';
	} else if(success === false) {
		alertStatusClass = 'alert alert-danger';
	}

	async function handlePetReferenceNumberChange(value) {
		let tempValue = value.trim()
		// Always clear out any of the success/warning messages when the input value is updated
		setState({message: '', petReferenceNumber: tempValue, success: ''});

		// When the tempValue is 7 characters long, check to see if it matches any of the orders that are at this location
		if(tempValue.length === 7 || tempValue.length === 8) {
			// See if this pet reference number matches any in the Order for this area.
			let order = Orders.find((order) => order.petReferenceNumber.toUpperCase() === tempValue.toUpperCase());
			// If no match, check the "other" orders
			if(order === undefined) {
				order = OrdersOther.find((order) => order.petReferenceNumber.toUpperCase() === tempValue.toUpperCase());
			}

			if(order) {
				if(order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved === null) {
					setState({message: 'This order currently has a hold placed on it.', success: false})
				} else {
					// Perform the save action as if the checkbox were clicked - calling from this function will only check the box, it will not uncheck it
					const onClickResponse = await onClick(true, order, true);
					// If successful, then also clear out the petReferenceNumber
					if(onClickResponse.success === true) {
						setState({message: onClickResponse.message, petReferenceNumber: '', success: onClickResponse.success})
					} else {
						setState({message: onClickResponse.message, success: onClickResponse.success})
					}
				}
			} else {
				setState({message: 'Pet Reference Number does not match any pickups or deliveries for this location.', success: false})
			}
		}
	}

	if (width >= mediumWidth) {
		return (
			<div className="row">
				<div className="col">
					<div className="p-2 bg-secondary mb-0">
						{/* INPUT TO SCAN BARCODES INTO FOR THIS ORDER */}
						<div className="form-inline float-right w-50 mt-n-1 text-right">
							<div className="input-group ml-auto w-100">
								<input type="text" className="form-control" placeholder="Scan / Enter Pet Reference Number" name="petReferenceNumber" value={petReferenceNumber} onChange={(event) => handlePetReferenceNumberChange(event.target.value)}  autoComplete="off" autoCorrect="off"  autoCapitalize="none" spellCheck="false" />
							</div>
						</div>
						<span className="h4 text-white">{title}</span>
					</div>
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
							</tr>
						</thead>
						<tbody>
							{ Orders.map((order) => {
								const {
									orderClass,
									orderStatus
								} =	getStatusClasses(order);

								const orderPrivate = order.ProductsOrder.findIndex((product) => parseInt(product.productId) === 27);
								const orderPrivatePP = order.ProductsOrder.findIndex((product) => orderPrivate > -1 && parseInt(product.isPawPrint) === 1);
								const orderCommunal = order.ProductsOrder.findIndex((product) => parseInt(product.productId) === 26);
								const orderCommunalPP = order.ProductsOrder.findIndex((product) => orderCommunal > -1 && parseInt(product.isPawPrint) === 1);

								// if the pet's order status indicates that its barcode has been scanned, make sure the badge and checkbox match
								const checked = SCANNED_ORDER_STATUSES.includes(parseInt(order.orderStatusId, 10));

								return (
									<tr key={order.orderId}>
										<td>
											<div className="pretty p-default p-pulse mr-0">
												<input className="form-check-input" type="checkbox" checked={checked} disabled={!checked} onChange={({ target: { checked } }) => onClick(checked, order)} />
												<div className="state p-primary form-check-label"><label>&nbsp;</label></div>
											</div>
										</td>
										<td>
											{moment(order.dateCreated).format('MMM D h:mm A')}
											{orderPrivate > -1 && <span className="ml-2 float-right"><img src={process.env.PUBLIC_URL + "/images/icons/tag_private.png"} className="pb-3 pt-1" alt="" style={{maxWidth: 30 + 'px'}} /></span>}
											{orderPrivatePP > -1 && <span className="ml-2 float-right"><img src={process.env.PUBLIC_URL + "/images/icons/tag_paw.png"} className="pb-3 pt-1" alt="" style={{maxWidth: 30 + 'px'}} /></span>}
											{orderCommunal > -1 && <span className="ml-2 float-right"><img src={process.env.PUBLIC_URL + "/images/icons/tag_communal.png"} className="pb-3 pt-1" alt="" style={{maxWidth: 30 + 'px'}} /></span>}
											{orderCommunalPP > -1 && <span className="ml-2 float-right"><img src={process.env.PUBLIC_URL + "/images/icons/tag_paw.png"} className="pb-3 pt-1" alt="" style={{maxWidth: 30 + 'px'}} /></span>}
										</td>
										<td><h5 className="m-0"><NavLink to={`/orders/orderId/${order.orderId}`} activeClassName="active">{order.petReferenceNumber}</NavLink></h5></td>
										<td>{order.petFirstName} {order.petLastName} <small className="text-muted">({order.weight} {order.weightUnits})</small>
										</td>
										<td>
											<h5 className="m-0">
												<span className={`badge badge-${orderClass} p-2 text-uppercase`}>{orderStatus}</span>
												{order.OrderHold.length > 0 && order.OrderHold[0].dateRemoved === null &&
													<span className={`badge badge-warning p-2 ml-2 text-uppercase`}>On Hold</span>
												}
											</h5>
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
		);
	} else{
		return (
			<div className="row">
				<div className="col">
					<h4 className="p-2 bg-light mb-0">{title}</h4>
					{/* INPUT TO SCAN BARCODES INTO FOR THIS ORDER */}
					<div className="form-inline w-100 mb-3">
						<div className="input-group ml-auto w-100">
							<input type="text" className="form-control" placeholder="Scan / Enter Pet Reference Number" name="petReferenceNumber" value={petReferenceNumber} onChange={(event) => handlePetReferenceNumberChange(event.target.value)} autoComplete="off" autoCorrect="off"  autoCapitalize="none" spellCheck="false" />
						</div>
						{message !== '' &&
							<div className={alertStatusClass}>{message}</div>
						}
					</div>
					{ Orders.map((order) => {
						const {
							orderClass,
							orderStatus
						} =	getStatusClasses(order);

						const orderPrivate = order.ProductsOrder.findIndex((product) => parseInt(product.productId) === 27);
						const orderPrivatePP = order.ProductsOrder.findIndex((product) => orderPrivate > -1 && parseInt(product.isPawPrint) === 1);
						const orderCommunal = order.ProductsOrder.findIndex((product) => parseInt(product.productId) === 26);
						const orderCommunalPP = order.ProductsOrder.findIndex((product) => orderCommunal > -1 && parseInt(product.isPawPrint) === 1);

						// if the pet's order status indicates that its barcode has been scanned, make sure the badge and checkbox match
						const checked = SCANNED_ORDER_STATUSES.includes(parseInt(order.orderStatusId, 10));

						return (
							<div key={order.orderId} className="border-bottom pb-3 mb-3">
								<h5> 
									<div className="pretty p-default p-pulse mr-0">
										<input className="form-check-input" type="checkbox" checked={checked} disabled={!checked} onChange={({ target: { checked } }) => onClick(checked, order)} />
										<div className="state p-primary form-check-label"><label>{order.petFirstName} {order.petLastName}  <small className="text-muted">({order.weight} {order.weightUnits})</small></label></div>
									</div>
								</h5>
								<p className="mb-0">
									<span className="h5"><NavLink to={`/orders/orderId/${order.orderId}`} className="float-right" activeClassName="active">{order.petReferenceNumber}</NavLink></span>
									<span className={`badge badge-${orderClass} p-2 text-uppercase`}>{orderStatus}</span>
								</p>
								<p className="mb-0 text-muted small">
									{moment(order.dateCreated).format('MMM D, h:mm A')}
									{orderPrivate > -1 && <span className="ml-2 float-right"><img src={process.env.PUBLIC_URL + "/images/icons/tag_private.png"} className="pb-3 pt-1" alt="" style={{maxWidth: 20 + 'px'}} /></span>}
									{orderPrivatePP > -1 && <span className="ml-2 float-right"><img src={process.env.PUBLIC_URL + "/images/icons/tag_paw.png"} className="pb-3 pt-1" alt="" style={{maxWidth: 20 + 'px'}} /></span>}
									{orderCommunal > -1 && <span className="ml-2 float-right"><img src={process.env.PUBLIC_URL + "/images/icons/tag_communal.png"} className="pb-3 pt-1" alt="" style={{maxWidth: 20 + 'px'}} /></span>}
									{orderCommunalPP > -1 && <span className="ml-2 float-right"><img src={process.env.PUBLIC_URL + "/images/icons/tag_paw.png"} className="pb-3 pt-1" alt="" style={{maxWidth: 20 + 'px'}} /></span>}
								</p>
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
				</div>
			</div>
		);
	}
}
