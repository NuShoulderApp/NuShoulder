import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import { NavLink } from "react-router-dom";
import React from 'react';
import { withRouter, Link } from "react-router-dom";
import { withSession } from "../utilities/session";

import { queryWithLoading } from '../utilities/IWDDb';
import { withTranslate, Translate } from '../translations/IWDTranslation';

import { withFormik, Field, Form } from "../utilities/IWDFormik";
import _ from "lodash";

// GRAPHQL QUERY
import {
	getOrdersQuery,
	GetRoutes
} from './orders_graphql';
import {
	getProductMaterialsQuery
} from '../products/products_graphql';
// var JsBarcode = require('jsbarcode');

const OrdersViewList = (props) => {
	const {
		orders,
		match: { params: {orderQueue}},
		Session: { User: {userTypeId}},
		values
	} = props;

	let tempOrders = orders;
	// Do complicated orderBy sorting for applicable work queues that is otherwise painful to do in knex
	if(orderQueue === 'pawprints' || orderQueue === 'cremations' || orderQueue === 'urns') {
		// Sort the orders by weight first, so that it is the lowest priority of sort order. Heaviest pets are at top of list
		tempOrders.sort((a,b) => a.weight - b.weight);
		// Next, sort by dateExpectedDelivery
		//tempOrders.sort((a,b) => new Date(a.dateExpectedDelivery) - new Date(b.dateExpectedDelivery))
		const putNullAtEnd = function() {
			return function (a,b) {
				if(a.dateExpectedDelivery === null) {
					return 1;
				} else if(b.dateExpectedDelivery === null) {
					return -1;
				} else if(new Date(a.dateExpectedDelivery) > new Date(b.dateExpectedDelivery)) {
					return 1
				} else if(new Date(a.dateExpectedDelivery) < new Date(b.dateExpectedDelivery)) {
					return -1
				} else {
					return 0;
				}

				// else if(new Date(a.dateExpectedDelivery) === new Date(b.dateExpectedDelivery)) {
				// 	return 0;
				// } else {
				// 	return new Date(a.dateExpectedDelivery) > new Date(b.dateExpectedDelivery) ? 1 : -1;
				// }
			}
		}
		// Custom sort function to get null dateExpectedDelivery to be at the end of the list. The sooner the dateExpectedDelivery, the top of the list.
		tempOrders.sort(putNullAtEnd());

		// In order to sort by if there is an expedited cremation on the order, we will do a forEach and add a 'hasExpeditedCremation' flag to each order, then sort on that.
		tempOrders.forEach((order => {
			const expeditedIndex = order.ProductsOrder.findIndex((product) => product.productName === 'Expedited Cremation');
			if(expeditedIndex > -1) {
				order.hasExpeditedCremation = 1;
			} else {
				order.hasExpeditedCremation = 0;
			}

			// Treat private and individual as the same for ordering purposes.
			const privateIndividualIndex = order.ProductsOrder.findIndex((product) => product.productName === 'Private Cremation' || product.productName === 'Individual Cremation');
			if(privateIndividualIndex > -1) {
				order.hasPrivateIndividualCremation = 1;
			} else {
				order.hasPrivateIndividualCremation = 0;
			}

			// Need to get just the privates for putting the P circled icon in list
			const privateIndex = order.ProductsOrder.findIndex((product) => product.productName === 'Private Cremation');
			if(privateIndex > -1) {
				order.hasPrivateCremation = 1;
			} else {
				order.hasPrivateCremation = 0;
			}

			// Need to get just the individuals for putting the I circled icon in list
			const individualIndex = order.ProductsOrder.findIndex((product) => product.productName === 'Individual Cremation');
			if(individualIndex > -1) {
				order.hasIndividualCremation = 1;
			} else {
				order.hasIndividualCremation = 0;
			}

			// Need to get just the communals for putting the C circled icon in list
			const communalIndex = order.ProductsOrder.findIndex((product) => product.productName === 'Communal Cremation');
			if(communalIndex > -1) {
				order.hasCommunalCremation = 1;
			} else {
				order.hasCommunalCremation = 0;
			}
		}))

		// Communal Cremations are at the bottom of the list
		tempOrders.sort((a,b) => a.hasCommunalCremation - b.hasCommunalCremation);
		// Private/Individual Cremations are in the middle of the list
		tempOrders.sort((a,b) => b.hasPrivateIndividualCremation - a.hasPrivateIndividualCremation);
		// Expedited Cremations are at the top of the list.
		tempOrders.sort((a,b) => b.hasExpeditedCremation - a.hasExpeditedCremation);
	}

	let width = window.innerWidth;
	let mediumWidth = 768;
	console.log({props})
	if (width >= mediumWidth) {
		// render for medium to large screens
		return (
			<div className="w-100">
				<div className="card p-3">
					{
						(props.match.params.orderQueue === 'holds') &&
						<div className="card-header border border-secondary text-secondary text-center h4 bg-light">
							Orders On Hold
						</div>
					}
					<table className="table table-striped">
						<thead>
							<tr>
								<th>Order Date</th>
								{
									(parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3) &&
									<th>Hospital</th>
								}
								<th>Reference #</th>
								<th>Pet Name</th>
								<th>Cremation Status</th>
								<th>Order Status</th>
							</tr>
						</thead>
						<tbody>
							{tempOrders.length > 0 &&
								tempOrders.map((order) => {
									let Cremation = order.ProductsOrder.find((product) => product.productTypeId === '2');
									let orderType = '';
									if(Cremation) {
										orderType = Cremation.productName;
									} else if(order.orderTypeId === 1) {
										orderType = 'Vet Supplies'
									} else if(order.orderTypeId === 3) {
										orderType = 'Product Only'
									}
									//set style in info for badge
									let orderClass = "secondary"; // default to a neutral gray
									if(order.orderStatus === "Deleted") {
										orderClass = "light border";
										order.orderServiceStatus = "N/A"; // if Deleted, don't show other status
									} else if(order.orderServiceStatus === "Completed" || order.orderServiceStatus === "Cremated") {
										orderClass = "success";
									} else if(order.orderServiceStatus === "In Process" || order.orderServiceStatus === "Cremating") {
										orderClass = "danger";
									} else if(order.orderServiceStatus === "Pending") {
										orderClass = "secondary";
									}

									// If this is a Vet Supply order, for the starting status do an override that is more clear.
									const orderStatus = parseInt(order.orderTypeId) === 1 && parseInt(order.orderStatusId) === 1 ? 'Awaiting hospital to complete checkout' : order.orderStatus;

									// match against filters
									let matchedFilters = false;
									// check if any of the order products match the filter in the values
									let matchedMaterialFilter = false;
									if (values.productMaterialId !== "All Materials") {
										matchedMaterialFilter = order.ProductsOrder.find((product) => parseInt(product.productMaterialId) === parseInt(values.productMaterialId));
									} else {
										matchedMaterialFilter = true;
									}
									if( (
											values.routeId === "All Routes" ||
											(parseInt(order.routeId) === parseInt(values.routeId) && !isNaN(parseInt(values.routeId))) ||
											(order.routeId === null && values.routeId === "")
										) && matchedMaterialFilter
									) {
										matchedFilters = true;
									}

									// only show Deleted orders to crematory staff
									if( ((order.orderStatus === "Deleted" && (parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3)) || order.orderStatus !== "Deleted") && matchedFilters === true) {
										return (
											<tr key={order.orderId}>
												<td>
													<div></div>{moment(order.dateCreated).format('MMM DD, YYYY h:mm A')}
													<div>
														{
															(orderQueue === 'pawprints' || orderQueue === 'cremations' || orderQueue === 'urns') &&
															<React.Fragment>
																{
																	order.hasExpeditedCremation === 1 &&
																	<span className="fa-layers fa-2x">
																		<FontAwesomeIcon icon="circle" color={"black"} />
																		<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
																		<strong className="fa-layers-text small">E</strong>
																	</span>
																}
																{
																	order.hasPrivateCremation === 1 &&
																	<span className="fa-layers fa-2x">
																		<FontAwesomeIcon icon="circle" color={"black"} />
																		<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
																		<strong className="fa-layers-text small">P</strong>
																	</span>
																}
																{
																	order.hasIndividualCremation === 1 &&
																	<span className="fa-layers fa-2x">
																		<FontAwesomeIcon icon="circle" color={"black"} />
																		<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
																		<strong className="fa-layers-text small">I</strong>
																	</span>
																}
																{
																	order.hasCommunalCremation === 1 &&
																	<span className="fa-layers fa-2x">
																		<FontAwesomeIcon icon="circle" color={"black"} />
																		<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" />
																		<strong className="fa-layers-text small">C</strong>
																	</span>
																}
															</React.Fragment>
														}
													</div>
												</td>
												{
													(parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3) &&
													<td>{order.companyName} {/*<br />
														{order.PickupAddress && order.DeliveryAddress && order.PickupAddress.routeName === order.DeliveryAddress.routeName && <React.Fragment>Pickup &amp; Delivery: {order.PickupAddress.routeName}</React.Fragment>}
														{order.PickupAddress && order.DeliveryAddress && order.PickupAddress.routeName !== order.DeliveryAddress.routeName && <React.Fragment>Pickup: {order.PickupAddress.routeName}<br />Delivery: {order.DeliveryAddress.routeName}</React.Fragment>}
														{orderQueue === 'cremations' && (userTypeId === "2" || userTypeId === "3") && <span><br />Expected Delivery: {moment(order.dateExpectedDelivery).format('MMM DD, YYYY')}</span>}*/}
													</td>
												}
												<td><h5 className="m-0"><NavLink to={`/orders/orderId/${order.orderId}`} activeClassName="active">{order.petReferenceNumber}</NavLink></h5></td>
												<td><div>{order.petFirstName} {order.petLastName}</div><div>{(orderQueue === 'pawprints' || orderQueue === 'cremations' || orderQueue === 'urns') && `(${order.weight} ${order.weightUnits})`}</div></td>
												<td>{orderType}
													<h5 className="m-0"><span className={`badge badge-${orderClass} p-2 text-uppercase`}>{order.orderServiceStatus}</span></h5>
												</td>
												<td>{order.OrderHold.length > 0 &&
														<h5 className="m-0">
															<span className="badge badge-warning p-2 text-uppercase">
																<FontAwesomeIcon icon="hand-paper" /> <Translate id="Hold" />
															</span>
														</h5>
													}
													{orderStatus === "Deleted" && <FontAwesomeIcon icon="trash-alt" />} {orderStatus !== "Deleted" && <FontAwesomeIcon icon="tasks" />} {orderStatus}<br />
													{ order.memorialization === 'home' && <span><FontAwesomeIcon icon="home" /> <Translate id="Memorialization At Home" /><br /></span> }
													{ order.memorialization === 'clinic' && <span><FontAwesomeIcon icon="hospital" /> <Translate id="Memorialization In Hospital" /><br /></span> }
													{ order.memorialization === 'none' && <h5 className="m-0"><span className="badge badge-success p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id="No Memorialization" /></span><br /></h5> }
													{/* check to see if the date MemorializationEnds is in the past */}
													{ order.orderTypeId === 2 && (moment().diff(moment(order.dateMemorializationEnds)) > 0 || order.memorializationCheckedOut === 1 || order.memorialization === "none" || order.tabMemorializationOpen === 1) &&
														<div className="">
															{moment().diff(moment(order.dateMemorializationEnds)) <= 0 && order.memorializationCheckedOut !== 1 && <h5 className="m-0">
																<span className="badge badge-danger p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Open" /></span> {/*<span className="small">until {moment(order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}</span>*/}
															</h5>}
															{moment().diff(moment(order.dateMemorializationEnds)) > 0 && order.memorializationCheckedOut !== 1 && <h5 className="m-0">
																<span className="badge badge-warning p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Closed" /></span> {/*<span className="small">on {moment(order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}</span>*/}
															</h5>}
															{order.memorializationCheckedOut === 1 && order.memorialization !== "none" && <h5 className="m-0">
																<span className="badge badge-success p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Completed at" /> {order.memorialization}</span>
															</h5>}

															{moment().diff(moment(order.dateMemorializationEnds)) <= 0 && order.memorializationCheckedOut !== 1 && order.memorialization !== "none" && <span><Translate id=" Memorialization Open until" /> {moment(order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}</span>}
															{moment().diff(moment(order.dateMemorializationEnds)) > 0 && order.memorializationCheckedOut !== 1 && order.memorialization !== "none" && <span><Translate id=" Memorialization Window Closed at" /> {moment(order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}</span>}
															{order.memorializationCheckedOut === 1 && order.memorialization !== "none" && order.tabMemorializationOpen === 0 && <span><Translate id=" Memorialization Completed at" /> {order.memorialization}</span>}
															{order.memorialization === "none" && <span><Translate id=" No Memorialization" /></span>}
															{order.tabMemorializationOpen === 1 && <span><Translate id=" Memorialization Reopened" /></span>}
														</div>
													}
													{ order.orderTypeId === 2 && (moment().diff(moment(order.dateMemorializationEnds)) <= 0 && order.memorializationCheckedOut !== 1) && order.memorialization !== "none" &&
														<h5 className="m-0">
															<span className="badge badge-danger p-2 text-uppercase"><FontAwesomeIcon icon="clock" />  <Translate id="Memorialization Open" /></span> {/*<span className="small">until {moment(order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}</span>*/}
														</h5>
													}
												</td>
											</tr>
										)
									} else {
										return false;
									}
								})
							}

						</tbody>
					</table>
				</div>
			</div>
		);
	} else {
		// MOBILE: small screen view
		return (
			<div className="w-100">

				{tempOrders.length > 0 &&
					tempOrders.map((order) => {
						let Cremation = order.ProductsOrder.find((product) => product.productTypeId === '2');
						let orderType = '';
						if(Cremation) {
							orderType = Cremation.productName;
						} else if(order.orderTypeId === 1) {
							orderType = 'Vet Supplies'
						} else if(order.orderTypeId === 3) {
							orderType = 'Product Only'
						}
						//set style in info for badge
						let orderClass = "secondary"; // default to a neutral gray
						if(order.orderStatus === "Deleted") {
							orderClass = "light border";
							order.orderServiceStatus = "N/A"; // if Deleted, don't show other status
						} else if(order.orderServiceStatus === "Completed") {
							orderClass = "success";
						} else if(order.orderServiceStatus === "In Process") {
							orderClass = "primary";
						} else if(order.orderServiceStatus === "Pending") {
							orderClass = "secondary";
						}

						// If this is a Vet Supply order, for the starting status do an override that is more clear.
						const orderStatus = parseInt(order.orderTypeId) === 1 && parseInt(order.orderStatusId) === 1 ? 'Awaiting hospital to complete checkout' : order.orderStatus;

						// match against filters
						let matchedFilters = false;
						// check if any of the order products match the filter in the values
						let matchedMaterialFilter = false;
						if (values.productMaterialId !== "All Materials") {
							matchedMaterialFilter = order.ProductsOrder.find((product) => parseInt(product.productMaterialId) === parseInt(values.productMaterialId));
						} else {
							matchedMaterialFilter = true;
						}
						if( (
								values.routeId === "All Routes" ||
								(parseInt(order.routeId) === parseInt(values.routeId) && !isNaN(parseInt(values.routeId))) ||
								(order.routeId === null && values.routeId === "")
							) && matchedMaterialFilter
						) {
							matchedFilters = true;
						}

						// only show Deleted orders to crematory staff
						if( ((order.orderStatus === "Deleted" && (parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3)) || order.orderStatus !== "Deleted") && matchedFilters === true) {
							return (
								<div key={order.orderId} className="card border-bottom p-3 mb-3">
									<h5 className="m-0"><NavLink to={`/orders/orderId/${order.orderId}`} activeClassName="active">{order.petReferenceNumber}</NavLink></h5>
									<p className="m-0">{orderType} {order.petFirstName} {order.petLastName}</p>
									{order.orderServiceStatus && <p className="m-0"><span className="h5"><span className={`badge badge-${orderClass} p-2 text-uppercase`}><Translate id="Cremation"/> {order.orderServiceStatus}</span></span></p>}
									<p className="m-0">{orderStatus === "Deleted" && <FontAwesomeIcon icon="trash-alt" />} {orderStatus}</p>

									{order.OrderHold.length > 0 &&
										<h5 className="m-0">
											<span className="badge badge-warning p-2 text-uppercase">
												<FontAwesomeIcon icon="hand-paper" /> <Translate id="Hold" />
											</span>
										</h5>
									}
									{ order.memorialization === 'home' && <p className="m-0"><FontAwesomeIcon icon="home" /> <Translate id="Memorialization At Home" /></p> }
									{ order.memorialization === 'clinic' && <p className="m-0"><FontAwesomeIcon icon="hospital" /> <Translate id="Memorialization In Hospital" /></p> }
									{ order.memorialization === 'none' && <h5 className="m-0"><span className="badge badge-success p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id="No Memorialization" /></span><br /></h5> }
									{/* check to see if the date MemorializationEnds is in the past */}
									{ order.orderTypeId === 2 && (moment().diff(moment(order.dateMemorializationEnds)) > 0 || order.memorializationCheckedOut === 1) &&
										<div className="">

											{moment().diff(moment(order.dateMemorializationEnds)) <= 0 && order.memorializationCheckedOut !== 1 && <h5 className="m-0">
												<span className="badge badge-danger p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Open" /></span> {/*<span className="small">until {moment(order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}</span>*/}
											</h5>}
											{moment().diff(moment(order.dateMemorializationEnds)) > 0 && order.memorializationCheckedOut !== 1 && <h5 className="m-0">
												<span className="badge badge-warning p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Closed" /></span> {/*<span className="small">on {moment(order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}</span>*/}
											</h5>}
											{order.memorializationCheckedOut === 1 && order.memorialization !== "none" && <h5 className="m-0">
												<span className="badge badge-success p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Completed at" /> {order.memorialization}</span>
											</h5>}
										</div>
									}
									{ order.orderTypeId === 2 && (moment().diff(moment(order.dateMemorializationEnds)) <= 0 && order.memorializationCheckedOut !== 1) &&
										<h5 className="m-0">
											<span className="badge badge-danger p-2 text-uppercase"><FontAwesomeIcon icon="clock" />  <Translate id="Memorialization Open" /></span> {/*<span className="small">until {moment(order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}</span>*/}
										</h5>
									}

									<p><Translate id="Order Date" />: {moment(order.dateCreated).format('MMM DD, YYYY h:mm A')}</p>
								</div>
							)
						} else {
							return false;
						}
					})
				}
			</div>
		);
	}
};

// WRAP CONTENT
const OrdersContentContainer = compose(
	withRouter,
	withSession,
	withTranslate
)(OrdersViewList)

// DISPLAY FILTER FORM
const OrdersFilter = (props) => {
	const {
		values,
		errors,
		data: { OrderWorkQueue: {orders}},
		GetRoutes: {Routes},
		GetMaterials: {ProductMaterials},
		match: { params: {orderQueue}},
	} = props;

	// get unique options for category filter select, it will be limited to options that will have a result in the orders list
	let productMaterialOptions = [];
	orders.forEach(order => {
		order.ProductsOrder.forEach(product => {
			// Check if the products on the order have a productMaterialId for our list
			if (!productMaterialOptions.find((material) => material.productMaterialId === product.productMaterialId)) {
				// If not, pushes category info to categoryOptions
				productMaterialOptions.push({
					productMaterialId: product.productMaterialId
				});
			}
		});
	});

	// display filters
	return (
		<div className="w-100 p-1">
			<div className="card p-3">
				<div className="row">
					{/* Only show New Cremation Order link if we are on the full Orders List page */}
					{orderQueue === '' &&
						<div className="col-12"><h3><span className="text-white text-shadow">All Orders</span>
							<Link to={`/new_orders/new_order_type/cremation`} className="btn btn-info btn-addon float-right ml-3"><FontAwesomeIcon icon="plus" /> <Translate id="Add Cremation Order"/> </Link>
							<Link to={`/new_orders/new_order_type/products`} className="btn btn-info btn-addon mb-2 float-right ml-3"><FontAwesomeIcon icon="plus" /> <Translate id="Add Product Only Order"/> </Link>
							<Link to={`/new_orders/supplies`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Order Supplies"/> </Link>
						</h3></div>
					}
					{orderQueue === 'burials' && <div className="col-12"><h3><span className="text-white text-shadow">Burial Orders</span><Link to={`/burials`} className="btn btn-info btn-addon mb-2 float-right"><FontAwesomeIcon icon="angle-right" className="pull-right" /><Translate id="Perform Burials"/> </Link></h3></div>}
					{orderQueue === 'cremations' &&
						<div className="col-12"><h3>Cremation Orders
							<Link to={`/cremations`} className="btn btn-info btn-addon mb-2 float-right ml-3"><FontAwesomeIcon icon="angle-right" className="pull-right" /><Translate id="Perform Cremations"/> </Link>
							<Link to={`/new_orders/new_order_type/cremation`} className="btn btn-info btn-addon mb-2 float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Add Cremation Order"/> </Link>
						</h3></div>
					}
					{orderQueue === 'followups' && <div className="col-12"><h3><span className="text-white text-shadow">Followup Orders</span></h3></div>}
					{false && orderQueue === 'holds' && <div className="col-12"><h3><span className="text-white text-shadow">On Hold Orders</span></h3></div>}
					{orderQueue === 'pawprints' && <div className="col-12"><h3><span className="text-white text-shadow">Paw Print Orders</span></h3></div>}
					{orderQueue === 'products' && <div className="col-12"><h3><span className="text-white text-shadow">Product Orders</span><Link to={`/new_orders/new_order_type/products`} className="btn btn-info btn-addon mb-2 float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Add Product Only Order"/> </Link></h3></div>}
					{orderQueue === 'supplies' && <div className="col-12"><h3><span className="text-white text-shadow">Vet Supplies Orders</span><Link to={`/new_orders/supplies`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Order Supplies"/> </Link></h3></div>}
					{orderQueue === 'urns' && <div className="col-12"><h3><span className="text-white text-shadow">Urn Orders</span></h3></div>}
					{orderQueue === 'visitations' && <div className="col-12"><h3><span className="text-white text-shadow">Visitations Orders</span></h3></div>}
				</div>

				<Form>
					<div className="row">
						<div className="col-12 form-row">
							{
								(props.match.params.orderQueue !== 'holds') 
								&&
								<div className="col-auto">
									<Translate id="Route" />
									<Field component="select" name="routeId" showError={true} className={`form-control ${errors.active && 'is-invalid'}`}>
										<option value="All Routes">{props.translate('All Routes')}</option>
										<option value="">{props.translate('No Route')}</option>
										{ Routes.map((route) => {
											return (
												<option key={route.routeId} value={route.routeId}>{route.routeName}</option>
											)
										})}
									</Field>
								</div>
							}
							{props.match.params.orderQueue === 'pawprints' &&
								<div className="col-auto">
									<Translate id="Material" />
									<Field component="select" name="productMaterialId" showError={true} className={`form-control ${errors.active && 'is-invalid'}`}>
										<option value="All Materials">{props.translate('All Materials')}</option>
										{ ProductMaterials.map((material) => {
											return (
												<option key={material.productMaterialId} value={material.productMaterialId}>{material.materialName}</option>
											)
										})}
									</Field>
								</div>
							}
						</div>
					</div>
					<div className="row">
						<div className="col-12">
								<OrdersContentContainer
									values={values}
									orders={orders}
								/>
						</div>
					</div>
				</Form>
			</div>
		</div>
	)
}

// WRAP FILTER FORM: wrap the filter form withFormik to handle the form submission and get the Orders data from server
const OrdersFilterContainer = compose(
	withRouter,
	withFormik({
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( FilterInputValues, FormikForm ) => {},
		validate: (values) => {
			let errors = {};
			return errors
		}
	}),
	queryWithLoading({ gqlString: GetRoutes, name: "GetRoutes"}),
	queryWithLoading({ gqlString: getProductMaterialsQuery, name: "GetMaterials"}),
	queryWithLoading({
		gqlString: getOrdersQuery, variablesFunction: (props) => ({orderQueue: props.match.params.orderQueue ? props.match.params.orderQueue : ''}),
		requiredPermission: { permission: "orders", permissionLevel: 3},
		options: {
			fetchPolicy: 'network-only', // we don't want to get the response from the Apollo cache
			pollInterval: 10000 // 10 seconds in milliseconds
		}
	}),
	withTranslate
)(OrdersFilter)

// MAIN CLASS: that wraps the filter form and the list
class OrdersFilterClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			productMaterialId: "All Materials",
			routeId: "All Routes"
		}
	}

	handleFormReload = (values) => {
		this.setState({
			productMaterialId: values.productMaterialId,
			routeId: values.routeId
		})
	};

	render () {
		return (
			<React.Fragment>
				<OrdersFilterContainer
					handleFormReload={this.handleFormReload}
					initialValues={this.state}
					match={this.props.match}
				/>
			</React.Fragment>
		)
	}
}

export const OrdersView = compose(
	withRouter,
	withTranslate
)(OrdersFilterClass)
