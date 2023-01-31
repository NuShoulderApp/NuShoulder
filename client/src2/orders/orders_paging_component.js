import React from 'react';
import _ from 'lodash';
import {  compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IWDPaginator } from '../layouts/pagination';
import moment from 'moment';
import { NavLink } from "react-router-dom";

import Select from "react-select";
import { Link } from "react-router-dom";
import { Form, Field, withFormik } from "../utilities/IWDFormik";

import { Translate } from '../translations/IWDTranslation';

import {
	GetOrders,
	getOrderServiceStatusesQuery,
	getOrderStatusesQuery
} from './orders_graphql';

import withState from 'react-state-hoc';
import { getCompaniesQuery } from '../companies/companies_graphql';
import { queryWithLoading } from '../utilities/IWDDb';
import { getSelectOptions } from '../utilities/IWDSelectField';

const FiltersContent = (props) => {
	const {
		setFieldValue,
		Companies: {
			Companies
		},
		OrderServiceStatuses: {
			OrderServiceStatuses
		},
		OrderStatuses: {
			OrderStatuses
		},
		userTypeId
	} = props;

	const companyOptions = getSelectOptions(Companies,"companyId", "companyName");
	const orderServiceStatusesOptions = getSelectOptions(OrderServiceStatuses,"orderServiceStatusId", "orderServiceStatus");
	const orderStatusesOptions = getSelectOptions(OrderStatuses,"orderStatusId", "orderStatus");

	return (
		<Form className="rounded border border-secondary text-secondary bg-light p-3 m-1 w-100">
			<div className="row mb-3">
				<div className="col-md-3">
					<div className="row">
						<div className="col-6">
							Pet Name
							<Field name="petName" />
						</div>
						<div className="col-6">
							Phone Number
							<Field name="ownerPhoneNumber" />
						</div>
					</div>
				</div>
				<div className="col-md-3">
					Pet Reference Number
					<Field name="petReferenceNumber" />
				</div>
				{
					(parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3) &&
					<div className="col-md-3">
						Hospital
						<Field component={Select}
							showError={true}
							className="text-dark"
							name="companyIds"
							//value={}
							options={companyOptions}
							onChange={(value) => setFieldValue("companyIds", value.map(( { value } ) => value)) }
							isMulti
						/>
					</div>
				}

				<div className="col-md-3">
					Cremation Status
					<Field component={Select}
						showError={true}
						className="text-dark"
						name="orderServiceStatusIds"
						options={orderServiceStatusesOptions}
						onChange={(value) => setFieldValue("orderServiceStatusIds", value.map(( { value } ) => value)) }
						isMulti
					/>
				</div>
			</div>
			<div className="row mb-2">
				<div className="col-md-3">
					Order Type
					<Field component={Select}
						showError={true}
						className="text-dark"
						name="orderTypeIds"
						options={[ { value: 1, label: "Vet Supplies Order" }, { value: 2, label: "Crematory Order" }, { value: 3, label: "Product Only Order" } ]}
						onChange={(value) => setFieldValue("orderTypeIds", value.map(( { value } ) => value)) }
						isMulti
					/>
				</div>
				<div className="col-md-3">
					Cremation Type
					<Field component={Select}
						showError={true}
						className="text-dark"
						name="productIds"
						options={[{value: 26, label: "Communal"}, {value: 27, label: "Private"}]}
						onChange={(value) => setFieldValue("productIds", value.map(( { value } ) => value)) }
						isMulti
					/>
				</div>
				<div className="col-md-3">
					Memorialization Type
					<Field component={Select}
						showError={true}
						className="text-dark"
						name="memorialization"
						options={[{value: "home", label: "At Home"}, {value: "clinic", label: "At Hospital" }, {value: "none", label: "None"}]}
						onChange={(value) => setFieldValue("memorialization", value.map(( { value } ) => value)) }
						isMulti
					/>
				</div>
				<div className="col-md-3">
					Order Status
					<Field component={Select}
						showError={true}
						className="text-dark"
						name="orderStatusIds"
						options={orderStatusesOptions}
						onChange={(value) => setFieldValue("orderStatusIds", value.map(( { value } ) => value)) }
						isMulti
					/>
				</div>
			</div>
			<button className="btn btn-info btn-addon rounded" type="submit"><FontAwesomeIcon icon="search" /> Filter</button>
		</Form>
	);
}

