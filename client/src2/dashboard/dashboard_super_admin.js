import Chart from 'react-apexcharts'
import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Math from 'mathjs';
import moment from 'moment';
import { NavLink } from "react-router-dom";
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import React from 'react';
import TimeAgo from 'react-timeago';
import { Translate } from '../translations/IWDTranslation';
import { withFormik } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import { withState } from "react-state-hoc";
import { withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
    getAnnouncementsQuery
} from '../announcements/announcement_graphql';

import {
    getOpenCremationsQuery
} from '../cremations/cremations_graphql';

import {
	getOpenOrdersQuery,
	getOrdersHoldsQuery,
	getOrdersInProcessQuery,
	getOrdersWithStatusQuery
} from './dashboard_graphql';

import { 
	LogCrematoryGasMeterLogs, 
	LogCrematoryGasMeterSave 
} from '../logs/log_graphql';

import {
	GetLogOrderActivities
} from '../log_order_activities/log_order_activities_graphql';

import {
    getOrdersQuery
} from '../orders/orders_graphql';

import {
	GetEmployeeUsersQuery
} from '../users/users_graphql';


//   updateCharts() {
//     const max = 90;
//     const min = 30;
//     const newMixedSeries = [];
//     const newBarSeries = [];

//     this.state.seriesMixedChart.forEach((s) => {
//       const data = s.data.map(() => {
//         return Math.floor(Math.random() * (max - min + 1)) + min;
//       });
//       newMixedSeries.push({ data: data, type: s.type });
//     });

//     this.state.seriesBar.forEach((s) => {
//       const data = s.data.map(() => {
//         return Math.floor(Math.random() * (180 - min + 1)) + min;
//       });
//       newBarSeries.push({ data, name: s.name });
//     });

//     this.setState({
//       seriesMixedChart: newMixedSeries,
//       seriesBar: newBarSeries,
//       seriesRadial: [Math.floor(Math.random() * (90 - 50 + 1)) + 50]
//     });
//   }


