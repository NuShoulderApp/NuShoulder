import _ from "lodash";
import { compose } from "react-apollo";
// import { Field, Form, withFormik } from "../utilities/IWDFormik";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Math from 'mathjs';
import moment from 'moment';
import { NavLink } from "react-router-dom";
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import React from 'react';
import { withRouter } from "react-router-dom";
import { withState } from "react-state-hoc";
import { withTranslate, Translate } from '../translations/IWDTranslation';


// GRAPHQL QUERY
import {
	getOrdersQuery,
	OrderProductSaveMutation
} from '../orders/orders_graphql';

import {
	GetLogOrderActivitiesAtCrematory
} from '../log_order_activities/log_order_activities_graphql';

const WorkflowListContainer = (props) => {
	const {
		data: { OrderWorkQueue: {orders}},
		displayOrderDate,
		filterCremationStatusSelected,
		filterCremationTypeSelected,
		FiltersDistinctClinics,
		filterDistinctClinicSelected,
		filterPetLocation,
		filterPrivateWeight,
		initialLoad,
		LogOrder: { LogOrderActivitiesAtCrematory },
		match: { params: {workflow}},
		privateWeightCount,
		OrderProductSave,
		OrdersList,
		OrdersListFiltered,
		// Session: { User: {userTypeId}},
		setState,
		sortTableResultsBy,
		sortTableResultsOrder,
		title,
		translate,
		weightTotal
	} = props;
	console.log({props})
	// On initialLoad - setup the OrdersList and do any sorting that sucks doing on the server using knex
	if(initialLoad === true) {
		let TempOrdersList = orders;
			// Set the Title of the List based on the workflow variable passed in via the URL
			let tempTitle = workflow;
			let tempDisplayOrderDate = displayOrderDate;
			let checkLogsForDateScanned = false;
			let checkPetNamesForDuplicates = false;
			if(tempTitle === 'cremation_prioritization') {
				checkLogsForDateScanned = true;
				tempDisplayOrderDate = 'Arrived (Created)'; // defaulted to 'Created'
				tempTitle = 'Cremation Priority - All Orders At Crematory';
			} else if(tempTitle === 'engraving') {
				tempTitle = 'In-House Engraving';
			} else if(tempTitle === 'memorialization_calls') {
				tempTitle = 'Follow-up Calls Needed';
			} else if(tempTitle === 'ordering_products') {
				tempTitle = 'Products Need To Be Ordered';
			} else if(tempTitle === 'pawprints') {
				tempTitle = 'Paw Prints / Fur Clippings Needed';
				checkPetNamesForDuplicates = true;
			}

			// Set the distinct list of Clinics/Hospitals that have orders in this list
			let TempDistinctClinics = [];
			let TempDistinctPetNames = []; // Use this for PP workflow ot highlight ones we need to watch out for
			if(TempOrdersList.length > 0) {
				TempOrdersList.forEach((order) => {
					// Get the date the Order was marked as "Scanned for Pickup - At Crematory"
					if(checkLogsForDateScanned === true) {
						let LogScannedAtCrematory = LogOrderActivitiesAtCrematory.find((log) => parseInt(order.orderId) === parseInt(log.orderId) && log.dbField === 'orderStatusId' && parseInt(log.valueNew) === 12);
						order.dateScannedAtCrematory = _.isEmpty(LogScannedAtCrematory) ? null : LogScannedAtCrematory.dateCreated;
					} else { order.dateScannedAtCrematory = null }

					// Push each order to its Clinic
					let tempIndex = TempDistinctClinics.findIndex((val) => parseInt(val.companyId) === parseInt(order.companyId));
					if(tempIndex > -1) {
						TempDistinctClinics[tempIndex].count = TempDistinctClinics[tempIndex].count+1;
					} else {
						TempDistinctClinics.push({ companyId: parseInt(order.companyId), companyName: order.companyName, count: 1});
					}

					// For PP workflow, mark the Pet Name in red if there are other orders in the queue that have the same name
					if(checkPetNamesForDuplicates === true) {
						let petMatchIndex = TempDistinctPetNames.findIndex((petName) => petName === order.petFirstName);
						order.petNameDuplicate = petMatchIndex > -1 ? true : false;
						// Find the other orders with that match pet and mark their flag as true also
						if(petMatchIndex > -1) {
							TempOrdersList.filter((matchPet) => matchPet.petFirstName === order.petFirstName).forEach((updateOrder) => updateOrder.petNameDuplicate = true);	
						}
						// Push petFristName to array for comparison for the next orders in the forEach loop
						TempDistinctPetNames.push(order.petFirstName);
					}

					// Mark each order with "isCommunal" or "isPrivate" for ease of use with filters later
					order.isCommunal = order.ProductsOrder.findIndex((product) => parseInt(product.productId) === 26) > -1 ? 1 : 0;;
					order.isPrivate = order.isCommunal === 0 && order.ProductsOrder.findIndex((product) => parseInt(product.productId) === 27) > -1 ? 1 : 0;
				})
			}
			// Sort the array of clinics that have orders by clinic name
			TempDistinctClinics = TempDistinctClinics.sort((a,b) => {
				if(a.companyName > b.companyName) {
					return 1;
				} else if(a.companyName < b.companyName) {
					return -1;
				} else {
					return 0;
				}
			});

			// Filter down the list of Orders if any of the Filters are defaulted to something other than any 'All Orders' type option
			let TempOrdersListFiltered = TempOrdersList;
			// For Paw Prints, filter down to only show Orders that are at the Crematory already (or whatever we set as the default)
			if(workflow === 'pawprints') {
				if(filterPetLocation === 'At Crematory Only') {
					TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => parseInt(order.statusAtCrematory) === 1);
				}
			}

			// Set the total weight for the initial Orders based on the initial filters
			let tempWeightTotal = 0;
			TempOrdersListFiltered.forEach((order) => { if(order.weight !== null) {tempWeightTotal = Math.add(tempWeightTotal, order.weight).toFixed(0)}});

			setState({
				displayOrderDate: tempDisplayOrderDate,
				FiltersDistinctClinics: TempDistinctClinics,
				initialLoad: false,
				OrdersList: TempOrdersList,
				OrdersListFiltered: TempOrdersListFiltered,
				title: tempTitle,
				weightTotal: tempWeightTotal
			})
		// }
	}

	// Simple function for updating single variables within State
	function changeState(value, name) {
		let tempValue = value;
		let TempOrdersListFiltered = OrdersList;

		if(name === 'filterDistinctClinicSelected') {
			// tempValue is going to be the companyId, so we want that to be an integer
			if(parseInt(tempValue) !== 0) {
				// Filter down the full list of orders 
				TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => parseInt(order.companyId) === parseInt(tempValue));
			}

			// Apply the other filters
			if(filterCremationStatusSelected !== 'All') {
				TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => order.orderServiceStatus === filterCremationStatusSelected);
			}
			if(filterCremationTypeSelected !== 'All') {
				let tempCremationProductId = filterCremationTypeSelected === 'Private' ? 27 : 26;
				// Filter down the full list of orders 
				TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => order.ProductsOrder.findIndex((product) => parseInt(product.productId) === parseInt(tempCremationProductId)) > -1);
			}
		} 
		/////////// CREMATION TYPE
		else if(name === 'filterCremationTypeSelected') {
			if(value !== 'All') {
				// Filter down the full list of orders 
				TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => (value === 'Communal' && order.isCommunal === 1) || (value === 'Private' && order.isPrivate === 1));
			}

			// Apply the other filters
			if(filterCremationStatusSelected !== 'All') {
				TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => order.orderServiceStatus === filterCremationStatusSelected);
			}
			if(parseInt(filterDistinctClinicSelected) !== 0) {
				TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => parseInt(order.companyId) === parseInt(filterDistinctClinicSelected));
			}
		}
		/////////// CREMATION STATUS
		else if(name === 'filterCremationStatusSelected') {
			if(value !== 'All') {
				// Filter down the full list of orders 
				TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => {
					if(order.orderServiceStatus === value) {
						return true;
					} else {
						return false;
					}
				});
			}

			// Apply the other filters
			if(filterCremationTypeSelected !== 'All') {
				let tempCremationProductId = filterCremationTypeSelected === 'Private' ? 27 : 26;
				// Filter down the full list of orders 
				TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => order.ProductsOrder.findIndex((product) => parseInt(product.productId) === parseInt(tempCremationProductId)) > -1);
			}
			if(parseInt(filterDistinctClinicSelected) !== 0) {
				TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => parseInt(order.companyId) === parseInt(filterDistinctClinicSelected));
			}
		} 
		/////////// PET LOCATION
		else if(name === 'filterPetLocation') {
				// Only need to filter down if we only want orders that are currently at the Crematory. Meaning orderStatusId 
				if(value === 'At Crematory Only') {
					TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => parseInt(order.statusAtCrematory) === 1);
				} 

				// Apply the other filters
				if(filterCremationTypeSelected !== 'All') {
					let tempCremationProductId = filterCremationTypeSelected === 'Private' ? 27 : 26;
					// Filter down the full list of orders 
					TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => order.ProductsOrder.findIndex((product) => parseInt(product.productId) === parseInt(tempCremationProductId)) > -1);
				}
				if(parseInt(filterDistinctClinicSelected) !== 0) {
					TempOrdersListFiltered = TempOrdersListFiltered.filter((order) => parseInt(order.companyId) === parseInt(filterDistinctClinicSelected));
				}
		}

		// Set the total weight for the Orders based on the new filters
		let tempWeightTotal = 0;
		TempOrdersListFiltered.forEach((order) => { if(order.weight !== null) {tempWeightTotal = Math.add(tempWeightTotal, order.weight).toFixed(0)}});

		// Update the number of Privates that match the filtered orders if there is a number entered in the Private Weight filter input
		let tempPrivateWeightCount = filterPrivateWeight !== '' ? TempOrdersListFiltered.filter((order) => order.isPrivate === 1 && order.weight !== null && Math.subtract(order.weight, filterPrivateWeight) <= 0).length : '';
		
		setState({
			[name]: tempValue,
			privateWeightCount: tempPrivateWeightCount,
			OrdersListFiltered: TempOrdersListFiltered,
			weightTotal: tempWeightTotal
		})
	}

	// Function for calculating the number of Privates that are at or below the integer entered in the filter area
	function handlePrivateWeightCalculation(weight) {
		let tempPrivateWeightCount = '';
		if(weight !== '' && weight > 0) {
			tempPrivateWeightCount = OrdersListFiltered.filter((order) => order.isPrivate === 1 && order.weight !== null && Math.subtract(order.weight, weight) <= 0).length;
		}
		setState({
			filterPrivateWeight: weight,
			privateWeightCount: tempPrivateWeightCount
		})
	}

	// Function for sorting the orders that are in the workflow table, by whatever sorting icon is clicked
	function handleTableSorting(name) {
		let tempSortOrder = '';
		// If this sorting name is the same as the current sorting name, move to the next sortOrder
		if(name === sortTableResultsBy) {
			if(sortTableResultsOrder === 'asc') tempSortOrder = 'desc'
			else if(sortTableResultsOrder === 'desc') tempSortOrder = ''
			else if(sortTableResultsOrder === '') tempSortOrder = 'asc'
		} else {
			tempSortOrder = 'asc'
		}
		let TempOrdersListFiltered = OrdersListFiltered.sort((a,b) => {
			if(tempSortOrder === 'asc') {return a[name] - b[name];}
			else if(tempSortOrder === 'desc'){return b[name] - a[name];}
			else if(tempSortOrder === '') {
				return new Date(a.dateCreated) - new Date(b.dateCreated);
			} else return null
		})

		setState({
			OrdersListFiltered: TempOrdersListFiltered,
			sortTableResultsBy: name,
			sortTableResultsOrder: tempSortOrder
		})
	}

	// Function to update the flag statuses of the individual products that need to be handled with some action - ie taking pp, furclipping
	async function handleProductStatusUpdate(name, value, orderProductId, passedOrderId, statusAtCrematory) {
		//.log("Name: ", name, " Val: ", value, " ID: ", orderProductId)
		// Only allow fulfillment of PP and FC to take place if the status of the Order is one that is at the Crematory
		if(false) {
			let { data: { orderProductSave: { Response }}} = await OrderProductSave({ input: {[name]: value, orderProductId}});
			if(Response.success === true) {
				let TempOrdersListFiltered = OrdersListFiltered;
				TempOrdersListFiltered.find((order) => parseInt(order.orderId) === parseInt(passedOrderId)).ProductsOrder.find((product) => parseInt(product.orderProductId) === parseInt(orderProductId))[name] = value;
				setState({
					OrdersListFiltered: TempOrdersListFiltered
				})
			}
		}
	}

	return (
		<div className="w-100">
			<div className="row m-0 pt-3 pb-1 clearfix">
				<div className="w-100 pl-4 pr-4">
					<div className="float-left h3">
						{title}
					</div>
					{
						workflow === 'cremation_prioritization' &&
						<React.Fragment>
							<div className="col-auto text-secondary pt-1 ml-5 float-left">
								Weight: <span className="text-dark">{weightTotal}</span>
								<span className="ml-5">Count: <span className="text-dark">{OrdersListFiltered.length}</span></span>
								<span className="ml-5">Privates Below <input type="text" className="" style={{width: 30+'px'}} value={filterPrivateWeight} onChange={(event) => handlePrivateWeightCalculation(event.target.value)} />: <span className="text-dark">{privateWeightCount}</span></span>
							</div>
							<div className="col-auto float-right">
								<select id="filterCremationStatusSelected" defaultValue="filterCremationStatusSelected" className="form-control" onChange={(event) => changeState(event.target.value, 'filterCremationStatusSelected')}>
									<option value="All">{translate("All Statuses")}</option>
									<option value="Pending">{translate("Pending/Ready")}</option>
									<option value="Cremating">{translate("Cremating")}</option>
									<option value="Cremated">{translate("Cremated")}</option>
								</select>
							</div>
						</React.Fragment>
					}
					{
						(workflow === 'cremation_prioritization' || workflow === 'pawprints') &&
						<React.Fragment>
							<div className="col-auto float-right">
								<select id="filterCremationTypeSelected" defaultValue="filterCremationTypeSelected" className="form-control" onChange={(event) => changeState(event.target.value, 'filterCremationTypeSelected')}>
									<option value="All">{translate("All Cremations")}</option>
									<option value="Private">{translate("Private")}</option>
									<option value="Communal">{translate("Communal")}</option>
								</select>
							</div>
						</React.Fragment>
					}
					<div className="col-auto float-right">
						<select id="filterDistinctClinicSelected" defaultValue="filterDistinctClinicSelected" className="form-control" onChange={(event) => changeState(event.target.value, 'filterDistinctClinicSelected')}>
							<option value="0">{translate("All Clinics")} ({OrdersList.length})</option>
							{FiltersDistinctClinics.map((clinic) => (
								<option value={parseInt(clinic.companyId)} key={clinic.companyId}>{clinic.companyName} ({OrdersList.filter((filtered) => parseInt(filtered.companyId) === parseInt(clinic.companyId)).length})</option>
							))}
						</select>
					</div>
					{
						workflow === 'pawprints' &&
						<React.Fragment>
							<div className="btn-group col-auto float-right" role="group">
								<button type="button" style={{boxShadow: 'none'}} className={`btn rounded-left border-secondary ${(filterPetLocation === 'At Crematory Only' && 'btn-success') || 'btn-light text-secondary'}`} onClick={() => changeState('At Crematory Only', 'filterPetLocation')}>At Crematory Only</button>
								<button type="button" style={{boxShadow: 'none'}} className={`btn rounded-right border-secondary ${(filterPetLocation === 'All Orders' && 'btn-success') || 'btn-light text-secondary'}`} onClick={() => changeState('All Orders', 'filterPetLocation')}>All Orders</button>
							</div>
						</React.Fragment>
					}
				</div>
			</div>
			<div className="p-2">
				<table className="table table-striped">
					<thead>
						<tr>
							<th><Translate id={displayOrderDate} /></th>
							<th><Translate id="Clinic" /></th>
							<th><Translate id="Reference" /></th>
							<th><Translate id="Pet Name" /></th>
							{
								workflow === 'cremation_prioritization' &&
								<React.Fragment>
									<th className="pb-2 pl-0 pr-0"><Translate id="Wt." /><button className="btn btn-sm btn-default ml-2" onClick={() => handleTableSorting('weight')}>
										{(sortTableResultsBy !== 'weight' || (sortTableResultsBy === 'weight' && sortTableResultsOrder === '')) && <FontAwesomeIcon icon="sort" />}
										{sortTableResultsBy === 'weight' && sortTableResultsOrder === 'asc' && <FontAwesomeIcon icon="sort-down" />}
										{sortTableResultsBy === 'weight' && sortTableResultsOrder === 'desc' && <FontAwesomeIcon icon="sort-up" />}
									</button></th>
									<th><Translate id="Type" /></th>
									<th><Translate id="Needs" /></th>							
									<th><Translate id="Status" /></th>
									<th><Translate id="Order Status" /></th>
								</React.Fragment>
							}
							{
								workflow === 'pawprints' &&
								<React.Fragment>
									<th className="pl-0 pr-0"><Translate id="Wt." /></th>
									<th><Translate id="Type" /></th>
									<th><Translate id="Needs" /></th>	
									<th><Translate id="Quantity" /></th>	
									<th><Translate id="Order Status" /></th>
								</React.Fragment>
							}
							{
								workflow === 'ordering_products' && 
								<React.Fragment>
									<th>Engraving</th>
									<th>Products</th>
								</React.Fragment>
							}
							{
								workflow === 'engraving' && 
								<React.Fragment>
									<th>Products</th>
								</React.Fragment>
							}
							<th><Translate id="Memorial" /></th>
						</tr>
					</thead>
					<tbody>
						{OrdersListFiltered.length > 0 &&
							OrdersListFiltered.map((order) => {
								// CONTENT FOR CREMATION PRIORITIZATION
									let Cremation = order.ProductsOrder.find((product) => product.productTypeId === '2');
									let orderType = '';
									let orderCommunal = false;
									let orderPrivate = false;
									if(Cremation) {
										orderType = Cremation.productName;
										orderCommunal = Cremation.productName === 'Communal Cremation' ? true : false;
										orderPrivate = Cremation.productName === 'Private Cremation' ? true : false;
									} 

									// Get any precremation products that we need to take
									let ppIndex = order.ProductsOrder.findIndex((product) => product.statusIsPawPrint === 1);
									let pawPrintOrderProductId = ppIndex > -1 ? order.ProductsOrder[ppIndex].orderProductId : 0;
									let isPawPrint = ppIndex > -1 ? true : false;
									let pawPrintTaken = ppIndex > -1 ? order.ProductsOrder[ppIndex].statusPawPrintTaken : 0;
									let pawPrintCompleted = ppIndex > -1 ? order.ProductsOrder[ppIndex].statusPawPrintCompleted : 0;
									// Get count of PP, and type
									let ProductCounts = []; // This is the final array that will be used for output in the table
									if(isPawPrint === true) {
										// Get Array with unique "Paw Print" products
										const PPCount = [...new Set(order.ProductsOrder.map((product) => product.productName).filter((name) => name.includes("Paw Print")))]
										// Loop this unique PP array, and get the counts for each unique product. Push an object to the final array for output
										PPCount.forEach((pp) => {
											let ppCount = order.ProductsOrder.filter((product) => product.productName === pp).length;
											let TempProductCount = {productName: pp, count: ppCount};
											ProductCounts.push(TempProductCount);
										})
									}

									let fcIndex = order.ProductsOrder.findIndex((product) => product.statusIsFurClipping === 1);
									let furClippingOrderProductId = fcIndex > -1 ? order.ProductsOrder[fcIndex].orderProductId : 0;
									let isFurClipping = fcIndex > -1 ? true : false;
									let furClippingCompleted = fcIndex > -1 ? order.ProductsOrder[fcIndex].statusFurClippingCompleted : 0;
									// Same functionality for FC as for PP to get the count of the products.
									if(isFurClipping === true) {
										// Get Array with unique "Fur Clipping" products
										const FCCount = [...new Set(order.ProductsOrder.map((product) => product.productName).filter((name) => name.includes("Fur Clipping")))]
										// Loop this unique FC array, and get the counts for each unique product. Push an object to the final array for output
										FCCount.forEach((fc) => {
											let fcCount = order.ProductsOrder.filter((product) => product.productName === fc).length;
											let TempProductCount = {productName: fc, count: fcCount};
											ProductCounts.push(TempProductCount);
										})
									}

									// Completed and Packaged - last step for most products
									// const iconCompletedPackagedBackgroundColor = product.statusCompletedAndPackaged === 1 ? 'black' : 'grey';
									// const iconCompletedPackagedColor = product.statusCompletedAndPackaged === 1 ? 'lightgreen' : 'white';
									// const alreadyPackagedDeleteDisabled = product.statusCompletedAndPackaged === 1 ? true : false;

									// Step 1 for Paw Prints
									let iconPawPrintBackgroundColor = pawPrintTaken === 1 ? 'gold' : 'grey';
									let iconPawPrintColor = pawPrintTaken === 1 ? 'white' : 'white';
									let nextPawPrintStatus = pawPrintTaken === 1 ? 'statusPawPrintCompleted' : 'statusPawPrintTaken';
									// if(isPawPrint) {
									// 	nextPawPrintStatus = pawPrintTaken === 1 ? 'statusPawPrintCompleted' : 'statusPawPrintTaken';
									// 	nextPawPrintStatus = pawPrintTaken === 1 && pawPrintCompleted === 1 ? 'statusCompletedAndPackaged' : 'statusPawPrintCompleted';
									// }

									// Step 2 for Paw Prints
									iconPawPrintBackgroundColor = pawPrintCompleted === 1 ? 'green' : iconPawPrintBackgroundColor;

									// Step 1 for Fur Clipping
									const iconFurClippingBackgroundColor = furClippingCompleted === 1 ? 'green' : 'grey';
									const iconFurClippingColor = furClippingCompleted === 1 ? 'white' : 'white';

									//set style in info for badge
									let orderClass = "secondary"; // default to a neutral gray
									let tempOrderServiceStatus = order.orderServiceStatus;
									if(tempOrderServiceStatus === "Completed" || tempOrderServiceStatus === "Cremated") {
										orderClass = "secondary";
									} 
									else if(tempOrderServiceStatus === "In Process" || tempOrderServiceStatus === "Cremating") {
										orderClass = "danger";
									} 
									else if(
										tempOrderServiceStatus === "Pending" && 
										((isFurClipping === true && furClippingCompleted ===1) || isFurClipping === false) &&
										((isPawPrint === true && pawPrintCompleted ===1) || isPawPrint === false)
									) {
										orderClass = "success";
										tempOrderServiceStatus = "Ready"
									} 
									else if(tempOrderServiceStatus === "Pending") {
										orderClass = "warning";
									} 

									// Calculate how long the pet has been at the crematory - Used for Cremation Prioritization
									let tempHoursAtCrematory = moment().diff(moment(order.dateScannedAtCrematory), "hours")
									let tempDaysAtCrematory = moment().diff(moment(order.dateScannedAtCrematory), "days")
									let tempLeftOverHours = tempDaysAtCrematory > 0 ? Math.subtract(tempHoursAtCrematory, Math.multiply(tempDaysAtCrematory, 24)) : tempHoursAtCrematory;
									let timeAtCrematory = tempDaysAtCrematory > 0 ? `${tempDaysAtCrematory} d ${tempLeftOverHours} hrs` : `${tempHoursAtCrematory} hours`;
								// END CONTENT FOR CREMATION PRIORITIZATION

								// CONTENT FOR PRODUCTS NEED TO BE ORDERED AND IN-HOUSE ENGRAVING
									let ProductsToOrder = order.ProductsOrder.filter((product) => product.statusConfirmedIndicator === 1 && product.statusConfirmed === 0);
									if(workflow === 'ordering_products') {
										// Only show products that we do not have in stock
										ProductsToOrder = ProductsToOrder.filter((product) => parseInt(product.stockAvailable) === 0)
										// // Loop through these products and add a key to each product's object for if it has been ordered yet.
										// ProductsToOrder.forEach((product) => { if(parseInt(product.statusOrdered) === 1) { product}})
									} else if(workflow === 'engraving') {
										// Only show products that we have in stock and that need personalization
										ProductsToOrder = ProductsToOrder.filter((product) => parseInt(product.stockAvailable) > 0 && product.personalizeProduct === 1 && product.personalizationConfirmed === 1)
									}

									let productsListed = ProductsToOrder.length > 0 && ProductsToOrder.map((product, index) => {
										if(ProductsToOrder.length > 1 && ProductsToOrder.length !== index+1) {
											return `${product.productName}, `
										} else {
											return product.productName
										}
									})
									let ProductNeedsEngraving = ProductsToOrder.length > 0 && ProductsToOrder.findIndex((product) => product.personalizeProduct === 1 && product.personalizationConfirmed === 1) > -1 ? true : false;
								// END CONTENT FOR PRODUCTS NEED TO BE ORDERED AND IN-HOUSE ENGRAVING


								// Do not show deleted orders
								if(order.orderStatus !== "Deleted") {
									return (
										<tr key={order.orderId}>
											<td>
												{workflow === 'cremation_prioritization' && <React.Fragment><div className="">{(order.dateScannedAtCrematory !== null && timeAtCrematory) || ''}</div><div className="text-secondary">({moment(order.dateCreated).format('MMM D')})</div></React.Fragment>}
												{workflow !== 'cremation_prioritization' && moment(order.dateCreated).format('MMM D')}
											</td>
											<td>{order.companyName}</td>
											<td><h5 className="m-0"><NavLink target="_blank" to={`/orders/orderId/${order.orderId}/section/memorialization`} activeClassName="active">{order.petReferenceNumber}</NavLink></h5></td>
											
											{
												workflow === 'pawprints' &&
												<React.Fragment>
													{order.petNameDuplicate === false && <td><div>{order.petFirstName}</div></td>}
													{order.petNameDuplicate === true && <td className="border border-danger"><div className="text-danger">{order.petFirstName}</div></td>}
												</React.Fragment>
											}
											{workflow !== 'pawprints' && <td><div>{order.petFirstName}</div></td>}
											
												
												{/* <div>{(workflow === 'pawprints' || workflow === 'cremations' || workflow === 'urns') && `(${order.weight} ${order.weightUnits})`}</div> */}
											{
												(workflow === 'cremation_prioritization' || workflow === 'pawprints') &&
												<React.Fragment>
													<td className="pl-0 pr-0 m-0 text-center">
														{order.weight}
													</td>
													<td className="p-0 m-0 text-center">
														{orderPrivate === false && orderCommunal === false && orderType.replace(" Cremation", "")}
														{orderPrivate === true && 
															<span className="fa-layers fa-2x mt-2 h1">
																<FontAwesomeIcon icon="circle" color={"grey"} />
																<strong className="fa-layers-text text-white small pl-1">P</strong>
															</span>}
														{orderCommunal === true && 
															<span className="fa-layers fa-2x mt-2 h1">
																<FontAwesomeIcon icon="circle" color={"grey"} />
																<strong className="fa-layers-text text-white small">C</strong>
															</span>}
													</td>
													<td className="p-0 m-0">
														{
															isPawPrint &&
															<span className="fa-layers fa-2x mt-2 h1" onClick={() => handleProductStatusUpdate(nextPawPrintStatus, 1, pawPrintOrderProductId, order.orderId, order.statusAtCrematory)}>
																<FontAwesomeIcon icon="circle" color={iconPawPrintBackgroundColor} />
																<FontAwesomeIcon icon="paw" color={iconPawPrintColor} transform="shrink-5" />
															</span>
														}
														{
															isFurClipping &&
															<span className={`fa-layers fa-2x mt-2 h1 ${isPawPrint && 'ml-3'}`} onClick={() => handleProductStatusUpdate('statusFurClippingCompleted', 1, furClippingOrderProductId, order.orderId, order.statusAtCrematory)}>
																<FontAwesomeIcon icon="circle" color={iconFurClippingBackgroundColor} />
																<FontAwesomeIcon icon="cut" color={iconFurClippingColor} transform="shrink-5" />
															</span>
														}
													</td>
													{
														workflow === 'pawprints' &&
														<td>
															{ProductCounts.map((product) => {
																return (
																	<div key={`${product.productName}-${order.orderId}`} className="small m-0 p-0">{product.productName.replace(" Paw Print", "")} x{product.count}</div>
																)
															})}
														</td>
													}{
														workflow !== 'pawprints' &&
														<td>
															<h5 className="m-0">
																<span className={`badge badge-${orderClass} text-white p-2 text-uppercase`}>{tempOrderServiceStatus}</span>
															</h5>
														</td>
													}
													<td>{order.OrderHold.length > 0 &&
															<h5 className="m-0">
																<span className="badge badge-warning p-2 text-uppercase">
																	<FontAwesomeIcon icon="hand-paper" /> <Translate id="Hold" />
																</span>
															</h5>
														}
														{order && order.orderStatus && order.orderStatus.replace('Preparation completed, awaiting delivery', 'Awaiting Delivery')}
													</td>
												</React.Fragment>
											}
											{
												workflow === 'ordering_products' && 
												<React.Fragment>
													<td>{ProductNeedsEngraving === true && 'Yes'}</td>
													<td>{ProductsToOrder.map((productToOrder) => {
														return ( <div key={productToOrder.orderProductId}>{productToOrder.productName} {productToOrder.statusOrdered === 1 && <span className="badge badge-success">Ordered</span>}</div>)
													})}</td>
												</React.Fragment>
											}
											{
												workflow === 'engraving' && 
												<React.Fragment>
													<td>{productsListed}</td>
												</React.Fragment>
											}
											<td>
												{ order.memorialization === 'home' && <span><FontAwesomeIcon icon="home" /> <Translate id="At Home" /></span> }
												{ order.memorialization === 'clinic' && <span><FontAwesomeIcon icon="hospital" /> <Translate id="Clinic" /></span> }
												{ order.memorialization === 'none' && <span><Translate id="None" /></span> }												
											</td>
										</tr>
									)
								} else {
									return false;
								}
							})
						}
					</tbody>
				</table>
				{/*  Display Alert message that there are no results */}
				{
					OrdersListFiltered.length === 0 &&
					<React.Fragment>
						{
							(workflow === 'pawprints' && filterPetLocation === 'At Crematory Only' &&
							<div className="alert alert-success text-center">There are no Orders currently at the crematory that still need Paw Prints or Fur Clippings.</div>)
							||
							<div className="alert alert-success text-center">There are no Orders in this workflow matching the selected filters.</div>
						}
					</React.Fragment>
				}
			</div>
		</div>
	);
	
}

