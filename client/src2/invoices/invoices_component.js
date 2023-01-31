import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import React from 'react';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import withState from "react-state-hoc";
import { withTranslate, Translate } from '../translations/IWDTranslation';

// import { withState } from "react-state-hoc";

import { InvoiceCreate } from './invoice_create_component';
import { InvoiceDetails } from './invoice_details_component';
import { InvoiceListClass } from './invoice_list_component';

import {
	getInvoicesQuery,
	InvoiceGenerateAllMutation
} from './invoices_graphql';

const InvoiceGenerateAllFormContent = (props) => {
	const {
		InvoiceGenerateAll,
		setState,
		showGenerateAllSuccess,
		submittingGenerateAll,
		values
	 } = props;

	 // Took this functionality out of withFormik's handSubmit because we need to be able to setState to disable the Generate All button while the invoices are getting created.
	async function handleOnSubmit() {
		// Update submitting state variable first to disable the Generate All Invoices button
		setState({submittingGenerateAll: true})

		let tempInput = {}
		// Only send the dateEnd and dateStart values if they are not blank
		if(values.dateEnd !== '' && values.dateEnd !== undefined) {
			tempInput.dateEnd = values.dateEnd;
		}
		if(values.dateStart !== '' && values.dateStart !== undefined) {
			tempInput.dateStart = values.dateStart;
		}

		const { data: { invoiceGenerateAll: { Response }}} = await InvoiceGenerateAll({ input: tempInput });

		// Once the generate all functionality is complete, set submitting back to false to enable the Generate All Invoices button again.
		if(Response) {
			setState({showGenerateAllSuccess: true, submittingGenerateAll: false})
		}
	}

	return (
		<Form>
			<div className="row mb-3">
				{showGenerateAllSuccess === false &&
					<div className="col-12 mb-2">
						<div className="alert alert-danger mb-0">
							Generate All Invoices will immediately send out invoices to customers.
						</div>
					</div>
				}
				<div className="col-12 form-row">
					<div className="col-md-auto">From <Field type="date" name="dateStart" className="form-control" /></div>
					<div className="col-md-auto">To <Field type="date" name="dateEnd" className="form-control" /></div>
					<div className="col-md-auto"><button type="button" disabled={submittingGenerateAll} onClick={() => handleOnSubmit()} className="btn btn-success mt-4">Generate All Invoices For Range</button></div>
					<div className="col-md-auto p-0 text-right">
						{/* DO NOT MAKE THIS A "LINK" - the state of that component is getting cached when using "LINK"*/}
						<a href={`/invoices/invoice_create`} className="btn btn-info btn-addon mt-4"><FontAwesomeIcon icon="plus" /> <Translate id="Create Single Company Invoice"/> </a>
					</div>
				</div>
			</div>
			{showGenerateAllSuccess === true &&
				<div className="row ml-0">
					<div className="col-auto alert alert-success">
						Invoices successfully generated.
						<a href={`/invoices`} className="btn btn-info btn-addon ml-3"><FontAwesomeIcon icon="plus" /> <Translate id="Create PDFs of All New Invoices"/> </a>
					</div>
				</div>
			}
		</Form>
	)
}

const InvoiceGenerateAllForm = compose (
	withMutation(InvoiceGenerateAllMutation, "InvoiceGenerateAll", ["getInvoices"]),
	withFormik(),
	withState({
		showGenerateAllSuccess: false,
		submittingGenerateAll: false
	}),
	withTranslate
)(InvoiceGenerateAllFormContent);

class InvoicesClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			dateFrom: '',
			dateTo: '',
			view: props.match.params.invoiceId ? 'invoiceDetails' : 'invoiceList'
		}
	}

	handleDateChange = (value, name) => {
		this.setState({[name]: value})
	}

	handleGenerateAll = () => {

	 }

 	handleViewChange = (view) => {
		this.setState({ view })
	};

	render () {
		const { Invoices } = this.props.data;

		if(this.state.view === 'invoiceList') {
			return (
				<div className="w-100 p-1">
					<div className="card p-3">
						{(parseInt(this.props.Session.User.userTypeId) === 2 || parseInt(this.props.Session.User.userTypeId) === 3) &&
							<InvoiceGenerateAllForm
								initialValues={{
									dateEnd: '',
									dateStart: ''
								}}
							/>
						}
						<InvoiceListClass
							handleViewChange={this.handleViewChange}
							Invoices={Invoices}
							invoicesPermissionLevel={this.props.Session.User.Permissions.find((Permission) => Permission.Permission.permission === "invoices").permissionLevel}
							userTypeId={this.props.Session.User.userTypeId}
						/>
					</div>
				</div>
			)
		} else if(this.state.view === 'invoiceCreate') {
			return (
				<InvoiceCreate
					handleViewChange={this.handleViewChange}
					invoicesPermissionLevel={this.props.Session.User.Permissions.find((Permission) => Permission.Permission.permission === "invoices").permissionLevel}
					userTypeId={this.props.Session.User.userTypeId}
				/>
			)
		} else if(this.state.view === 'invoiceDetails') {
			return (
				<InvoiceDetails
					handleViewChange={this.handleViewChange}
				/>
			)
		}
	}
}

export const Invoices = compose(
	withRouter,
	queryWithLoading({
		gqlString: getInvoicesQuery,
		requiredPermission: { permission: "invoices", permissionLevel: 1},
		options: {
			fetchPolicy: 'network-only'
		}
	}),
	withTranslate
)(InvoicesClass);