const RecentActivityContainer = (props) => {
	const {
		FilterUsers,
		initialLoad,
		Logs: { LogOrderActivities },
		RecentActivityLogs,
		selectedUserId,
		setState,
		userId,
		UsersActivities
	} = props;

	console.log({props})
	if (initialLoad === true) {
		// // Get the List of Users to show Logs for based on the userId passed in from the filters
		// let TempFilterUsers = userId > 0 ? FilterUsers.filter((user) => parseInt(user.userId) === parseInt(userId)) : FilterUsers;

		// // For Each User, add a key for the array of Logs that they were responsible for creating
		// TempFilterUsers.forEach((user) => user.Logs = LogOrderActivities.filter((log) => parseInt(log.loggedInUserId) === parseInt(user.userId)));

		// // Only show users with Log Activity if userId = '-1', which is "With Activity" option.
		// if(parseInt(userId) === -1) TempFilterUsers = TempFilterUsers.filter((user) => user.Logs.length > 0);

		// For now, just show logs that are updating info about the orders
		let TempLogOrderActivities = LogOrderActivities.filter((log) => log.activity.includes("Updated to") || log.activity.includes("updated to"));

		// Go through each log and add in the user's name that did the action
		TempLogOrderActivities.forEach((log) => {
			// Get the user for this log
			let tempUserIndex = FilterUsers.findIndex((user) => parseInt(user.userId) === parseInt(log.loggedInUserId));
			// Only update the log if there is a match user
			if(tempUserIndex > -1) {
				log.loggedInUserFirstName = FilterUsers[tempUserIndex].firstName;
				log.loggedInUserLastName = FilterUsers[tempUserIndex].lastName;
			}
		})
		setState({
			initialLoad: false,
			RecentActivityLogs: TempLogOrderActivities
		})
	}

	return (
		<div className="row mt-4">
			<div className="col-12">
				<div className="card">
					<div className="card-body">
						<div className="h5 text-muted font-weight-normal text-truncate">Recent Activity</div>
						<div className="row" style={{height: 843+'px', overflowY: 'scroll'}}>
							{RecentActivityLogs.map((log, index) => {
								let lastActivityTimeStamp = ''; // For use in the Logs for each log
								let lastActivityDay = '';
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

											// <tr>
											// 	<td>{moment(log.dateCreated).format('MMM DD h:mm:ss a')}</td>
											// 	<td>{((newDay === false || index === 0) && differenceString) || ''}</td>
											// 	<td><h5 className="m-0"><NavLink to={`/orders/orderId/${log.orderId}`} activeClassName="active">{log.orderId}</NavLink></h5></td>
											// 	<td>{log.activity}</td>
											// </tr>
									let activityIcon = 'plus';
									let activityIconBackgroundColor = 'white';
									let activityIconColor = 'black';
									if(log.activity.includes('Ink Paw Print updated')) { // Do the ink PP first, because we will make the icon black. Other PP will be green.
										activityIcon = 'paw';
									} else if(log.activity.includes('Paw Print updated')) {
										activityIcon = 'paw';
										activityIconColor = 'green';
									} else if(log.activity.includes('Fur Clipping updated')) {
										activityIcon = 'cut';
										activityIconColor = 'green';
									} else if(log.activity.includes('Order Status Updated')) {
										activityIcon = 'tasks';
										activityIconColor = 'blue';
									} else if(log.activity.includes("updated to 'Confirmed'")) {
										activityIcon = 'check';
										activityIconColor = 'black';
									} else if(log.activity.includes("Remains Filled")) {
										activityIcon = 'box-open';
										activityIconColor = 'black';
									} else if(log.activity.includes("Completed & Packaged")) {
										activityIcon = 'box';
										activityIconColor = 'green';
									}

										// data-toggle="tooltip" data-html="true" title="<em>Tooltip</em> <u>with</u> <b>HTML</b>">
									return (
										<div className="col-12" key={`log-${index}`}>
											<div className="row">
												{/* {newDay === true &&
													<tr className="h2 text-center bg-success">
														<td colSpan="4">{moment(log.dateCreated).format('MMMM DD')}</td>
													</tr>
												} */}
												<div className="col-md-1 p-0 pl-1">
													<span className={`fa-layers fa-2x h1`}>
														<FontAwesomeIcon icon="circle" color={activityIconBackgroundColor} />
														<FontAwesomeIcon icon={activityIcon} color={activityIconColor} transform="shrink-5" />
													</span>
												</div>
												<div className="col-md-1 p-0">
													{
														((log.loggedInUserFirstName === "Barrett" || log.loggedInUserFirstName === "Roberta" || log.loggedInUserFirstName === "Ben" || log.loggedInUserFirstName === "Jamie")&&
															<span className="fa-layers fa-2x">
																{/* <FontAwesomeIcon icon="circle" color={"black"} />
																<FontAwesomeIcon icon="circle" color={"white"} transform="shrink-1" /> */}
																<strong className="fa-layers-text small">{log.loggedInUserFirstName.substring(0,1)}{log.loggedInUserLastName.substring(0,1)}</strong>
															</span>
														)
														||
														(log.loggedInUserFirstName !== null &&
														<img src={process.env.PUBLIC_URL + "/images/photos/employees/" + log.loggedInUserFirstName + ".png"} className="" alt={log.loggedInUserFirstName} style={{ maxWidth: 35 + 'px' }} />)
													}
													{
														log.loggedInUserFirstName === null &&
														<span className="h4 pt-1"><FontAwesomeIcon icon="magic" color="red" /></span>
													}
												</div>
												<div className="col-md-10" data-toggle="tooltip" data-placement="top" title="Help">
													<div className="small text-truncate">{log.activity}</div>
													<div className="small"><TimeAgo date={moment(log.dateCreated).format('YYYY-MM-DD HH:mm:ss')} /></div>
												</div>
											</div>
											{/* This div class is simply there to put a border-bottom that doesn't extend the full width of the parent col-12 */}
											<div className="row mb-2 ml-2 mr-2 border-bottom"></div>
										</div>
									)
								})
							}
						</div>
					</div>
				</div>
			</div>
		</div>

	)
}
const RecentActivity = compose(
	queryWithLoading({
		gqlString: GetLogOrderActivities,
		variablesFunction: (props) => ({ limit: 500, userId: props.userId }),
		name: "Logs"
	}),
	withRouter,
	withState({
		initialLoad: true,
		RecentActivityLogs: [],
		selectedUserId: 0,
		UsersActivities: []
	}),
	withTranslate
)(RecentActivityContainer)


const OrdersOnHoldContainer = (props) => {
	const {
		initialLoad,
		OrdersHoldLength,
		OrdersHolds,
		setState
	} = props;

	if(initialLoad === true) {
		setState({
			initialLoad: false
		})
	}
	console.log({OrdersHolds})
	return (
	 <div className="h3">
	 	{
			initialLoad === true &&
			<div className="spinner-border text-success" role="status">
				<span className="sr-only">Loading...</span>
			</div>
		}
	 	{initialLoad === false && OrdersHolds.OrdersHolds.length}
	</div>
	)
};

