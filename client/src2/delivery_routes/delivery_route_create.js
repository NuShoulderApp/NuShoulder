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
import { getDeliveryRouteQuery, getDeliveryRoutesQuery, DeliveryRouteSaveMutation } from './delivery_routes_graphql';


// define the form to use with the handlers below
const RouteCreateFormContent = (props) => {
	const {
		errors,
		handleChange,
		isSubmitting,
		touched
	} = props;

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				{/* SELECT THE MACHINE TO USE & THE CREMATION TYPE TO PERFORM */}
				<div className="card p-3">
					<h3><FontAwesomeIcon icon="plus" /> Create a Delivery / Pickup Route</h3>
					<Form>
						<div className="row">
							<div className="col-md-auto">
								<label htmlFor="routeName"><Translate id="Route Name"/></label>
								<Field name="routeName" className={`form-control ${errors.routeName && touched.routeName && 'is-invalid'}`} />
									{errors.routeName && touched.routeName && <div className="invalid-feedback">{props.translate(errors.routeName)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="pickupDays"><Translate id="Pickup Days"/></label>
								<Field name="pickupDays" className={`form-control ${errors.pickupDays && touched.pickupDays && 'is-invalid'}`} />
									{errors.pickupDays && touched.pickupDays && <div className="invalid-feedback">{props.translate(errors.pickupDays)}</div>}
							</div>
						</div>
						<div className="row">
							<div className="col-md-auto">
								<label htmlFor="monday"><Translate id="Monday"/></label>
								<Field  component="select" name="monday" className={`form-control ${errors.monday && touched.monday && 'is-invalid'}`}  onChange={handleChange}>
									<option value="0">No</option>
									<option value="1">Yes</option>
								</Field>
								{errors.monday && touched.monday && <div className="invalid-feedback">{props.translate(errors.monday)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="tuesday"><Translate id="Tuesday"/></label>
								<Field  component="select" name="tuesday" className={`form-control ${errors.tuesday && touched.tuesday && 'is-invalid'}`}  onChange={handleChange}>
									<option value="0">No</option>
									<option value="1">Yes</option>
								</Field>
								{errors.tuesday && touched.tuesday && <div className="invalid-feedback">{props.translate(errors.tuesday)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="wednesday"><Translate id="Wednesday"/></label>
								<Field  component="select" name="wednesday" className={`form-control ${errors.wednesday && touched.wednesday && 'is-invalid'}`}  onChange={handleChange}>
									<option value="0">No</option>
									<option value="1">Yes</option>
								</Field>
								{errors.wednesday && touched.wednesday && <div className="invalid-feedback">{props.translate(errors.wednesday)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="thursday"><Translate id="Thursday"/></label>
								<Field  component="select" name="thursday" className={`form-control ${errors.thursday && touched.thursday && 'is-invalid'}`}  onChange={handleChange}>
									<option value="0">No</option>
									<option value="1">Yes</option>
								</Field>
								{errors.thursday && touched.thursday && <div className="invalid-feedback">{props.translate(errors.thursday)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="friday"><Translate id="Friday"/></label>
								<Field  component="select" name="friday" className={`form-control ${errors.friday && touched.friday && 'is-invalid'}`}  onChange={handleChange}>
									<option value="0">No</option>
									<option value="1">Yes</option>
								</Field>
								{errors.friday && touched.friday && <div className="invalid-feedback">{props.translate(errors.friday)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="saturday"><Translate id="Saturday"/></label>
								<Field  component="select" name="saturday" className={`form-control ${errors.saturday && touched.saturday && 'is-invalid'}`}  onChange={handleChange}>
									<option value={0}>No</option>
									<option value={1}>Yes</option>
								</Field>
								{errors.saturday && touched.saturday && <div className="invalid-feedback">{props.translate(errors.saturday)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="sunday"><Translate id="Sunday"/></label>
								<Field  component="select" name="sunday" className={`form-control ${errors.sunday && touched.sunday && 'is-invalid'}`}  onChange={handleChange}>
									<option value={0}>No</option>
									<option value={1}>Yes</option>
								</Field>
								{errors.sunday && touched.sunday && <div className="invalid-feedback">{props.translate(errors.sunday)}</div>}
							</div>
						</div>
						<div className="row mt-3">
							<div className="col-md-12">
								<Link to={`/delivery_routes`} className="btn btn-default btn-addon float-right"><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/> </Link>
								<button type="submit" className="btn btn-success btn-addon" disabled={isSubmitting}><FontAwesomeIcon icon="plus" /> <Translate id="Create the Route"/> </button>
							</div>
						</div>
					</Form>
				</div>
			</div>
		</React.Fragment>
	);
};

// Define the handlers for the form above
const RouteCreateContent = compose (
	withMutation(DeliveryRouteSaveMutation, "DeliveryRouteSaveMutation", [{query: getDeliveryRoutesQuery}]),
	withFormik({
		handleSubmit: async ( input, { props: { DeliveryRouteSaveMutation, history }}, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			
			input.monday = parseInt(input.monday);
			input.tuesday = parseInt(input.tuesday);
			input.wednesday = parseInt(input.wednesday);
			input.thursday = parseInt(input.thursday);
			input.friday = parseInt(input.friday);
			input.saturday = parseInt(input.saturday);
			input.sunday = parseInt(input.sunday);
			
			const { data: { RouteSave }} = await DeliveryRouteSaveMutation({ input });
			


			if(RouteSave.Response.success === true) {
				history.push(`/delivery_routes/routeId/${RouteSave.Route.routeId}`);	
			}

		},
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		validationSchema: () => Yup.object().shape({
			routeName: Yup.string().required("Enter a Route Name")
	   })
	}),
	withTranslate
)(RouteCreateFormContent);

class RouteCreateClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			routeId: 0,
			pickupDays: "",
			routeName: "",
			monday: 0,
			tuesday: 0,
			wednesday: 0,
			thursday: 0,
			friday: 0,
			saturday: 0,
			sunday: 0
		}
	}
	
	handleSetState = (valueObject) => {
		this.setState(valueObject)
	};

	render () {
		const Route = { 
			routeId: 0,
			pickupDays: "",
			routeName: "",
			monday: 0,
			tuesday: 0,
			wednesday: 0,
			thursday: 0,
			friday: 0,
			saturday: 0,
			sunday: 0 }; // if we don't get back a route then setup an empty one to use

		return (
			<React.Fragment>
				<RouteCreateContent
					initialValues={Route}
					Route={Route}
					handleSetState={this.handleSetState}
					history={this.props.history}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}

// get the data for the ID in the URL
export const RouteCreate = compose(
	withRouter,
	queryWithLoading({
        gqlString: getDeliveryRouteQuery,
        variablesFunction: (props) => ({routeId: 0})
    }),
	withTranslate
)(RouteCreateClass);
