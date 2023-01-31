import _ from 'lodash';
import React from 'react';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withRouter, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compose } from "react-apollo";
import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import { getOrderStatusQuery, OrderStatusSaveMutation } from './order_statuses_graphql';


// define the form to use with the handlers below
const OrderStatusCreateFormContent = (props) => {
	const {
		errors,
		handleChange,
		isSubmitting,
		touched
	} = props;

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				<div className="border bg-light p-3 mt-3 mb-3">
					<h3>Create an Order Status</h3>
					<Form>
						<div className="row">
							<div className="col-md-auto">
								<label htmlFor="orderStatus"><Translate id="Order Status Name"/></label>
								<Field name="orderStatus" className={`form-control ${errors.orderStatus && touched.orderStatus && 'is-invalid'}`} />
									{errors.orderStatus && touched.orderStatus && <div className="invalid-feedback">{props.translate(errors.orderStatus)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="barcode"><Translate id="Barcode"/></label>
								<Field name="barcode" className={`form-control ${errors.barcode && touched.barcode && 'is-invalid'}`} />
									{errors.barcode && touched.barcode && <div className="invalid-feedback">{props.translate(errors.barcode)}</div>}
							</div>
						</div>
						<div className="row">
							<div className="col-md-auto">
								<label htmlFor="active"><Translate id="Active"/></label>
								<Field  component="select" name="active" className={`form-control ${errors.active && touched.active && 'is-invalid'}`}  onChange={handleChange}>
									<option value="0">No</option>
									<option value="1">Yes</option>
								</Field>
								{errors.active && touched.active && <div className="invalid-feedback">{props.translate(errors.active)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="visibleOrderUpdater"><Translate id="Show in Status Updater"/></label>
								<Field  component="select" name="visibleOrderUpdater" className={`form-control ${errors.visibleOrderUpdater && touched.visibleOrderUpdater && 'is-invalid'}`}  onChange={handleChange}>
									<option value="0">No</option>
									<option value="1">Yes</option>
								</Field>
								{errors.visibleOrderUpdater && touched.visibleOrderUpdater && <div className="invalid-feedback">{props.translate(errors.visibleOrderUpdater)}</div>}
							</div>
						</div>
						<div className="row mt-3">
							<div className="col-md-12">
								<Link to={`/order_statuses`} className="btn btn-default btn-addon float-right"><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/> </Link>
								<button type="submit" className="btn btn-success btn-addon" disabled={isSubmitting}><FontAwesomeIcon icon="plus" /> <Translate id="Save"/> </button>
							</div>
						</div>
					</Form>
				</div>
			</div>
		</React.Fragment>
	);
};

// Define the handlers for the form above
const OrderStatusCreateContent = compose (
	withMutation(OrderStatusSaveMutation, "OrderStatusSaveMutation", ["getOrderStatusQuery"]),
	withFormik({
		handleSubmit: async ( input, { props: { OrderStatusSaveMutation, history }}, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			let orderStatusInput = {};
			orderStatusInput.active = parseInt(input.active);
			orderStatusInput.barcode = input.barcode;
			orderStatusInput.visibleOrderUpdater = parseInt(input.visibleOrderUpdater);
			orderStatusInput.orderStatus = input.orderStatus;
			
			const { data: { OrderStatusSave }} = await OrderStatusSaveMutation({ input: orderStatusInput });

			if(OrderStatusSave.Response.success === true) {
				history.push(`/order_statuses/orderStatusId/${OrderStatusSave.OrderStatus.orderStatusId}`);	
			}

		},
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		validationSchema: () => Yup.object().shape({
			orderStatus: Yup.string().required("Enter an Order Status")
	   })
	}),
	withTranslate
)(OrderStatusCreateFormContent);

class OrderStatusCreateClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			orderStatusId: 0,
			active: 1,
			barcode: "",
			defaultSortOrder: null,
			editable: 1,
			orderStatus: "",
			orderCompletedIndicator: 0,
			visibleOrderUpdater: 1,
			sortOrder: null,
			statusAtCrematory: 1,
			statusAtVet: 0,
			statusInTransit: 0
		}
	}
	
	handleSetState = (valueObject) => {
		this.setState(valueObject)
	};

	render () {
		const OrderStatus = { 
			orderStatusId: 0,
			active: 1,
			barcode: "",
			defaultSortOrder: null,
			editable: 1,
			orderStatus: "",
			orderCompletedIndicator: 0,
			visibleOrderUpdater: 1,
			sortOrder: null,
			statusAtCrematory: 1,
			statusAtVet: 0,
			statusInTransit: 0 }; // if we don't get back an order status then setup an empty one to use

		return (
			<React.Fragment>
				<OrderStatusCreateContent
					initialValues={OrderStatus}
					OrderStatus={OrderStatus}
					handleSetState={this.handleSetState}
					history={this.props.history}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}

// get the data for the ID in the URL
export const OrderStatusCreate = compose(
	withRouter,
	queryWithLoading({
        gqlString: getOrderStatusQuery,
        variablesFunction: (props) => ({orderStatusId: 0})
    }),
	withTranslate
)(OrderStatusCreateClass);
