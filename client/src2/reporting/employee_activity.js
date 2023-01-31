import { compose } from "react-apollo";
import React from 'react';

import DatePicker from 'react-datepicker';
// import { Field, Form, withFormik } from "../utilities/IWDFormik";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Math from 'mathjs';
import moment from 'moment';
import { NavLink } from "react-router-dom";
import { queryWithLoading } from '../utilities/IWDDb';
// import { PieChart, Pie, Cell } from 'recharts';

import "react-datepicker/dist/react-datepicker.css";
import { withRouter } from "react-router-dom";
import { withState } from "react-state-hoc";
import { withTranslate, Translate } from '../translations/IWDTranslation';


// GRAPHQL QUERY
import {
	GetLogOrderActivities,
	GetLogOrderActivitiesDistinctColumnValues
} from '../log_order_activities/log_order_activities_graphql';

import {
	GetEmployeeUsersQuery
} from '../users/users_graphql';

const EmployeeActivityResultsContainer = (props) => {
	const {
		FilterUsers,
		initialLoad,
		Logs: { LogOrderActivities },
		selectedUserId,
		setState,
		userId,
		UsersActivities
	} = props;

	console.log({props})
	if (initialLoad === true) {
		// Get the List of Users to show Logs for based on the userId passed in from the filters
		let TempFilterUsers = userId > 0 ? FilterUsers.filter((user) => parseInt(user.userId) === parseInt(userId)) : FilterUsers;

		// For Each User, add a key for the array of Logs that they were responsible for creating
		TempFilterUsers.forEach((user) => user.Logs = LogOrderActivities.filter((log) => parseInt(log.loggedInUserId) === parseInt(user.userId)));

		// Only show users with Log Activity if userId = '-1', which is "With Activity" option.
		if(parseInt(userId) === -1) TempFilterUsers = TempFilterUsers.filter((user) => user.Logs.length > 0);

			// console.log('Log: ', LogOrderActivities[0])
			// console.log('Date: ', LogOrderActivities[0].dateCreated)
			// console.log('Moment: ', moment(LogOrderActivities[0].dateCreated).format('MM-DD-YYYY'))
			// console.log('Moment: ', moment(LogOrderActivities[0].dateCreated).format('MM-DD-YYYY'))

		setState({
			initialLoad: false,
			UsersActivities: TempFilterUsers
		})
	}

	return (
		<div className="p-2">
			{UsersActivities.map((user, index) => {
				let lastActivityTimeStamp = ''; // For use in the Logs for each User
				let lastActivityDay = '';

				return (
					<React.Fragment key={`user-${index}`}>
						<div className="card row mb-4 pt-2">
							<div className="col-12">
								<div className="row m-0 p-0">
									<div className="col-2">
										<div className="h5">{user.firstName} {user.lastName}</div>
										<div className="mt-2">
											{
												parseInt(user.userId) === parseInt(selectedUserId) &&
												<button type="button" className="btn btn-sm btn-addon" onClick={() => setState({ selectedUserId: 0 })}><FontAwesomeIcon icon="minus" className="" /><Translate id="Details" /></button>
											}
											{
												parseInt(user.userId) !== parseInt(selectedUserId) &&
												<button type="button" className="btn btn-sm btn-addon" onClick={() => setState({ selectedUserId: parseInt(user.userId) })}><FontAwesomeIcon icon="plus" className="" /><Translate id="Details" /></button>
											}
										</div>
									</div>
									<div className="col-auto">
										
										
									</div>
								</div>
							</div>{/* End col-12 */}
							{
								parseInt(selectedUserId) === parseInt(user.userId) &&
								<React.Fragment>
									<div className="col-12">
										<table className="table table-striped">
											<thead>
												<tr>
													<th style={{minWidth: 200+'px'}}><Translate id="Completed" /></th>
													<th style={{minWidth: 200+'px'}}><Translate id="Diff." /></th>
													<th style={{minWidth: 100+'px'}}><Translate id="Order" /></th>
													<th><Translate id="Activity" /></th>
												</tr>
											</thead>
											<tbody>
												{user.Logs.length > 0 &&
													user.Logs.map((log, index) => {
														// Get the time difference since the last activity logged
														let tempSecondsSinceLastActivity = 0;
														let tempMinutesSinceLastActivity = 0;
														let tempHoursSinceLastActivity = 0;
														if(index === 0) {
															tempSecondsSinceLastActivity = moment().diff(moment(log.dateCreated), "seconds");
															tempMinutesSinceLastActivity = moment().diff(moment(log.dateCreated), "minutes");
															tempHoursSinceLastActivity = moment().diff(moment(log.dateCreated), "hours");
														} else {
															tempSecondsSinceLastActivity = moment(lastActivityTimeStamp).diff(moment(log.dateCreated), "seconds");
															tempMinutesSinceLastActivity = moment(lastActivityTimeStamp).diff(moment(log.dateCreated), "minutes");
															tempHoursSinceLastActivity = moment(lastActivityTimeStamp).diff(moment(log.dateCreated), "hours");
														} 

														let tempLeftOverMinutes = tempHoursSinceLastActivity > 0 ? Math.subtract(tempMinutesSinceLastActivity, Math.multiply(tempHoursSinceLastActivity, 60)) : tempMinutesSinceLastActivity;
														let tempLeftOverSeconds = tempLeftOverMinutes > 0 ? Math.subtract(tempSecondsSinceLastActivity, Math.multiply(tempMinutesSinceLastActivity, 60)) : tempSecondsSinceLastActivity;
														let differenceString = tempHoursSinceLastActivity > 0 ? `${tempHoursSinceLastActivity} hrs ${tempLeftOverMinutes} mins` : `${tempLeftOverMinutes} mins ${tempLeftOverSeconds} s`

														// If this log is from a difference day than the previous log, mark this flag to make a new day's record.
														let newDay = lastActivityDay === moment(log.dateCreated).format('MM-DD-YYYY') ? false : true;

														// Update the last activity for comparison to the next activity
														lastActivityTimeStamp = moment(log.dateCreated);
														lastActivityDay = moment(log.dateCreated).format('MM-DD-YYYY');

														return (
															<React.Fragment key={`log-${index}`}>
																{newDay === true &&
																	<tr className="h2 text-center bg-success">
																		<td colSpan="4">{moment(log.dateCreated).format('MMMM DD')}</td>
																	</tr>
																}
																<tr>
																	<td>{moment(log.dateCreated).format('MMM DD h:mm:ss a')}</td>
																	<td>{((newDay === false || index === 0) && differenceString) || ''}</td>
																	<td><h5 className="m-0"><NavLink to={`/orders/orderId/${log.orderId}`} activeClassName="active">{log.orderId}</NavLink></h5></td>
																	<td>{log.activity}</td>
																</tr>
															</React.Fragment>
														)
													})
												}
											</tbody>
										</table>
									</div>
									<div className="col-12 mb-2">
										<button type="button" className="btn btn-lrg btn-addon" onClick={() => setState({ selectedUserId: 0 })}><FontAwesomeIcon icon="minus" className="" /><Translate id="Close Orders" /></button>
									</div>
								</React.Fragment>
							}
						</div>
					</React.Fragment>
				)
			})}
		</div>
	)
}


