import React from 'react';
import { withRouter, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NavLink } from "react-router-dom";
//import moment from 'moment';
import { compose } from "react-apollo";
import moment from 'moment';

import { queryWithLoading } from '../utilities/IWDDb';
import { withTranslate, Translate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	getAnnouncementsQuery
} from './announcement_graphql';

const AnnouncementsViewList = (props) => {
	const {
        Announcements,
		//state: { orderQueue }
	} = props;

	let today = moment().format("YYYY-MM-DD");
	today = moment(today);
	
	return (
		<div className="w-100 p-1">
			<h3><span className="text-white text-shadow"><Translate id="Admin Announcements" /></span>
				<Link to={`/announcements/create`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="New Announcement"/> </Link>
			</h3>
			<div className="card p-3">
				<table className="table table-striped">
					<thead>
						<tr>
							<th>Announcement Title</th>
							<th>Announcement</th>
							<th>Date Start</th>
							<th>Date End</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{Announcements.length > 0 &&
							Announcements.map((announcement) => {
								return (
									<tr key={announcement.announcementId}>
										<td><h5 className="m-0"><NavLink to={`/announcements/announcement/${announcement.announcementId}`} activeClassName="active">{announcement.title}</NavLink></h5></td>
										<td>{announcement.announcement.length > 50 ? announcement.announcement.substring(0, 47) + "..." : announcement.announcement}</td>
										<td>{moment(announcement.dateStart).format('MMM DD, YYYY')}</td>
										<td>{moment(announcement.dateEnd).format('MMM DD, YYYY')}</td>
										<td>{parseInt(announcement.active) === 0 && <span className="badge badge-warning">Inactive</span>}
											{parseInt(announcement.active) === 1 && today.diff(announcement.dateEnd, "days") > 0 && <span className="badge badge-dark">Expired</span>}
											{parseInt(announcement.active) === 1 && today.diff(announcement.dateStart, "days") >= 0 && today.diff(announcement.dateEnd, "days") <= 0 && <span className="badge badge-success">Showing</span>}
											{parseInt(announcement.active) === 1 && today.diff(announcement.dateStart, "days") < 0 && <span className="badge badge-info">Upcoming</span>}
										</td>
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


class AnnouncementsViewClass extends React.Component {
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
		const Announcements = this.props.data.Announcements;
		return (
			<React.Fragment>
				<AnnouncementsViewList
					Announcements={Announcements}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}


export const AnnouncementsView = compose(
	withRouter,
	queryWithLoading({
		gqlString: getAnnouncementsQuery, variablesFunction: (props) => ({}),
		requiredPermission: { permission: "settings", permissionLevel: 4},
		fetchPolicy: 'network-only', // we don't want to get the response from the Apollo cache
	}),
	withTranslate
)(AnnouncementsViewClass)
