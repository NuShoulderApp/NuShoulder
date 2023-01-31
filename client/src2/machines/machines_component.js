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
	getMachinesQuery
} from './machines_graphql';

const MachinesViewList = (props) => {
	const {
        Machines,
		//state: { orderQueue }
	} = props;

	//console.log(props);

	return (
		<div className="w-100 p-1">
			<h3><span className="text-white text-shadow"><Translate id="Admin Machines" /></span>
				<Link to={`/machines/create`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="New Machine"/> </Link>
			</h3>
			<div className="card p-3">
				<table className="table table-striped">
					<thead>
						<tr>
							<th>Machine Name</th>
							<th>Does Communal</th>
							<th>Does Individual</th>
							<th>Does Private</th>
							<th>Multi Chamber</th>
							<th>Rows</th>
							<th>Columns</th>
							<th>In Use</th>
						</tr>
					</thead>
					<tbody>
						{Machines.length > 0 &&
							Machines.map((machine) => {
								return (
									<tr key={machine.machineId}>
										<td><h5 className="m-0"><NavLink to={`/machines/machine/${machine.machineId}`} activeClassName="active">{machine.machineName}</NavLink></h5></td>
										<td>{machine.doCommunal === 1 ? <span>Yes</span> : <span>No</span>}</td>
										<td>{machine.doIndividual === 1 ? <span>Yes</span> : <span>No</span>}</td>
										<td>{machine.doPrivate === 1 ? <span>Yes</span> : <span>No</span>}</td>
										<td>{machine.isMultiChamber === 1 ? <span>Yes</span> : <span>No</span>}</td>
										<td>{machine.rows}</td>
										<td>{machine.columns}</td>
										<td>{machine.cremationLogId !== null ? <NavLink to={`/cremations/logs/${machine.cremationLogId}`}>Yes</NavLink> : <span>No</span>}</td>
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


class MachinesViewClass extends React.Component {
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
		const Machines = this.props.data.Machines;
		return (
			<React.Fragment>
				<MachinesViewList
					Machines={Machines}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}


export const MachinesView = compose(
	withRouter,
	queryWithLoading({
		gqlString: getMachinesQuery, variablesFunction: (props) => ({}),
		requiredPermission: { permission: "settings", permissionLevel: 4},
		fetchPolicy: 'network-only', // we don't want to get the response from the Apollo cache
	}),
	withTranslate
)(MachinesViewClass)
