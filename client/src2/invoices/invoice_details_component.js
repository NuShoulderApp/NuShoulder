import { compose } from "react-apollo";
import { FileDownloadLink } from "../files/FileDownloadLink";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from "react-router-dom";
import Math from 'mathjs';
import moment from 'moment';
import { NavLink } from "react-router-dom";
import { Payment } from "../payments/payment_component";
import { PrintButton } from '../orders/pdf_print_button_component';
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import React from "react";
import { Translate } from '../translations/IWDTranslation';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import { withState } from "react-state-hoc";
import { withTranslate } from '../translations/IWDTranslation';
import * as Yup from "yup";

import {
	getInvoiceQuery,
	InvoiceItemDeleteMutation,
	InvoiceItemSaveMutation,
	InvoiceSaveMutation,
	InvoiceSaveAndSendMutation
} from './invoices_graphql';

const InvoiceDetailsFormContent = (props) => {
	const {
		errors,
		handleAddAdjustmentClick,
		handleAddAdjustmentOnChange,
		handleInvoiceItemDelete,
		handleInvoiceItemEdit,
		handleInvoiceItemOnChange,
		handleSetState,
        Invoice,
		InvoiceItemDelete,
		InvoiceItemSave,
		invoicesPermissionLevel,
		messageSuccess,
		messageWarning,
		messageWarningAdjustmentForm,
		orderDetailsParent,
		orderId,
		paymentFormShow,
		PetReferenceNumbers,
		setState,
		state,
		submitForm,
		touched,
		translate,
		userTypeId,
		values
	} = props;

	// Function for saving the contents of the Add an Adjustment form, which creates a new invoiceItem record
	async function handleInvoiceItemAdjustmentSave() {
		if(values.invoiceItemDescription === '' || values.petReferenceNumber === '' || values.invoiceCostSubtotal === '') {
			setState({messageSuccess: '', messageWarningAdjustmentForm: 'Please complete all required fields'});
		} else if (PetReferenceNumbers.findIndex((number) => number === values.petReferenceNumber.toUpperCase()) === -1) {
			setState({messageSuccess: '', messageWarningAdjustmentForm: 'The Pet Reference Number does not match any Orders on this Invoice.'});
		} else {
			const input = {
				accountId: Invoice.accountId,
				companyId: Invoice.companyId,
				invoiceCostSubtotal: values.invoiceCostSubtotal,
				invoiceCostTotal: values.invoiceCostTotal,
				invoiceId: Invoice.invoiceId,
				invoiceItemId: 0,
				invoiceItemDescription: values.invoiceItemDescription,
				invoiceItemDescriptionPrivate: values.invoiceItemDescriptionPrivate,
				invoiceItemType: values.invoiceItemType,
				petReferenceNumber: values.petReferenceNumber,
				taxDue: values.taxDue
			};

			const { data: { invoiceItemSave }} =  await InvoiceItemSave({ input });

			// Close the inline form is save worked
			if(invoiceItemSave.Response.success === true) {
				handleAddAdjustmentClick();
				// If this invoice has already been sent, display a danger message that they have to resend the invoice or else the adjustment they just added will not get to the customer
				if(Invoice.dateInvoiceSent !== null) {
					setState({messageSuccess: 'Adjustment successfully added to invoice', messageWarning: 'Adjustment After Invoice Sent Warning', messageWarningAdjustmentForm: ''});
				} else {
					setState({messageSuccess: 'Adjustment successfully added to invoice', messageWarning: '', messageWarningAdjustmentForm: ''});
				}
			}
		}
	}

	// Function to actually mark the invoice item deleted in the db and save the deletedReason, along with date and userId
	async function handleInvoiceItemDeleteConfirmation(invoiceItemId) {
		const { data: { invoiceItemDelete }} =  await InvoiceItemDelete({ input: { deletedReason: values.deletedReason, invoiceItemId } });

		// Close the inline form is save worked
		if(invoiceItemDelete.Response.success === true) {
			handleSetState({invoiceItemIdDelete: 0, deletedReason: ''});
		}
	}

	// This function exists purely to clear out the success / warning messages that adding an adjustment can trigger. This is only called when the 'Add an Adjustment' button is clicked
	function handleLocalAddAdjustmentClick() {
		// Same functionality as previous - called function in the class
		handleAddAdjustmentClick();

		// clears out messages
		setState({messageSuccess: '', messageWarning: '', messageWarningAdjustmentForm: ''});
	}

	// Determine if there are any invoiceItems on this invoice that were created after the inoice was sent - this would mean that there were adjustments made after the invoice was send, so they need to resend the invoice.
	if(Invoice.dateInvoiceSent !== null) {
		if(Invoice.ItemsInvoice.findIndex((item) => moment(item.dateCreated).format() > moment(Invoice.dateInvoiceSent).format()) > -1 && messageWarning === '') {
			setState({messageWarning: 'Adjustment Not On Invoice Sent Warning'})
		}
	}

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				<div className="card p-3">
					<div className="">
						{Invoice && Invoice.companyName && <h3>ADJUST INVOICE ITEMS, SAVE, AND SEND INVOICE</h3>}
						{userTypeId !== 5 && orderDetailsParent === false && Invoice.dateInvoicePaid === null && invoicesPermissionLevel >= 3 && <p className="small text-right mt-n-1 mb-1"><button type="button" className="btn btn-info btn-sm btn-addon" disabled={state.addAdjustmentFormShow === true} onClick={() => handleLocalAddAdjustmentClick()}><FontAwesomeIcon icon="plus" /> <Translate id="Add an Adjustment"/> </button></p>}
						{userTypeId !== 5 && orderDetailsParent === true && Invoice.dateInvoicePaid === null && Invoice.dateInvoiceSent !== null && invoicesPermissionLevel >= 3 && <p className="small text-right mt-n-1 mb-1"><Link to={`/invoices/invoice_details/${Invoice.invoiceId}`} className="btn btn-info btn-sm"><Translate id="Go to Invoice Details"/> </Link></p>}
						{userTypeId !== 5 && Invoice && Invoice.companyName && <h6>Invoice for {Invoice.companyName}</h6>}
						{userTypeId === 5 && Invoice.dateInvoicePaid === null && <p className="small float-right mt-n-1 mb-1 mr-2"><button type="button" className="btn btn-info btn-sm btn-addon" disabled={paymentFormShow === true} onClick={() => setState({paymentFormShow: true})}><FontAwesomeIcon icon="credit-card" /> <Translate id="Make Payment"/> </button></p>}
						{Invoice.dateInvoicePaid !== undefined && Invoice.dateInvoicePaid !== null && <div className="alert alert-success clearfix"><FontAwesomeIcon icon="check" /> Invoice paid on {moment(Invoice.dateInvoicePaid).format('MM-DD-YYYY')}</div>}
						{paymentFormShow === true &&
							<div className="border p-3">
								<div className="form-row">
									<Payment
										amount={Invoice.totalDue}
										description={`Invoice ${Invoice.invoiceId}`}
										invoiceId={Invoice.invoiceId}
									/>
								</div>
								<div className="mt-3">
									<h6>Item Total: ${Invoice.totalDue}</h6>
									<button type="button" className="btn btn-default btn-sm btn-addon" onClick={() => setState({paymentFormShow: false})}><FontAwesomeIcon icon="times" />
										{Invoice.dateInvoicePaid === null && <Translate id="Cancel"/>}
										{Invoice.dateInvoicePaid !== null && <Translate id="Close"/>}
									</button>
								</div>
							</div>
						}
						{state.addAdjustmentFormShow === true &&
							<div className="border p-3">
								<div className="form-row">
									<div className="col-md-6">
									<label htmlFor="invoiceItemDescription"><Translate id="Adjustment Description for Crematory Use" />*</label><br />
										<Field className="form-control" name="invoiceItemDescription" onChange={(event) => handleSetState({'invoiceItemDescription': event.target.value})} aria-describedby="invoiceItemDescriptionHelp" />
										<small className="form-text text-muted" id="invoiceItemDescriptionHelp"><Translate id="Will appear on the Invoice" /></small>
									</div>
									<div className="col-md-6">
										<label htmlFor="invoiceItemDescriptionPrivate"><Translate id="Adjustment Description for Crematory Use (Private)" /></label><br />
										<Field className="form-control" name="invoiceItemDescriptionPrivate" onChange={(event) => handleSetState({'invoiceItemDescriptionPrivate': event.target.value})} aria-describedby="invoiceItemDescriptionPrivateHelp" />
										<small className="form-text text-muted" id="invoiceItemDescriptionPrivateHelp"><Translate id="Will NOT appear on the Invoice" /></small>
									</div>
								</div>
								<div className="form-row">
									<div className="col-md-auto">
										<label htmlFor="invoiceItemType"><Translate id="Adjustment Type" /></label>
										<Field component="select" showError={true} name="invoiceItemType" className="form-control" onChange={(event) => handleSetState({'invoiceItemType': event.target.value})} >
											<option value="Adjustment">{translate("Adjustment")}</option>
											<option value="Charity">{translate("Charity")}</option>
											<option value="Commission">{translate("Commission")}</option>
											<option value="Cremation">{translate("Cremation")}</option>
											<option value="Purchase">{translate("Purchase")}</option>
										</Field>
									</div>
									<div className="col-md-auto">
										<label htmlFor="petReferenceNumber"><Translate id="Reference" /> #*</label>
										<Field className="form-control form-control-num" name="petReferenceNumber" onChange={(event) => handleSetState({'petReferenceNumber': event.target.value})}  />
									</div>
									<div className="col-md-auto">
										<label htmlFor="invoiceCostSubtotal"><Translate id="Subtotal" />*</label>
										<div className="input-group">
											<div className="input-group-prepend">
												<div className="input-group-text">$</div>
											</div>
											<Field className="form-control form-control-num" name="invoiceCostSubtotal" onChange={(event) => handleAddAdjustmentOnChange('invoiceCostSubtotal', event.target.value)} />
										</div>
										<small className="form-text text-muted" id="invoiceCostSubtotalHelp">Can be negative</small>
									</div>
									<div className="col-md-auto">
										<label htmlFor="taxDue">Tax</label>
										<select className="form-control" name="taxDue" onChange={(event) => handleAddAdjustmentOnChange('taxDue', event.target.value)}>
											<option value={values.taxDue} >Include ${values.taxDue} Tax</option>
											<option value={0}>NO Tax</option>
										</select>
										<small className="form-text text-muted" id="taxDueHelp">$[invoiceCostSubtotal] * [accountTaxRate]% = $[taxDue]</small>
									</div>
								</div>
								<div className="mt-3">
									{/* invoiceCostTotal =  invoiceCostSubtotal + taxDue */}
									<h6>Item Total: ${values.invoiceCostTotal}</h6>
									<button type="button" className="btn btn-success btn-sm btn-addon" onClick={() => handleInvoiceItemAdjustmentSave()}><FontAwesomeIcon icon="check" /> <Translate id="Save"/> </button>
									<button type="button" className="btn btn-default btn-sm btn-addon ml-3" onClick={() => handleLocalAddAdjustmentClick()}><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/> </button>
								</div>
								{messageWarningAdjustmentForm !== '' &&
									<div className="alert alert-danger mt-3 mb-0"><Translate id={messageWarningAdjustmentForm} /></div>
								}

							</div>
						}
						{messageSuccess !== '' &&
							<div className="alert alert-success mt-3"><Translate id={messageSuccess} /></div>
						}
						{messageWarning !== '' &&
							<div className="alert alert-danger mt-3"><Translate id={messageWarning} /></div>
						}
					</div>
					<table className="table table-striped small">
						<thead>
							<tr>
								<th>Reference #</th>
								<th>Product / Cremation Type</th>
								<th>Subtotal</th>
								<th>Charity</th>
								<th>Tax</th>
								<th>Item Total</th>
								{/* Only allow Edit & Delete if this item has not been sent on an invoice yet */}
								{Invoice.dateInvoiceSent === null &&
									<React.Fragment>
										{invoicesPermissionLevel >= 3 && <th>Edit</th>}
										{invoicesPermissionLevel >= 4 && <th>Delete</th>}
									</React.Fragment>
								}
							</tr>
						</thead>
						<tbody>
							{Invoice.ItemsInvoice.length > 0 &&
								Invoice.ItemsInvoice.map((item) => {
									const charity = item.totalCharity === null ? '0.00' : item.totalCharity;
									const productName = item.accountProductName !== null && item.accountProductName !== '' ? item.accountProductName : item.productName;
									if(item.invoiceItemId === state.invoiceItemId && !(orderDetailsParent === true && item.orderId !== orderId)) {
										let originalCost = item.invoiceCostPersonalization !== null ? Math.add(item.invoiceCostPersonalization,item.invoiceCost) : item.invoiceCost;
										return (
											<React.Fragment key={item.invoiceItemId}>
												<tr>
													<td>
														{orderDetailsParent === false &&
															<span className="h6 m-0">
																{userTypeId === 5 && item.petReferenceNumber}
																{userTypeId !== 5 && <NavLink to={`/orders/orderId/${item.orderId}`} activeClassName="active">{item.petReferenceNumber}</NavLink>}
															</span>
														}
														{orderDetailsParent === true &&
															<span className="h6 m-0">Invoice {Invoice.invoiceId}</span>
														}
														<br />
														Item: {item.invoiceItemId} <span className="ml-3">Order: {item.orderId}</span>
													</td>
													<td>
														{item.orderProductId > 0 && <span className="h6 m-0">{productName} {parseInt(item.invoiceCostPersonalization) > 0 && <span className="small">(Personalized)</span>}</span>}
														{productName !== item.invoiceItemDescription && <div className="small m-0">{item.invoiceItemDescription}</div>}
														{(item.orderProductId === null || item.orderProductId === 0) && <React.Fragment><span className="h6 m-0">{item.invoiceItemDescription}</span><br />{item.invoiceItemType}</React.Fragment>}
														{!(item.familyFriendPet === 0 && item.servicePet === 0 && item.staffEmployeePet === 0) && <React.Fragment><br /></React.Fragment>}
														{item.familyFriendPet === 1 && <div className="badge badge-danger mr-1">Family / Friend Pet</div>}
														{item.servicePet === 1 && <div className="badge badge-danger mr-1">Service Pet</div>}
														{item.staffEmployeePet === 1 && <div className="badge badge-danger">Staff / Employee Pet</div>}
													</td>
													<td>
														<div className="input-group">
															<div className="input-group-prepend">
																<div className="input-group-text">$</div>
															</div>
															<Field className="form-control form-control-num" name="invoiceCostSubtotal" aria-describedby="invoiceCostSubtotalHelp" onChange={(event) => handleInvoiceItemOnChange('invoiceCostSubtotal', event.target.value)}  />
														</div>
														<small id="invoiceCostSubtotalHelp" className="form-text text-muted">Original Cost: ${originalCost}</small>
													</td>
													<td>
														<div className="input-group">
															<div className="input-group-prepend">
																<div className="input-group-text">$</div>
															</div>
															<Field className="form-control form-control-num" name="totalCharity" onChange={(event) => handleInvoiceItemOnChange('totalCharity', event.target.value)} />
														</div>
														<small id="totalCharityHelp" className="form-text text-muted">Reduces the Tax &amp; Item Total</small>
													</td>
													<td>${state.taxDue}</td>
													<td>${state.invoiceCostTotal}</td>
													{/* Only allow Edit & Delete if this item has not been sent on an invoice yet */}
													{Invoice.dateInvoiceSent === null &&
														<React.Fragment>
															{invoicesPermissionLevel >= 3 && <td><button type="button" className="btn btn-sm btn-success btn-addon" disabled={false} onClick={() => submitForm()}><FontAwesomeIcon icon="pen" /> <Translate id="Save"/></button></td>}
															{invoicesPermissionLevel >= 4 && <td><button type="button" className="btn btn-sm btn-default btn-addon" disabled={false} onClick={() => handleSetState({invoiceItemId: 0})}><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/></button></td>}
														</React.Fragment>
													}
												</tr>
												<tr></tr>
												<tr>
													<td colSpan="4">
														<label htmlFor="invoiceItemDescription"><Translate id="Adjustment Description for Crematory Use" /></label><br />
														<Field className="form-control" name="invoiceItemDescription" onChange={(event) => handleSetState({'invoiceItemDescription': event.target.value})} aria-describedby="invoiceItemDescriptionHelp" />
														<small className="form-text text-muted" id="invoiceItemDescriptionHelp"><Translate id="Will appear on the Invoice" /></small>
													</td>
													<td colSpan="4">
														<label htmlFor="invoiceItemDescriptionPrivate"><Translate id="Adjustment Description for Crematory Use (Private)" /></label><br />
														<Field className="form-control" name="invoiceItemDescriptionPrivate" onChange={(event) => handleSetState({'invoiceItemDescriptionPrivate': event.target.value})} aria-describedby="invoiceItemDescriptionPrivateHelp" />
														<small className="form-text text-muted" id="invoiceItemDescriptionPrivateHelp"><Translate id="Will NOT appear on the Invoice" /></small>
													</td>
												</tr>
											</React.Fragment>
										)
									} else if(item.invoiceItemId === state.invoiceItemIdDelete) {
										return (
											<tr key={item.invoiceItemId}>
												<td colSpan="6">
													<Field name="deletedReason" component="textarea" placeholder={`${props.translate("Reason for deleting invoice item")} ${item.invoiceItemDescription}`} showError={true} className={`form-control ${errors.deletedReason && touched.deletedReason && 'is-invalid'}`} />
												</td>
												<td><button type="button" className="btn btn-sm btn-danger btn-addon" disabled={false} onClick={() => handleInvoiceItemDeleteConfirmation(item.invoiceItemId)}><FontAwesomeIcon icon="trash-alt" /> <Translate id="Delete"/></button></td>
												<td><button type="button" className="btn btn-sm btn-default btn-addon" disabled={false} onClick={() => handleSetState({invoiceItemIdDelete: 0})}><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/></button></td>
											</tr>
										)
									} else if(!(orderDetailsParent === true && item.orderId !== orderId)) {
										const badgeClass = item.invoiceCostTotal > 0 ? 'badge badge-danger' : 'badge badge-success';
										const badgeText = item.invoiceCostTotal > 0 ? 'CHARGE' : 'CREDIT';
										const badgeTextClass = item.invoiceCostTotal > 0 ? 'text text-danger' : 'text text-success';
										//console.log("item", item);
										return (
											<tr key={item.invoiceItemId}>
												<td>
													{orderDetailsParent === false &&
														<span className="h6 m-0">
															{userTypeId === 5 && item.petReferenceNumber}
															{userTypeId !== 5 && <NavLink to={`/orders/orderId/${item.orderId}`} activeClassName="active">{item.petReferenceNumber}</NavLink>}
														</span>
													}
													{orderDetailsParent === true &&
														<span className="h6 m-0">Invoice {Invoice.invoiceId}</span>
													}
													<br />
													Item: {item.invoiceItemId} <span className="ml-3">Order: {item.orderId}</span>
												</td>
												<td>
													{item.orderProductId > 0 && <span className="h6 m-0">{productName} {parseInt(item.invoiceCostPersonalization) > 0 && <span className="small">(Personalized)</span>}</span>}
													{productName !== item.invoiceItemDescription && <div className="small m-0">{item.invoiceItemDescription}</div>}
													{(item.orderProductId === null || item.orderProductId === 0) && <React.Fragment><span className="h6 m-0">{item.invoiceItemDescription}</span><br />{item.invoiceItemType}</React.Fragment>}
													{!(item.familyFriendPet === 0 && item.servicePet === 0 && item.staffEmployeePet === 0) && <React.Fragment><br /></React.Fragment>}
													{item.familyFriendPet === 1 && <div className="badge badge-danger mr-1">Family / Friend Pet</div>}
													{item.servicePet === 1 && <div className="badge badge-danger mr-1">Service Pet</div>}
													{item.staffEmployeePet === 1 && <div className="badge badge-danger">Staff / Employee Pet</div>}
												</td>
												<td>${item.invoiceCostSubtotal}</td>
												<td>${charity}</td>
												<td>${item.taxDue}</td>
												<td>
													<div className={badgeTextClass}>${item.invoiceCostTotal}</div>
													<div className={badgeClass}>{badgeText}</div>
												</td>
												{/* Only allow Edit & Delete if this item has not been sent on an invoice yet */}
												{Invoice.dateInvoiceSent === null &&
													<React.Fragment>
														{invoicesPermissionLevel >= 3 && <td className="pl-0 pr-0"><button type="button" className="btn btn-sm btn-info btn-addon" disabled={false} onClick={() => handleInvoiceItemEdit(item.invoiceItemId)}><FontAwesomeIcon icon="pen" /> <Translate id="Edit"/></button></td>}
														{invoicesPermissionLevel >= 4 && <td className="pl-0 pr-0"><button type="button" className="btn btn-sm btn-danger btn-addon" disabled={false} onClick={() => handleInvoiceItemDelete(item.invoiceItemId)}><FontAwesomeIcon icon="trash-alt" /> <Translate id="Delete"/></button></td>}
													</React.Fragment>
												}
											</tr>
										)
									} else {
										return false;
									}
								})
							}
							{Invoice.ItemsInvoice.length === 0 &&
								<tr>
									<td className="alert alert-warning" colSpan="8">
										There are no invoice items
									</td>
								</tr>
							}
						</tbody>
					</table>
					{userTypeId !== 5 && Invoice && Invoice.companyName && orderDetailsParent === false &&
						<SaveAndSend Invoice={Invoice} initialValues={{emailedTo: Invoice.emailedTo, dateInvoice: Invoice.dateInvoice }}/>
					}
				</div>
			</div>
		</React.Fragment>
	);
};

