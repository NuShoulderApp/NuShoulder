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
	getCremationLogsQuery
} from './cremations_graphql';

const CremationLogsViewList = (props) => {
	const {
        CremationLogs,
		state: { orderQueue }
	} = props;

	// <Link to={`/new_orders/burial`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="New Burial Order"/> </Link>
	// <Link to={`/new_orders/supplies`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Order Supplies"/> </Link>
	// <Link to={`/new_orders/products`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Product Only Order"/> </Link>
	console.log({CremationLogs})
	return (
		<div className="w-100 p-1">
			{/* Only show New Cremation Order link if we are on the full Orders List page */}
			{orderQueue === '' && <div className="text-right"><Link to={`/cremations/log/create`} className="btn btn-info btn-addon"><FontAwesomeIcon icon="plus" /> <Translate id="New Cremation Log"/> </Link></div>}
			<div className="card p-3">
				<table className="table table-striped">
					<thead>
						<tr>
							<th>Cremation Log #</th>
							<th>Cremation Start Date</th>
							<th>Cremation End Date</th>
							<th>Machine</th>
							<th>Cremation Type</th>
							<th>Performed By</th>
						</tr>
					</thead>
					<tbody>
						{CremationLogs.length > 0 &&
							CremationLogs.map((cremationLog) => {

								return (
									<tr key={cremationLog.cremationLogId}>
										<td><h5 className="m-0"><NavLink to={`/cremations/logs/${cremationLog.cremationLogId}`} activeClassName="active">{cremationLog.cremationLogId}</NavLink></h5></td>
										<td>{moment(cremationLog.dateCremationLogStart).format('MMM DD, YYYY h:mm A')}</td>
										<td>{cremationLog.dateCremationLogEnd !== null && 
												<React.Fragment>
													{moment(cremationLog.dateCremationLogEnd).format('MMM DD, YYYY h:mm A')}
													{/* If this cremation was ended using the Schedule End time feature, show how many minutes were added */}
													{cremationLog.cremationEndScheduledMinutes > 0 && ` (+${cremationLog.cremationEndScheduledMinutes}m)`}
												</React.Fragment>
											}
											{cremationLog.dateCremationLogEnd === null && 
												<React.Fragment>
													<h5 className="m-0"><span className="badge badge-danger">LOG OPEN</span></h5>
												</React.Fragment>
											}
										</td>
										<td>{cremationLog.machineName}</td>
										<td>{cremationLog.cremationType}</td>
										<td>{cremationLog.firstName} {cremationLog.lastName}</td>
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


class CremationLogsViewClass extends React.Component {
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
		const CremationLogs = this.props.data.CremationLogs;
		return (
			<React.Fragment>
				<CremationLogsViewList
					CremationLogs={CremationLogs}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}


export const CremationLogsView = compose(
	withRouter,
	queryWithLoading({
		gqlString: getCremationLogsQuery, variablesFunction: (props) => ({orderQueue: props.match.params.orderQueue ? props.match.params.orderQueue : ''}),
		requiredPermission: { permission: "orders", permissionLevel: 3}
	}),
	withTranslate
)(CremationLogsViewClass)