import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import React from 'react';
import { withRouter } from "react-router-dom";
import { withState } from "react-state-hoc";
import { withTranslate, Translate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	GenerateJobMutation,
	getJobQuery
} from '../jobs/jobs_graphql';

import {
	PrintableLogSaveMutation
} from './orders_graphql';

// PRINTABLES
/*
	If not printableOrder then give a button to generate a job, and then poll for the job completion until we get back the file, then open the file
	If printableOrder and caching allowed for that printable then show the link
	If printableOrder and NO caching then show the button to generate a job to generate a new file, poll for the job completion and then open the file

	getJobQuery - will return the Job if it exists, if it does not exist it will start a job and return that
		if we cant pass it a job then pass in a printableName and an orderId and it will generate the printable job and return that

		*/


// Show Print button - must poll for compelted jobId and then once completed get the associated file and then open that in a new tab to print
// This function needed to be turned into a Class in order to be able to do componentWillReceiveProps to know whether when the render is called it is the first time being called or not.
class PrintButtonClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			allowAutoOpenFile: true,
			calledFromGeneratePrint: props.calledFromGeneratePrint ? props.calledFromGeneratePrint : false,
			generatingButtonText: props.generatingButtonText && props.generatingButtonText !== '' ? props.generatingButtonText : 'Generating',
			jobStatus: props.data.Job.status
		}
	}
	
	componentWillReceiveProps(nextProps) {
		// Need to see if the jobStatus in state is currently "pending" and the nextProps is "completed". This only happens once, when the file is first generated. After that, we set allowAutoOpenFile=false because everyone time there is a state change in the parent component, the window.open was getting fired since the jobstatus was completed.
		const tempOpenFile = this.state.jobStatus === nextProps.data.Job.status ? false : true;
		this.setState({
			allowAutoOpenFile: tempOpenFile,
			jobStatus: nextProps.data.Job.status
		})
	}

	handleOnClickPrint = () => {
		// Log that the file was printed
		this.props.PrintableLogSave({input: { fileId: parseInt(this.props.data.Job.fileId), orderId: this.props.orderId, printableId: this.props.printableId }})
	}

	// async testJob(orderId, printableName) {
	// 		const { data: { generateJob: { Job }}} = await this.props.GenerateJob({ input: { orderId, printableName }})
	// 		console.log("await job: ", Job)
	// 		// Update state for jobStatus to trigger the polling function to start searching for the fileId
	// 		this.setState({ jobStatus: Job.status });
	// }

	// async handleGenerateJob(orderId, printableName) {
	// 	this.setState({ 
	// 		jobStatus: 'pending' 
	// 	}, () => {
	// 		this.testJob(orderId, printableName);
	// 	})
	// }


	render () {
		let Job = this.props.data.Job;
		// if we created a new job then stop polling - we'll show a new button below
		if(this.props.jobId == null && Job.jobId !== undefined) {
			this.props.data.stopPolling();
		}
		if(Job.status === "complete" || Job.status === "error") {
			this.props.data.stopPolling();
			if(Job.status === "complete" && this.state.allowAutoOpenFile === true) {
				window.open(Job.File.location, '_blank');
				// Log that the file was printed
				this.props.PrintableLogSave({input: { fileId: parseInt(Job.fileId), orderId: this.props.orderId, printableId: this.props.printableId }})
			}
		}
		return (
			<React.Fragment>
				{
					Job.status === "complete" && 
					<React.Fragment>
						<a className="btn btn-dark btn-sm btn-addon" rel="noopener noreferrer" target="_blank" href={Job.File.location} onClick={() => this.handleOnClickPrint()}><FontAwesomeIcon icon="print" /> <Translate id="Print" /></a>
						{/*
							this.props.printableName === "Order Tag" &&
							<button type="button"  onClick={() => this.handleGenerateJob(this.props.orderId, 'Order Tag')} className="btn btn-dark btn-sm ml-2 btn-addon" ><FontAwesomeIcon icon="print" /> <Translate id="Retry" /></button>
						*/}
					</React.Fragment>
				}
				{
					Job.status === "pending" && 
					<button className="btn btn-dark btn-sm disabled" type="button" disabled="disabled"><FontAwesomeIcon icon="spinner" spin /> <Translate id={this.state.generatingButtonText} /></button>
				}
				{
					Job.status === "error" && 
					<React.Fragment>
						<button className="btn btn-dark btn-sm disabled" type="button" disabled="disabled"><FontAwesomeIcon icon="times" /> <Translate id="File Failed" /></button>
						{/* {
							this.props.printableName === "Order Tag" &&
							this.state.calledFromGeneratePrint === false &&
							<div className="w-100 text-center mt-2">
								<a href={`/orders/orderId/${this.props.orderId}`} className="btn btn-info btn-small">Click Here To Retry Printing From Order Details Please</a>
							</div>
						}
						{
							this.props.printableName === "Order Tag" &&
							this.state.calledFromGeneratePrint === true &&
							<button type="button"  onClick={() => this.props.handleGenerateJob(this.props.orderId, 'Order Tag')} className="btn btn-dark btn-sm ml-2 btn-addon" ><FontAwesomeIcon icon="print" /> <Translate id="Retry" /></button>
						} */}
					</React.Fragment>
				}

				{
					this.props.jobId === null && Job.jobId !== undefined && 
					<React.Fragment>
						<PrintButton jobId={Job.jobId} orderId={this.props.orderId} orderIds={this.props.orderIds} printableId={this.props.printableId} printableName={this.props.printableName} />
					</React.Fragment>
				}
			</React.Fragment>
		);
	}
};

