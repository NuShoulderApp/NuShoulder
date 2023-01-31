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
const OrderStatusSaveFormContent = (props) => {
	const {
		errors,
		handleChange,
		isSubmitting,
		Response,
		touched,
		values
	} = props;

	let responseAlertClass = Response && Response.success === false ? 'alert-danger' : 'alert-success';

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				<h3 className="text-white text-shadow">Update the &ldquo;{values.orderStatus}&rdquo; Order Status</h3>
				<div className="card p-3">
					<Form>
						{ Response && Response.message !== "" && <div className="row"><div className={`col-12 alert ${responseAlertClass}`} >{props.translate(Response.message)}</div></div> }
						<div className="row">
							<div className="col-md-auto">
								<label htmlFor="orderStatus"><Translate id="Order Status"/></label>
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
								<button type="submit" className="btn btn-success btn-addon" disabled={isSubmitting}><FontAwesomeIcon icon="plus" /> <Translate id={isSubmitting ? "SAVING..." : "SAVE"}/> </button>
							</div>
						</div>
					</Form>
				</div>
			</div>
		</React.Fragment>
	);
};

// Define the handlers for the form above
const OrderStatusSaveContent = compose (
	withMutation(OrderStatusSaveMutation, "OrderStatusSaveMutation", ["getOrderStatusQuery"]),
	withFormik({
		handleSubmit: async ( input, { props: { OrderStatusSaveMutation, setResponse }, setSubmitting, resetForm} ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			let orderStatusInput = {};
			orderStatusInput.orderStatusId = input.orderStatusId;
			orderStatusInput.active = parseInt(input.active);
			orderStatusInput.barcode = input.barcode;
			orderStatusInput.visibleOrderUpdater = parseInt(input.visibleOrderUpdater);
			orderStatusInput.orderStatus = input.orderStatus;

			const { data: { OrderStatusSave }} = await OrderStatusSaveMutation({ input: orderStatusInput });

			if(OrderStatusSave.Response.success === true) {
				setResponse({
					message: "Order Status Updated",
					success: true,
					OrderStatus: OrderStatusSave.OrderStatus
				});

			} else {
				setResponse({
					message: "Order Status Could Not Be Updated",
					success: false,
					OrderStatus: input
				});
			}

			resetForm(input);

		},
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		validationSchema: () => Yup.object().shape({
			orderStatus: Yup.string().required("Enter a Order Status")
	   })
	}),
	withTranslate
)(OrderStatusSaveFormContent);

class OrderStatusSaveClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {}
	}

	handleSetState = (valueObject) => {
		this.setState(valueObject)
	};

	render () {
		const { OrderStatus } = this.props.data;
		return (
			<React.Fragment>
				<OrderStatusSaveContent
					initialValues={{...this.props.data.OrderStatus}}
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
export const OrderStatusSave = compose(
	withRouter,
	queryWithLoading({
		gqlString: getOrderStatusQuery,
		variablesFunction: (props) => ({ orderStatusId: props.match.params.orderStatusId }),
		fetchPolicy: 'network-only' // we don't want to get the response from the Apollo cache
    }),
	withTranslate
)(OrderStatusSaveClass);