const SaveAndSendContent = (props) => {
	const {
		dirty,
		disableGenerateButton=false,
		Invoice,
		invoiceSentMessage,
		isSubmitting,
		isValid,
		jobId,
		tooltipGenerateButton=''
	} = props;

	return (
		<div className="col-sm-auto mb-3">
			<Form>
				<div className="form-row">
					<div className="col-md-3">
						<label htmlFor="emailedTo">Email To *</label>
						<Field showError={true} className="form-control" name="emailedTo"/>
					</div>
					<div className="col-md-3">
						<label htmlFor="dateInvoice">Invoice Date (YYYY-MM-DD) *</label>
						<Field showError={true} className="form-control" name="dateInvoice" type="date"  />
					</div>
					<div className="col-md">
						<label>&nbsp;</label>
						<br />
						<button
							type="submit"
							className="btn btn-success btn-addon"
							disabled={ isSubmitting || (dirty === true && isValid === false) }
						>
							<FontAwesomeIcon icon="paper-plane" />
							<Translate id="Save &amp; Send Invoice"/>
						</button>
						{
							jobId > 0 &&
							<span className="ml-2">
								<PrintButton disableButton={disableGenerateButton} jobId={jobId} orderId={null} printableId={1} printableName="Invoice" tooltipGenerateButton={tooltipGenerateButton} />
							</span>
						}
						{
							Invoice.File &&
							isSubmitting === false &&
							jobId === 0 &&
							<FileDownloadLink
								className="btn btn-success btn-addon ml-2"
								File={Invoice.File}
								label={`Created: ${moment(Invoice.File.dateCreated).format("MMM DD, YYYY h:mm A")}`}
							/>
						}
					</div>
				</div>
			</Form>
			{invoiceSentMessage !== ''
				&&
				<div className="form-row mt-2">
					<div className="col-6 alert alert-success"><Translate id={invoiceSentMessage} /></div>
				</div>
			}
		</div>
	);
};