export const WorkflowList = compose(
	queryWithLoading({
		gqlString: getOrdersQuery, 
		variablesFunction: (props) => ({orderQueue: props.match.params.workflow ? props.match.params.workflow : ''}),
		requiredPermission: { permission: "orders", permissionLevel: 3},
		options: {
			fetchPolicy: 'network-only', // we don't want to get the response from the Apollo cache
			pollInterval: 1000000 // 10 seconds in milliseconds
		}
	}),
	queryWithLoading({
		gqlString: GetLogOrderActivitiesAtCrematory, 
		variablesFunction: (props) => ({orderQueue: props.match.params.workflow ? props.match.params.workflow : ''}),
		name: 'LogOrder'
	}),
	withMutation(OrderProductSaveMutation, "OrderProductSave"),
	withRouter,
	withState({
		displayOrderDate: 'Created',
		filterCremationStatusSelected: 'All',
		filterCremationTypeSelected: 'All',
		FiltersDistinctClinics: [],
		filterDistinctClinicSelected: 0,
		filterPetLocation: 'At Crematory Only',
		filterPrivateWeight: '',
		initialLoad: true,
		privateWeightCount: '',
		OrdersList: [],
		OrdersListFiltered: [],
		sortTableResultsBy: '',
		sortTableResultsOrder: '',
		title: '',
		weightTotal: 0
	}),
	withTranslate
)(WorkflowListContainer)