import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Math from 'mathjs';
import { withRouter } from "react-router-dom";
import { queryWithLoading } from '../utilities/IWDDb';
import React from 'react';
import { Translate } from '../translations/IWDTranslation';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withMutation } from '../utilities/IWDDb';
import { withState } from "react-state-hoc";
import { withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import { InvoiceableCompaniesQuery } from '../companies/companies_graphql';

import {
	getInvoiceableAdjustmentsQuery,
	getInvoiceableOrdersProductsQuery,
	InvoiceSaveMutation
} from './invoices_graphql';

const InvoiceCreateFormContent = (props) => {
	const {
		history,
		InvoiceableAdjustments: { InvoiceableAdjustments },
        InvoiceableOrdersProducts: { InvoiceableOrdersProducts },
		InvoiceSave,
		listLoaded,
		orderProductIds,
		setState,
		submitting,
		updateState
	} = props;


	// When this function is first called, we need to reset the filtering button of the function below by resetting its state variables for determining if filtering is occuring.
	if(listLoaded === false && submitting === true) {
		const newListLoaded = true;
		const newSubmitting = false;
		updateState(newListLoaded, newSubmitting);
	}

	function handleOrderProductSelect(orderProductId) {
		let removeId = false;

		if(orderProductIds.length > 0) {
			removeId = orderProductIds.find((item) => parseInt(item) === parseInt(orderProductId)) > 0 ? true : false;
		}
		let tempOrderProductIds = orderProductIds;
		if(removeId === false) {
			tempOrderProductIds.push(orderProductId);
		} else {
			tempOrderProductIds = orderProductIds.filter((item) => parseInt(item) !== parseInt(orderProductId));
		}
		setState({orderProductIds: tempOrderProductIds})
	};

	async function handleSubmit() {
		const { data: { invoiceSave }} = await InvoiceSave({ input: { invoiceId: 0, orderProductIds: orderProductIds.join() } });
		if(invoiceSave.Response.success === true) {
			setState({orderProductIds: []}, () => history.push('/invoices'))
		}

	}

	async function handleSelectAll() {
		// If all of the Order Products are selected and CHECK ALL gets clicked, then empty the array
		if(InvoiceableOrdersProducts.length === orderProductIds.length) {
			setState({orderProductIds: []})
		} else {
			// Check all of the checkboxes
			const tempOrderProducts = InvoiceableOrdersProducts.map((orderProduct) => orderProduct.orderProductId);
			setState({orderProductIds: tempOrderProducts})
		}
	}

	// On 8/29/19 we added the code to have adjustments made in the Order Details also show up in this list of potential invoice items. They were not there at the time because the Create Invoice System was created before the Adjustment system in Order Details.
	// We need to add any Adjustments that are in the InvoiceableAdjustments array into the InvoiceableOrdersProducts array so they show up below, in the same grouping as the other items for the same order.
	let tempInvoiceableOrdersProducts = [];
	let tempCounter = 0;

	if(InvoiceableOrdersProducts) {
		InvoiceableOrdersProducts.forEach((product) => {
			// push this OrderProduct to the temp array
			tempInvoiceableOrdersProducts.push(product);

			// Go ahead and update the counter to use to get the next index's orderId below
			tempCounter = Math.add(tempCounter, 1);

			// if this is the last product for this order, then check to see if this order has any adjustments, if so, push them to the temp array.
			if(InvoiceableAdjustments.length > 0 && ((InvoiceableOrdersProducts.length > tempCounter && parseInt(product.orderId) !== parseInt(InvoiceableOrdersProducts[tempCounter].orderId)) || InvoiceableOrdersProducts.length === tempCounter)) {
				let tempAdjustments = InvoiceableAdjustments.filter((adjustments) => parseInt(adjustments.orderId) === parseInt(product.orderId));
				if(tempAdjustments.length > 0) {
					tempAdjustments.forEach((tAdjustment) => {
						// push the adjustments to the tempInvoiceableOrdersProducts
						tempInvoiceableOrdersProducts.push(tAdjustment);
					})
				}
			}
		})
	}

	return (
		<div className="w-100">
			<div className="">
				<table className="table table-striped small">
					<thead>
						<tr>
							<th>{InvoiceableOrdersProducts && InvoiceableOrdersProducts.length > 0 && <input type="checkbox" name="OrderProductId" onClick={() => handleSelectAll()} />}</th>
							<th>Vet Hospital</th>
							<th>Reference #</th>
							<th>Product / Cremation Type</th>
							<th>Subtotal</th>
							<th>Tax</th>
							<th>Product Total</th>
						</tr>
					</thead>
					<tbody>
						{InvoiceableOrdersProducts && InvoiceableOrdersProducts.length > 0 &&
							tempInvoiceableOrdersProducts.map((orderProduct) => {
								// Define all of the variables that get set in the IF /ELSE IF below
								let fragmentKey;

								let invoiceCostCharged;
								let invoiceCostChargedPersonalization;
								let invoiceCostSubtotal;
								let taxDue;

								let badgeClass;
								let badgeText;
								let badgeTextClass;

								let priceCharged;
								let priceChargedPersonalization;
								let priceChargedSubtotal;
								let taxCharged;

								let badgeClassCredit;
								let badgeTextCredit;
								let badgeTextClassCredit;

								let productName;

								let badgeClassAdjustment;
								let badgeTextAdjustment;
								let badgeTextClassAdjustment;

								if(orderProduct.orderProductId !== null) {
									fragmentKey = orderProduct.orderProductId;
									// for CHARGES
									invoiceCostCharged = orderProduct.invoiceCostCharged !== null ? orderProduct.invoiceCostCharged : 0;
									invoiceCostChargedPersonalization = orderProduct.invoiceCostChargedPersonalization !== null ? orderProduct.invoiceCostChargedPersonalization : 0;
									invoiceCostSubtotal = Math.add(invoiceCostCharged, invoiceCostChargedPersonalization).toFixed(2);
									taxDue = orderProduct.taxChargedInvoice !== null ? orderProduct.taxChargedInvoice : '0.00';

									badgeClass = 'badge badge-danger';
									badgeText = 'CHARGE';
									badgeTextClass = 'text text-danger';

									// for CREDITS - do not put this in an IF because constants do not persist outside of the IF. You can declare all the variables first as LET and then do an IF and set them inside.
									priceCharged = orderProduct.priceCharged !== null ? orderProduct.priceCharged : 0;
									priceChargedPersonalization = orderProduct.priceChargedPersonalization !== null ? orderProduct.priceChargedPersonalization : 0;
									priceChargedSubtotal = Math.add(priceCharged, priceChargedPersonalization).toFixed(2);
									taxCharged = orderProduct.taxCharged !== null ? orderProduct.taxCharged : '0.00';

									badgeClassCredit = 'badge badge-success';
									badgeTextCredit = 'CREDIT';
									badgeTextClassCredit = 'text text-success';

									productName = orderProduct.accountProductName !== null && orderProduct.accountProductName !== '' ? orderProduct.accountProductName : orderProduct.productName;
								}
								else if(orderProduct.orderProductId === null) {
									fragmentKey = `0-${orderProduct.invoiceItemId}`;
									// For ADJUSTMENTS - these would have been made within the Order details
									badgeClassAdjustment = orderProduct.invoiceCostTotal > 0 ? 'badge badge-danger' : 'badge badge-success';
									badgeTextAdjustment = orderProduct.invoiceCostTotal > 0 ? 'CHARGE' : 'CREDIT';
									badgeTextClassAdjustment = orderProduct.invoiceCostTotal > 0 ? 'text text-danger' : 'text text-success';
								}

								// Show the INVOICE CHARGED info for every product. If it is invoiceVet=0, then also show the CREDIT info.
								return (
									<React.Fragment key={fragmentKey}>
										<tr>
											<td>
												{
													orderProduct.orderProductId !== null &&
													<input type="checkbox" name={`OrderProductId${orderProduct.orderProductId}`} checked={orderProductIds.find((item) => parseInt(item) === parseInt(orderProduct.orderProductId))} onClick={() => handleOrderProductSelect(orderProduct.orderProductId)} />
												}
											</td>
											<td>
												{orderProduct.companyName}
												<br />
												{parseInt(orderProduct.familyFriendPet) === 1 && <div className='badge badge-danger mr-1'>Family Pet</div>}
												{parseInt(orderProduct.servicePet) === 1 && <div className='badge badge-danger mr-1'>Service Pet</div>}
												{parseInt(orderProduct.staffEmployeePet) === 1 && <div className='badge badge-danger'>Staff Pet</div>}
											</td>
											{
												orderProduct.orderProductId !== null &&
												<React.Fragment>
													<td>
														<span className="h6 m-0"><a href={`/orders/orderId/${orderProduct.orderId}`} activeclassname="active">{orderProduct.petReferenceNumber}</a></span>
														<br />Item: {orderProduct.orderProductId}
													</td>
													<td>
														<span className="h6 m-0">{productName} {orderProduct.priceChargedPersonalization !== null && <span>(Personalized)</span>}</span>
														<br />{orderProduct.productType === 'Cremation' && productName}
													</td>
													<td>${invoiceCostSubtotal}</td>
													<td>${taxDue}</td>
													<td>
														<div className={badgeTextClass}>${Math.add(taxDue, invoiceCostSubtotal).toFixed(2)}</div>
														<div className={badgeClass}>{badgeText}</div>
													</td>
												</React.Fragment>
											}
											{/* This section below is for an adjustments that were made in the Order Details */}
											{
												orderProduct.orderProductId === null &&
												<React.Fragment>
													<td>
														<span className="h6 m-0"><a href={`/orders/orderId/${orderProduct.orderId}`} activeclassname="active">{orderProduct.petReferenceNumber}</a></span>
														<br />Adjustment
													</td>
													<td>
														<span className="h6 m-0">{orderProduct.invoiceItemDescription}</span>
														<br />Adjustment Type: {orderProduct.invoiceItemType}
													</td>
													<td>${orderProduct.invoiceCostSubtotal}</td>
													<td>${orderProduct.taxDue}</td>
													<td>
														<div className={badgeTextClassAdjustment}>${orderProduct.invoiceCostTotal}</div>
														<div className={badgeClassAdjustment}>{badgeTextAdjustment}</div>
													</td>
												</React.Fragment>
											}
										</tr>
										{
											parseInt(orderProduct.invoiceVet) === 0 &&
											<tr key={orderProduct.orderProductId}>
												<td>{/* Do not put checkbox here because it will have the same orderProductId as the Charge checkbox above, and uncheck that one while appear to have checked both */}</td>
												<td></td>
												<td></td>
												<td></td>
												<td>-${priceChargedSubtotal}</td>
												<td>-${taxCharged}</td>
												<td>
													<div className={badgeTextClassCredit}>-${Math.add(taxCharged, priceChargedSubtotal).toFixed(2)}</div>
													<div className={badgeClassCredit}>{badgeTextCredit}</div>
												</td>
											</tr>
										}

									</React.Fragment>
								)
							})
						}
					</tbody>
				</table>

				<div className="mb-3">
					<button type="button" className="btn btn-success btn-addon" disabled={orderProductIds.length === 0} onClick={() => handleSubmit()}><FontAwesomeIcon icon="plus" /> <Translate id="Generate Invoice"/> </button>
				</div>
			</div>
		</div>
	)
};



const InvoiceCreateForm = compose (
	queryWithLoading({
		gqlString: getInvoiceableAdjustmentsQuery,
		variablesFunction: (props) => ({ dateEnd: props.dateEnd, dateStart: props.dateStart, companyId: props.companyId }),
		name: "InvoiceableAdjustments",
		options: {
			fetchPolicy: 'no-cache'
		}
	}),
	queryWithLoading({
		gqlString: getInvoiceableOrdersProductsQuery,
		variablesFunction: (props) => ({ dateEnd: props.dateEnd, dateStart: props.dateStart, companyId: props.companyId }),
		name: "InvoiceableOrdersProducts",
		options: {
			fetchPolicy: 'no-cache'
		}
	}),
	withMutation(InvoiceSaveMutation, "InvoiceSave", ['getInvoices']),
	withFormik(),
	withState({
		orderProductIds: []
	}),
	withTranslate
)(InvoiceCreateFormContent);

const InvoiceCreateContainer = (props) => {
	const {
		Companies: { InvoiceableCompanies },
		companyId,
		dateEnd,
		dateStart,
		history,
		listLoaded,
		setState,
		submitting
	} = props

	function updateState(listLoaded, submitting) {
		setState({ listLoaded: listLoaded, submitting: submitting })
	}

	return (
		<React.Fragment>
			<Form className="w-100 p-1">
				<div className="card p-3">
					<div className="form-row">
						<div className="col-md-auto"><label htmlFor="dateStart" className="mb-0"><Translate id="From" />*</label><Field type="date" name="dateStart" onChange={(event) => setState({dateStart: event.target.value})} className="form-control" /></div>
						<div className="col-md-auto"><label htmlFor="dateEnd" className="mb-0"><Translate id="To" />*</label><Field type="date" name="dateEnd" onChange={(event) => setState({dateEnd: event.target.value})} className="form-control" /></div>
						<div className="col-md-auto"><label htmlFor="companyId" className="mb-0"><Translate id="For" /></label>
							<Field component="select" name="companyId" onChange={(event) => setState({companyId: event.target.value})} className="form-control">
								<option>Select a Vet Hospital</option>
								{InvoiceableCompanies.map((company) => {
									return <option key={company.companyId} value={company.companyId}>{company.companyName}</option>
								})}
							</Field>
						</div>
						<div className="col-md-auto">
							<button type="button" className="btn btn-info btn-addon mt-4" onClick={() => setState({listLoaded: false, submitting: true})} disabled={dateEnd === '' || dateStart === ''}><FontAwesomeIcon icon="search" /> <Translate id="Get Orders"/> </button>
						</div>
					</div>
					<div className="row">
						<div className="col-12">
							{dateEnd !== '' && dateStart !== '' && submitting &&
								<InvoiceCreateForm
									companyId={companyId}
									dateEnd={dateEnd}
									dateStart={dateStart}
									history={history}
									listLoaded={listLoaded}
									submitting={submitting}
									updateState={(listLoaded, submitting) => updateState(listLoaded, submitting)}
								/>
							}
							{listLoaded === true && submitting === false &&
								<InvoiceCreateForm
									companyId={companyId}
									dateEnd={dateEnd}
									dateStart={dateStart}
									history={history}
									listLoaded={listLoaded}
									submitting={submitting}
									updateState={(listLoaded, submitting) => updateState(listLoaded, submitting)}
								/>
							}
						</div>
					</div>
				</div>
			</Form>
		</React.Fragment>
	)
}

export const InvoiceCreate = compose(
	queryWithLoading({
		gqlString: InvoiceableCompaniesQuery,
		name: "Companies"
	}),
	withFormik(),
	withRouter,
	withState({
		companyId: 0,
		dateEnd: '',
		dateStart: '',
		listLoaded: false,
		submitting: false
	}),
	withTranslate
)(InvoiceCreateContainer);
