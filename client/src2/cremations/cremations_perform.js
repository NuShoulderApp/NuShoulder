import _ from 'lodash';
import React from 'react';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withState } from "react-state-hoc";
import { withRouter } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compose } from "react-apollo";
import moment from 'moment';
import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import { getCremationLogQuery, getCremationLogsQuery, CremationLogSaveMutation, CremationSaveMutation, CremationEndMutation, CremationStartMutation, CremationCancelLogMutation } from './cremations_graphql';


// OUTPUT CREMATION LIST
// output either a cremation entry or a blank spot for a cremation to happen in a machine  onClick={() => cremationSave(Cremation.cremationId)}
const CremationLogEntryContent = (props) => {

	if(props.CremationLog.Cremations !== undefined) {
		var Cremation = props.CremationLog.Cremations.find(function(cremation) {
			return cremation.machineRow === (props.currentRow + 1) && cremation.machineColumn === (props.column + 1) && cremation.dateCremationEnd === null;
		});
	}

	let cremationLogClosed = (props.CremationLog.dateCremationLogStart !== undefined && props.CremationLog.dateCremationLogEnd !== null);
	let cremationLogOpen = (props.CremationLog.dateCremationLogStart !== undefined && props.CremationLog.dateCremationLogEnd === null);

	if(Cremation === undefined || Cremation === null) {
		// return an empty slot as a placeholder
		return (
			<div className="card border bg-light">
				<div className="card-body">
					<div className="display-3 text-muted  pt-4 pb-4"><FontAwesomeIcon icon="inbox" /></div>
				</div>
				<div className="card-footer"><button className="btn btn-secondary btn-sm btn-addon disabled"><FontAwesomeIcon icon="times" /> <Translate id="EMPTY"/> </button></div>
			</div>
		)
	} else {
		// show a cremation entry
		let cremationClosed = (Cremation.dateCremationStart !== null && Cremation.dateCremationEnd !== null);
		let cremationOpen = (Cremation.dateCremationStart !== null && Cremation.dateCremationEnd === null);

		let cardHeaderClass = "";
		// NOT STARTED
		if(!cremationOpen && !cremationClosed) {
			cardHeaderClass = "card-header h4 bg-success text-light";
		}
		// OPENED / STARTED
		if(cremationOpen && !cremationClosed) {
			cardHeaderClass = "card-header h4 bg-danger text-light";
		}
		// CLOSED / COMPLETED
		if(cremationOpen && cremationClosed) {
			cardHeaderClass = "card-header h4 bg-secondary text-light";
		}

		return (
			<div className="card border border-dark bg-light">
				<div className={cardHeaderClass}>{Cremation.petReferenceNumber}</div>
				<div className="card-body">
					<h5 className="card-title">{Cremation.Order.petFirstName} {Cremation.Order.petLastName}</h5>
					<p className="card-text">{Cremation.Order.species} ({Cremation.Order.petBreed}, {Cremation.Order.sex})
						<br />{Cremation.petWeight} {Cremation.petWeightUnits}
					</p>
				</div>
				<div className="card-footer">
					{props.CremationLog.cremationType !== "Communal" && cremationLogOpen && !cremationOpen && !cremationClosed && <React.Fragment>
						<button className="btn btn-success btn-sm btn-addon" onClick={() => props.CremationStartMutation({ input: {cremationId: Cremation.cremationId} }) }><FontAwesomeIcon icon="arrow-right" /> <Translate id="START"/> </button> 
						<button type="button" className="btn btn-default btn-sm btn-addon ml-3" onClick={() => props.CremationCancelLogMutation({ cremationId: Cremation.cremationId })}><FontAwesomeIcon icon="times" /> <Translate id="CANCEL" /></button>
					</React.Fragment>}
					{props.CremationLog.cremationType !== "Communal" && cremationLogOpen && cremationOpen && !cremationClosed && <button className="btn btn-danger btn-sm btn-addon" onClick={() => props.CremationEndMutation({ input: {cremationId: Cremation.cremationId} }) }><FontAwesomeIcon icon="check" /> <Translate id="END"/> </button>}
					{props.CremationLog.cremationType === "Communal" && cremationLogOpen && cremationOpen && !cremationClosed && <button className="btn btn-secondary btn-sm btn-addon disabled" disabled="disabled"><FontAwesomeIcon icon="check" /> <Translate id="STARTED"/> </button>}
					{(cremationLogClosed || cremationClosed) && <button disabled="disabled" className="btn btn-secondary btn-sm btn-addon"><FontAwesomeIcon icon="check" /> <Translate id="DONE"/> </button>}
				</div>
			</div>
		)
	}
};

