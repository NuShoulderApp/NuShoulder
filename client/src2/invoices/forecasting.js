import _ from "lodash";
import { compose } from "react-apollo";
import React from 'react';

import DatePicker from 'react-datepicker';
// import { Field, Form, withFormik } from "../utilities/IWDFormik";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Math from 'mathjs';
import moment from 'moment';
import { NavLink } from "react-router-dom";
import { queryWithLoading } from '../utilities/IWDDb';
import { PieChart, Pie, Cell } from 'recharts';

import "react-datepicker/dist/react-datepicker.css";
import { withRouter } from "react-router-dom";
import { withState } from "react-state-hoc";
import { withTranslate, Translate } from '../translations/IWDTranslation';


// GRAPHQL QUERY
import {
	getCompaniesQuery
} from '../companies/companies_graphql';

import {
	GetInvoiceForecasting,
	GetInvoiceItemsForecasting
} from './invoices_graphql';

import {
	getOrderServiceStatusesQuery,
	getOrderStatusesQuery
} from '../orders/orders_graphql';

// import { parse } from "graphql";

const InvoiceForecastingResultsContainer = (props) => {
	const {
		clinicId,
		ClinicTotals,
		FilterClinics,
		// filterCremationTypeSelected,
		initialLoad,
		InvoiceForecasting: { InvoiceForecasting },
		InvoiceForecastingList,
		InvoiceItemsForecasting: { InvoiceItemsForecasting },
		InvoiceTotal,
		ordersCount,
		OrderServiceStatuses,
		OrderStatuses,
		selectedClinicId,
		selectedOrderId,
		setState
	} = props;

	if (initialLoad === true) {
		let TempList = InvoiceForecasting;

		// if(filterCremationTypeSelected !== 'All') {
		// 	let tempCremationProductId = filterCremationTypeSelected === 'Private' ? 27 : 26;
		// 	// Filter down the full list of orders 
		// 	TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => order.ProductsOrder.findIndex((product) => parseInt(product.productId) === parseInt(tempCremationProductId)) > -1);
		// }

		let TempFilterClinics = FilterClinics
		// If there is a specific clinic selected in the Filters, then only do the forecasting functionality below for that clinic
		if(parseInt(clinicId) > 0) {
			TempFilterClinics = TempFilterClinics.filter((clinics) => parseInt(clinics.clinicId) === parseInt(clinicId));
		}

		let tempInvoiceTotal = 0; // This is the total amount that is invoiced for the filter results
		let tempOrdersCount = 0; // This is the total number of orders for all of the clinics
		let TempClinicsTotals = {
			Invoice: {
				extraProductsCommunal: 0,
				extraProductsPrivate: 0,
				invoiceCostCharged: 0,
				invoiceCostChargedPersonalization: 0,
				taxChargedInvoice: 0
			},
			Cremations: {
				Communal: {
					count: 0,
					invoice: 0
				},
				Private: {
					count: 0,
					invoice: 0
				}
			}
		}; // This will be used for the totals output at the top for all the clinics

		TempFilterClinics.forEach((clinic) => {
			// Get the Products for this Clinic
			let TempProducts = TempList.filter((product) => parseInt(product.companyId) === parseInt(clinic.clinicId));

			// Set arrays and objects for this Clinic
			clinic.Products = TempProducts;
			clinic.Orders = [];
			clinic.Invoice = {
				extraProductsCommunal: 0,
				extraProductsPrivate: 0,
				invoiceCostCharged: 0,
				invoiceCostChargedPersonalization: 0,
				taxChargedInvoice: 0
			};
			clinic.Cremations = {
				Communal: {
					count: 0,
					invoice: 0
				},
				Private: {
					count: 0,
					invoice: 0
				}
			};

			if (TempProducts.length > 0) {
				// Use this for checking if we are on the next order
				let tempOrderId = 0;

				// Add all of the Product invoice amounts - anything that is not a Cremation or Delivery;
				let tempExtraProductsCommunal = 0;
				let tempExtraProductsPrivate = 0;

				// Go through each Product
				TempProducts.forEach((product, index) => {
					// Get Invoicing amounts
					let tempInvoiceCostCharged = product.invoiceCostCharged;
					let tempInvoiceCostChargedPersonalization = product.invoiceCostChargedPersonalization === null ? '0.00' : product.invoiceCostChargedPersonalization;
					let tempTaxChargedInvoice = product.taxChargedInvoice;
					// Set Invoice amounts
					clinic.Invoice = {
						invoiceCostCharged: Math.add(clinic.Invoice.invoiceCostCharged, tempInvoiceCostCharged),
						invoiceCostChargedPersonalization: Math.add(clinic.Invoice.invoiceCostChargedPersonalization, tempInvoiceCostChargedPersonalization),
						taxChargedInvoice: Math.add(clinic.Invoice.taxChargedInvoice, tempTaxChargedInvoice)
					}

					// Check if this product is from a different Order than the previous product
					if (parseInt(tempOrderId) !== parseInt(product.orderId)) {
						// Get the OrderStatus object
						let TempOrderStatus = OrderStatuses.OrderStatuses.find((status) => parseInt(status.orderStatusId) === parseInt(product.orderStatusId));

						/////// ADJUSTMENTS /////////
						// Check if there are any Adjustments in the InvoiceItemsForecasting array for this orderId, if so add them to the Order object as an Adjustments array, or else add an empty array.
						let TempOrderAdjustments = InvoiceItemsForecasting.filter((item) => parseInt(item.adjustmentOrderId) === parseInt(product.orderId));
						
						// Total the Adjustments amount for this Order
						let tempAdjustmentsInvoiceTotal = 0;

						TempOrderAdjustments.forEach((adjustment) => {
							// Update the total Adjustments on this Invoice with the new adjustment values, if any
							tempAdjustmentsInvoiceTotal = Math.add(tempAdjustmentsInvoiceTotal, adjustment.adjustmentInvoiceCostTotal);
							// Update the Clinic.Invoice values

							clinic.Invoice = {
								...clinic.Invoice,
								invoiceCostCharged: Math.add(clinic.Invoice.invoiceCostCharged, adjustment.adjustmentInvoiceCostSubtotal),
								taxChargedInvoice: Math.add(clinic.Invoice.taxChargedInvoice, adjustment.adjustmentTaxDue)
							}
						})

						/////// PRODUCTS /////////
						// Get All Products for this Order
						let TempOrderProducts = TempProducts.filter((tempProduct) => parseInt(tempProduct.orderId) === parseInt(product.orderId));

						// Total the Products invoice amount - anything that is not a Cremation or Delivery Product
						let tempProductsInvoiceTotal = 0;

						TempOrderProducts.forEach((orderProduct) => {
							if(orderProduct.statusIsCremation === 0 && orderProduct.statusIsDelivery === 0) {
								let tempInvoiceCostCharged = orderProduct.invoiceCostCharged;
								let tempInvoiceCostChargedPersonalization = orderProduct.invoiceCostChargedPersonalization === null ? '0.00' : orderProduct.invoiceCostChargedPersonalization;
								let tempTaxChargedInvoice = orderProduct.taxChargedInvoice;

								tempProductsInvoiceTotal = Math.add(tempProductsInvoiceTotal, tempInvoiceCostCharged, tempInvoiceCostChargedPersonalization, tempTaxChargedInvoice);
							}
						})

						// Add in the Cremation and Delivery Charges in order to get the total cost of this invoice
						let tempOrderInvoiceTotal = Math.add(tempProductsInvoiceTotal, tempAdjustmentsInvoiceTotal);

						TempOrderProducts.forEach((orderProduct) => {
							if(orderProduct.statusIsCremation === 1 || orderProduct.statusIsDelivery === 1) {
								let tempInvoiceCostCharged = orderProduct.invoiceCostCharged;
								let tempInvoiceCostChargedPersonalization = orderProduct.invoiceCostChargedPersonalization === null ? '0.00' : orderProduct.invoiceCostChargedPersonalization;
								let tempTaxChargedInvoice = orderProduct.taxChargedInvoice;

								tempOrderInvoiceTotal = Math.add(tempOrderInvoiceTotal, tempInvoiceCostCharged, tempInvoiceCostChargedPersonalization, tempTaxChargedInvoice);
							}
						})
						
						// Check that this product has an OrderServiceStatus
						let tempOrderServiceStatusIndex = OrderServiceStatuses.OrderServiceStatuses.findIndex((status) => parseInt(status.orderServiceStatusId) === parseInt(product.orderServiceStatusId));
						let tempOrderServiceStatus = tempOrderServiceStatusIndex > -1 ? OrderServiceStatuses.OrderServiceStatuses[tempOrderServiceStatusIndex].orderServiceStatus : '';

						// Create the new Order object for this new Order, then PUSH to the Orders array for this clinic
						let TempOrderObject = {
							Adjustments: TempOrderAdjustments,
							invoiceProductsTotal: tempProductsInvoiceTotal,
							invoiceTotal: tempOrderInvoiceTotal,
							memorialization: product.memorialization,
							orderCompletedIndicator: TempOrderStatus.orderCompletedIndicator,
							orderDate: product.orderDate,
							orderId: parseInt(product.orderId),
							orderServiceStatus: tempOrderServiceStatus,
							orderStatus: TempOrderStatus.orderStatus,
							petFirstName: product.petFirstName,
							petReferenceNumber: product.petReferenceNumber,
							Products: TempOrderProducts
						};
						clinic.Orders.push(TempOrderObject);

						// Update tempOrderId so this conditional IF does not get hit until the next Order's products come through the Products forEach loop
						tempOrderId = product.orderId;
					}

					// Check if this is a Cremation product, if so, update the Cremations object for this clinic.
					if (product.statusIsCremation === 1) {
						if (product.productName.includes('Private')) {
							clinic.Cremations.Private.count = Math.add(clinic.Cremations.Private.count, 1);
							clinic.Cremations.Private.invoice = Math.add(clinic.Cremations.Private.invoice, tempInvoiceCostCharged).toFixed(2);
							// Get the order index in the Clinic's Orders array
							let tempOrderIndex = clinic.Orders.findIndex((order) => parseInt(order.orderId) === parseInt(product.orderId));
							// Mark Order object as Private
							clinic.Orders[tempOrderIndex].cremationType = 'Private';
							// Update the Clinic's tracking for the Non-Cremation/delivery Products Invoice amount
							tempExtraProductsPrivate = Math.add(tempExtraProductsPrivate, clinic.Orders[tempOrderIndex].invoiceProductsTotal);

						} else if (product.productName.includes('Communal')) {
							clinic.Cremations.Communal.count = Math.add(clinic.Cremations.Communal.count, 1);
							clinic.Cremations.Communal.invoice = Math.add(clinic.Cremations.Communal.invoice, tempInvoiceCostCharged).toFixed(2);
							// Get the order index in the Clinic's Orders array
							let tempOrderIndex = clinic.Orders.findIndex((order) => parseInt(order.orderId) === parseInt(product.orderId));
							// Mark Order object as Communal
							clinic.Orders[tempOrderIndex].cremationType = 'Communal';
							// Update the Clinic's tracking for the Non-Cremation/delivery Products Invoice amount
							tempExtraProductsCommunal = Math.add(tempExtraProductsCommunal, clinic.Orders[tempOrderIndex].invoiceProductsTotal);
							
						}
					}


				}); // End looping through this Clinic's Products

				// Update Clinic's Invoice Amount that was invoiced for all privates and communals BESIDES the cremation charge.
				clinic.Invoice.extraProductsCommunal = tempExtraProductsCommunal;
				clinic.Invoice.extraProductsPrivate = tempExtraProductsPrivate;
			}
			
			// Add clinic's totals to the overall total
			tempInvoiceTotal = Math.add(tempInvoiceTotal, clinic.Invoice.invoiceCostCharged, clinic.Invoice.invoiceCostChargedPersonalization, clinic.Invoice.taxChargedInvoice).toFixed(2)
			// Add clinic's total orders to overall orders count
			tempOrdersCount = Math.add(tempOrdersCount, clinic.Orders.length);
			// Add to the Totals for the top row output
			TempClinicsTotals.Invoice.extraProductsCommunal = Math.add(TempClinicsTotals.Invoice.extraProductsCommunal, clinic.Invoice.extraProductsCommunal);
			TempClinicsTotals.Invoice.extraProductsPrivate = Math.add(TempClinicsTotals.Invoice.extraProductsPrivate, clinic.Invoice.extraProductsPrivate);
			TempClinicsTotals.Invoice.invoiceCostCharged = Math.add(TempClinicsTotals.Invoice.invoiceCostCharged, clinic.Invoice.invoiceCostCharged).toFixed(2);
			TempClinicsTotals.Invoice.invoiceCostChargedPersonalization = Math.add(TempClinicsTotals.Invoice.invoiceCostChargedPersonalization, clinic.Invoice.invoiceCostChargedPersonalization).toFixed(2);
			TempClinicsTotals.Invoice.taxChargedInvoice = Math.add(TempClinicsTotals.Invoice.taxChargedInvoice, clinic.Invoice.taxChargedInvoice).toFixed(2);
			TempClinicsTotals.Cremations.Communal.count = Math.add(TempClinicsTotals.Cremations.Communal.count, clinic.Cremations.Communal.count);
			TempClinicsTotals.Cremations.Communal.invoice = Math.add(TempClinicsTotals.Cremations.Communal.invoice, clinic.Cremations.Communal.invoice).toFixed(2);
			TempClinicsTotals.Cremations.Private.count = Math.add(TempClinicsTotals.Cremations.Private.count, clinic.Cremations.Private.count);
			TempClinicsTotals.Cremations.Private.invoice = Math.add(TempClinicsTotals.Cremations.Private.invoice, clinic.Cremations.Private.invoice).toFixed(2);
		
		});

		// If 'Clinics' filter is set to 'With Orders', then filter out an Clinics have do not have any Orders
		if (parseInt(clinicId) === -1) {
			TempFilterClinics = TempFilterClinics.filter((clinics) => clinics.Orders.length > 0);
		}

		setState({
			ClinicTotals: TempClinicsTotals,
			initialLoad: false,
			InvoiceForecastingList: TempFilterClinics,
			InvoiceTotal: tempInvoiceTotal,
			ordersCount: tempOrdersCount
		})
	}
	console.log({props})

	// START CALCULATIONS - Set variables for the pie charts
	let COLORS = ['green', 'red'];
	let COLORSCREMATIONS = ['green', 'orange'];
	let RADIAN = Math.PI / 180;
	let renderCustomizedLabel = ({
		cx, cy, midAngle, innerRadius, outerRadius, percent, index
	}) => {
		const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
		const x = cx + radius * Math.cos(-midAngle * RADIAN);
		const y = cy + radius * Math.sin(-midAngle * RADIAN);
		return (
			<text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
				{`${(percent * 100).toFixed(0)}%`}
			</text>
		);
	};

	let ChartDataOrders = _.isEmpty(ClinicTotals) === false ? [{ name: 'Private', value: ClinicTotals.Cremations.Private.count }, { name: 'Com', value: ClinicTotals.Cremations.Communal.count }] : [];
	let ChartDataInvoices = _.isEmpty(ClinicTotals) === false ? [{ name: 'Private', value: parseInt(ClinicTotals.Cremations.Private.invoice) }, { name: 'Com', value: parseInt(ClinicTotals.Cremations.Communal.invoice) }] : [];
	let ChartDataExtraProductCommunals = _.isEmpty(ClinicTotals) === false ? [{ name: 'ExtraProduct', value: parseInt(ClinicTotals.Invoice.extraProductsCommunal) }, { name: 'Cremation', value: parseInt(ClinicTotals.Cremations.Communal.invoice) }] : [];
	let ChartDataExtraProductPrivates = _.isEmpty(ClinicTotals) === false ? [{ name: 'ExtraProduct', value: parseInt(ClinicTotals.Invoice.extraProductsPrivate) }, { name: 'Cremation', value: parseInt(ClinicTotals.Cremations.Private.invoice) }] : [];

	// END PIE CHART CALCULATIONS

	return (
		<div className="p-2">
			{ (parseInt(clinicId) === 0 || parseInt(clinicId) === -1 ) && _.isEmpty(ClinicTotals) === false &&
				<div className="card row mb-4 pt-2 border-secondary">
					<div className="col-12">
						<div className="row m-0 p-0">
							<div className="col-2 mt-4">
								<div className="h4">All Clinics</div>
								<div className="h5">${InvoiceTotal}</div>
								<div className="h6">{ordersCount} Orders</div>
							</div>
							<div className="col-auto">
								<div className="text-success">Privates</div>
								<div className="mb-3">${ClinicTotals.Cremations.Private.invoice}</div>
								<div className="text-warning">Group</div>
								<div className="">${ClinicTotals.Cremations.Communal.invoice}</div>
							</div>
							<div className="col-auto">
								<PieChart width={150} height={150}>
									<Pie
										data={ChartDataInvoices}
										dataKey="value"
										nameKey="Invoices"
										cx={65}
										cy={65}
										labelLine={false}
										label={renderCustomizedLabel}
										outerRadius={65}
										fill="#8884d8"
									>
										{
											ChartDataInvoices.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORSCREMATIONS[index % COLORSCREMATIONS.length]} />)
										}
									</Pie>
								</PieChart>
							</div>
							<div className="col-auto">
								<div className="text-success">Privates</div>
								<div className="mb-3">{ClinicTotals.Cremations.Private.count}</div>
								<div className="text-warning">Group</div>
								<div className="">{ClinicTotals.Cremations.Communal.count}</div>
							</div>
							<div className="col-auto">
								<PieChart width={150} height={150}>
									<Pie
										data={ChartDataOrders}
										dataKey="value"
										nameKey="P"
										cx={65}
										cy={65}
										labelLine={false}
										label={renderCustomizedLabel}
										outerRadius={65}
										fill="#8884d8"
									>
										{
											ChartDataOrders.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORSCREMATIONS[index % COLORSCREMATIONS.length]} />)
										}
									</Pie>
								</PieChart>
							</div>
							<div className="col-auto">
								<div className="">Privates</div>
								<div className="text-success">Product</div>
								<div className="mb-3">${ClinicTotals.Invoice.extraProductsPrivate.toFixed(2)}</div>
								<div className="text-danger">Cremation</div>
								<div className="">${ClinicTotals.Cremations.Private.invoice}</div>
							</div>
							<div className="col-auto">
								<PieChart width={150} height={150}>
									<Pie
										data={ChartDataExtraProductPrivates}
										dataKey="value"
										nameKey="P"
										cx={65}
										cy={65}
										labelLine={false}
										label={renderCustomizedLabel}
										outerRadius={65}
										fill="#8884d8"
									>
										{
											ChartDataExtraProductPrivates.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
										}
									</Pie>
								</PieChart>
							</div>
							<div className="col-auto">
								<div className="">Group</div>
								<div className="text-success">Product</div>
								<div className="mb-3">${ClinicTotals.Invoice.extraProductsCommunal.toFixed(2)}</div>
								<div className="text-danger">Cremation</div>
								<div className="">${ClinicTotals.Cremations.Communal.invoice}</div>
							</div>
							<div className="col-auto">
								<PieChart width={150} height={150}>
									<Pie
										data={ChartDataExtraProductCommunals}
										dataKey="value"
										nameKey="P"
										cx={65}
										cy={65}
										labelLine={false}
										label={renderCustomizedLabel}
										outerRadius={65}
										fill="#8884d8"
									>
										{
											ChartDataExtraProductCommunals.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
										}
									</Pie>
								</PieChart>
							</div>
						</div>
					</div>
				</div>
			}

			{InvoiceForecastingList.map((list, index) => {
				// START CALCULATIONS - Set variables for the pie charts
				let COLORS = ['green', 'red'];
				let COLORSCREMATIONS = ['green', 'orange'];
				let RADIAN = Math.PI / 180;
				let renderCustomizedLabel = ({
					cx, cy, midAngle, innerRadius, outerRadius, percent, index
				}) => {
					const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
					const x = cx + radius * Math.cos(-midAngle * RADIAN);
					const y = cy + radius * Math.sin(-midAngle * RADIAN);
					return (
						<text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
							{`${(percent * 100).toFixed(0)}%`}
						</text>
					);
				};

				let ChartDataOrders = [{ name: 'Private', value: list.Cremations.Private.count }, { name: 'Com', value: list.Cremations.Communal.count }];
				let ChartDataInvoices = [{ name: 'Private', value: parseInt(list.Cremations.Private.invoice) }, { name: 'Com', value: parseInt(list.Cremations.Communal.invoice) }];
				let ChartDataExtraProductCommunals = [{ name: 'ExtraProduct', value: parseInt(list.Invoice.extraProductsCommunal) }, { name: 'Cremation', value: parseInt(list.Cremations.Communal.invoice) }];
				let ChartDataExtraProductPrivates = [{ name: 'ExtraProduct', value: parseInt(list.Invoice.extraProductsPrivate) }, { name: 'Cremation', value: parseInt(list.Cremations.Private.invoice) }];

				// END PIE CHART CALCULATIONS

				return (
					<React.Fragment key={index}>
						<div className="card row mb-4 pt-2">
							<div className="col-12">
								<div className="row m-0 p-0">
									<div className="col-2">
										<div className="h5">{list.clinicName}</div>
										<div className="h6">${Math.add(list.Invoice.invoiceCostCharged, list.Invoice.invoiceCostChargedPersonalization, list.Invoice.taxChargedInvoice).toFixed(2)}</div>
										<div>{list.Orders.length} Orders</div>
										<div className="mt-2">
											{
												parseInt(list.clinicId) === parseInt(selectedClinicId) &&
												<button type="button" className="btn btn-sm btn-addon" onClick={() => setState({ selectedClinicId: 0 })}><FontAwesomeIcon icon="minus" className="" /><Translate id="Details" /></button>
											}
											{
												parseInt(list.clinicId) !== parseInt(selectedClinicId) &&
												<button type="button" className="btn btn-sm btn-addon" onClick={() => setState({ selectedClinicId: list.clinicId })}><FontAwesomeIcon icon="plus" className="" /><Translate id="Details" /></button>
											}
										</div>
									</div>
									<div className="col-auto">
										<div className="text-success">Privates</div>
										<div className="mb-3">${list.Cremations.Private.invoice}</div>
										<div className="text-warning">Group</div>
										<div className="">${list.Cremations.Communal.invoice}</div>
									</div>
									<div className="col-auto">
										<PieChart width={150} height={150}>
											<Pie
												data={ChartDataInvoices}
												dataKey="value"
												nameKey="Invoices"
												cx={65}
												cy={65}
												labelLine={false}
												label={renderCustomizedLabel}
												outerRadius={65}
												fill="#8884d8"
											>
												{
													ChartDataInvoices.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORSCREMATIONS[index % COLORSCREMATIONS.length]} />)
												}
											</Pie>
										</PieChart>
									</div>
									<div className="col-auto">
										<div className="text-success">Privates</div>
										<div className="mb-3">{list.Cremations.Private.count}</div>
										<div className="text-warning">Group</div>
										<div className="">{list.Cremations.Communal.count}</div>
									</div>
									<div className="col-auto">
										<PieChart width={150} height={150}>
											<Pie
												data={ChartDataOrders}
												dataKey="value"
												nameKey="P"
												cx={65}
												cy={65}
												labelLine={false}
												label={renderCustomizedLabel}
												outerRadius={65}
												fill="#8884d8"
											>
												{
													ChartDataOrders.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORSCREMATIONS[index % COLORSCREMATIONS.length]} />)
												}
											</Pie>
										</PieChart>
									</div>
									<div className="col-auto">
										<div className="">Privates</div>
										<div className="text-success">Product</div>
										<div className="mb-3">${list.Invoice.extraProductsPrivate.toFixed(2)}</div>
										<div className="text-danger">Cremation</div>
										<div className="">${list.Cremations.Private.invoice}</div>
									</div>
									<div className="col-auto">
										<PieChart width={150} height={150}>
											<Pie
												data={ChartDataExtraProductPrivates}
												dataKey="value"
												nameKey="P"
												cx={65}
												cy={65}
												labelLine={false}
												label={renderCustomizedLabel}
												outerRadius={65}
												fill="#8884d8"
											>
												{
													ChartDataExtraProductPrivates.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
												}
											</Pie>
										</PieChart>
									</div>
									<div className="col-auto">
										<div className="">Group</div>
										<div className="text-success">Product</div>
										<div className="mb-3">${list.Invoice.extraProductsCommunal.toFixed(2)}</div>
										<div className="text-danger">Cremation</div>
										<div className="">${list.Cremations.Communal.invoice}</div>
									</div>
									<div className="col-auto">
										<PieChart width={150} height={150}>
											<Pie
												data={ChartDataExtraProductCommunals}
												dataKey="value"
												nameKey="P"
												cx={65}
												cy={65}
												labelLine={false}
												label={renderCustomizedLabel}
												outerRadius={65}
												fill="#8884d8"
											>
												{
													ChartDataExtraProductCommunals.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)
												}
											</Pie>
										</PieChart>
									</div>
								</div>
								{/* <div>${Math.round(list.Invoice.invoiceCostCharged,2)}</div>
								<div>${Math.round(list.Invoice.invoiceCostChargedPersonalization)}</div>
								<div>${Math.round(list.Invoice.taxChargedInvoice)}</div> */}
							</div>
							{
								parseInt(selectedClinicId) === parseInt(list.clinicId) &&
								<React.Fragment>
									<div className="col-12">
										<table className="table table-striped">
											<thead>
												<tr>
													<th></th>
													<th><Translate id="Ordered" /></th>
													<th></th>
													<th className="text-center" style={{width: 10+'px'}}>$</th>
													<th><Translate id="Reference" /></th>
													<th><Translate id="Name" /></th>
													<th className="text-center"><Translate id="Type" /></th>
													<th><Translate id="Status" /></th>
													<th><Translate id="Order Status" /></th>
													<th><Translate id="Memorial" /></th>
												</tr>
											</thead>
											<tbody>
												{list.Orders.length > 0 &&
													list.Orders.map((order, index) => {
														//set style in info for badge
														let orderClass = "secondary"; // default to a neutral gray
														let tempOrderServiceStatus = order.orderServiceStatus;
														if (tempOrderServiceStatus === "Completed" || tempOrderServiceStatus === "Cremated") {
															orderClass = "success";
														}
														else if (tempOrderServiceStatus === "In Process" || tempOrderServiceStatus === "Cremating") {
															orderClass = "danger";
														}
														// else if(
														// 	tempOrderServiceStatus === "Pending" && 
														// 	((isFurClipping === true && furClippingCompleted ===1) || isFurClipping === false) &&
														// 	((isPawPrint === true && pawPrintCompleted ===1) || isPawPrint === false)
														// ) {
														// 	orderClass = "success";
														// 	tempOrderServiceStatus = "Ready"
														// } 
														else if (tempOrderServiceStatus === "Pending") {
															orderClass = "warning";
														}

														return (
															<React.Fragment key={index}>
																<tr>
																	<td className="h4" style={{width: 15+'px'}}>
																		{
																			(
																				parseInt(selectedOrderId) !== parseInt(order.orderId) &&
																				<FontAwesomeIcon icon="chevron-right" className="" onClick={() => setState({selectedOrderId: parseInt(order.orderId)})} />
																			) ||
																			<FontAwesomeIcon icon="chevron-down" className="" onClick={() => setState({selectedOrderId: 0})} />
																		}
																	</td>
																	<td>{moment(order.orderDate).format('MM-DD-YY')}</td>
																	<td>${order.invoiceTotal} (${order.invoiceProductsTotal})</td>
																	<td>
																		{
																			order.orderCompletedIndicator === 1 &&
																			<span className="fa-layers fa-2x mt-1 h5">
																				<FontAwesomeIcon icon="circle" color={"green"} />
																				<FontAwesomeIcon icon="check" color={"white"} transform="shrink-5" />
																			</span>
																		}
																		{
																			order.orderCompletedIndicator === 0 &&
																			<span className="fa-layers fa-2x mt-1 h5">
																				<FontAwesomeIcon icon="circle" color={"red"} />
																				<FontAwesomeIcon icon="times" color={"white"} transform="shrink-5" />
																			</span>
																		}
																	</td>
																	<td><h5 className="m-0"><NavLink to={`/orders/orderId/${order.orderId}`} activeClassName="active">{order.petReferenceNumber}</NavLink></h5></td>
																	<td>{order.petFirstName}</td>
																	<td className="p-0 m-0 text-center">
																		{order.cremationType === 'Private' &&
																			<span className="fa-layers fa-2x mt-2 h3">
																				<FontAwesomeIcon icon="circle" color={"grey"} />
																				<strong className="fa-layers-text text-white small pl-1">P</strong>
																			</span>}
																		{order.cremationType === 'Communal' &&
																			<span className="fa-layers fa-2x mt-2 h3">
																				<FontAwesomeIcon icon="circle" color={"grey"} />
																				<strong className="fa-layers-text text-white small">C</strong>
																			</span>}
																	</td>
																	<td>
																		<h5 className="m-0">
																			<span className={`badge badge-${orderClass} text-white p-2 text-uppercase`}>{tempOrderServiceStatus}</span>
																		</h5>
																	</td>
																	<td>
																		{/* {order.OrderHold.length > 0 &&
																			<h5 className="m-0">
																				<span className="badge badge-warning p-2 text-uppercase">
																					<FontAwesomeIcon icon="hand-paper" /> <Translate id="Hold" />
																				</span>
																			</h5>
																		} */}
																		{order.orderStatus.replace('Preparation completed, awaiting delivery', 'Awaiting Delivery')}
																	</td>
																	<td>
																		{order.memorialization === 'home' && <span><FontAwesomeIcon icon="home" /> <Translate id="At Home" /></span>}
																		{order.memorialization === 'clinic' && <span><FontAwesomeIcon icon="hospital" /> <Translate id="Clinic" /></span>}
																		{order.memorialization === 'none' && <span><Translate id="None" /></span>}
																	</td>

																</tr>

																{/* Show the Order's Product details if the Order is selected */}
																{
																	parseInt(selectedOrderId) === parseInt(order.orderId) &&
																	<tr>
																		<td colSpan="11">
																			{order.Products.map((product) => {
																				return(
																					<span className="row" key={product.orderProductId}>
																						<span className="col-sm-3 col-md-2">
																							{product.productName}
																						</span>
																						<span className="col-sm-3 col-md-2">
																							<span className="text-secondary">Invoiceable:</span> ${product.invoiceCostCharged}
																						</span>
																						<span className="col-sm-2 col-md-1">
																							<span className="text-secondary">Tax:</span> ${product.taxChargedInvoice}
																						</span>
																						<span className="col-sm-2 col-md-1">
																							<span className="text-secondary">Total:</span> ${Math.add(product.invoiceCostCharged,product.taxChargedInvoice)}
																						</span>
																					</span>
																				)
																			})}
																			{order.Adjustments.map((adjustment, index) => {
																			// adjustmentInvoiceCostSubtotal: "30.00"
																			// adjustmentInvoiceCostTotal: "31.80"
																			// adjustmentInvoiceItemDescription: "Odyssey 25 Necklace"
																			// adjustmentInvoiceItemDescriptionPrivate: ""
																			// adjustmentInvoiceItemType: "Adjustment"
																			// adjustmentOrderId: "335"
																			// adjustmentTaxDue: "1.80"		
																				return(
																					<span className={`row ${index === 0 && 'border-top'}`} key={`adjustment-${index}`}>
																						<span className="col-sm-3 col-md-2">
																							{adjustment.adjustmentInvoiceItemType}
																						</span>
																						<span className="col-sm-3 col-md-2">
																							<span className="text-secondary">Invoiceable:</span> ${adjustment.adjustmentInvoiceCostSubtotal}
																						</span>
																						<span className="col-sm-2 col-md-1">
																							<span className="text-secondary">Tax:</span> ${adjustment.adjustmentTaxDue}
																						</span>
																						<span className="col-sm-2 col-md-1">
																							<span className="text-secondary">Total:</span> ${adjustment.adjustmentInvoiceCostTotal}
																						</span>
																						<span className="col-sm-2 col-md-6">
																							<span className="text-secondary">Note:</span> {adjustment.adjustmentInvoiceItemDescription}
																							{
																								adjustment.adjustmentInvoiceItemDescriptionPrivate !== '' &&
																								<React.Fragment> ({adjustment.adjustmentInvoiceItemDescriptionPrivate})</React.Fragment>
																							}
																						</span>
																					</span>
																				)
																			})}
																		</td>
																	</tr>
																}
															</React.Fragment>

														)
													})
												}
											</tbody>
										</table>
									</div>
									<div className="col-12 mb-2">
										<button type="button" className="btn btn-lrg btn-addon" onClick={() => setState({ selectedClinicId: 0 })}><FontAwesomeIcon icon="minus" className="" /><Translate id="Close Orders" /></button>
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


const InvoiceForecastingResults = compose(
	queryWithLoading({
		gqlString: GetInvoiceForecasting,
		variablesFunction: (props) => ({ clinicId: props.clinicId, dateEnd: props.dateEnd, dateStart: props.dateStart, filterOrderTypeDate: props.filterOrderTypeDate }),
		name: "InvoiceForecasting",
		requiredPermission: { permission: "invoices", permissionLevel: 3 },
	}),
	queryWithLoading({
		gqlString: GetInvoiceItemsForecasting,
		variablesFunction: (props) => ({ clinicId: props.clinicId, dateEnd: props.dateEnd, dateStart: props.dateStart, filterOrderTypeDate: props.filterOrderTypeDate }),
		name: "InvoiceItemsForecasting",
		requiredPermission: { permission: "invoices", permissionLevel: 3 },
	}),
	queryWithLoading({ gqlString: getOrderServiceStatusesQuery, name: "OrderServiceStatuses" }),
	queryWithLoading({ gqlString: getOrderStatusesQuery, name: "OrderStatuses" }),
	withRouter,
	withState({
		ClinicTotals: {},
		selectedClinicId: 0,
		selectedOrderId: 0,
		initialLoad: true,
		InvoiceForecastingList: [],
		InvoiceTotal: 0,
		ordersCount: 0
	}),
	withTranslate
)(InvoiceForecastingResultsContainer)


const InvoiceForecastingContainer = (props) => {
	const {
		data: {
			Companies: Clinics
		},
		FilterClinics,
		filterClinicSelected,
		filterCremationTypeSelected,
		filterDateEnd,
		filterDateEndClass,
		filterDateStart,
		filterDateStartClass,
		filterOrderTypeDate,
		initialLoad,
		setState,
		showResults
	} = props;

	if (initialLoad) {
		let TempFilterClinics = Clinics.map((clinic) => { return { clinicId: clinic.companyId, clinicName: clinic.companyName } });

		setState({
			FilterClinics: TempFilterClinics,
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

	// Handle changes to any of the filters
	function handleFilterChange(name, value) {
		setState({
			[name]: value,
			showResults: false
		}, () => {
			if (filterDateEnd !== '' && filterDateEnd !== null && filterDateStart !== '' && filterDateStart !== null) {
				setState({showResults: true})
			}
		})
	}

	return (
		<div className="w-100 bg-light" style={{minHeight: 1000+'px'}}>
			<div className="ml-3 mr-3">
				<div className="p-2">
					<div className="card row pt-3 pb-3">
						<div className="w-100 pl-4 pr-4 clearfix">
							<div className="float-left h2 pt-2">Invoice Forecasting</div>
							<div className="float-right">
								<Translate id="Clinics" />
								<div className="clearfix">
									<div className="float-right">
										<button type="button" className={`btn btn-success ${(filterDateEnd === '' || filterDateStart === '') && 'disabled'}`} onClick={() => onFilter()}><Translate id="Search" /></button>
									</div>
									<div className="float-right mr-3">
										<select id="filterClinicSelected" defaultValue="filterClinicSelected" className="form-control" onChange={(event) => setState({ filterClinicSelected: event.target.value, showResults: false })}>
											<option value="-1">{props.translate("With Orders")}</option>
											<option value="0">{props.translate("All Clinics")} ({FilterClinics.length})</option>
											{FilterClinics.map((clinic) => (
												<option value={clinic.clinicId} key={clinic.clinicId}>{clinic.clinicName}</option>
											))}
										</select>
									</div>

								</div>
							</div>
							<div className="btn-group col-auto pt-4 float-right" role="group">
								<button type="button" style={{boxShadow: 'none'}} className={`btn rounded-left border-secondary ${(filterOrderTypeDate === 'Invoiceable' && 'btn-success') || 'btn-light text-secondary'}`} onClick={() => handleFilterChange('filterOrderTypeDate', 'Invoiceable')}>Invoiceable</button>
								<button type="button" style={{boxShadow: 'none'}} className={`btn rounded-right border-secondary ${(filterOrderTypeDate === 'Order Created' && 'btn-success') || 'btn-light text-secondary'}`} onClick={() => handleFilterChange('filterOrderTypeDate', 'Order Created')}>Order Created</button>
							</div>
							<div className={`float-right ${filterDateEndClass}`} style={{ width: 170 + 'px' }}><Translate id="To" />* <DatePicker className={`form-control ${filterDateEndClass}`} selected={filterDateEnd} onChange={(date) => handleFilterChange('filterDateEnd', date)} /></div>
							<div className={`float-right mr-3 ${filterDateStartClass}`} style={{ width: 170 + 'px' }}><Translate id="From" />* <DatePicker className={`form-control ${filterDateStartClass}`} selected={filterDateStart} onChange={(date) => handleFilterChange('filterDateStart', date)} /></div>

							{/* <div className="float-right">
								<Translate id="Cremations" />
								<div className="clearfix">
									<div className="float-right mr-3">
										<select id="filterCremationTypeSelected" defaultValue="filterCremationTypeSelected" className="form-control" onChange={(event) => setState({ filterCremationTypeSelected: event.target.value, showResults: false })}>
											<option value="All">{props.translate("All")}</option>
											<option value="Private">{props.translate("Private")}</option>
											<option value="Communal">{props.translate("Communal")}</option>
										</select>
									</div>
									<div className="float-right">
										<button type="button" className={`btn btn-success ${(filterDateEnd === '' || filterDateStart === '') && 'disabled'}`} onClick={() => onFilter()}><Translate id="Search" /></button>
									</div>
								</div>
							</div> */}
						</div>
					</div>		
					{filterOrderTypeDate === 'Invoiceable' && <div className="card row mt-2"><div className="alert alert-light text-center"><strong>Invoiceable:</strong><br />Indicates the amount that would be actually invoiced to each clinic if the same dates were used. The determining date used on each order is when it is marked as invoiceable.<br />Orders that have already been invoiced <u>WILL NOT</u> be in the results.</div></div>}	
					{filterOrderTypeDate === 'Order Created' && <div className="card row mt-2"><div className="alert alert-light text-center"><strong>Order Created:</strong><br />Indicates the amount that would be <u>AND</u> has already been invoiced to each clinic for orders that were <u>CREATED</u> within the date range.<br />Orders that have already been invoiced <u>WILL</u> be in the results.</div></div>}	
				</div>

				{/* Do Not Show Until Filter Button Is Clicked */}
				{
					showResults === true &&
					<InvoiceForecastingResults
						clinicId={filterClinicSelected}
						dateEnd={moment(filterDateEnd)}
						dateStart={moment(filterDateStart)}
						FilterClinics={FilterClinics}
						filterCremationTypeSelected={filterCremationTypeSelected}
						filterOrderTypeDate={filterOrderTypeDate}
					/>
				}
			</div>
		</div>
	);

}

export const InvoiceForecasting = compose(
	queryWithLoading({
		gqlString: getCompaniesQuery,
		requiredPermission: { permission: "invoices", permissionLevel: 3 },
	}),
	withRouter,
	withState({
		FilterClinics: [],
		filterClinicSelected: -1,
		filterCremationTypeSelected: 'All',
		filterDateEnd: '',
		filterDateEndClass: '',
		filterDateStart: '',
		filterDateStartClass: '',
		filterOrderTypeDate: 'Invoiceable',
		initialLoad: true,
		showResults: false
	}),
	withTranslate
)(InvoiceForecastingContainer)