const SaveAndSend = compose(
	withMutation(InvoiceSaveAndSendMutation, "InvoiceSaveAndSend"),
	withState({ invoiceSentMessage: "", jobId: 0}),
	withFormik({
		handleSubmit: async (input, form) => {
			const {
				props: {
					Invoice: { invoiceId } ,
					setState,
					InvoiceSaveAndSend
				}
			} = form;

			const result = await InvoiceSaveAndSend({ input: { ...input, invoiceId, sendEmail: true }});

			if( result.data.invoiceSaveAndSend.Response.success === true && result.data.invoiceSaveAndSend.Invoice.jobId !== null) {
				setState({invoiceSentMessage: "The Invoice has been sent", jobId: result.data.invoiceSaveAndSend.Invoice.jobId});
			} else if( result.data.invoiceSaveAndSend.Response.success === true && result.data.invoiceSaveAndSend.Invoice.jobId === null && result.data.invoiceSaveAndSend.Invoice.fileId !== null) {
				setState({invoiceSentMessage: "The Invoice has been updated. Refresh the page to access the file.", jobId: 0, fileId: result.data.invoiceSaveAndSend.Invoice.fileId});
			}
		},
		validationSchema: () => Yup.object().shape({
			emailedTo: Yup.string().required("Email To is required"),
			dateInvoice: Yup.string().required("Invoice Date is required")
		})
	})
)(SaveAndSendContent);