// Just get the number of Orders on Hold
const OrdersOnHold = compose(
	queryWithLoading({
		gqlString: getOrdersHoldsQuery,
		variablesFunction: (props) => ({ companyId: (props.Session.User ? props.Session.User.companyId : 0) }),
		name: "OrdersHolds",
		options: {
			fetchPolicy: 'network-only'
		}
	}),
	withState({
		initialLoad: true,
		OrdersHoldLength: ''
	})
)(OrdersOnHoldContainer)

const CrematingContainer = (props) => {
	const {
		initialLoad,
		OrdersHoldLength,
		Cremations,
		setState
	} = props;

	if(initialLoad === true) {
		setState({
			initialLoad: false
		})
	}
	console.log({Cremations})
	return (
		<div className="h3">
			{
				initialLoad === true &&
				<div className="spinner-border text-success" role="status">
					<span className="sr-only">Loading...</span>
				</div>
			}
			{initialLoad === false && Cremations.OpenCremations.length}
		</div>
	)
};

// Just get the number of Open Cremations
const Cremating = compose(
	queryWithLoading({
		gqlString: getOpenCremationsQuery,
		name: "Cremations",
		options: {
			fetchPolicy: 'network-only'
		}
	}),
	withState({
		initialLoad: true,
		OrdersHoldLength: ''
	})
)(CrematingContainer)

