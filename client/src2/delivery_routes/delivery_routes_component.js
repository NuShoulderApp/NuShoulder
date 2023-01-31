import React from 'react';
import { withRouter, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink } from "react-router-dom";
//import moment from 'moment';
import { compose } from "react-apollo";

import { queryWithLoading } from '../utilities/IWDDb';
import { withTranslate, Translate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	getDeliveryRoutesQuery
} from './delivery_routes_graphql';

const DeliveryRoutesViewList = (props) => {
	const {
        Routes
	} = props;

	//console.log(props);

	return (
		<div className="w-100 p-1">
			<div className="text-right"><Link to={`/delivery_routes/create`} className="btn btn-info btn-addon"><FontAwesomeIcon icon="plus" /> <Translate id="New Delivery Route"/> </Link></div>

			<div className="card p-3">
				<table className="table table-striped">
					<thead>
						<tr>
							<th>Delivery Route Name</th>
							<th>Days of the Week</th>
							<th>Mon</th>
							<th>Tue</th>
							<th>Wed</th>
							<th>Thu</th>
							<th>Fri</th>
							<th>Sat</th>
							<th>Sun</th>
						</tr>
					</thead>
					<tbody>
						{Routes.length > 0 &&
							Routes.map((route) => {
								return (
									<tr key={route.routeId}>
										<td><h5 className="m-0"><NavLink to={`/delivery_routes/routeId/${route.routeId}`} activeClassName="active">{route.routeName}</NavLink></h5></td>
										<td>{route.pickupDays}</td>
										<td>{route.monday === 1 ? <span className="text-success h4"><FontAwesomeIcon icon="check" /></span> : <span className="text-muted">&mdash;</span> }</td>
										<td>{route.tuesday === 1 ? <span className="text-success h4"><FontAwesomeIcon icon="check" /></span> : <span className="text-muted">&mdash;</span> }</td>
										<td>{route.wednesday === 1 ? <span className="text-success h4"><FontAwesomeIcon icon="check" /></span> : <span className="text-muted">&mdash;</span> }</td>
										<td>{route.thursday === 1 ? <span className="text-success h4"><FontAwesomeIcon icon="check" /></span> : <span className="text-muted">&mdash;</span> }</td>
										<td>{route.friday === 1 ? <span className="text-success h4"><FontAwesomeIcon icon="check" /></span> : <span className="text-muted">&mdash;</span> }</td>
										<td>{route.saturday === 1 ? <span className="text-success h4"><FontAwesomeIcon icon="check" /></span> : <span className="text-muted">&mdash;</span> }</td>
										<td>{route.sunday === 1 ? <span className="text-success h4"><FontAwesomeIcon icon="check" /></span> : <span className="text-muted">&mdash;</span> }</td>
									</tr>
								)
							})
						}

					</tbody>
				</table>
			</div>
		</div>
	);
};


class DeliveryRoutesViewClass extends React.Component {
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
		const Routes = this.props.data.Routes;
		return (
			<React.Fragment>
				<DeliveryRoutesViewList
					Routes={Routes}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}


export const DeliveryRoutesView = compose(
	withRouter,
	queryWithLoading({
		gqlString: getDeliveryRoutesQuery, 
		variablesFunction: (props) => ({}),
		fetchPolicy: 'network-only', // we don't want to get the response from the Apollo cache
		requiredPermission: { permission: "settings", permissionLevel: 4}
	}),
	withTranslate
)(DeliveryRoutesViewClass)