// NOTE: on mutation for printableLogSave, the getOrder refetch is for when printing from the order details in order to get the status of the printable updated to show that it has been printed without having to refresh the page.
export const PrintButton = compose(
	withRouter,
	withMutation(GenerateJobMutation, "GenerateJob"),
	withMutation(PrintableLogSaveMutation, "PrintableLogSave", ["getOrder"]),
	queryWithLoading({
		gqlString: getJobQuery,
		variablesFunction: (props) => ({jobId: props.jobId, orderId: props.orderId, orderProductId: props.orderProductId, printableName: props.printableName}),
		options: {
			fetchPolicy: 'network-only', // we don't want to get the response from the Apollo cache
			pollInterval: 10000 // 10 seconds in milliseconds
		}
	}),
	withState({
		jobStatus: '',
		oldJobStatus: ''
	}),
	withTranslate
)(PrintButtonClass)

const GeneratePrintButtonContent = (props) => {
	const {
		autoPrint,
		autoPrinted,
		deliveryLogId=0,
		disableButton=false,
		GenerateJob,
		invoiceId=0,
		jobId,
		jobStatus,
		orderId,
		orderIds,
		orderProductId=0,
		printableId,
		printableName,
		sendEmail,
		setState,
		tooltipGenerateButton=''
	} = props;

	async function handleGenerateJob(autoPrinted, deliveryLogId, invoiceId, jobId, orderId, orderIds, orderProductId, printableName, sendEmail) {
		const { data: { generateJob: { Job }}} = await GenerateJob({ input: { deliveryLogId, invoiceId, jobId, orderId, orderIds, orderProductId, printableName, sendEmail }})
		// Update state for jobStatus to trigger the polling function to start searching for the fileId
		setState({autoPrinted, jobId: Job.jobId, jobStatus: 'pending', printableId: Job.printableId});
	}

	// This is coming from the Order Details when a printable is checked and then the 'Print Selected' button is clicked, the state of that component updates with an 'autoPrint' variable,
	// that when true passes 'autoPrint: true' to this child component and causes the printable to execute the job creation process as if the Print button were clicked below
	if(autoPrint === true && autoPrinted === false) {
		handleGenerateJob(true, deliveryLogId, invoiceId, jobId, orderId, orderIds, orderProductId, printableName, sendEmail)
	}

	// If the initial "Print" button has not been clicked, then show the 'Generate' button that will generate the job to create the file.
	if(jobStatus === '') {
		return (
			<button type="button" disabled={disableButton} onClick={() => handleGenerateJob(false, deliveryLogId, invoiceId, jobId, orderId, orderIds, orderProductId, printableName, sendEmail)} className="btn btn-dark btn-sm btn-addon" title={tooltipGenerateButton}><FontAwesomeIcon icon="print" /> <Translate id="Print" /></button>
		)
	} else {
		// Initiate the function to start polling, and show an updated button based on job status
		return (
			<React.Fragment>
				<PrintButton 
					calledFromGeneratePrint={true}
					jobId={jobId} 
					orderId={orderId} 
					orderIds={orderIds} 
					orderProductId={orderProductId} 
					printableId={printableId} 
					printableName={printableName} 
					handleGenerateJob={handleGenerateJob.bind(this)}
				/>
			</React.Fragment>
		);
	}
};

export const GeneratePrintButton = compose (
	withMutation(GenerateJobMutation, "GenerateJob"),
	withState({
		autoPrinted: false,
		jobStatus: '',
		printableId: 0
	}),
	withTranslate
)(GeneratePrintButtonContent);
