import React from 'react';
import { withRouter, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink } from "react-router-dom";
import moment from 'moment';
import { compose } from "react-apollo";

import { queryWithLoading } from '../utilities/IWDDb';
import { withTranslate, Translate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	getBurialLogsQuery
} from './burials_graphql';

const BurialLogsViewList = (props) => {
	const {
        BurialLogs,
		state: { orderQueue }
	} = props;

	// <Link to={`/new_orders/burial`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="New Burial Order"/> </Link>
	// <Link to={`/new_orders/supplies`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Order Supplies"/> </Link>
	// <Link to={`/new_orders/products`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Product Only Order"/> </Link>

	return (
		<div className="w-100 p-1">
			{/* Only show New Burial Order link if we are on the full Orders List page */}
			{orderQueue === '' && <div className="col-12"><Link to={`/burials/logs`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="New Burial Log"/> </Link></div>}

			<table className="table table-striped">
				<thead>
					<tr>
						<th>Burial Log #</th>
						<th>Burial Date</th>
						<th>Plot</th>
						<th>Burial Type</th>
						<th>Performed By</th>
					</tr>
				</thead>
				<tbody>
					{BurialLogs.length > 0 &&
						BurialLogs.map((burialLog) => {
							return (
								<tr key={burialLog.burialLogId}>
									<td><h5 className="m-0"><NavLink to={`/burials/logs/${burialLog.burialLogId}`} activeClassName="active">{burialLog.burialLogId}</NavLink></h5></td>
									<td>{moment(burialLog.dateBurial).format('MMM DD, YYYY h:mm A')}</td>
									<td>{burialLog.cemetaryPlot}</td>
									<td>{burialLog.burialType}</td>
									<td>{burialLog.User.firstName} {burialLog.User.lastName}</td>
								</tr>
							)
						})
					}

				</tbody>
			</table>
		</div>
	);
};


class BurialLogsViewClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			orderQueue: props.match.params.orderQueue ? props.match.params.orderQueue : ''
		}
	}

	handleViewChange = (view) => {
		this.setState({ view })
	};

	render () {
		const BurialLogs = this.props.data.BurialLogs;
		return (
			<React.Fragment>
				<BurialLogsViewList
					BurialLogs={BurialLogs}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}


export const BurialLogsView = compose(
	withRouter,
	queryWithLoading({
		gqlString: getBurialLogsQuery, variablesFunction: (props) => ({orderQueue: props.match.params.orderQueue ? props.match.params.orderQueue : ''}),
		requiredPermission: { permission: "orders", permissionLevel: 4}
	}),
	withTranslate
)(BurialLogsViewClass)
