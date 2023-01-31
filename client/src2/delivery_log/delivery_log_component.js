import { compose } from "react-apollo";
import moment from 'moment';
import { queryWithLoading } from '../utilities/IWDDb';
import React from 'react';
import Select from "react-select";
import { Translate } from '../translations/IWDTranslation';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withState } from "react-state-hoc";

import { GeneratePrintButton } from '../orders/pdf_print_button_component';

// GRAPHQL QUERY
import {
	getCompanyRouteQuery,
	getDeliveryLogCompaniesQuery,
    getDeliveryLogsQuery
} from './delivery_log_graphql';

import {
	GetRoutes,
	GetRoutesOrderQueue
} from '../orders/orders_graphql';

const DeliveryLogListContent = (props) => {
    const {
        data: { DeliveryLogs }
	} = props;

    // Filter the DeliveryLogs down to only ones that are type pickup or delivery
    const filteredDeliveryLogs = DeliveryLogs.filter((log) => log.DeliveryLogOrder.findIndex((order) => order.deliveryType === 'delivery' || order.deliveryType === 'pickup') > -1);

	return (
        <table className="table table-striped mt-3">
			<thead>
				<tr>
					<th><Translate id="Hospital" /></th>
					<th><Translate id="Date" /></th>
					<th><Translate id="Picked Up" /></th>
					<th><Translate id="Delivered" /></th>
					<th><Translate id="PDF" /></th>
				</tr>
			</thead>
			<tbody>
                {filteredDeliveryLogs.length > 0 &&
                    filteredDeliveryLogs.map((log) => {
						const deliveries = log.DeliveryLogOrder.filter((order) => order.deliveryType === 'delivery');
                        const pickups = log.DeliveryLogOrder.filter((order) => order.deliveryType === 'pickup');
						const Company = props.DeliveryLogCompanies.filter((company) => {
							return parseInt(company.companyId) === parseInt(log.companyId)
						});
						const companyName = Company[0].companyName
                        return (
                            <tr key={log.deliveryLogId}>
								<td>{companyName}</td>
                                <td>{moment(log.dateCreated).format('MMM D, YYYY HH:mm A')}</td>
                                <td>{pickups.length}</td>
                                <td>{deliveries.length}</td>
                                <td><GeneratePrintButton disableButton={false} jobId={null} orderId={null} deliveryLogId={log.deliveryLogId} printableName="Delivery Log" tooltipGenerateButton="" /></td>
                            </tr>
                        )
                    })
                }
				{filteredDeliveryLogs.length === 0 &&
					<tr key="0">
						<td colSpan="4">No Logs match your search, please change your filters</td>
					</tr>
				}
            </tbody>
        </table>
    )
}

const DeliveryLogListContainer = compose(
    queryWithLoading({
        gqlString: getDeliveryLogsQuery,
        variablesFunction: (props) => ({ companyIds: parseInt(props.Session.User.userTypeId) === 5 ? props.Session.User.companyId : props.companyIds, dateEnd: props.dateEnd, dateStart: props.dateStart, routeIds: props.routeIds })
    }),
	withFormik()
)(DeliveryLogListContent)


