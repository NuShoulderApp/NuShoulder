import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import React from 'react';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withRouter, NavLink } from "react-router-dom";
import { withState } from "react-state-hoc";
import _ from "lodash";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

import {
	getOrderStatusesQuery,
	OrderStatusUpdateMutation
} from './orders_graphql';

const OrderStatusUpdaterFormContent = (props) => {
	const {
		errors,
		Order,
		OrderSave,
		OrderStatuses: { OrderStatuses },
		orderStatusId,
		petReferenceNumber,
		responseAlertClass,
		responseMessage,
		setState
	} = props;

	// Is Memorialization Time Open, Time Closed, Manually Completed, Reopened by Crematory?
	let memorializationOpen = true;			// memorialization is still available
	let memorializationCompleted = true;	// memorialization manually completed in clinic or at home
	let memorializationReopened = true;
	// if Reopened by Staff - OPEN
	if(Order && Order.tabMemorializationOpen === 1) {
		memorializationOpen = true;
		memorializationCompleted = false;
		memorializationReopened = true;
	}
	// else if Manually Completed - COMPLETED at ____
	else if (Order && Order.memorializationCheckedOut === 1) {
		memorializationOpen = false;
		memorializationCompleted = true;
		memorializationReopened = false;
	}
	// else if Time Closed - CLOSED
	else if (Order && moment().diff(moment(Order.dateMemorializationEnds)) > 0) {
		memorializationOpen = false;
		memorializationCompleted = false;
		memorializationReopened = false;
	}
	// else if Time Open - OPEN
	else if (Order && moment().diff(moment(Order.dateMemorializationEnds)) <= 0) {
		memorializationOpen = true;
		memorializationCompleted = false;
		memorializationReopened = false;
	}

	async function handleChangeStatus() {
		if(parseInt(orderStatusId) === 0) {
			errors.orderStatusId = 'Choose a Status';
		} else {
			delete errors.orderStatusId;
		}
		if(petReferenceNumber === "") {
			errors.petReferenceNumber = 'Enter a Pet Reference Number';
		} else if(petReferenceNumber.length !== 7) {
			errors.petReferenceNumber = 'Must be 7 digits';
		} else {
			// delete this key
			delete errors.petReferenceNumber;
		}

		if(Object.keys(errors).length !== 0) {
			// The set state is simply a way to refresh the component with the new errors object to take effect in this component
			setState({orderStatusId: orderStatusId})
		} else {
			const { data: { orderStatusUpdate }} = await OrderSave({ input: {orderStatusId: orderStatusId, petReferenceNumber: _.toUpper(petReferenceNumber)} });

			if(orderStatusUpdate.Response.success === false) {
				setState({
					responseAlertClass: 'alert-danger',
					responseMessage: orderStatusUpdate.Response.message
				})
			} else {
				// Update the Order and clear out the petReferenceNumber and any warning that was previously there
				setState({
					Order: orderStatusUpdate.Order,
					petReferenceNumber: '',
					responseAlertClass: '',
					responseMessage: ''
				})

			}
		}
	}

	return (
		<React.Fragment>
			<Form className="w-100 p-1">
				<div className="card p-3">
					{/*  Display form  */}
					<div className="row">
						<div className="col-md-auto">
							<label htmlFor="orderStatusId" className="mb-0"><Translate id="Set Status To"/></label>
							<Field component="select" name="orderStatusId" className={`form-control ${errors.orderStatusId && 'is-invalid'}`} onChange={(event) => setState({ orderStatusId: event.target.value, responseAlertClass: '', responseMessage: '' })} >
								{/* This render to Static Markup is required because options don't like React children as the label */}
									<option value="0">Choose a Status</option>
									{OrderStatuses.map((orderStatus) => {
											if(orderStatus.visibleOrderUpdater === 1) {
												return <option value={orderStatus.orderStatusId} key={orderStatus.orderStatusId}>{orderStatus.orderStatus}</option>
											} else {
												return null;
											}
										}
									)}
							</Field>

						</div>
						<div className="col-md-auto">
							<label htmlFor="petReferenceNumber" className="mb-0"><Translate id="Pet Reference Number"/></label>
							<Field name="petReferenceNumber" value={petReferenceNumber} className={`form-control ${errors.petReferenceNumber && 'is-invalid'}`} onChange={(event) => setState({ petReferenceNumber: event.target.value, responseAlertClass: '', responseMessage: '' })} />
						</div>
						<div className="col-md">
							<button type="button" className="btn btn-success btn-addon mt-4" onClick={() => handleChangeStatus()}>
								<FontAwesomeIcon icon="tasks" /> <Translate id="Update Status" />
							</button>
						</div>
					</div>


					{/*  Display a resulting status message.  */}
					{ responseMessage !== '' && <div className="row ml-0 mt-2"><div className={`col-auto alert ${responseAlertClass}`} >{props.translate(responseMessage)}</div></div> }

					{
						Object.keys(Order).length > 0 &&
						<div className="mt-3">
							<div className="card-header bg-dark text-light">
								<h3 className="float-md-right m-0"><FontAwesomeIcon icon="hospital" /> {Order.companyName}</h3>
								{/* Show Either Vet Supply Order, Product Only Order, OR Cremation Order Info Pet Name */}
								<h3 className="m-0">
									{ Order.orderTypeId === 1 &&
										<span className="m-0 mr-3"><Translate id="Vet Supply Order" /> </span>
									}
									{ Order.orderTypeId === 3 &&
										<span className="m-0 mr-3"><Translate id="Product Only Order" /> </span>
									}
									{ (Order.orderTypeId === 2 || Order.orderTypeId === null) &&
										<span className="m-0 mr-3">{Order.petFirstName} {Order.petLastName} </span>
									}
									<NavLink to={`/orders/orderId/${Order.orderId}`} activeClassName="active" className="btn btn-info btn-addon"><FontAwesomeIcon icon="angle-right" /> {Order.petReferenceNumber}</NavLink>
								</h3>
							</div>
							{Order.OrderHold && Order.OrderHold.length > 0 &&
								<div className="card mb-3 border-warning bg-warning">
									<div className="card-header">
										<h4 className="m-0"><FontAwesomeIcon icon="hand-paper" /> <Translate id="Hold" /></h4>
									</div>
									<div className="card-body">
										<p className="m-0">{Order.OrderHold[0].orderHoldReason}</p>
									</div>
									{Order.OrderHold[0].dateCreated && <div className="card-footer">{moment(Order.OrderHold[0].dateCreated).format('MMM D, YYYY h:mm A')}</div>}
								</div>
							}
							<div className="card-deck">
								<div className="card">
									{/* check to see if the date MemorializationEnds is in the past */}
									{ Order.orderTypeId === 2 && Order.memorialization !== 'none' && <React.Fragment>
										{memorializationOpen === true && memorializationCompleted === false && <div className="card-header text-white bg-danger">
											<h5 className="m-0 text-light">
												<span className="h4 float-md-right m-0"><FontAwesomeIcon icon="tasks" /> {Order.orderStatus}</span>
												<FontAwesomeIcon icon="clock" />
												{memorializationReopened === false && <React.Fragment><Translate id=" Memorialization Open until" /> {moment(Order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}</React.Fragment>}
												{memorializationReopened === true && <React.Fragment><Translate id=" Memorialization Reopened" /></React.Fragment>}
											</h5>
										</div>}
										{memorializationOpen === false && memorializationCompleted === false && <div className="card-header text-white bg-warning">
											<h5 className="m-0 text-light">
												<span className="h4 float-md-right m-0"><FontAwesomeIcon icon="tasks" /> {Order.orderStatus}</span>
												<FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Window Closed at" /> {moment(Order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}
											</h5>
										</div>}
										{memorializationOpen === false && memorializationCompleted === true && <div className="card-header text-white bg-success">
											<h5 className="m-0 text-light">
												<span className="h4 float-md-right m-0"><FontAwesomeIcon icon="tasks" /> {Order.orderStatus}</span>
												<FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Completed at" /> {Order.memorialization}
											</h5>
										</div>}
									</React.Fragment>}

									{ Order.orderTypeId === 2 && Order.memorialization === 'none' && <div className="card-header text-white bg-success">
										<h5 className="m-0 text-light">
											<span className="h4 float-md-right m-0"><FontAwesomeIcon icon="tasks" /> {Order.orderStatus}</span>
											<FontAwesomeIcon icon="clock" /> <Translate id=" No Memorialization" />
										</h5>
									</div>}

									{ Order.orderTypeId !== 2 &&
										<div className="card-header text-white bg-info">
											<h5 className="m-0">
												<FontAwesomeIcon icon="tasks" /> {Order.orderStatus}
											</h5>
										</div>
									}
								</div>
							</div>
						</div>
					}
				</div>

			</Form>
		</React.Fragment>
	);
};

export const OrderStatusUpdater = compose(
	queryWithLoading({
		gqlString: getOrderStatusesQuery,
		requiredPermission: { permission: "orders", permissionLevel: 3},
		name: 'OrderStatuses'
	}),
	withFormik(),
	withMutation(OrderStatusUpdateMutation, "OrderSave"),
	withRouter,
	withState({
		Order: {},
		orderStatusId: 0,
		petReferenceNumber: '',
		responseAlertClass: '',
		responseMessage: ''
	}),
	withTranslate
)(OrderStatusUpdaterFormContent)
