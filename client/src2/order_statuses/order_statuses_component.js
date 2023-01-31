import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { withRouter, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink } from "react-router-dom";
//import moment from 'moment';
import { compose } from "react-apollo";

import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import { withTranslate, Translate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	getOrderStatusesQuery, OrderStatusReorderMutation
} from './order_statuses_graphql';

// REORDERING FUNCTIONS
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

	// change background colour if dragging
	background: isDragging ? 'lightyellow' : 'white',

	// styles we need to apply on draggables
	...draggableStyle,
});
const getListStyle = isDraggingOver => ({
	background: isDraggingOver ? 'lightblue' : 'lightgrey',
	padding: 10
});

// reorder order statuses list
class OrderStatusesList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			items: this.props.OrderStatuses,
		};
		//this.onDragUpdate = this.onDragUpdate.bind(this);
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
		// Send Updated sortOrder for orderStatuses, correct for zero index in items array vs 1 index in routeStopOrder
		let OrderStatusReorderInput = {
			orderStatusId: draggedItem.orderStatusId,
			sortOrderOld: result.source.index + 1,
			sortOrderNew: result.destination.index + 1
		}
		
		this.props.OrderStatusReorderMutation({input: OrderStatusReorderInput});
		
		this.setState({
			items,
		});
	}
  
	render() {
		return (
			<DragDropContext onDragEnd={this.onDragEnd}>
				<Droppable droppableId="droppable">
					{(provided, snapshot) => (
						<div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)}>
							{this.state.items.map((item, index) => (
								<React.Fragment key={item.id}>
									{!(item.statusAtCrematory === 1 && item.orderCompletedIndicator === 0 && item.orderStatusId !== "5" && item.orderStatusId !== "9" && item.orderStatusId !== "11" && item.orderStatusId !== "12") &&
										<div className="bg-white mt-1 mb-1 p-2">
											<div>
												{(item.statusAtCrematory === 1 && item.orderCompletedIndicator === 0 && item.orderStatusId !== "5" && item.orderStatusId !== "9" && item.orderStatusId !== "11" && item.orderStatusId !== "12") && <span className="text-muted mr-3"><FontAwesomeIcon icon="grip-vertical" /></span>}
												{!(item.statusAtCrematory === 1 && item.orderCompletedIndicator === 0 && item.orderStatusId !== "5" && item.orderStatusId !== "9" && item.orderStatusId !== "11" && item.orderStatusId !== "12") && <span className="text-white mr-3"><FontAwesomeIcon icon="grip-vertical" /></span>}
												{item.orderStatus} 
												<span className="float-right">
													{item.statusAtVet === 1 && <span className="mr-3 d-inline-block"><FontAwesomeIcon icon="hospital" /> At Vet Hospital</span>}
													{item.statusAtCrematory === 1 && <span className="mr-3 d-inline-block"><FontAwesomeIcon icon="building" /> At Crematory</span>}
													{item.statusInTransit === 1 && <span className="mr-3 d-inline-block"><FontAwesomeIcon icon="ambulance" /> In Transit</span>}

													{item.visibleOrderUpdater === 1 && <span className="mr-3 d-inline-block"><FontAwesomeIcon icon="eye" /> Show in Order Updater</span>}
													{item.visibleOrderUpdater === 0 && <span className="mr-3 d-inline-block text-muted"><FontAwesomeIcon icon="eye-slash" /> Hide in Order Updater</span>}

													{item.active === 1 && <span className="mr-3 d-inline-block"><FontAwesomeIcon icon="check" /> Active</span>}
													{item.active === 0 && <span className="mr-3 d-inline-block text-muted"><FontAwesomeIcon icon="times" /> Inactive</span>}

													{item.editable === 1 && <span><NavLink to={`/order_statuses/orderStatusId/${item.orderStatusId}`} activeClassName="active" className="btn btn-info btn-sm mt-n-1">EDIT</NavLink></span>}
													{item.editable === 0 && <span><span className="btn btn-secondary btn-sm disabled mt-n-1">EDIT</span></span>}
												</span>
											</div>
										</div>
									}
									{(item.statusAtCrematory === 1 && item.orderCompletedIndicator === 0 && item.orderStatusId !== "5" && item.orderStatusId !== "9" && item.orderStatusId !== "11" && item.orderStatusId !== "12") &&
										<Draggable draggableId={item.orderStatusId} index={index} isDragDisabled={!(item.statusAtCrematory === 1 && item.orderCompletedIndicator === 0 && item.orderStatusId !== "5" && item.orderStatusId !== "9" && item.orderStatusId !== "11" && item.orderStatusId !== "12")}>
											{(provided, snapshot) => (
											<div ref={provided.innerRef}
												{...provided.draggableProps}
												{...provided.dragHandleProps}
												style={getItemStyle( snapshot.isDragging, provided.draggableProps.style )}
												className="mt-1 mb-1 p-2"
												>
												{(item.statusAtCrematory === 1 && item.orderCompletedIndicator === 0 && item.orderStatusId !== "5" && item.orderStatusId !== "9" && item.orderStatusId !== "11" && item.orderStatusId !== "12") && <span className="text-muted mr-3"><FontAwesomeIcon icon="grip-vertical" /></span>}
												{!(item.statusAtCrematory === 1 && item.orderCompletedIndicator === 0 && item.orderStatusId !== "5" && item.orderStatusId !== "9" && item.orderStatusId !== "11" && item.orderStatusId !== "12") && <span className="text-white mr-3"><FontAwesomeIcon icon="grip-vertical" /></span>}
												{item.orderStatus} 
												<span className="float-right">
													{item.statusAtVet === 1 && <span className="mr-3 d-inline-block"><FontAwesomeIcon icon="hospital" /> At Vet Hospital</span>}
													{item.statusAtCrematory === 1 && <span className="mr-3 d-inline-block"><FontAwesomeIcon icon="building" /> At Crematory</span>}
													{item.statusInTransit === 1 && <span className="mr-3 d-inline-block"><FontAwesomeIcon icon="ambulance" /> In Transit</span>}

													{item.visibleOrderUpdater === 1 && <span className="mr-3 d-inline-block"><FontAwesomeIcon icon="eye" /> Show in Order Updater</span>}
													{item.visibleOrderUpdater === 0 && <span className="mr-3 d-inline-block text-muted"><FontAwesomeIcon icon="eye-slash" /> Hide in Order Updater</span>}

													{item.active === 1 && <span className="mr-3 d-inline-block"><FontAwesomeIcon icon="check" /> Active</span>}
													{item.active === 0 && <span className="mr-3 d-inline-block text-muted"><FontAwesomeIcon icon="times" /> Inactive</span>}

													{item.editable === 1 && <span><NavLink to={`/order_statuses/orderStatusId/${item.orderStatusId}`} activeClassName="active" className="btn btn-info btn-sm mt-n-1">EDIT</NavLink></span>}
													{item.editable === 0 && <span><span className="btn btn-secondary btn-sm disabled mt-n-1">EDIT</span></span>}
												</span>
											</div>
											)}
										</Draggable>
									}
								</React.Fragment>
							))}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</DragDropContext>
		);
	}
}