const DeliveryLogContent = (props) => {
	const {
        Companies: { DeliveryLogCompanies },
        companies,
		CompanyAddressRoute: { CompanyAddresses },
        companyIds,
        dateEnd,
        dateStart,
		Orders: { OrderWorkQueue: { orders }},
        routeIds,
        Routes: { Routes },
        routes,
		Session: { User: { userTypeId }},
		setState,
        submitting
	} = props;

    // Functionality for Companies/Hospitals Multi-select
    const ALL_COMPANIES_ARRAY = [{value: "ALL_COMPANIES", label: "All Hospitals"}];
	const CompaniesSelectValues = ALL_COMPANIES_ARRAY.concat(DeliveryLogCompanies.map(({ companyId: value, companyName: label}) => ({ value, label }) ));

	function companyChange(selectedCompanies, { option: newOption = {} }) {
		// Filter out the ALL_COMPANIES item.
		const filteredCompanies = selectedCompanies.filter(( { value } ) => value !== "ALL_COMPANIES");

		// After filtering, if there are no Companies to show, set it to ALL_COMPANIES_ARRAY.
		if( newOption.value === "ALL_COMPANIES" || filteredCompanies.length === 0 ) {
			setState({companies: ALL_COMPANIES_ARRAY, companyIds: ''});
		} else {
			let companyIds = filteredCompanies.map((company) => {
				return company.value;
			})
			companyIds = companyIds.join();
			setState({companies: filteredCompanies, companyIds });
		}
	}

    // Functionality for Routes Multi-select
    const ALL_ROUTES_ARRAY = [{value: "ALL_ROUTES", label: "All Routes"}];
	const RoutesSelectValues = ALL_ROUTES_ARRAY.concat(Routes.map(({ routeId: value, routeName: label}) => ({ value, label }) ));

	function routeChange(selectedRoutes, { option: newOption = {} }) {
		// Filter out the ALL_ROUTES item.
		const filteredRoutes = selectedRoutes.filter(( { value } ) => value !== "ALL_ROUTES");

		// After filtering, if there are no Routes to show, set it to ALL_ROUTES_ARRAY.
		if( newOption.value === "ALL_ROUTES" || filteredRoutes.length === 0 ) {
			setState({routes: ALL_ROUTES_ARRAY, routeIds: ''});
		} else {
			let routeIds = filteredRoutes.map((route) => {
				return route.value;
			})
			routeIds = routeIds.join();
			setState({routes: filteredRoutes, routeIds });
		}
	}

	return (
        <div className="w-100 p-1">
			<div className="card p-3">
				<Form>
					{parseInt(userTypeId) === 5 &&
						<div className="mb-2">
							<div>Our pickup vehicle services your area on the following schedule: <strong>{CompanyAddresses[0].Route[0].pickupDays}</strong></div>
							<div>Your hospital currently has {orders.length} pets awaiting pickup.</div>
							<div>Below is a detailed log of your most recent pickups and delivery services. A summary of each service can be viewed by clicking the "Print" link.</div>
						</div>
					}
					<div className="row">
						<div className="col-12 form-row">
							<div className="col-md-auto"><Translate id="From" />* <Field type="date" name="dateStart" value={dateStart} onChange={(event) => setState({dateStart: event.target.value})} className="form-control" /></div>
							<div className="col-md-auto"><Translate id="To" />* <Field type="date" name="dateEnd" value={dateEnd} onChange={(event) => setState({dateEnd: event.target.value})} className="form-control" /></div>
							{(parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3) &&
								<div className="col-auto">
									<Translate id="Routes" />
									<Field component={Select}
										name="routes"
										className
										value={routes}
										options={RoutesSelectValues}
										onChange={ routeChange }
										isMulti
									/>
								</div>
							}
							{/* This filter button is in the div row below for crematory users */}
							{parseInt(userTypeId) === 5 &&
								<div className="mt-4 ml-1"><button type="button" disabled={dateEnd === '' || dateStart === ''} onClick={() => setState({submitting: true})} className="btn btn-success btn-sm"><Translate id="Get Delivery Log List" /></button></div>
							}
						</div>
					</div>
					{(parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3) &&
						<div className="row">
							<div className="col-auto">
								<Translate id="Hospitals" />
								<Field component={Select}
									name="companies"
									className
									value={companies}
									options={CompaniesSelectValues}
									onChange={ companyChange }
									isMulti
								/>
							</div>
							<div className="mt-4 ml-1"><button type="button" disabled={dateEnd === '' || dateStart === ''} onClick={() => setState({submitting: true})} className="btn btn-info btn-sm"><Translate id="Get Delivery Log List" /></button></div>
						</div>
					}
					<div className="row">
						<div className="col-12">
							{dateEnd !== '' && dateStart !== '' && submitting &&
								<DeliveryLogListContainer
									DeliveryLogCompanies={DeliveryLogCompanies}
									companyIds={companyIds}
									dateEnd={dateEnd}
									dateStart={dateStart}
									routeIds={routeIds}
								/>
							}
						</div>
					</div>
				</Form>
			</div>
		</div>
	)
}

export const DeliveryLog = compose(
	queryWithLoading({
		gqlString: getCompanyRouteQuery,
		variablesFunction: (props) => ({ companyId: props.Session.User.companyId }),
		name: "CompanyAddressRoute"
	}),
    queryWithLoading({
        gqlString: getDeliveryLogCompaniesQuery,
        name: "Companies"
    }),
    queryWithLoading({
        gqlString: GetRoutes,
        name: "Routes"
    }),
	queryWithLoading({
		gqlString: GetRoutesOrderQueue,
		name: "Orders",
		variablesFunction: () => ({ orderQueue:"pickups" })
	}),
	withFormik(),
	withState({
        companies: [{value: "ALL_COMPANIES", label: "All Hospitals"}],
        companyIds: '',
        dateEnd: moment().format('YYYY-MM-DD'),
        dateStart: moment().add(-1,'M').format('YYYY-MM-DD'),
        routeIds: '',
        routes: [{value: "ALL_ROUTES", label: "All Routes"}],
        submitting: false})
)(DeliveryLogContent)