const EmployeeActivityResults = compose(
	queryWithLoading({
		gqlString: GetLogOrderActivities,
		variablesFunction: (props) => ({ userId: props.userId, dateEnd: props.dateEnd, dateStart: props.dateStart }),
		name: "Logs"
	}),
	withRouter,
	withState({
		initialLoad: true,
		selectedUserId: 0,
		UsersActivities: []
	}),
	withTranslate
)(EmployeeActivityResultsContainer)

const ReportingEmployeeActivityContainer = (props) => {
	const {
		DistinctActivity: { LogOrderActivitiesDistinctColumnValues: DistinctActivity },
		DistinctActivityType: { LogOrderActivitiesDistinctColumnValues: DistinctActivityType },
		DistinctField: { LogOrderActivitiesDistinctColumnValues: DistinctField },
		DistinctTable: { LogOrderActivitiesDistinctColumnValues: DistinctTable },
		// filterActivitySelected,
		// filterActivityTypeSelected,
		filterDateEnd,
		filterDateEndClass,
		// filterDateRange,
		filterDateStart,
		filterDateStartClass,
		// filterDbFieldSelected,
		// filterDbTableSelected,
		FilterDistinctActivity,
		FilterDistinctActivityType,
		FilterDistinctField,
		FilterDistinctTable,
		FilterUsers,
		filterUserSelected,
		initialLoad,
		setState,
		showResults,
		Users: { Users: Employees }
	} = props;

	if (initialLoad) {
		// let TempFilterClinics = Clinics.map((clinic) => { return { clinicId: clinic.companyId, clinicName: clinic.companyName } });
		// Sort Employees to put userTypeId 3 (users) before 2 (admins)
		let TempEmployees = Employees.sort((a,b) => parseInt(b.userTypeId) - parseInt(a.userTypeId));

		// Sort Distinct Logs alphabetically
		let TempDistinctActivity = DistinctActivity.sort(function(a, b){
			if(a.activity.toUpperCase() < b.activity.toUpperCase()) { return -1; }
			if(a.activity.toUpperCase() > b.activity.toUpperCase()) { return 1; }
			return 0;
		})
		let TempDistinctActivityType = DistinctActivityType.sort(function(a, b){
			if(a.activityType.toUpperCase() < b.activityType.toUpperCase()) { return -1; }
			if(a.activityType.toUpperCase() > b.activityType.toUpperCase()) { return 1; }
			return 0;
		})
		let TempDistinctField = DistinctField.sort(function(a, b){
			if(a.dbField.toUpperCase() < b.dbField.toUpperCase()) { return -1; }
			if(a.dbField.toUpperCase() > b.dbField.toUpperCase()) { return 1; }
			return 0;
		})

		setState({
			FilterDistinctActivity: TempDistinctActivity,
			FilterDistinctActivityType: TempDistinctActivityType,
			FilterDistinctField: TempDistinctField,
			FilterDistinctTable: DistinctTable,
			FilterUsers: TempEmployees,
			initialLoad: false
		})
	}

	// Filter function that grabs results based on the filter options selected
	function onFilter() {
		let tempFilterDateEndClass = filterDateEnd === '' || filterDateEnd === null ? 'border-danger text-danger' : '';
		let tempFilterDateStartClass = filterDateStart === '' || filterDateEnd === null ? 'border-danger text-danger' : '';

		if (filterDateEnd !== '' && filterDateEnd !== null && filterDateStart !== '' && filterDateStart !== null) {
			setState({
				filterDateEndClass: tempFilterDateEndClass,
				filterDateStartClass: tempFilterDateStartClass,
				showResults: true
			})
		}
		else {
			setState({
				filterDateEndClass: tempFilterDateEndClass,
				filterDateStartClass: tempFilterDateStartClass
			})
		}
	}

	// function changeState(value, name) {
	// 	let tempValue = value;
	// 	let tempFilterDateEnd = '';
	// 	let tempFilterDateStart = '';

	// 	// if(name === 'filterDateRange') {
	// 	// 	if(value === "Today") {
	// 	// 		tempFilterDateEnd = moment().format('L'); // L means today in local timezone
	// 	// 		tempFilterDateStart = moment().format('L'); // L means today in local timezone
	// 	// 		console.log({tempFilterDateStart})
	// 	// 	}
	// 	// } 


	// 	setState({
	// 		[name]: tempValue,
	// 		filterDateEnd: tempFilterDateEnd,
	// 		filterDateStart: tempFilterDateStart
	// 	})
	// }

	return (
		<div className="w-100 bg-light" style={{minHeight: 1000+'px'}}>
			<div className="ml-3 mr-3">
				<div className="p-2">
					<div className="card row pt-3 pb-3">
						<div className="w-100 pl-4 pr-4 clearfix">
							<div className="col-12">
								<div className="float-left h2 pt-2">Employee Activity</div>
								<div className="float-right">
									<div className="float-right mr-3" style={{ width: 135 + 'px' }}>
										<select id="filterActivitySelected" defaultValue="filterActivitySelected" className="form-control" onChange={(event) => setState({ filterActivitySelected: event.target.value, showResults: false })}>
											<option value="All">{props.translate("All Activities")}</option>
											{FilterDistinctActivity.map((activity, index) => (
												<option value={activity.activity} key={`activity-${index}`}>{activity.activity.charAt(0).toUpperCase()}{activity.activity.slice(1)}</option>
											))}
										</select>
									</div>
									<div className="float-right mr-3" style={{ width: 170 + 'px' }}>
										<select id="filterActivityTypeSelected" defaultValue="filterActivityTypeSelected" className="form-control" onChange={(event) => setState({ filterActivityTypeSelected: event.target.value, showResults: false })}>
											<option value="All">{props.translate("All Activity Types")}</option>
											{FilterDistinctActivityType.map((activityType, index) => (
												<option value={activityType.activityType} key={`activityType-${index}`}>{activityType.activityType.charAt(0).toUpperCase()}{activityType.activityType.slice(1)}</option>
											))}
										</select>
									</div>
									<div className="float-right mr-3" style={{ width: 140 + 'px' }}>
										<select id="filterDbFieldSelected" defaultValue="filterDbFieldSelected" className="form-control" onChange={(event) => setState({ filterDbFieldSelected: event.target.value, showResults: false })}>
											<option value="All">{props.translate("All Db Fields")}</option>
											{FilterDistinctField.map((field, index) => (
												<option value={field.dbField} key={`activityType-${index}`}>{field.dbField.charAt(0).toUpperCase()}{field.dbField.slice(1)}</option>
											))}
										</select>
									</div>
									<div className="float-right mr-3" style={{ width: 140 + 'px' }}>
										<select id="filterDbTableSelected" defaultValue="filterDbTableSelected" className="form-control" onChange={(event) => setState({ filterDbTableSelected: event.target.value, showResults: false })}>
											<option value="All">{props.translate("All Db Tables")}</option>
											{FilterDistinctTable.map((table, index) => (
												<option value={table.dbTable} key={`activityType-${index}`}>{table.dbTable.charAt(0).toUpperCase()}{table.dbTable.slice(1)}</option>
											))}
										</select>
									</div>
								</div>
							</div>
							<div className="col-12">
								<div className="float-right">
									<Translate id="Employee" />
									<div className="clearfix">
										<div className="float-left mr-3">
											<select id="filterUserSelected" defaultValue="filterUserSelected" className="form-control" onChange={(event) => setState({ filterUserSelected: event.target.value, showResults: false })}>
												<option value="-1">{props.translate("With Activity")}</option>
												<option value="0">{props.translate("All Employees")}</option>
												{FilterUsers.map((user) => (
													<option value={user.userId} key={user.userId}>{user.firstName} {user.lastName}</option>
												))}
											</select>
										</div>
										<div className="float-left">
											<button type="button" className={`btn btn-success ${(filterDateEnd === '' || filterDateStart === '') && 'disabled'}`} onClick={() => onFilter()}><Translate id="Search" /></button>
										</div>
									</div>
								</div>
								<div className={`float-right mr-3 ${filterDateEndClass}`} style={{ width: 170 + 'px' }}><Translate id="To" />* <DatePicker className={`form-control ${filterDateEndClass}`} selected={filterDateEnd} onChange={(date) => setState({ filterDateEnd: date })} /></div>
								<div className={`float-right mr-3 ${filterDateStartClass}`} style={{ width: 170 + 'px' }}><Translate id="From" />* <DatePicker className={`form-control ${filterDateStartClass}`} selected={filterDateStart} onChange={(date) => setState({ filterDateStart: date })} /></div>
							</div>
						</div>
					</div>			
				</div>
				{/* Do Not Show Until Filter Button Is Clicked */}
				{
					showResults === true &&
					<EmployeeActivityResults
						dateEnd={moment(filterDateEnd)}
						dateStart={moment(filterDateStart)}
						FilterUsers={FilterUsers}
						userId={filterUserSelected}
					/>
				}
			</div>
		</div>
	);

}