// COMPOSE CremationLogEntry with mutations for Start and End Cremation buttons
const CremationLogEntry = compose (
	withMutation(CremationEndMutation, "CremationEndMutation"),
	withMutation(CremationStartMutation, "CremationStartMutation"),
	withMutation(CremationCancelLogMutation, "CremationCancelLogMutation", [{query: getCremationLogsQuery}]),
)(CremationLogEntryContent);

// outputs a row in the cremation log
const CremationLogRow = (props) => {
	return (
		<React.Fragment>
			{_.times(props.columns, i =>
				<CremationLogEntry CremationLog={props.CremationLog} currentRow={props.currentRow} column={i} key={i} />
			)}
		</React.Fragment>
	)
}

// outputs a grid using one or more CremationLogRow which contains one or more CremationLogEntry
const CremationLogGrid = (props) => {
	return (
		<React.Fragment>
			{_.times(props.CremationLog.Machine.rows, i =>
				<div className="card-group text-center" key={i}>
					<CremationLogRow CremationLog={props.CremationLog} currentRow={i} columns={props.CremationLog.Machine.columns} />
				</div>
			)}
		</React.Fragment>
	)
}
// END OUTPUT CREMATION GRID

// SHOW COMPLETED CREMATIONS IN A TABLE
const CremationLogTable = (props) => {
	// filter the cremations to only include ended cremations
	let Cremations = {};
	if(props.CremationLog.Cremations !== undefined) {
		Cremations = props.CremationLog.Cremations.filter((cremation) => cremation.dateCremationEnd !== null);
	}

	let totalWeight = 0;
	let weightUnits = "";
	return (
		<React.Fragment>
			<div className="card">
				<table className="table table-striped">
					<thead>
						<tr>
							<th>Reference Number</th>
							<th>Name</th>
							<th>Species</th>
							<th>Breed</th>
							<th>Color</th>
							<th>Weight</th>
							<th>Started</th>
							<th>Completed</th>
						</tr>
					</thead>
					<tbody>
						{props.CremationLog.Cremations !== undefined && Cremations.map((cremation) => {
								totalWeight = totalWeight + Number(cremation.Order.weight);
								weightUnits = cremation.Order.weightUnits;

								return (
									<tr key={cremation.cremationId}>
										<td>{cremation.petReferenceNumber}</td>
										<td>{cremation.Order.petFirstName} {cremation.Order.petLastName}</td>
										<td>{cremation.Order.species}</td>
										<td>{cremation.Order.petBreed}</td>
										<td>{cremation.Order.petColor}</td>
										<td>{cremation.Order.weight} {cremation.Order.weightUnits}</td>
										<td>{moment(cremation.dateCremationStart).format('MMM DD, YYYY h:mm A')} {cremation.UserStart !== undefined && cremation.UserStart !== null && <span>by {cremation.UserStart.firstName} {cremation.UserStart.lastName}</span>}</td>
										<td>{moment(cremation.dateCremationEnd).format('MMM DD, YYYY h:mm A')}{cremation.cremationEndScheduledMinutes > 0 && ` (+${cremation.cremationEndScheduledMinutes}m)`} {cremation.UserEnd !== undefined && cremation.UserEnd !== null && <span>by {cremation.UserEnd.firstName} {cremation.UserEnd.lastName}</span>}</td>
									</tr>
								)
							}
						)}
						{props.CremationLog.Cremations !== undefined && <tr>
							<td colSpan="5" className="text-right h5 pt-3"><Translate id="TOTAL" /></td>
							<td className="h3">{totalWeight} {weightUnits}</td>
							<td colSpan="2">&nbsp;</td>
						</tr>}
						{props.CremationLog.Cremations === undefined && <tr>
							<td colSpan="8">There are no Completed Cremations on this Log</td>
						</tr>}
					</tbody>
				</table>
			</div>
		</React.Fragment>
	)
}


