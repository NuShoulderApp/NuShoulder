import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import Math from 'mathjs';
import moment from 'moment';
// import { NavLink } from "react-router-dom";
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import React from 'react';
import { Translate } from '../translations/IWDTranslation';
import { withFormik } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import { withState } from "react-state-hoc";
import { withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
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
    getOrdersQuery
} from '../orders/orders_graphql';

import {
    getAnnouncementsQuery
} from '../announcements/announcement_graphql';

const DashboardContent = (props) => {
	const {
		Announcements,
		CrematoryOrder,
		EngravingInHouse: { OrderWorkQueue: { orders: EngravingInHouse}},
		GasMeterLogs,
		GasMeterLog: { LogCrematoryGasMeterLogs },
		gasMeterSaveButtonText,
		initalLoad,
		LogCrematoryGasMeterSave,
		measured,
		OpenOrders: { OpenOrders},
		OrdersHolds: { OrdersHolds},
		OrdersReadyDelivery: { OrdersWithStatus: OrdersReadyDelivery},
		OrdersWithStatus: { OrdersWithStatus},
		ProductsNeedOrdering: { OrderWorkQueue: { orders: ProductsNeedOrdering}},
		setState
	} = props

	if(initalLoad) {
		setState({GasMeterLogs: LogCrematoryGasMeterLogs, initalLoad: false})
	}

	let style = {};
	style.backgroundImage = `url(/images/ui/loyalpaws_background3.png)`;
	style.backgroundSize = 'cover';
	style.backgroundPosition = 'center center';
	style.backgroundRepeat = 'no-repeat';
	style.height = '1200px';

	// Set State on change handler for measurements of gas meter
	function handleOnChange(value) {
		setState({ gasMeterSaveButtonText: 'Save', measured: value});
	}

	// Save function for measuring the gas meter at the crematory
	async function saveGasLog() {
		let { data: { logCrematoryGasMeterSave: { LogCrematoryGasMeterLogs } }} = await LogCrematoryGasMeterSave({input: {measured}})
		setState({GasMeterLogs: LogCrematoryGasMeterLogs, gasMeterSaveButtonText: 'Saved', measured: ''});
	}

			// <div className="row m-3">
			// 	{/* <div className="col-2"></div> */}
			// 	<div className="col-12">
			// 		<div className="card">
			// 			<div className="card-header h4 text-center">
			// 				New Acacia Wood Urn Is Available!
			// 			</div>
			// 			<div className="card-body text-justify">
			// 				<div className="">
			// 					<p>Our new Acacia Wood Urn is now ready for your pet owners to order. This will replace the MDF Cherry and MDF Natural Urns as the included option for Private Cremations. The Acacia Wood Urn is also engravable for $35 for the first two lines, and an addittional $10 for the third line. This will be shown within the Memorialization ordering process as usual. If you have any questions or if we can assist in any way, please do not hesitate to call us.</p>
			// 					<p>Starting on November 6th, all NEW cremation orders with the MDF Cherry or MDF Natural Urns will be charged the regular urn price. This will be shown within the Memorialization ordering process as well.</p>
			// 				</div>
			// 			</div>
			// 		</div>
			// 	</div>
			// 	{/* <div className="col-2"></div> */}
			// </div>
			
	return (
		<div className="w-100 p-1" style={style}>
			
			<div className="row justify-content-center w-100 m-0 mt-5">
				<div className="col-md-3 mb-4 row justify-content-center text-center">
					<div className="col-auto">
						<div className="display-3 no-wrap rounded-circle p-4 text-white text-center mt-n-2 mr-2" style={{backgroundColor: '#ec8333', width: 125 + 'px', height: 125 + 'px'}}>
							<svg height="115" viewBox="0 10 70 80" width="80" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd" stroke="#FFF" strokeLinecap="round" strokeWidth="3" transform="translate(1.727379 2.124724)"><path d="m33.6202771 8.87527632c4.8686523 10.64697268 8.9058982 12.24511718 13.5742187 12.24511718 4.6683206 0 6.3701172-6.8374023 4.5488282-14.76269531-1.8212891-7.92529297-34.2204119-7.92529297-36.0454102-2.84082031-1.8249984 5.08447265 0 5.35839844-2.5131836 11.87792972-2.5131836 6.5195312-12.19579029 1.1506202-13.06835937 7.1738281-.87256909 6.0232079 3.20937021 11.1427016 10.64697267 13.4716797 7.4376024 2.328978 10.5534136-2.5292203 15.4663518-3.2832031 4.9129382-.7539829 4.5699043 1.118164 11.5292537 1.118164 6.9593493 0 11.0876263-2.9803756 13.0908203-1.118164 2.003194 1.8622115-4.7426758 4.9330354-4.7426758 9.2163085 0 4.2832732 3.5688476 3.8880397 3.5688476 6.4965821 0 2.6085423-.2061024 4.2877097-1.3442382 7.1420898-1.1381359 2.8543802 1.6626256 2.3738347 0 5.6601563-1.6626257 3.2863215-1.6992386 4.9794922-8.1108399 4.9794922s-8.3397168-4.8552429-11.2939453-4.9794922c-2.9542285-.1242494-7.7902832 3.4682617-6.6040039 4.9794922"/><path d="m39.4889294 48.1633623c-.8850911 4.7721354.7158203 6.1567382 4.8027344 4.1538085"/><path d="m20.3829724 12.3357255c.1165364 3.7278646 1.2791341 5.5917969 3.487793 5.5917969 3.4240118 0 5.0688476-3.026123 5.0688476-4.8999023"/></g></svg>
						</div>
					</div>
					<div className="col-12 mt-n-2">
						<div className="h5 p-0 m-0 mt-3">Awaiting Pickup</div> 
						<div className="display-3 no-wrap mt-n-2">{OrdersWithStatus.length}</div>
					</div>
				</div>
				
				<div className="col-md-3 mb-4 row justify-content-center text-center">
					<div className="col-auto">
						<div className="display-3 no-wrap float-left rounded-circle p-4 text-white mr-2" style={{backgroundColor: '#ec8333', width: 125 + 'px', height: 125 + 'px'}}>
							<div className="text-center mt-n-1">
								<FontAwesomeIcon icon="clock" />
							</div>
						</div> 
					</div>
					<div className="col-12 mt-n-2">
						<div className="h5 p-0 m-0 mt-4">Open Memorializations</div> 
						<div className="display-3 no-wrap mt-n-2">{OpenOrders.length}</div>
					</div>
				</div>


				<div className="col-md-3 mb-4 row justify-content-center text-center">
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
				</div>

			</div>

			{/* For Crematory Users - Show Deliveries */}
			{
				(parseInt(props.Session.User.userTypeId) === 2 || parseInt(props.Session.User.userTypeId) === 3) && 
				<div className="row justify-content-center w-100 m-0 mt-5">
					<div className="col-md-3 mb-4 row justify-content-center text-center">
						<div className="col-auto">
							<div className="display-3 no-wrap float-left rounded-circle p-4 text-white mr-2" style={{backgroundColor: '#ec8333', width: 125 + 'px', height: 125 + 'px'}}>
								<div className="text-center mt-n-1">
									<FontAwesomeIcon icon="fire" />
								</div>
							</div> 
						</div>
						<div className="col-12 mt-n-2">
							<div className="h5 p-0 m-0 mt-4">Cremations In Process</div> 
							<div className="display-3 no-wrap mt-n-2">{CrematoryOrder.OrdersInProcess.length}</div>
						</div>
					</div>
					<div className="col-md-3 mb-4 row justify-content-center text-center">
						<div className="col-auto">
							<div className="display-3 no-wrap float-left rounded-circle p-4 text-white mr-2" style={{backgroundColor: '#ec8333', width: 125 + 'px', height: 125 + 'px'}}>
								<div className="text-center mt-n-1">
									<FontAwesomeIcon icon="truck" />
								</div>
							</div> 
						</div>
						<div className="col-12 mt-n-2">
							<div className="h5 p-0 m-0 mt-4">Orders Ready For Delivery</div> 
							<div className="display-3 no-wrap mt-n-2">{OrdersReadyDelivery.length}</div>
						</div>
					</div>
					<div style={{cursor: 'pointer'}} onClick={() => props.history.push(`/workflow/list/ordering_products`)} className="col-md-3 mb-4 row justify-content-center text-center">
						<div className="col-auto">
							<div className="display-3 no-wrap float-left rounded-circle p-4 text-white mr-2" style={{backgroundColor: '#ec8333', width: 125 + 'px', height: 125 + 'px'}}>
								<div className="text-center mt-n-1">
									<FontAwesomeIcon icon="cart-plus" />
								</div>
							</div> 
						</div>
						<div className="col-12 mt-n-2">
							<div className="h5 p-0 m-0 mt-4">Order Products</div> 
							<div className="display-3 no-wrap mt-n-2">{ProductsNeedOrdering.length}</div>
						</div>
					</div>
					<div style={{cursor: 'pointer'}} onClick={() => props.history.push(`/workflow/list/engraving`)} className="col-md-3 mb-4 row justify-content-center text-center">
						<div className="col-auto">
							<div className="display-3 no-wrap float-left rounded-circle p-4 text-white mr-2" style={{backgroundColor: '#ec8333', width: 125 + 'px', height: 125 + 'px'}}>
								<div className="text-center mt-n-1">
									<FontAwesomeIcon icon="pen-alt" />
								</div>
							</div> 
						</div>
						<div className="col-12 mt-n-2">
							<div className="h5 p-0 m-0 mt-4">In-House Engraving</div> 
							<div className="display-3 no-wrap mt-n-2">{EngravingInHouse.length}</div>
						</div>
					</div>
				</div>
			}

			{/* Gas Meter Log */}
			{
				false && 
				(parseInt(props.Session.User.userTypeId) === 2 || parseInt(props.Session.User.userTypeId) === 3) && 
				<div className="row w-100 m-0 ml-5 mt-5">
					<div className="card">
						<div className="card-header text-center">
							Gas Meter Log
						</div>
						<div className="card-body">
							<div>
								<input type="text" name="measuredGasMeter" value={measured} onChange={(event) => handleOnChange(event.target.value)} className="form-control float-left ml-2" style={{width: 150 + 'px'}}/>
								<button type="button" className="btn float-left ml-1 btn-success" disabled={gasMeterSaveButtonText === 'Saved'} onClick={() => saveGasLog()}><Translate id={gasMeterSaveButtonText} /></button>
							</div>
							<table className="">
								<tbody>
									{GasMeterLogs.map((gas) => {
										return (
											<tr key={gas.logCrematoryGasMeterId}>
												<td className="p-1 m-0">{gas.measured} @ {moment(gas.dateCreated).format('M-D h:mm a')}</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			}


			{/* <div className="col-md-6"><div className="p-1"><div className="display-3 no-wrap float-left rounded-circle p-4 text-white mr-2" style={{backgroundColor: '#ec8333', width: 125 + 'px', height: 125 + 'px'}}><div className="text-center mt-n-1"><FontAwesomeIcon icon="fire" /></div></div> <p className="h5 p-0 m-0 mt-4">Cremation Orders In Process</p> <p className="display-3 no-wrap mt-n-2">{CrematoryOrder.OrdersInProcess.length}</p></div></div>
			<div className="col-md-6"><div className="p-1"><div className="display-3 no-wrap float-left rounded-circle p-4 text-white mr-2" style={{backgroundColor: '#ec8333', width: 125 + 'px', height: 125 + 'px'}}><div className="text-center mt-n-1"><FontAwesomeIcon icon="hand-paper" /></div></div> <p className="h5 p-0 m-0 mt-4">Orders on Hold</p> <p className="display-3 no-wrap mt-n-2">{OrdersHolds.length}</p></div></div> */}
			{/* <div className="col-md-6"><div className="p-1"><div className="display-3 no-wrap float-left rounded-circle p-4 text-white mr-2" style={{backgroundColor: '#ec8333', width: 125 + 'px', height: 125 + 'px'}}><div className="text-center"><FontAwesomeIcon icon="shopping-cart" /></div></div> <p className="h5 p-0 m-0 mt-4">Product Only Orders In Process</p> <p className="display-3 no-wrap mt-n-2">{ProductOnly.OrdersInProcess.length}</p></div></div> */}
			{/* <div className="col-md-6"><div className="p-1"><div className="display-3 no-wrap float-left rounded-circle p-4 text-white mr-2" style={{backgroundColor: '#ec8333', width: 125 + 'px', height: 125 + 'px'}}><div className="text-center mt-n-1"><FontAwesomeIcon icon="user-md" /></div></div> <p className="h5 p-0 m-0 mt-4">Vet Supply Orders In Process</p> <p className="display-3 no-wrap mt-n-2">{VetSupplies.OrdersInProcess.length}</p></div></div> */}

			{
				Announcements.Announcements.length > 0 && 
				<div className="w-100 mt-3">
					<h3 className="text-white text-shadow"><FontAwesomeIcon icon="bullhorn" /> <Translate id="Announcements" /></h3>
					{Announcements.Announcements.map((announcement) => {
						return <div className="card bg-info text-white mb-3" key={announcement.announcementId}>
							<div className="card-header">
								<h5 className="m-0">{announcement.title}</h5>
							</div>
							<div className="card-body">
								<p className="m-0">{announcement.announcement}</p>
							</div>
						</div>
					})}
				</div>
			}
		</div>
	)

		// 	{/* Crematory User */}
		// {/* {
		// 	parseInt(props.Session.User.userTypeId) !== 5 && 
		// 	<div className="w-100" style={style}>
		// 		<h3 className="text-white text-shadow">Welcome. You are logged in.</h3>
		// 		{
		// 			Announcements.Announcements.length > 0 && 
		// 			<div className="w-100 mt-3">
		// 				<h3 className="text-white text-shadow"><FontAwesomeIcon icon="bullhorn" /> <Translate id="Announcements" /></h3>
		// 				{Announcements.Announcements.map((announcement) => {
		// 					return <div className="card bg-info text-white mb-3" key={announcement.announcementId}>
		// 						<div className="card-header">
		// 							<h5 className="m-0">{announcement.title}</h5>
		// 						</div>
		// 						<div className="card-body">
		// 							<p className="m-0">{announcement.announcement}</p>
		// 						</div>
		// 					</div>
		// 				})}
		// 			</div>
		// 		}
		// 	</div>
		// } */}

}

export const Dashboard = compose(
	queryWithLoading({
		gqlString: getAnnouncementsQuery,
        variablesFunction: (props) => ({ onlyActive: true, onlyCurrent: true }),
        name: "Announcements",
		options: {
			fetchPolicy: 'network-only'
		}
	}),
	queryWithLoading({
		gqlString: getOpenOrdersQuery,
        variablesFunction: (props) => ({ companyId: (props.Session.User ? props.Session.User.companyId : 0) }),
        name: "OpenOrders",
		options: {
			fetchPolicy: 'network-only'
		}
	}),
  queryWithLoading({
		gqlString: getOrdersHoldsQuery,
        variablesFunction: (props) => ({ companyId: (props.Session.User ? props.Session.User.companyId : 0) }),
        name: "OrdersHolds",
		options: {
			fetchPolicy: 'network-only'
		}
	}),
  queryWithLoading({
		gqlString: getOrdersInProcessQuery,
        variablesFunction: (props) => ({ companyId: (props.Session.User ? props.Session.User.companyId : 0), orderTypeId: 1 }),
        name: "VetSupplies",
		options: {
			fetchPolicy: 'network-only'
		}
	}),
  queryWithLoading({
		gqlString: getOrdersInProcessQuery,
        variablesFunction: (props) => ({ companyId: (props.Session.User ? props.Session.User.companyId : 0), orderTypeId: 2 }),
        name: "CrematoryOrder",
		options: {
			fetchPolicy: 'network-only'
		}
	}),
  queryWithLoading({
		gqlString: getOrdersInProcessQuery,
        variablesFunction: (props) => ({ companyId: (props.Session.User ? props.Session.User.companyId : 0), orderTypeId: 3 }),
        name: "ProductOnly",
		options: {
			fetchPolicy: 'network-only'
		}
	}),
  queryWithLoading({
		gqlString: getOrdersWithStatusQuery,
        variablesFunction: (props) => ({ companyId: (props.Session.User ? props.Session.User.companyId : 0), orderStatusId: 1 }),
        name: "OrdersWithStatus",
		options: {
			fetchPolicy: 'network-only'
		}
	}),
  queryWithLoading({
		gqlString: getOrdersWithStatusQuery,
        variablesFunction: (props) => ({ companyId: (props.Session.User ? props.Session.User.companyId : 0), orderStatusId: 9 }),
        name: "OrdersReadyDelivery",
		options: {
			fetchPolicy: 'network-only'
		}
	}),
	queryWithLoading({
		gqlString: getOrdersQuery, 
		variablesFunction: (props) => ({orderQueue: 'engraving'}),
		requiredPermission: { permission: "orders", permissionLevel: 3},
		name: "EngravingInHouse"
	}),
	queryWithLoading({
		gqlString: getOrdersQuery, 
		variablesFunction: (props) => ({orderQueue: 'ordering_products'}),
		requiredPermission: { permission: "orders", permissionLevel: 3},
		name: "ProductsNeedOrdering"
	}),

	queryWithLoading({
		gqlString: LogCrematoryGasMeterLogs,
		name: "GasMeterLog"
	}),
	withFormik(),
	withMutation(LogCrematoryGasMeterSave, "LogCrematoryGasMeterSave"),
	withRouter,
	withState({
		GasMeterLogs: [],
		gasMeterSaveButtonText: 'Save',
		initalLoad: true,
		measured: ''
	}),
	withTranslate
)(DashboardContent);

	// withMutation(LogCrematoryGasMeterSave, "LogCrematoryGasMeterSave", ["getOrderProducts"]),