export const ReportingEmployeeActivity = compose(
	queryWithLoading({
		gqlString: GetEmployeeUsersQuery,
    variablesFunction: (props) => ({ userTypeId: [2,3] }),
		name: "Users"
	}),
	queryWithLoading({
		gqlString: GetLogOrderActivitiesDistinctColumnValues,
    variablesFunction: (props) => ({ columnName: 'activity' }),
		name: "DistinctActivity"
	}),
	queryWithLoading({
		gqlString: GetLogOrderActivitiesDistinctColumnValues,
    variablesFunction: (props) => ({ columnName: 'activityType' }),
		name: "DistinctActivityType"
	}),
	queryWithLoading({
		gqlString: GetLogOrderActivitiesDistinctColumnValues,
    variablesFunction: (props) => ({ columnName: 'dbField' }),
		name: "DistinctField"
	}),
	queryWithLoading({
		gqlString: GetLogOrderActivitiesDistinctColumnValues,
    variablesFunction: (props) => ({ columnName: 'dbTable' }),
		name: "DistinctTable"
	}),
	withRouter,
	withState({
		filterActivitySelected: 'All',
		filterActivityTypeSelected: 'All',
		filterDateEnd: '',
		filterDateEndClass: '',
		filterDateRange: 'Today',
		filterDateStart: '',
		filterDateStartClass: '',
		filterDbFieldSelected: 'All',
		filterDbTableSelected: 'All',
		FilterDistinctActivity: [],
		FilterDistinctActivityType: [],
		FilterDistinctField: [],
		FilterDistinctTable: [],
		FilterUsers: [],
		filterUserSelected: -1,
		initialLoad: true,
		LogsList: [],
		LogsListFiltered: [],
		showResults: false
	}),
	withTranslate
)(ReportingEmployeeActivityContainer)