const Filters = compose(
	withFormik({ handleSubmit: (submittedValues, { props: { setState } }) => setState({ filterValues: submittedValues }) }),
	queryWithLoading({gqlString: getCompaniesQuery, name: "Companies"}),
	queryWithLoading({gqlString: getOrderServiceStatusesQuery, name: "OrderServiceStatuses"}),
	queryWithLoading({gqlString: getOrderStatusesQuery, name: "OrderStatuses"})
)(FiltersContent);

const OrdersViewList = (props) => {
	const {
		match: {
			params: { orderQueue='' }
		},
		Orders: {
			fetchMore=(_)=>(_),
			Orders: {
				orders: Orders
			}
		},
		Session: {
			User: {
				userTypeId
			}
		}
	} = props;
	console.log({props})
  let style = {};
  style.backgroundImage = `url(/images/ui/loyalpaws_background1.jpg)`;
  style.backgroundSize = 'cover';
  style.backgroundPosition = 'center center';
  style.backgroundRepeat = 'no-repeat';
  // style.height = '1000px';
  style.paddingTop = '350px';
  style.marginTop = '-350px';

	let width = window.innerWidth;
	let mediumWidth = 768;

	const windowSize = orderQueue === '' || orderQueue === 'completed' ? 500 : 100000;

	if (width >= mediumWidth) {
		// render for medium to large screens
		return (
			<IWDPaginator
				list={Orders}
				listName={'OrderList'}
				windowSize={windowSize}
				render={({OrderList}) => {
					return (
						<div className="w-100">
							<div className="row m-0 mb-2">
								<Filters
									setState={props.setState}
									userTypeId={userTypeId}
								/>
							</div>

							<div className="row mb-2">
								{orderQueue === 'burials' && <div className="col-12"><h3>Burial Orders<Link to={`/burials`} className="btn btn-info btn-addon mb-2 float-right"><FontAwesomeIcon icon="angle-right" className="pull-right" /><Translate id="Perform Burials"/> </Link></h3></div>}
								{orderQueue === 'cremations' &&
									<div className="col-12"><h3>Cremation Orders
										<Link to={`/cremations`} className="btn btn-info btn-addon mb-2 float-right ml-3"><FontAwesomeIcon icon="angle-right" className="pull-right" /><Translate id="Perform Cremations"/> </Link>
										<Link to={`/new_orders/new_order_type/cremation`} className="btn btn-info btn-addon mb-2 float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Add Cremation Order"/> </Link>
									</h3></div>
								}
								{orderQueue === 'followups' && <div className="col-12"><h3>Followup Orders</h3></div>}
								{orderQueue === 'holds' && <div className="col-12"><h3>On Hold Orders</h3></div>}
								{orderQueue === 'pawprints' && <div className="col-12"><h3>Paw Print Orders</h3></div>}
								{orderQueue === 'products' && <div className="col-12"><h3>Product Orders<Link to={`/new_orders/new_order_type/products`} className="btn btn-info btn-addon mb-2 float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Add Product Only Order"/> </Link></h3></div>}
								{orderQueue === 'supplies' && <div className="col-12"><h3>Vet Supplies Orders<Link to={`/new_orders/supplies`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Order Supplies"/> </Link></h3></div>}
								{orderQueue === 'urns' && <div className="col-12"><h3>Urn Orders</h3></div>}
								{orderQueue === 'visitations' && <div className="col-12"><h3>Visitations Orders</h3></div>}
							</div>
							<div className="border border-secondary rounded mr-1 ml-1">
								<table className="table table-sm table-striped">
									<thead>
										<tr className="h5" style={{height: 40+'px'}}>
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
										{OrderList.list.length > 0 &&
											OrderList.list.map((order) => {
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

												// If this is a Vet Supply order, for the starting status do an override that is more clear.
												const orderStatus = parseInt(order.orderTypeId) === 1 && parseInt(order.orderStatusId) === 1 ? 'Awaiting hospital to complete checkout' : order.orderStatus;

												if((order.orderStatus === "Deleted" && (parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3)) || order.orderStatus !== "Deleted") {
													return (
														<tr key={order.orderId}>
															<td>{moment(order.dateCreated).format('MMM DD, YYYY h:mm A')}</td>
															{
																(parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3) &&
																<td>{order.companyName}</td>
															}
															<td><h5 className="m-0"><NavLink to={`/orders/orderId/${order.orderId}`} activeClassName="active">{order.petReferenceNumber}</NavLink></h5></td>
															<td>{order.petFirstName} {order.petLastName}</td>
															<td>
																{orderType}
																<h5 className="m-0"><span className={`badge badge-${orderClass} p-2 text-uppercase`}>{order.orderServiceStatus}</span></h5>
															</td>
															<td>{order.OrderHold.length > 0 &&
																	<h5 className="m-0">
																		<span className="badge badge-warning p-2 text-uppercase">
																			<FontAwesomeIcon icon="hand-paper" /> <Translate id="Hold" />
																		</span>
																	</h5>
																}

																{orderStatus === "Deleted" && <FontAwesomeIcon icon="trash-alt" />}
																{orderStatus !== "Deleted" && <FontAwesomeIcon icon="tasks" />} {orderStatus}
																<br />
																{ order.orderTypeId === 2 && <React.Fragment>
																	{ order.memorialization === 'home' && <span><FontAwesomeIcon icon="home" /> <Translate id="Memorialization At Home" /><br /></span> }
																	{ order.memorialization === 'clinic' && <span><FontAwesomeIcon icon="hospital" /> <Translate id="Memorialization In Hospital" /><br /></span> }
																	{ order.memorialization === 'none' && <h5 className="m-0"><span className="badge badge-success p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id="No Memorialization" /></span><br /></h5> }

																	{ order.memorialization !== 'none' && <React.Fragment>
																		{memorializationOpen === true && memorializationCompleted === false && <React.Fragment>
																			<h5 className="m-0">
																				{memorializationReopened === false && <span className="badge badge-danger p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Open" /></span>}
																				{memorializationReopened === true && <span className="badge badge-danger p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Reopened" /></span>}
																			</h5>
																			{/* Show Shortcut to Add Products if Open and At Clinic */}
																			{order.memorialization === 'clinic' && <React.Fragment>
																				<button onClick={() => props.history.push(`/memorialization/referenceNumber/${order.petReferenceNumber}`)} disabled={order.OrderHold.length > 0} className="btn btn-info btn-sm btn-addon"><FontAwesomeIcon icon="shopping-cart" /> <Translate id="Add Products"/> </button>
																			</React.Fragment>}
																		</React.Fragment>}
																		{memorializationOpen === false && memorializationCompleted === false && <h5 className="m-0">
																			<span className="badge badge-warning p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Closed" /></span>
																		</h5>}
																		{memorializationOpen === false && memorializationCompleted === true && <h5 className="m-0">
																			<span className="badge badge-success p-2 text-uppercase"><FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Completed at" /> {order.memorialization}</span>
																		</h5>}
																	</React.Fragment>}
																</React.Fragment>}
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
							<div className="mt-3 mb-3 p-3">
								<div className="text-center">
									{/* Button that decides whether or not to fetch another page, and then tells paging to move to next page. */}
									<button className="btn btn-info btn-addon" onClick={async () => {
										// if we're at end of list, fetch more data
										if (OrderList.endOfList) {
											let result = await fetchMore();
											if(result) {result = {};} // cleaning up ESLint error - doesn't do anything
										}
										// finally, tell paging to move window
										OrderList.nextPage();
									}}>
										<FontAwesomeIcon icon="plus" />
										<Translate id="Show More Search Results" />
									</button>
								</div>
							</div>
						</div>
					)
				}}>
			</IWDPaginator>
		);
	} else {
		// small screen view
		return (
			<IWDPaginator
				list={Orders}
				listName={'OrderList'}
				windowSize={windowSize}
				render={({OrderList}) => {
					return (
						<div className="w-100 p-1">
							<div className="row mb-2">
								<Filters
									setState={props.setState}
									userTypeId={userTypeId}
								/>
							</div>

							<div className="row mb-2">
								{orderQueue === 'burials' && <div className="col-12"><h3><span className="text-white text-shadow">Burial Orders</span> <Link to={`/burials`} className="btn btn-info btn-addon mb-2 float-right"><FontAwesomeIcon icon="angle-right" className="pull-right" /><Translate id="Perform Burials"/> </Link></h3></div>}
								{orderQueue === 'cremations' &&
									<div className="col-12"><h3><span className="text-white text-shadow">Cremation Orders</span>
										<Link to={`/cremations`} className="btn btn-info btn-addon mb-2 float-right ml-3"><FontAwesomeIcon icon="angle-right" className="pull-right" /><Translate id="Perform Cremations"/> </Link>
										<Link to={`/new_orders/new_order_type/cremation`} className="btn btn-info btn-addon mb-2 float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Add Cremation Order"/> </Link>
									</h3></div>
								}
								{orderQueue === 'followups' && <div className="col-12"><h3 className="text-white text-shadow">Followup Orders</h3></div>}
								{orderQueue === 'holds' && <div className="col-12"><h3 className="text-white text-shadow">On Hold Orders</h3></div>}
								{orderQueue === 'pawprints' && <div className="col-12"><h3 className="text-white text-shadow">Paw Print Orders</h3></div>}
								{orderQueue === 'products' && <div className="col-12"><h3><span className="text-white text-shadow">Product Orders</span> <Link to={`/new_orders/new_order_type/products`} className="btn btn-info btn-addon mb-2 float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Add Product Only Order"/> </Link></h3></div>}
								{orderQueue === 'supplies' && <div className="col-12"><h3><span className="text-white text-shadow">Vet Supplies Orders</span> <Link to={`/new_orders/supplies`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Order Supplies"/> </Link></h3></div>}
								{orderQueue === 'urns' && <div className="col-12"><h3 className="text-white text-shadow">Urn Orders</h3></div>}
								{orderQueue === 'visitations' && <div className="col-12"><h3 className="text-white text-shadow">Visitations Orders</h3></div>}
							</div>
							{OrderList.list.length > 0 &&
								OrderList.list.map((order) => {
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

									// only show Deleted orders to crematory staff
									if((order.orderStatus === "Deleted" && (parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3)) || order.orderStatus !== "Deleted") {
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
							<div className="row mb-2">
								<div className="col-12">
									{/* Button that decides whether or not to fetch another page, and then tells paging to move to next page. */}
									<button className="btn btn-info float-right" onClick={async () => {
										// if we're at end of list, fetch more data
										if (OrderList.endOfList) {
											await fetchMore();
										}
										// finally, tell paging to move window
										OrderList.nextPage();
									}}><Translate id="Show More" /></button>
								</div>
							</div>
						</div>
					)
				}}>
			</IWDPaginator>
		);
	}
};

// NOTE: Below is the functionality for paging the Orders List
export const OrderPaging = compose(
	// Keep the filterValues in a state variable.  Any input types must be defaulted, the select types do not.
	withState({ filterValues: { petName: "", petReferenceNumber: "" }}),
	queryWithLoading({
		name: "Orders",
		gqlString: GetOrders,
		options: {
			fetchPolicy: 'network-only', // we don't want to get the response from the Apollo cache
			pollInterval: 10000 // 10 seconds in milliseconds
		},
		// Get the pass the filtervalues as variables.
		variablesFunction: (props) => ({ OrderSearchInput: { ...props.filterValues, limit: 100 } }),
		props: ({Orders}) => ({Orders: {
				...Orders,
				fetchMore: () => {
					if (Orders.fetchMore) {
						let cursor_obj = (Orders.Orders) ? (Orders.Orders.cursor || {}) : {};
						let cursor = _.pick(cursor_obj, ['after']);

						return Orders.fetchMore({
							variables: { cursor },

							// add new orders to list, update cursor
							updateQuery: (prev, { fetchMoreResult }) => ({
									...prev,
								Orders: {
									...prev.Orders,
									orders: [...prev.Orders.orders, ...fetchMoreResult.Orders.orders],
									cursor: fetchMoreResult.Orders.cursor
								}
							})
						})
					}
				}
			}
		})
	})
)(OrdersViewList);
