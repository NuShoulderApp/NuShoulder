import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from "react-router-dom";
import moment from 'moment';
import React from 'react';

import { FileDownloadLink } from "../files/FileDownloadLink";
import { IWDPaginator } from '../layouts/pagination';
import { Translate } from '../translations/IWDTranslation';
import { withMutation } from '../utilities/IWDDb';
import { withFormik } from "../utilities/IWDFormik";
import { withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	InvoiceSaveMutation
} from './invoices_graphql';

const InvoiceListFormContent = (props) => {
	const {
        Invoices,
		invoicesPermissionLevel,
		userTypeId
	} = props;

	return (
		<React.Fragment>
			{/* DON'T NEED PAGING HERE */}
			<IWDPaginator
				list={Invoices}
				listName={'InvoiceList'}
				render={({InvoiceList}) => {
					return (
						<table className="table table-striped small">
							<thead>
								<tr>
									<th>Invoice Date</th>
									{(userTypeId === 2 || userTypeId === 3) && <th>Hospital</th>}
									<th>Invoice #</th>
									<th>Date Sent</th>
									<th>Subtotal</th>
									<th>Taxes</th>
									<th>Total</th>
									{invoicesPermissionLevel === 1 && <th>View Details</th>}
									{invoicesPermissionLevel >= 3 && <th>Edit</th>}
									<th>Download</th>
								</tr>
							</thead>
							<tbody>
								{Invoices.length > 0 &&
									Invoices.map((invoice) => {
										const dateInvoiceSent = invoice.dateInvoiceSent !== null ? moment(invoice.dateInvoiceSent).format('MM-DD-YYYY') : '';
										//const dateInvoiceDue = invoice.dateInvoiceDue !== null ? moment(invoice.dateInvoiceDue).format('MM-DD-YYYY') : '';
										//const dateInvoicePaid = invoice.dateInvoicePaid !== null ? moment(invoice.dateInvoicePaid).format('MM-DD-YYYY') : '';
										const dateInvoiceCreated = invoice.dateCreated !== null ? moment(invoice.dateCreated).format('MM-DD-YYYY') : '';
										const subtotalDue = invoice.totalDue - invoice.taxDue;

										const invoiceLabel = invoice.File && invoice.File.mimeType && invoice.File.mimeType === 'text/csv' ? 'Invoice Excel' : 'Invoice PDF';
										
										return (
											<tr key={invoice.invoiceId}>
												<td>{dateInvoiceCreated}</td>
												{(userTypeId === 2 || userTypeId === 3) && <td>{invoice.companyName}</td>}
												<td>{invoice.invoiceId}</td>
												<td>{dateInvoiceSent}</td>
												<td>{subtotalDue.toFixed(2)}</td>
												<td>{invoice.taxDue !== null && '$'}{parseFloat(invoice.taxDue).toFixed(2)}</td>
												<td>{invoice.totalDue !== null && '$'}{invoice.totalDue}</td>
												{invoicesPermissionLevel === 1 && <td><Link to={`/invoices/invoice_details/${invoice.invoiceId}`} className="btn btn-info"><Translate id="Details"/> </Link></td>}
												{invoicesPermissionLevel >= 3 && <td><Link to={`/invoices/invoice_details/${invoice.invoiceId}`} className="btn btn-info btn-addon"><FontAwesomeIcon icon="pen" /> <Translate id="Details"/> </Link></td>}
												<td>
													{invoice.File !== null &&
														<FileDownloadLink
															className="btn btn-success btn-addon"
															File={invoice.File}
															label={invoiceLabel}
														/>
													}
													{/*<GeneratePrintButton disableButton={false} jobId={null} orderId={null} invoiceId={invoice.invoiceId} printableName="Invoice" sendEmail={false} tooltipGenerateButton="" />*/}
												</td>
											</tr>
										)
									})
								}
							</tbody>
						</table>
					)
				}}>
			</IWDPaginator>
		</React.Fragment>
	);
};



const InvoiceListForm = compose (
	withMutation(InvoiceSaveMutation, "InvoiceSave"),
	withFormik({
		handleSubmit: async ( input, { props: { InvoiceSave, setResponse, }} ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			await InvoiceSave({ input });
		}
	}),
	withTranslate
)(InvoiceListFormContent);

export class InvoiceListClass extends React.Component {
	render () {
		const { Invoices, invoicesPermissionLevel, userTypeId } = this.props;
		return (
			<React.Fragment>
				<InvoiceListForm
					initialValues={this.state}
					Invoices={Invoices}
					invoicesPermissionLevel={invoicesPermissionLevel}
					userTypeId={parseInt(userTypeId)}
				/>
			</React.Fragment>
		)
	}
}

// const InvoiceListCompose = compose(
// 	withRouter,
// 	withTranslate
// )(InvoiceListClass);
//
// export const InvoiceList = graphql(GetInvoices, {
// 	props: ({data}) => ({
// 		Invoices: (data.Invoices) ? (data.Invoices.invoices || []) : [],
// 		fetchMore: () => {
// 			if (data.fetchMore) {
// 				//console.log("Fetching more: ", {data, cursor: data.Invoices.cursor})
// 				let cursor_obj = (data.Invoices) ? (data.Invoices.cursor || {}) : {};
// 				let cursor = _.pick(cursor_obj, ['after']);
// 				return data.fetchMore({
// 					variables: { cursor },
//
// 					updateQuery: (prev, { fetchMoreResult }) => ({
// 						...prev,
// 						Invoices: {
// 							...prev.Invoices,
// 							invoices: [...prev.Invoices.invoices, ...fetchMoreResult.Invoices.invoices],
// 							cursor: fetchMoreResult.Invoices.cursor
// 						}
// 					})
// 				})
// 			}
// 		}
// 	})
// })(InvoiceListCompose)