// FORM TO ADD CREMATIONS TO THE CREMATION LOG <CremationLogForm CremationLog={CremationLog} />
const CremationSaveFormContent = (props) => {
	const {
		errors,
		petReferenceNumber,
		Response,
		setState,
		touched,
		values
	} = props;

	values.petReferenceNumber = petReferenceNumber;

	let responseAlertClass = Response && Response.success === false ? 'alert-danger' : 'alert-success';
	const multipleErrors = Response && Response.message.includes("|") ? true : false;

	let errorsArray = [];
	if(multipleErrors) {
		errorsArray = Response.message.split("|");
	}
	return (
		<React.Fragment>
			<Form className="form-inline mt-3 border-top pt-3">
				<label><Translate id="Enter / Scan Reference #" /></label>
				<input type="text" name="petReferenceNumber" value={petReferenceNumber} className={`form-control ml-3 ${errors.petReferenceNumber && touched.petReferenceNumber && 'is-invalid'}`} onChange={(props) => setState({"petReferenceNumber": props.target.value.trim()}) } />
				<button type="submit" className="btn btn-success btn-addon"><FontAwesomeIcon icon="plus" /> <Translate id="Add Pet"/> </button>
			</Form>
			{ Response && (petReferenceNumber !== null && petReferenceNumber !== "") &&
				<div className={`mt-3 mb-0 alert ${responseAlertClass}`}>
					{Response.success === true &&
						<React.Fragment>{props.translate(Response.message)}</React.Fragment>
					}
					{multipleErrors === false && Response.success === false &&
						<React.Fragment>Cremation NOT Created. {props.translate(Response.message)}</React.Fragment>
					}
					{multipleErrors === true && Response.success === false &&
						<React.Fragment>
							<div>Cremation NOT Created. Please correct the following errors:</div>
							{errorsArray.map((e) => {
								return <div>- {e}</div>
							})}
						</React.Fragment>
					}
				</div>
			}
		</React.Fragment>
	);
}
// Define the handlers for the form above - for adding cremations to the cremation log
const CremationSaveContent = compose (
	withState(({initialValues: {cremationLogId, petReferenceNumber}}) => ({cremationLogId, petReferenceNumber})),
	withMutation(CremationSaveMutation, "CremationSaveMutation"),
	withFormik({
		handleSubmit: async ( input, { props: { CremationSaveMutation, setResponse, handleSetState}, resetForm} ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			const { data: { CremationSave }} = await CremationSaveMutation({ input });

			setResponse(CremationSave.Response);

			if(CremationSave.Response.success === true) {
				resetForm();

				handleSetState({"petReferenceNumber": ""})
			}
		},
		validationSchema: () => Yup.object().shape({
			petReferenceNumber: Yup.string().required("Enter a Reference Number")
	   })
	}),
	withTranslate
)(CremationSaveFormContent);
class CremationSaveFormClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			petReferenceNumber: ''
		}
	}
	handleSetState = (valueObject) => {
		this.setState(valueObject)
	};

	render () {
		const CremationLog = this.props.data.CremationLog || { cremationLogId: 0, cremationType: "", machineId: 0, Machine: {} }; // if we don't get back a cremation log then setup an empty one to use

		return (
			<React.Fragment>
				<CremationSaveContent
					CremationLog={CremationLog}
					initialValues={{cremationLogId: CremationLog.cremationLogId, petReferenceNumber: this.state.petReferenceNumber}}
					handleSetState={this.handleSetState}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}
const CremationSaveForm = compose(
	withRouter,
	queryWithLoading({
        gqlString: getCremationLogQuery,
        variablesFunction: (props) => ({cremationLogId: props.match.params.cremationLogId ? props.match.params.cremationLogId : ''})
    }),
	withTranslate
)(CremationSaveFormClass);




// define the form to use with the handlers below
const CremationOrdersPerformFormContent = (props) => {
	const {
		CremationLog,
		cremationType,
		errors,
		isSubmitting,
		machineId,
		Machines,
		setState,
		touched,
		values
	} = props;

	values.cremationType = cremationType;
	values.machineId = machineId;

	// if a machineId is already specified then set which creamtion options are enabled, else disable them all until they choose the machine
	const SelectedMachine = Machines.find((machine) => {
		return machine.machineId === machineId;
	}) || {}
	let doCommunal = SelectedMachine.doCommunal;
	let doIndividual = SelectedMachine.doIndividual;
	let doPrivate = SelectedMachine.doPrivate;

	let cremationLogClosed = (CremationLog.dateCremationLogStart !== null && CremationLog.dateCremationLogEnd !== null) && CremationLog.dateCremationLogStart !== undefined;
	let cremationLogOpen = (CremationLog.dateCremationLogStart !== null && CremationLog.dateCremationLogEnd === null) && CremationLog.dateCremationLogStart !== undefined;

	// CHECK IF WE CAN STILL ADD PETS TO AN OPEN LOG
	let allowCremationAdd = true;
	if(cremationLogOpen) {
		let openCremations = CremationLog.Cremations.filter((cremation) => { return cremation.dateCremationEnd === null });
		let totalSpots = SelectedMachine.rows * SelectedMachine.columns; // should always be at least one row and one column in any machine

		// IF Communal - allow as many pets to be added as we like, ignore rows, columns, etc. for communal - no need to change from the default - make sure there is at least one open spot at all times
		if(cremationType === "Communal") {
			CremationLog.Machine.columns = 5;
			totalSpots = 5;
			if(openCremations.length >= totalSpots) {
				CremationLog.Machine.rows = Math.floor(openCremations.length / 5) + 1;
			}
		}
		// IF Individual - check if we have an open spot
		// allow as many pets as theyere are rows and columns, multi-chamber or not just use that count
		if(cremationType === "Individual") {
			if(openCremations.length >= totalSpots) {
				allowCremationAdd = false; // don't allow adding any more creamtions, machine is full
			}
		}
		// IF Private - check if we have an open spot
		// if it is multi chamber then allow for multiple private cremations, one in each chamber, counted by rows and columns of the machine, if NOT multi chamber then just one pet at a time is allowed
		if(cremationType === "Private") {
			if(SelectedMachine.isMultiChamber === 0 && openCremations.length > 0) {
				allowCremationAdd = false;
			} else if (SelectedMachine.isMultiChamber === 1 && openCremations.length >= totalSpots) {
				allowCremationAdd = false;
			}
		}
	} else {
		allowCremationAdd = false;
	}

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				{/* SELECT THE MACHINE TO USE & THE CREMATION TYPE TO PERFORM */}
				<div className="border bg-light p-3 mt-3 mb-3">
					<Form className="row">
						<div className="col-md-auto">
							<Field component="select" value={machineId} disabled={cremationLogClosed || cremationLogOpen} name="machineId" className={`form-control ${errors.machineId && touched.machineId && 'is-invalid'}`} onChange={(props) => setState({"machineId": props.target.value}) }>
                            {/* This render to Static Markup is required because options don't like React children as the label */}
                                <option value="">{props.translate('Select a Machine')}</option>
                                {Machines.map((machine) => {
										// disable the option if there is a cremation log active for that machine already
										let disableOption = false;
										let optionText = machine.machineName
										if(machine.cremationLogId !== null) {
											disableOption = true;
											optionText = `${machine.machineName} - Log #${machine.cremationLogId} Open`;
										}
										return <option disabled={disableOption} value={machine.machineId} key={machine.machineId}>{optionText}</option>
                                    }
                                )}
                        	</Field>
						</div>

						{/* CHECK OFF THE CREMATION TYPE FROM THE TYPES ALLOWED FOR THIS MACHINE - Communal, Individual, Private */}
						<div className="col-md-auto">
							<Field component="select" value={cremationType} disabled={cremationLogClosed || cremationLogOpen} name="cremationType" className={`form-control ${errors.cremationType && touched.cremationType && 'is-invalid'}`}  onChange={(props) => setState({"cremationType": props.target.value}) }>
                            {/* This render to Static Markup is required because options don't like React children as the label */}
                                <option value="">{props.translate('Select a Cremation Type')}</option>
                                {doCommunal && <option value="Communal" key="Communal">Communal</option>}
								{doIndividual && <option value="Individual" key="Individual">Individual</option>}
								{doPrivate && <option value="Private" key="Private">Private</option>}
                        	</Field>
						</div>
						<div className="col-md-auto">
							{/* SHOW THE LOG STATUS FOR THIS MACHINE - BUTTON TO EITHER START A NEW LOG OR END THE CURRENT ONE IN PROGRESS */}
							{CremationLog.dateCremationLogStart === undefined && <button type="submit" className="btn btn-success btn-addon" disabled={isSubmitting}><FontAwesomeIcon icon="plus" /> <Translate id="Start Cremation Log"/> </button>}
							{cremationLogOpen && <button type="submit" className="btn btn-danger btn-addon" disabled={isSubmitting}><FontAwesomeIcon icon="check" /> <Translate id="Close Cremation Log"/> </button>}
							{cremationLogClosed && <button disabled className="btn btn-secondary btn-addon"><FontAwesomeIcon icon="check" /> <Translate id="Cremation Log Closed"/> </button>}
						</div>
					</Form>
					{cremationLogOpen && <div className="mt-3 h4 alert alert-danger">Log #{CremationLog.cremationLogId} in Progress</div>}
					{cremationLogClosed && <div className="mt-3 h4 alert alert-success">Log #{CremationLog.cremationLogId} Closed on {moment(CremationLog.dateCremationLogEnd).format('MMM DD, YYYY h:mm A')}</div>}

					{/* IF LOG IS STARTED - FORM TO ENTER OR SCAN REFERENCE NUMBERS FOR CREMATION - MUST VALIDATE THAT THEY ARE READY - no holds, vistations, paw prints, etc. still needed */}
					{cremationLogOpen && allowCremationAdd &&
						<CremationSaveForm CremationLog={CremationLog} />
					}
				</div>

				{/* IF LOG IS STARTED - SHOW THE INDIVIDUAL PETS THAT ARE BEING CREMATED AND LOGGED - AVAILABLE SLOTS BASED ON THE CREMATION TYPE AND THE rows AND columns FIELDS IN THE machines TABLE */}
				{cremationLogOpen && <CremationLogGrid CremationLog={CremationLog} />}
				{(cremationLogOpen || cremationLogClosed) && <React.Fragment>
					<h3 className="mt-3 text-white text-shadow"><FontAwesomeIcon icon="check" /> <Translate id="Completed Cremations"/></h3>
					<CremationLogTable CremationLog={CremationLog} />
				</React.Fragment>}
			</div>
		</React.Fragment>
	);
};

// Define the handlers for the form above
const CremationOrdersPerformContent = compose (
	withState(({initialValues: {machineId, cremationType}}) => ({machineId, cremationType})),
	withMutation(CremationLogSaveMutation, "CremationLogSaveMutation", [{query: getCremationLogsQuery}]),
	withFormik({
		handleSubmit: async ( input, { props: { CremationLogSaveMutation, setResponse, history }} ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			const { data: { CremationLogSave }} = await CremationLogSaveMutation({ input });

			if(CremationLogSave.Response.success === true) {
				setResponse({
					message: "Cremation Log Updated",
					success: true,
					CremationLog: CremationLogSave.CremationLog
				});
			}
		},
		validationSchema: () => Yup.object().shape({
			//productCategory: Yup.string().required("Enter a Product Category"),
			//productTypeId: Yup.number().required("Select a Product Type")
	   })
	}),
	withTranslate
)(CremationOrdersPerformFormContent);

class CremationOrdersPerformClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			cremationType: '',
			machineId: 0
		}
	}

	handleSetState = (valueObject) => {
		this.setState(valueObject)
	};

	render () {
		const CremationLog = this.props.data.CremationLog || { cremationLogId: 0, cremationType: "", machineId: 0, Machine: {} }; // if we don't get back a cremation log then setup an empty one to use
		const Machines = this.props.data.Machines;

		return (
			<React.Fragment>
				<CremationOrdersPerformContent
					initialValues={_.pick(CremationLog, ["cremationLogId", "cremationType", "machineId"])}
					CremationLog={CremationLog}
					handleSetState={this.handleSetState}
					history={this.props.history}
					Machines={Machines}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}

// get the data for the ID in the URL
export const CremationOrdersPerform = compose(
	withRouter,
	queryWithLoading({
		gqlString: getCremationLogQuery,
		variablesFunction: (props) => ({cremationLogId: props.match.params.cremationLogId ? props.match.params.cremationLogId : ''}),
		options: {
			fetchPolicy: 'network-only', // we don't want to get the response from the Apollo cache
			pollInterval: 10000 // 10 seconds in milliseconds
		}
    }),
	withTranslate
)(CremationOrdersPerformClass);
