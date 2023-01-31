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
import { 
    getCremationLogQuery, 
    getCremationLogsQuery, 
    getOpenCremationLogsQuery,
    CremationLogSaveMutation, 
    CremationSaveMutation, 
    CremationEndMutation, 
    CremationStartMutation, 
    CremationCancelLogMutation
 } from './cremations_graphql';

import { 
    getMachinesQuery
} from '../machines/machines_graphql';

// OUTPUT CREMATION LIST
// output either a cremation entry or a blank spot for a cremation to happen in a machine  onClick={() => cremationSave(Cremation.cremationId)}
const CremationLogEntryContent = (props) => {
	const {
		Cremation,
		CremationCancelLogMutation,
        cremationEndMinutes,
		CremationEndMutation,
        cremationEndTime,
        cremationEndTimeText,
		CremationLog,
		CremationLogFromProps,
		cremationLogId,
		cremationMessage,
		cremationMessageStatus,
		CremationSaveMutation,
		CremationStartMutation,
		initialLoad,
		Machine,
		petReferenceNumber,
		Response,
		setState
	} = props;

	console.log({props})
	if(initialLoad === true) {
		// Check the CremationLog for any unstarted Cremations in this log
		let TempOpenCremation = {};
		if(_.isEmpty(CremationLogFromProps) === false && CremationLogFromProps.Cremations.length > 0) {
			let TempOpenCremationIndex = CremationLogFromProps.Cremations.findIndex((cremation) => cremation.dateCremationStart === null);
			if(TempOpenCremationIndex === -1) {
				TempOpenCremation = CremationLogFromProps.Cremations.find((cremation) => cremation.dateCremationStart !== null && cremation.dateCremationEnd === null);
			} else {
				TempOpenCremation = CremationLogFromProps.Cremations[TempOpenCremationIndex];
			}
			console.log({TempOpenCremation})
		}

		setState({ 
			Cremation: CremationLogFromProps.cremationType === 'Communal' ? {} : TempOpenCremation, // do not show Communal cremations that have already been started
			CremationLog: CremationLogFromProps,
			initialLoad: false
		})
	}


	// let responseAlertClass = Response && Response.success === false ? 'alert-danger' : 'alert-success';
	// const multipleErrors = Response && Response.message.includes("|") ? true : false;

	// let errorsArray = [];
	// if(multipleErrors) {
	// 	errorsArray = Response.message.split("|");
	// }
	function handleCancelCremation() {
		CremationCancelLogMutation({ cremationId: Cremation.cremationId })
		setState({Cremation: {}, cremationMessage: ''})
	}


    async function handleEndCremation(cremationEndScheduledMinutes) {
		// CremationEndMutation({ input: {cremationId: Cremation.cremationId} })
        const { data: { CremationEnd }} = await CremationEndMutation({input: { calledFromCremationsPerform: false, cremationId: parseInt(Cremation.cremationId), cremationEndScheduledMinutes}})
		console.log({CremationEnd})
		console.log({props})
		// Need to Add the UserEnd and dateCremationEnd to the Cremation object within the CremationLog.Cremations array for this cremation.
		// We do not need to update the keys within the single Cremation object in state because we are just going to clear that value out after we update the log.
		let TempCremationLog = CremationLog;
		TempCremationLog.Cremations = TempCremationLog.Cremations.map((log) => {
			console.log({log})
			if(parseInt(log.cremationId) === parseInt(CremationEnd.Cremation.cremationId)) {
				let tempSpreadLog = {...log, UserEnd: CremationEnd.Cremation.UserEnd, dateCremationEnd: CremationEnd.Cremation.dateCremationEnd};
				console.log({tempSpreadLog})
				return tempSpreadLog;
			} else {
				return log;
			}
		})
		
		console.log({TempCremationLog})
		setState({
			Cremation: {},
			CremationLog: TempCremationLog,
			cremationMessage: 'Cremation successfully completed',
			cremationMessageStatus: true,
			petReferenceNumber: ''
		})
    }

	// Handle live changing of Reference Number being entered
	function handleReferenceNumberEntry(value) {
		console.log({value})
		if(value.length !== 7) {
			setState({
				petReferenceNumber: value
			})
		} else if(value.length === 7) {
			handleSaveCremation(value)
		}
	}

	// Handle Scan of Ref Number or Click of Add button to save the Cremation
	async function handleSaveCremation(value) {
		console.log({value})
		let tempInput = {
			autoStartCommunal: true, 
			calledFromCremationsPerform: true,
			column: 1,
			cremationLogId: cremationLogId,
			doCommunal: Machine.doCommunal,
			doIndividual: Machine.doIndividual,
			doPrivate: Machine.doPrivate,
			petReferenceNumber: value,
			row: 1
		};
		console.log('Temp Input WTF: ', tempInput)
		const { data: { CremationSave }} = await CremationSaveMutation({ input: tempInput });
		console.log({CremationSave})
				// Spread the Cremation Log 'Cremation' for this one that was just saved, need to update the UserEnd and dateCremationEnd

		if(CremationSave.Response.success === true) {
			// If this is a communal log, clear out the Cremation object so the next one can go in
			setState({
				Cremation: CremationLog.cremationType === 'Communal' ? {} : CremationSave.CremationLog.Cremations.find((cremation) => cremation.dateCremationStart === null),
				CremationLog: CremationSave.CremationLog,
				cremationMessage: CremationSave.Response.message,
				cremationMessageStatus: CremationSave.Response.success
			})
		} else if(CremationSave.Response.success === false) {
			setState({
				Cremation: {},
				cremationMessage: CremationSave.Response.message,
				cremationMessageStatus: CremationSave.Response.success
			})
		}
	}

	// Hande Start Cremation
	async function handleStartCremation() {
		const { data: { CremationStart } } = await CremationStartMutation({ input: { calledFromCremationsPerform: true, cremationId: Cremation.cremationId } });
		console.log({data: { CremationStart }})
		// Get the UserStart object from the returned CremationStart, and the dateCrematedStart.

		// Get the Cremation object off of the CremationLog object because it already has the Order object on it
		let TempCremation = CremationStart.CremationLog.Cremations.find((cremation) => parseInt(cremation.cremationId) === parseInt(CremationStart.Cremation.cremationId));
		let TempCremationLog = CremationStart.CremationLog;
		// let NewUserStart = CremationStart.Cremation.UserStart;
		// let newDateCremationStart = CremationStart.Cremation.dateCremationStart;
		// Spread the temp Objects
		// TempCremation = {...TempCremation, UserStart: NewUserStart, dateCremationStart: newDateCremationStart};
		// TempCremationLog = TempCremationLog.Cremations.map((log) => {
		// 	console.log({log})
		// 	if(parseInt(log.cremationId) === parseInt(CremationStart.Cremation.cremationId)) {
		// 		let tempSpreadLog = {...log, UserStart: NewUserStart, dateCremationStart: newDateCremationStart};
		// 		console.log({tempSpreadLog})
		// 		return tempSpreadLog;
		// 	} else {
		// 		return log;
		// 	}
		// })

		// TempCremationLog = {...TempCremation}
		//CremationStart.CremationLog.Cremations.find((cremation) => parseInt(cremation.cremationId) === parseInt(CremationStart.Cremation.cremationId))
		setState({
			Cremation: TempCremation,
			CremationLog: TempCremationLog
		})
	}

    // Calculate the time for the Cremation to end based on the number of minutes entered
    function handleTimeEnd(time) {
        let tempCremationEndTime = time === '' ? '' : moment().add(time, 'm').format('h:mm A');
        setState({ 
            cremationEndMinutes: time, 
            cremationEndTime: tempCremationEndTime
        });
    }

	let cremationLogClosed = (CremationLog.dateCremationLogStart !== undefined && CremationLog.dateCremationLogEnd !== null);
	let cremationLogOpen = (CremationLog.dateCremationLogStart !== undefined && CremationLog.dateCremationLogEnd === null);
	console.log({Cremation})
	if(_.isEmpty(Cremation)) {
		// return an empty slot as a placeholder
		return (
			<React.Fragment>
				<div className="card border border-secondary">
					<div className="card-body">
						<div className="display-3 text-muted text-center pt-4 pb-4"><FontAwesomeIcon icon="fire" /></div>
						<div className="form-inline justify-content-center">
							{/* <button type="button" className="btn btn-success rounded" onClick={() => handleSaveCremation()} disabled={petReferenceNumber.length !== 7}><FontAwesomeIcon icon="plus" /></button> */}
							<input type="text" placeholder={props.translate("Reference #")} name="petReferenceNumber" value={petReferenceNumber} 
								className={`form-control rounded`} style={{width: 115+'px'}}
								onChange={(event) => handleReferenceNumberEntry(event.target.value.trim())} />
						</div>
						{
							cremationMessage !== '' &&
							<div className={`mt-3 mb-0 text-center alert alert-${(cremationMessageStatus === true && 'success') || 'danger'}`}>
								{props.translate(cremationMessage)}
							</div>
						}
					</div>
					{/* <div className="card-footer"><button className="btn btn-secondary btn-sm btn-addon disabled"><FontAwesomeIcon icon="times" /> <Translate id="EMPTY"/> </button></div> */}
				</div>
				<CremationLogTable CremationLog={CremationLog} />
			</React.Fragment>
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
			<React.Fragment>
				<div className="card border border-dark bg-light">
					<div className={`${cardHeaderClass} text-center`}>{Cremation.petReferenceNumber}{Cremation.dateCremationStart === null && ' - Ready to Cremate'}</div>
					<div className="card-body text-center">
						<h5 className="card-title">{Cremation.Order.petFirstName} {Cremation.Order.petLastName} - {Cremation.Order.companyName}</h5>
						<div className="card-text">
							<div>{Cremation.Order.species} ({Cremation.Order.petBreed}, {Cremation.Order.sex})</div>
							<div>{Cremation.Order.weight} {Cremation.Order.weightUnits}</div>
							{Cremation.dateCremationStart !== null && <div className="mt-3 h4">{moment(Cremation.dateCremationStart).format('MMM D')} @ {moment(Cremation.dateCremationStart).format('h:mm A')}</div>}
						</div>
						{CremationLog.cremationType !== "Communal" && cremationLogOpen && !cremationOpen && !cremationClosed && <div className="mt-3">
							<button className="btn btn-success btn-sm btn-addon" onClick={() => handleStartCremation()}><FontAwesomeIcon icon="arrow-right" /> <Translate id="START"/> </button> 
							<button type="button" className="btn btn-default btn-sm btn-addon ml-3" onClick={() => handleCancelCremation()}><FontAwesomeIcon icon="times" /> <Translate id="CANCEL" /></button>
						</div>}
						{
							Cremation.dateCremationStart !== null &&
							<React.Fragment>
								<div className="mt-2">
									Schedule End in <input type="text" className="small" style={{width: 30+'px'}} onChange={(event) => handleTimeEnd(event.target.value)} /> minutes{cremationEndTimeText}
								</div>
								{
									cremationEndTime !== '' &&
									<div className="mt-2">
										<button type="button" className="btn btn-danger btn-sm btn-addon" onClick={() => handleEndCremation(parseInt(cremationEndMinutes))}><FontAwesomeIcon icon="check" /> <Translate id="END" /> @ {cremationEndTime}</button>
									</div>
								}
								{
									cremationEndTime === '' &&
									<div className="mt-2">
										<button type="button" className="btn btn-danger btn-sm btn-addon" onClick={() => handleEndCremation(0)}><FontAwesomeIcon icon="check" /> <Translate id="END" /></button>
									</div>
								}                        
							</React.Fragment>}
						{/* {CremationLog.cremationType !== "Communal" && cremationLogOpen && cremationOpen && !cremationClosed && <button className="btn btn-danger btn-sm btn-addon" onClick={() => props.CremationEndMutation({ input: {cremationId: Cremation.cremationId} }) }><FontAwesomeIcon icon="check" /> <Translate id="END"/> </button>}
						{CremationLog.cremationType === "Communal" && cremationLogOpen && cremationOpen && !cremationClosed && <button className="btn btn-secondary btn-sm btn-addon disabled" disabled="disabled"><FontAwesomeIcon icon="check" /> <Translate id="STARTED"/> </button>}
						{(cremationLogClosed || cremationClosed) && <button disabled="disabled" className="btn btn-secondary btn-sm btn-addon"><FontAwesomeIcon icon="check" /> <Translate id="DONE"/> </button>} */}
					</div>
				</div>
				<CremationLogTable CremationLog={CremationLog} />
			</React.Fragment>
		)
	}
};

