import _ from 'lodash';
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withRouter, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compose } from "react-apollo";
import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import { getDeliveryRouteQuery, getDeliveryRoutesQuery, DeliveryRouteSaveMutation, DeliveryRouteReorderMutation } from './delivery_routes_graphql';

// used for reordering the drag and drop list
const reorder = (list, startIndex, endIndex) => {
	let result = Array.from(list);
	const [removed] = result.splice(startIndex, 1);
	result.splice(endIndex, 0, removed);

	return result;
};

const getItemStyle = (isDragging, draggableStyle) => ({
	// some basic styles to make the items look a bit nicer
	userSelect: 'none',
	padding: 10,
	margin: `0 0 10px 0`,

	// change background colour if dragging
	background: isDragging ? 'lightyellow' : 'white',

	// styles we need to apply on draggables
	...draggableStyle,
});

const getListStyle = isDraggingOver => ({
	background: isDraggingOver ? 'lightblue' : 'lightgrey',
	padding: 10
});

// reorder route stop list
class RouteStopList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			items: this.props.RouteStops,
		};
		this.onDragEnd = this.onDragEnd.bind(this);
	}

	onDragEnd(result) {
		// dropped outside the list
		if (!result.destination) {
			return;
		}

		const items = reorder(
			this.state.items,
			result.source.index,
			result.destination.index
		);
		let draggedItem = items[result.destination.index];
		// Send Updated Route Stops to Server to Save New Order - we will update all of the RouteStop items to a new stopOrder, correct for zero index in items array vs 1 index in routeStopOrder
		let RouteReorderInput = {
			companyAddressId: draggedItem.companyAddressId,
			routeId: draggedItem.routeId,
			routeStopOrderOld: result.source.index + 1,
			routeStopOrderNew: result.destination.index + 1
		}

		this.props.DeliveryRouteReorderMutation({input: RouteReorderInput});

		this.setState({
			items,
		});
	}

	// Normally you would want to split things out into separate components.
	// But in this example everything is just done in one place for simplicity
	render() {
		return (
			<DragDropContext onDragEnd={this.onDragEnd}>
				<Droppable droppableId="droppable">
					{(provided, snapshot) => (
						<div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)}>
							{this.state.items.map((item, index) => {
								return (
									<Draggable key={item.companyAddressId} draggableId={item.companyAddressId} index={index}>
										{(provided, snapshot) => (
										<div ref={provided.innerRef}
											{...provided.draggableProps}
											{...provided.dragHandleProps}
											style={getItemStyle( snapshot.isDragging, provided.draggableProps.style )}
											>
											<span className="text-muted mr-3"><FontAwesomeIcon icon="grip-vertical" /></span> {item.addressName} {item.address1} {item.address2} {item.city}, {item.state} {item.postalCode}
										</div>
										)}
									</Draggable>
								)
							})}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</DragDropContext>
		);
	}
}

// define the form to use with the handlers below
const RouteSaveFormContent = (props) => {
	const {
		errors,
		handleChange,
		isSubmitting,
		Response,
		Route,
		DeliveryRouteReorderMutation,
		touched,
		values
	} = props;

	let responseAlertClass = Response && Response.success === false ? 'alert-danger' : 'alert-success';
	return (
		<React.Fragment>
			<div className="w-100 p-1">
				{/* SELECT THE MACHINE TO USE & THE CREMATION TYPE TO PERFORM */}
				<div className="card p-3">
					<h3><FontAwesomeIcon icon="pen" /> Update the &ldquo;{values.routeName}&rdquo; Route</h3>
					<Form>
						{ Response && Response.message !== "" && <div className="row"><div className={`col-12 alert ${responseAlertClass}`} >{props.translate(Response.message)}</div></div> }
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
								<button type="submit" className="btn btn-success btn-addon" disabled={isSubmitting}><FontAwesomeIcon icon="pen" /> <Translate id={isSubmitting ? "SAVING..." : "Update the Route"}/> </button>
							</div>
						</div>
					</Form>
				</div>
				<h2><Translate id="Route Stops"/></h2>

				<RouteStopList RouteStops={Route.RouteStops} DeliveryRouteReorderMutation={DeliveryRouteReorderMutation} />
				{Route.RouteStops.length === 0 &&
					Route.RouteStops.map((routeStop) => {
						return (
							<p className="border-bottom" key={routeStop.companyAddressId}>
								{routeStop.address1} {routeStop.address2} {routeStop.city} {routeStop.state} {routeStop.postalCode}
							</p>
						)
					})
				}
			</div>
		</React.Fragment>
	);
};

// Define the handlers for the form above
const RouteSaveContent = compose (
	withMutation(DeliveryRouteSaveMutation, "DeliveryRouteSaveMutation", [{query: getDeliveryRoutesQuery}]),
	withMutation(DeliveryRouteReorderMutation, "DeliveryRouteReorderMutation"),
	withFormik({
		handleSubmit: async ( input, { props: { DeliveryRouteSaveMutation, setResponse }, setSubmitting, resetForm} ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			input.monday = parseInt(input.monday);
			input.tuesday = parseInt(input.tuesday);
			input.wednesday = parseInt(input.wednesday);
			input.thursday = parseInt(input.thursday);
			input.friday = parseInt(input.friday);
			input.saturday = parseInt(input.saturday);
			input.sunday = parseInt(input.sunday);

			let tempInput =  _.omit(input,["RouteStops"]);

			const { data: { RouteSave }} = await DeliveryRouteSaveMutation({ input: tempInput });

			if(RouteSave.Response.success === true) {
				setResponse({
					message: "Route Updated",
					success: true,
					Route: RouteSave.Route
				});

			} else {
				setResponse({
					message: "Route Could Not Be Updated",
					success: false,
					Route: input
				});
			}

			resetForm(input);

		},
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		validationSchema: () => Yup.object().shape({
			routeName: Yup.string().required("Enter a Route Name")
	   })
	}),
	withTranslate
)(RouteSaveFormContent);

class RouteSaveClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {}
	}

	handleSetState = (valueObject) => {
		this.setState(valueObject)
	};

	render () {
		const { Route } = this.props.data;
		return (
			<React.Fragment>
				<RouteSaveContent
					initialValues={{...this.props.data.Route}}
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
export const RouteSave = compose(
	withRouter,
	queryWithLoading({
		gqlString: getDeliveryRouteQuery,
		variablesFunction: (props) => ({ routeId: props.match.params.routeId }),
		fetchPolicy: 'network-only' // we don't want to get the response from the Apollo cache
    }),
	withTranslate
)(RouteSaveClass);