const DashboardSuperAdminContent = (props) => {
	const {
		FilterUsers,
		filterRecentActivityUserSelected,
		initalLoad,
		setState,
		Users: { Users: Employees }
	} = props

	if(initalLoad) {
		// Sort Employees to put userTypeId 3 (users) before 2 (admins)
		let TempEmployees = Employees.sort((a,b) => parseInt(b.userTypeId) - parseInt(a.userTypeId));

		setState({
			FilterUsers: TempEmployees,
			initalLoad: false
		})
	}

	// EMPLOYEE HOURS CHART
	let optionsMixedChart = {
        chart: { id: "basic-bar", toolbar: { show: false } },
		plotOptions: { bar: { columnWidth: "50%", dataLabels: { position: 'top' }, } },
		dataLabels: {
			enabled: true,
			formatter: function (val) {
				return val;
			},
			offsetY: -10,
			style: {
				fontSize: '12px'
			}
			},        
		stroke: { width: [4, 0, 0] },
        xaxis: {
          categories: [['Mon','11/23'], ['Tue','11/24'], ['Wed', '11/25'], ['Fri', '11/27'], ['Sat', '11/28'], ['Mon','11/30'], ['Tue','12/01'], ['Wed', '12/02'], ['Thu', '12/03']]
        },
        markers: { size: 6, strokeWidth: 3, fillOpacity: 0, strokeOpacity: 0, hover: { size: 8 } },
        yaxis: { tickAmount: 12, min: 0, max: 12 },
		legend: {
			show: true,
			showForSingleSeries: false,
			showForNullSeries: true,
			showForZeroSeries: true,
			position: 'right',
			horizontalAlign: 'center', 
			floating: false,
			fontSize: '14px',
			fontFamily: 'Helvetica, Arial',
			fontWeight: 400,
			formatter: undefined,
			inverseOrder: false,
			width: undefined,
			height: undefined,
			tooltipHoverFormatter: undefined,
			offsetX: 0,
			offsetY: 0,
			labels: {
				colors: undefined,
				useSeriesColors: false
			},
			markers: {
				width: 12,
				height: 12,
				strokeWidth: 0,
				strokeColor: '#fff',
				fillColors: undefined,
				radius: 12,
				customHTML: undefined,
				onClick: undefined,
				offsetX: 0,
				offsetY: 0
			},
			itemMargin: {
				horizontal: 5,
				vertical: 20
			},
			onItemClick: {
				toggleDataSeries: true
			},
			onItemHover: {
				highlightDataSeries: true
			},
		}
	};

	let seriesMixedChart = [
        {
          name: "Molly",
          type: "column",
          data: [3.25,5,1.25,4,2.75,0,3.5,2.75,4]
        },
		{
          name: "Angelo",
          type: "column",
          data: [8.5,10,6.75,9,4.75,4.5,8.5,9.25,6]
        },
        {
          name: "Bryon",
          type: "column",
          data: [4.75,4.5,8.5,9.25,6,0,5,6,8.5]
        }
      ];
	// END EMPLOYEE HOURS CHART

	// CREMATIONS CHART
	let optionsChartCremations = {
        chart: { id: "cremations-bar", toolbar: { show: false } },
        plotOptions: { bar: { columnWidth: "50%", dataLabels: { position: 'top' }, } },
		dataLabels: {
			enabled: true,
			formatter: function (val) {
				return val;
			},
			offsetY: -10,
			style: {
				fontSize: '12px'
			}
			},
        stroke: { width: [4, 0, 0] },
        xaxis: {
          categories: [['Mon','11/23'], ['Tue','11/24'], ['Wed', '11/25'], ['Fri', '11/27'], ['Sat', '11/28'], ['Mon','11/30'], ['Tue','12/01'], ['Wed', '12/02'], ['Thu', '12/03']]
        },
        markers: { size: 6, strokeWidth: 3, fillOpacity: 0, strokeOpacity: 0, hover: { size: 8 } },
		yaxis: [{
                title: {
                  text: 'Cremations',
                },
				tickAmount: 6, min: 0, max: 12
              }, {
                opposite: true,
                title: {
                  text: 'Gas Units'
                },
				tickAmount: 1, min: 0, max: 200
              }],
		legend: {
			show: true,
			showForSingleSeries: false,
			showForNullSeries: true,
			showForZeroSeries: true,
			position: 'right',
			horizontalAlign: 'center', 
			floating: false,
			fontSize: '14px',
			fontFamily: 'Helvetica, Arial',
			fontWeight: 400,
			formatter: undefined,
			inverseOrder: false,
			width: undefined,
			height: undefined,
			tooltipHoverFormatter: undefined,
			offsetX: 0,
			offsetY: 0,
			labels: {
				colors: undefined,
				useSeriesColors: false
			},
			markers: {
				width: 12,
				height: 12,
				strokeWidth: 0,
				strokeColor: '#fff',
				fillColors: undefined,
				radius: 12,
				customHTML: undefined,
				onClick: undefined,
				offsetX: 0,
				offsetY: 0
			},
			itemMargin: {
				horizontal: 5,
				vertical: 20
			},
			onItemClick: {
				toggleDataSeries: true
			},
			onItemHover: {
				highlightDataSeries: true
			},
		}
	};
	let seriesChartCremations = [
        {
          name: "Private",
          type: "column",
          data: [4,5,2,8,2,5,2,3,4]
        },
		{
          name: "Communal",
          type: "column",
          data: [12,15,4,8,4,10,12,3,6]
        },
		{
          name: "Gas Usage",
          type: "column",
          data: [150,140,130,190,175,50,120,150,135]
        },
      ];
	// END CREMATIONS CHART

			
	return (
		<div className="w-100 p-1 bg-light" >
			<div className="row justify-content-center w-100 m-0 mt-4">
				<div className="col-md-8">
					{/* Top Level Row - quick data numbers */}
					<div className="row">
						<div className="col-md-3">
							<div className="card" onClick={() => props.history.push('/orders/orderQueue/holds')} style={{cursor: 'pointer'}}>
								<div className="card-body">
									<div className="h5 text-muted font-weight-normal text-truncate">Orders on Hold</div>
									<OrdersOnHold 
										companyId={props.Session.User.companyId}
									/>
									{/* <div className="text-center mt-n-1 float-right">
										<FontAwesomeIcon icon="hand-paper" />
									</div> */}
 								</div>
							</div>
						</div>
						<div className="col-md-3">
							<div className="card">
								<div className="card-body">
									<div className="h5 text-muted font-weight-normal text-truncate">Open Orders</div>
									<div className="h3">{/*OpenOrders.length*/}3</div>
									{/* <div className="text-center mt-n-1 float-right">
										<FontAwesomeIcon icon="clock" />
									</div> */}
 								</div>
							</div>
						</div>
						<div className="col-md-3">
							<div className="card" onClick={() => props.history.push('/cremations/perform')} style={{cursor: 'pointer'}}>
								<div className="card-body">
									<div className="h5 text-muted font-weight-normal text-truncate">Cremating</div>
									<Cremating />
									{/* <div className="text-center mt-n-1 float-right">
										<FontAwesomeIcon icon="fire" />
									</div> */}
								</div>
							</div>
						</div>
						<div className="col-md-3">
							<div className="card">
								<div className="card-body">
									<div className="h5 text-muted font-weight-normal text-truncate">Ready To Delivery</div>
									<div className="h3">{/*OrdersReadyDelivery.length*/}20</div>
									{/* <div className="text-center mt-n-1 float-right">
										<FontAwesomeIcon icon="truck" />
									</div> */}
								</div>
							</div>
						</div>
					</div>{/* End Top Level Row - quick data numbers */}

					{/* Cremations count/revenue and Pet Possession tracker */}
					<div className="row mt-4">
						<div className="col-md-6">
							<div className="card">
								<div className="card-body">
									<div className="h5 text-muted font-weight-normal text-truncate">Cremations</div>
									<div className="row">
										<div className="col-auto text-muted">
											<div className="">Private:</div>
											<div className="">Group:</div>
										</div>
										<div className="col-auto text-dark">
											<div className="">23 ($4913)</div>
											<div className="">41 ($1025)</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="col-md-6">
							<div className="card">
								<div className="card-body">
									<div className="h5 text-muted font-weight-normal text-truncate">Pet Possession</div>
									<div className="row">
										<div className="col-auto text-muted">
											<div className="">Private:</div>
											<div className="">Group:</div>
										</div>
										<div className="col-auto text-dark">
											<div className="">2d 17h</div>
											<div className="">1d 3h</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>{/* End Cremations count/revenue and Pet Possession tracker */}

					{/* Employee Hours Graph */}
					<div className="row mt-4">
						<div className="col-md-12">
							<div className="card">
								<div className="card-body mixed-chart">
									<div className="h5 text-muted font-weight-normal text-truncate">Employee Hours</div>
									<Chart
										height='300px'
										options={optionsMixedChart}
										series={seriesMixedChart}
										type="line"
									/>
								</div>
							</div>
						</div>
					</div>{/* End Employee Hours Graph */}

					{/* Cremation Graph */}
					<div className="row mt-4">
						<div className="col-md-12">
							<div className="card">
								<div className="card-body mixed-chart">
									<div className="h5 text-muted font-weight-normal text-truncate">Cremations</div>
									<Chart
										height='300px'
										options={optionsChartCremations}
										series={seriesChartCremations}
										type="line"
									/>
								</div>
							</div>
						</div>
					</div>{/* End Employee Hours Graph */}


				</div>{/* End col-md-8 */}


				<div className="col-md-4">
					<div className="row">
						<div className="col-12">
							<div className="card border-danger" onClick={() => props.history.push('/orders/orderQueue/holds')} style={{cursor: 'pointer'}}>
								<div className="card-body text-danger">
									<div className="h5 text-danger font-weight-normal text-truncate">Needs Immediate Attention</div>
									<OrdersOnHold 
										companyId={props.Session.User.companyId}
									/>
									{/* <div className="text-center mt-n-1 float-right">
										<FontAwesomeIcon icon="hand-paper" />
									</div> */}
 								</div>
							</div>
						</div>
					</div>
					<RecentActivity 
						FilterUsers={FilterUsers}
						userId={filterRecentActivityUserSelected}
					/>
				</div>{/* End col-md-4 */}
				
				
				


				{/* <div className="col-md-3 mb-4 row justify-content-center text-center">
					<div className="col-auto">
						<div className="display-3 no-wrap float-left rounded-circle p-4 text-white mr-2" style={{backgroundColor: '#ec8333', width: 125 + 'px', height: 125 + 'px'}}>
							<div className="text-center mt-n-1">
								<FontAwesomeIcon icon="hand-paper" />
							</div>
						</div> 
					</div>
					<div className="col-12 mt-n-2">
						<div className="h5 p-0 m-0 mt-4">Orders on Hold</div> 
						<div className="display-3 no-wrap mt-n-2">{OrdersHolds.length}</div>
					</div>
				</div> */}

			</div>

			
		</div>
	)
}

export const DashboardSuperAdmin = compose(
	queryWithLoading({
		gqlString: GetEmployeeUsersQuery,
    variablesFunction: (props) => ({ userTypeId: [2,3] }),
		name: "Users"
	}),
	withRouter,
	withState({
		FilterUsers: [],
		initalLoad: true
	}),
	withTranslate
)(DashboardSuperAdminContent);

	// withMutation(LogCrematoryGasMeterSave, "LogCrematoryGasMeterSave", ["getOrderProducts"]),