const OrderStatusesViewList = (props) => {
	const {
		OrderStatuses,
		OrderStatusReorderMutation
	} = props;

	return (
		<div className="w-100 p-1">
			<div className="text-right"><Link to={`/order_statuses/create`} className="btn btn-info btn-addon"><FontAwesomeIcon icon="plus" /> <Translate id="New Order Status"/> </Link></div>
			<OrderStatusesList OrderStatuses={OrderStatuses} OrderStatusReorderMutation={OrderStatusReorderMutation} />
		</div>
	);
};


class OrderStatusesViewClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			//orderQueue: props.match.params.orderQueue ? props.match.params.orderQueue : ''
		}
	}

	handleViewChange = (view) => {
		this.setState({ view })
	};

	render () {
		const OrderStatuses = this.props.data.OrderStatuses;
		return (
			<React.Fragment>
				<OrderStatusesViewList
					OrderStatuses={OrderStatuses}
					OrderStatusReorderMutation={this.props.OrderStatusReorderMutation}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}


export const OrderStatusesView = compose(
	withRouter,
	withMutation(OrderStatusReorderMutation, "OrderStatusReorderMutation"),
	queryWithLoading({
		gqlString: getOrderStatusesQuery, 
		variablesFunction: (props) => ({orderQueue: props.match.params.orderQueue ? props.match.params.orderQueue : ''}),
		fetchPolicy: 'network-only', // we don't want to get the response from the Apollo cache
		requiredPermission: { permission: "settings", permissionLevel: 4}
	}),
	withTranslate
)(OrderStatusesViewClass)