const InvoiceDetailsForm = compose (
	withMutation(InvoiceItemDeleteMutation, "InvoiceItemDelete", ["getInvoice"]),
	withMutation(InvoiceItemSaveMutation, "InvoiceItemSave", ["getInvoice"]),
	withMutation(InvoiceSaveMutation, "InvoiceSave"),
	withFormik({
		handleSubmit: async ( input, { props: { handleSetState, InvoiceItemSave, setResponse, }} ) => {
			const { invoiceCostSubtotal, invoiceCostTotal, invoiceItemDescription, invoiceItemDescriptionPrivate, invoiceItemId, taxDue, totalCharity } = input;
			// Async/Await Perform the mutation (to the server) and decompose the result.
			const { data: { invoiceItemSave }} =  await InvoiceItemSave({ input: { invoiceCostSubtotal, invoiceCostTotal, invoiceItemDescription, invoiceItemDescriptionPrivate, invoiceItemId, taxDue, totalCharity } });

			// Close the inline form is save worked
			if(invoiceItemSave.Response.success === true) {
				handleSetState({invoiceItemId: 0});
			}
		}
	}),
	withState({messageSuccess: '', messageWarning: '', messageWarningAdjustmentForm: '', paymentFormShow: false}),
	withTranslate
)(InvoiceDetailsFormContent);

class InvoiceDetailsClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state= {
			addAdjustmentFormShow: false,
			emailedTo: (props.data.Invoice.emailedTo !== '' && props.data.Invoice.emailedTo !== null) ? props.data.Invoice.emailedTo : '',
			invoiceCostSubtotal: '',
			invoiceCostTotal: '',
			invoiceItemId: 0,
			invoiceItemDescription: '',
			invoiceItemDescriptionPrivate: '',
			invoiceItemIdDelete: 0,
			invoiceItemType: 'Adjustment',
			invoiceSentMessage: '',
			orderId: null,
			petReferenceNumber: '',
			taxDue: '',
			totalCharity: ''
		}
	}

	// Function for handling the 'Add an Adjustment' button, and the cancel button for that same form. Need to make sure that the inputs are cleared when the form is open and closed so variables do not carry over into other forms.
	handleAddAdjustmentClick = () => {
		const addAdjustmentFormShow = this.state.addAdjustmentFormShow === true ? false : true;
		// Reset the state variables when the form is open or closed.
		this.setState({
			addAdjustmentFormShow: addAdjustmentFormShow,
			invoiceCostSubtotal: '',
			invoiceCostTotal: '',
			invoiceItemId: 0,
			invoiceItemDescription: '',
			invoiceItemDescriptionPrivate: '',
			invoiceItemIdDelete: 0,
			invoiceItemType: 'Adjustment',
			invoiceSentMessage: '',
			petReferenceNumber: '',
			taxDue: '',
			totalCharity: ''
		});
	};

	// Function to update the taxDue and invoiceSubtotal inputs, and invoiceCostTotal output for the Add an Adjustment
	handleAddAdjustmentOnChange = (name,value) => {
		let invoiceCostTotal = this.state.invoiceCostTotal;
		let taxDue = this.state.taxDue;
		let taxRate = this.props.Account.Settings.find((setting) => setting.name === 'taxRate').value;
		let updateState = true;

		// check that the last character typed is not a number, do not update state if the entered value is similar to "-.0h", where they accidentally type a letter.
		const lastCharacter = value.substring(value.length-1)

		if(value === '-' || value === '-.' || value === '.' || value === '') {
			// do nothing, this would be the first key stroke of entering a negative number, and we do not want to execute the math functionality below until a number is added to this.
		} else if(isNaN(parseFloat(value)) || !isFinite(value)) {
			// if the value is not a valid number, do not update state
			updateState = false;
		} else if(isNaN(parseFloat(lastCharacter)) && !isFinite(lastCharacter) && lastCharacter !== '.') {
			updateState = false;
		} else {
			if(name === 'invoiceCostSubtotal') {
				// Get the new total for subTotal + charity
				let tempTotal = Math.subtract(value,this.state.totalCharity).toFixed(2);
				// If this product is taxable, get the taxDue
				taxDue = Math.multiply(tempTotal, taxRate).toFixed(2);
				// Add tax to subtotal
				invoiceCostTotal = Math.add(tempTotal, taxDue).toFixed(2);
			} else if(name === 'taxDue') {
				// This is only editable on the 'Add an Adjustment' form, where is it an all or nothing option. So the value will either be the already calculated taxDue in the state, or 0.
				// Get the new total for subTotal + taxDue
				invoiceCostTotal = Math.add(this.state.invoiceCostSubtotal,value).toFixed(2);
				taxDue = value;
			}
		}

		if(updateState) {
			// Update state variables, which rerenders the form with these variables for onChange updates
			this.setState({
				[name]: value,
				invoiceCostTotal: invoiceCostTotal,
				taxDue: taxDue
			})
		}
	};

	// Function to update the tax due and cost total outputs for an invoice item when the subtotal and charity are updated inline
	handleInvoiceItemOnChange = (name,value) => {
		let invoiceCostTotal = this.state.invoiceCostTotal;
		let taxDue = this.state.taxDue;
		let taxRate = this.props.Account.Settings.find((setting) => setting.name === 'taxRate').value;

		if(value === '-' || value === '-.' || value === '.') {
			// do nothing, this would be the first key stroke of entering a negative number, and we do not want to execute the math functionality below until a number is added to this.
		} else {
			if(name === 'invoiceCostSubtotal') {
				// Get the new total for subTotal + charity
				let tempTotal = Math.subtract(value,this.state.totalCharity).toFixed(2);
				// If this product is taxable, get the taxDue
				taxDue = Math.multiply(tempTotal, taxRate).toFixed(2);
				// Add tax to subtotal
				invoiceCostTotal = Math.add(tempTotal, taxDue).toFixed(2);
			} else if(name === 'totalCharity') {
				// Get the new total for subTotal + charity
				let tempTotal = Math.subtract(this.state.invoiceCostSubtotal,value).toFixed(2);
				// If this product is taxable, get the taxDue
				taxDue = Math.multiply(tempTotal, taxRate).toFixed(2);
				// Add tax to subtotal
				invoiceCostTotal = Math.add(tempTotal, taxDue).toFixed(2);
			}
		}

		// Update state variables, which rerenders the form with these variables for onChange updates
		this.setState({
			[name]: value,
			invoiceCostTotal: invoiceCostTotal,
			taxDue: taxDue
		})
	};

	handleInvoiceItemDelete = (invoiceItemId) => {
		// Reset all the other variables
		this.setState({
			addAdjustmentFormShow: false,
			invoiceCostSubtotal: '',
			invoiceCostTotal: '',
			invoiceItemId: 0,
			invoiceItemDescription: '',
			invoiceItemDescriptionPrivate: '',
			invoiceItemIdDelete: invoiceItemId,
			invoiceItemType: '',
			invoiceSentMessage: '',
			petReferenceNumber: '',
			taxDue: '',
			totalCharity: ''
		});

	};

	handleInvoiceItemEdit = (invoiceItemId) => {
		let InvoiceItem = {};
		if(this.props.ItemsInvoice === undefined) {
			InvoiceItem = this.props.data.Invoice.ItemsInvoice.find((item) => item.invoiceItemId === invoiceItemId);
		} else {
			InvoiceItem = this.props.ItemsInvoice.find((item) => item.invoiceItemId === invoiceItemId);
		}

		// Reset all of the other state variables
		this.setState({
			addAdjustmentFormShow: false,
			invoiceCostSubtotal: InvoiceItem.invoiceCostSubtotal,
			invoiceCostTotal: InvoiceItem.invoiceCostTotal,
			invoiceItemDescription: InvoiceItem.invoiceItemDescription,
			invoiceItemDescriptionPrivate: InvoiceItem.invoiceItemDescriptionPrivate,
			invoiceItemId: invoiceItemId,
			invoiceItemIdDelete: 0,
			invoiceItemType: '',
			invoiceSentMessage: '',
			petReferenceNumber: '',
			taxDue: InvoiceItem.taxDue,
			totalCharity: InvoiceItem.totalCharity === null ? '0.00' : InvoiceItem.totalCharity
		})
	};

	handleSetState = (valueObject) => {
		this.setState(valueObject)
	};

	render () {
		const { Invoice } = this.props.data;
		const { orderDetailsParent=false } = this.props;
		// NOTE: orderDetailsParent is true when this component is invoked from the order_details_component.js

		// Create an array of the petReferenceNumbers which are on this invoice to use for comparing the reference number they enter in an adjustment to make sure it matches an order.
		const PetReferenceNumbers = [];
		Invoice.ItemsInvoice.forEach((item) => {
			if(PetReferenceNumbers.find((number) => number === item.petReferenceNumber)) {
				// do nothing, the petReferenceNumber is already in the array
			} else {
				PetReferenceNumbers.push(item.petReferenceNumber);
			}
		});
		return (
			<React.Fragment>
				<InvoiceDetailsForm
					handleAddAdjustmentClick={this.handleAddAdjustmentClick}
					handleAddAdjustmentOnChange={this.handleAddAdjustmentOnChange}
					handleInvoiceItemDelete={this.handleInvoiceItemDelete}
					handleInvoiceItemEdit={this.handleInvoiceItemEdit}
					handleInvoiceItemOnChange={this.handleInvoiceItemOnChange}
					handleSetState={this.handleSetState}
					initialValues={{...this.state, cardName: '', dateInvoiceSent: ''}}
					Invoice={Invoice}
					invoicesPermissionLevel={this.props.Session.User.Permissions.find((Permission) => Permission.Permission.permission === "invoices").permissionLevel}
					orderDetailsParent={orderDetailsParent}
					orderId={this.props.orderId}
					PetReferenceNumbers={PetReferenceNumbers}
					state={this.state}
					userTypeId={parseInt(this.props.Session.User.userTypeId)}
				/>
			</React.Fragment>
		)
	}
}

export const InvoiceDetails = compose(
	withRouter,
	queryWithLoading({
		gqlString: getInvoiceQuery,
		variablesFunction: (props) => ({invoiceId: props.match.params.invoiceId ? props.match.params.invoiceId : '', orderId: parseInt(props.orderId) > 0 ? parseInt(props.orderId) : ''}),
	}),
	withTranslate
)(InvoiceDetailsClass)