// COMPOSE CremationLogEntry with mutations for Start and End Cremation buttons
const CremationLogEntry = compose (
	withMutation(CremationEndMutation, "CremationEndMutation"),
	withMutation(CremationStartMutation, "CremationStartMutation"),
	withMutation(CremationCancelLogMutation, "CremationCancelLogMutation"),
	withMutation(CremationSaveMutation, "CremationSaveMutation"),
	withState({
		Cremation: {},
        cremationEndMinutes: '',
        cremationEndTime: '',
        cremationEndTimeText: '',
		CremationLog: {},
		cremationMessage: '',
		cremationMessageStatus: '',
		initialLoad: true,
		petReferenceNumber: ''
	}),
	withTranslate
)(CremationLogEntryContent);

// SHOW COMPLETED CREMATIONS IN A TABLE
const CremationLogTable = (props) => {
	// filter the cremations to only include ended cremations
	console.log({props})
	const { 
		CremationLog: { cremationType }
	} = props;

	let Cremations = {};
	if(props.CremationLog.Cremations !== undefined) {
		Cremations = props.CremationLog.cremationType === 'Private' ? props.CremationLog.Cremations.filter((cremation) => cremation.dateCremationEnd !== null) : props.CremationLog.Cremations;
	}

	let totalWeight = 0;
	let weightUnits = "";
	return (
		<React.Fragment>
			{
				_.isEmpty(Cremations) === true && <div className="alert mt-3 alert-light text-center border-secondary">No Completed Cremations</div>
			}
			{
				_.isEmpty(Cremations) === false &&
				<React.Fragment>
					{/* <h3 className="mt-3 text-white text-shadow"><FontAwesomeIcon icon="check" /> <Translate id="Completed Cremations"/></h3> */}
					<div className="card mt-4 border-0">
						<table className="table table-sm">
							<thead className="text-secondary">
								<tr>
									<th>Reference</th>
									<th>Name</th>
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
												<td>{cremation.Order.petFirstName}</td>
												<td>{cremation.Order.weight}</td>
												<td>{moment(cremation.dateCremationStart).format('h:mm A M-D-YY')} {/*cremation.UserStart !== undefined && cremation.UserStart !== null && <span>by {cremation.UserStart.firstName} {cremation.UserStart.lastName}</span>*/}</td>
												<td>{cremation.dateCremationEnd !== null && moment(cremation.dateCremationEnd).format('h:mm A M-D-YY')}{cremation.cremationEndScheduledMinutes > 0 && ` (+${cremation.cremationEndScheduledMinutes}m)`} {/*cremation.UserEnd !== undefined && cremation.UserEnd !== null && <span>by {cremation.UserEnd.firstName} {cremation.UserEnd.lastName}</span>*/}</td>
											</tr>
										)
									}
								)}
								{props.CremationLog.Cremations !== undefined && <tr>
									<td colSpan="2" className="text-right h5 text-secondary pt-3"><Translate id="TOTAL" /></td>
									<td className="h5 pt-3">{totalWeight} {weightUnits}</td>
									<td colSpan="2">&nbsp;</td>
								</tr>}
								
							</tbody>
						</table>
					</div>
				</React.Fragment>
			}
		</React.Fragment>
	)
}

const CremationPerform = (props) => {
    const {
        CremationLog
    } = props;
    console.log({props})
    return (
        <div>
			<CremationLogEntry CremationLogFromProps={CremationLog} cremationLogId={CremationLog.cremationLogId} Machine={CremationLog.Machine} />
        </div>
    )
}

const CremationPerformContainer = compose(
	withRouter,
	queryWithLoading({
		gqlString: getMachinesQuery,
		variablesFunction: (props) => ({active: 1}),
		options: { fetchPolicy: 'network-only' }
    }),
	withTranslate
)(CremationPerform);

const MachineWorkflow = (props) => {
    const {
        buttonSelected,
        CremationLog,
		cremationLogIdClosed,
		cremationLogMessage,
        CremationLogSaveMutation,
        cremationType,
        initialLoad,
        Machine,
        OpenCremationLogs: { OpenCremationLogs },
        setState
    } = props;
    console.log({props})
    console.log({OpenCremationLogs})
    if(initialLoad === true) {
        setState({
            CremationLog: OpenCremationLogs.length > 0 ? OpenCremationLogs[0] : [],
            cremationType: OpenCremationLogs.length > 0 ? OpenCremationLogs[0].cremationType : '',
            initialLoad: false
        })
    }

    function handleGenericSetState(name, value='') {
        setState({
            [name]: value
        })
    }

    // Save a new Cremation Log for this Machine
    async function handleStartCremationLog(machineId) {
        let tempInput = { cremationLogId: 0, cremationType: cremationType, machineId: Machine.machineId };
        const { data: { CremationLogSave }} = await CremationLogSaveMutation({ input: tempInput });
        console.log({CremationLogSave})
        setState({
            CremationLog: CremationLogSave.CremationLog,
			cremationLogIdClosed: 0,
			cremationLogMessage: ''
        })
    }

	// Function to close the cremation log
	async function handleEndCremationLog() {
        const { data: { CremationLogSave }} = await CremationLogSaveMutation({ input: { cremationLogId: CremationLog.cremationLogId, cremationType} });
        console.log({CremationLogSave})
        setState({
            CremationLog: [],
			cremationLogIdClosed: CremationLogSave.CremationLog.cremationLogId,
			cremationLogMessage: 'Cremation Log closed'
        })
	}

    return (
        <div className="col m-2 p-0 card">
            <div className="card-header">
                <div className="row">
                    <div className="col-auto pt-1 h5"><span className="h6 text-secondary">{Machine.machineName}:</span> {CremationLog.length !== 0 && cremationType}</div>
                    {
                        CremationLog.length === 0 &&
                        <React.Fragment>
                            <div className="col">
                                <div className="btn-group">
                                    {Machine.doCommunal === 1 &&
                                        <button type="button" style={{boxShadow: 'none'}} 
                                            className={`btn btn-sm border-secondary ${(cremationType === 'Communal' && 'btn-secondary') || 'btn-light text-secondary'}`}
                                            onClick={() => handleGenericSetState('cremationType', 'Communal')}
                                        ><Translate id="Communal" /></button>
                                    }
                                    {Machine.doIndividual === 1 &&
                                        <button type="button" style={{boxShadow: 'none'}} 
                                            className={`btn btn-sm border-secondary ${(cremationType === 'Individual' && 'btn-secondary') || 'btn-light text-secondary'}`}
                                            onClick={() => handleGenericSetState('cremationType', 'Individual')}
                                        ><Translate id="Individual" /></button>
                                    }
                                    {Machine.doPrivate === 1 &&
                                        <button type="button" style={{boxShadow: 'none'}} 
                                            className={`btn btn-sm border-secondary ${(cremationType === 'Private' && 'btn-secondary') || 'btn-light text-secondary'}`}
                                            onClick={() => handleGenericSetState('cremationType', 'Private')}
                                        ><Translate id="Private" /></button>
                                    }
                                </div>
                            </div>
                            <div className="col"><div className="float-right"><button type="button" disabled={cremationType === ''} onClick={() => handleStartCremationLog(Machine.machineId)} className="btn btn-sm btn-success btn-addon"><FontAwesomeIcon icon="plus" /> <Translate id="Start Cremation Log"/> </button></div></div>
                        </React.Fragment>
                    }
                    {
                        CremationLog.length !== 0 &&
                        <React.Fragment>
                            <div className="col"><div className="float-right"><button type="button" className="btn btn-sm btn-danger btn-addon" onClick={() => handleEndCremationLog()}><FontAwesomeIcon icon="check" /> <Translate id="Close Cremation Log"/> </button></div></div>
                        </React.Fragment>
                    }
                </div>
            </div>
            <div className="card-body">
                {_.isEmpty(CremationLog) === true && 
					<React.Fragment>
						<div className="alert alert-success m-0 text-center"><Translate id="Select a cremation type and start the log" /></div>
						{cremationLogIdClosed > 0 && <button type="button" onClick={() => props.history.push(`/cremations/logs/${cremationLogIdClosed}`)} className="btn mt-4 btn-lg rounded btn-block btn-success">Click here to go to Cremation Log #{cremationLogIdClosed} that just closed.</button>}
					</React.Fragment>
				}

                {_.isEmpty(CremationLog) === false && 
                    <CremationPerformContainer props={props} CremationLog={CremationLog} />
                }
            </div>
        </div>
    );

}

const MachineWorkflowContainer = compose (
	queryWithLoading({
		gqlString: getOpenCremationLogsQuery,
        name: 'OpenCremationLogs',
        variablesFunction: (props) => ({ machineId: props.Machine.machineId, onlyOpenCremations: false }),
		options: { fetchPolicy: 'network-only' }
    }),
	withState({
        buttonSelected: '',
        CremationLog: [],
		cremationLogIdClosed: 0,
		cremationLogMessage: '',
        cremationType: '',
        initialLoad: true
    }),
	withMutation(CremationLogSaveMutation, "CremationLogSaveMutation"),
	withRouter,
	withTranslate
)(MachineWorkflow);

const Machines = (props) => {
    return (
        <div className="w-100"><div className="row m-0">{props.data.Machines.map((machine) => <React.Fragment key={machine.machineId}><MachineWorkflowContainer Machine={machine} /></React.Fragment>)}</div></div>
    );
}

// get the data for the ID in the URL
export const CremationWorkflow = compose(
	withRouter,
	queryWithLoading({
		gqlString: getMachinesQuery,
		variablesFunction: (props) => ({active: 1}),
		options: { fetchPolicy: 'network-only' }
    }),
	withTranslate
)(Machines);
