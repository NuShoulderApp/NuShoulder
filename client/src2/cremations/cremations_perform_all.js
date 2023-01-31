import _ from 'lodash';
import moment from 'moment';
import { compose } from "react-apollo";
import { Field, withFormik } from "../utilities/IWDFormik";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import Math from 'mathjs';
import React from 'react';
import { withState } from "react-state-hoc";
import { withRouter } from "react-router-dom";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
    getOpenCremationLogsQuery,
    CremationLogCreateMutation,
    CremationSaveMutation,
    CremationCancelMutation,
    CremationEndMutation,
    CremationStartMutation
 } from './cremations_graphql';

import { getMachinesQuery } from '../machines/machines_graphql';

const CremationsPerformAllContent = (props) => {
    const {
        initialLoad,
        Machines: { Machines },
        MachinesArray,
        OpenCremationLogs: { OpenCremationLogs },
        setState
    } = props;

    // On initialLoad of this page, create the Machines array that has an object for each column of each row of each machine. Then put this Machines array into state so we can update it as columns are filled / completed / updated.
    if(initialLoad === true) {
        // NOTE: We have to use for loops here because we are not looping through arrays, we have an integer X and we are creating X arrays.
        let TempMachines = Machines.map((machine) => {
            let TempMachine = machine;
            TempMachine.cremationType = null;
            TempMachine.Rows = [];
            // Loop through each row
            let i;
            for(i = 0; i < machine.rows; i++) {
                TempMachine.Rows.push({row: i+1, Columns: []})
                // Loop through each column
                let j;
                for(j = 0; j < machine.columns; j++) {
                    TempMachine.Rows[i].Columns.push({column: j+1, Cremation: {}, row: i+1, machine: _.omit(machine,["Rows"])})
                }
            }
            return TempMachine;
        });

        // Because we cannot do functions within a for loop, now that our TempMachines array structure is build, we can check to see if there are any cremations going on in the machine's row's columns.
        // Only need to do this if there are OpenCremationLogs though.
        if(OpenCremationLogs.length > 0) {
            TempMachines.forEach((tempMachine) => {
                tempMachine.Rows.forEach((tempRow) => {
                    tempRow.Columns.forEach((tempColumn) => {
                        // Check if there is an open cremation for this column.
                        const tempOpenCremationLog = OpenCremationLogs.find((log) => log.Cremations.findIndex((crem) => crem.machineColumn === tempColumn.column && crem.machineRow === tempColumn.row && parseInt(log.machineId) === parseInt(tempMachine.machineId)) > -1);

                        if(tempOpenCremationLog) {
                            // Get the Cremation object for this column
                            const tempOpenCremation = tempOpenCremationLog.Cremations.find((crem) => crem.machineColumn === tempColumn.column && crem.machineRow === tempColumn.row && parseInt(tempOpenCremationLog.machineId) === parseInt(tempMachine.machineId));

                            // Set this column's Cremation object
                            tempColumn.Cremation = {...tempOpenCremation, cremationType: tempOpenCremationLog.cremationType};

                            // Add the cremationType to the machine for display on empty columns
                            tempMachine.cremationType = tempOpenCremationLog.cremationType;
                        }
                    })
                })
            })
        }

        setState({ initialLoad: false, MachinesArray: TempMachines });
    }

    // Function to update state that will be passed down to children
    function updateParentState(name, value) {
        setState({
            [name]: value
        })
    }

    return (
        <div className="p-3 w-100">
            <div className="row">
                {/* Loop through all of the machines */}
                {MachinesArray.map((machine) => {
                    return (
                        <React.Fragment key={machine.machineId}>
                            {machine.Rows.map((row) => {
                                return (
                                    <React.Fragment key={`${machine.machineId}-${row.row}`}>
                                        {/* Loop through all of the columns of this row */}
                                        {row.Columns.map((column) => {
                                            if(parseInt(column.Cremation.cremationId) > 0) {
                                                return (
                                                    <div className="col-md-4 border-left border-right p-0 text-center mb-3" key={`${machine.machineId}-${row.row}-${column.column}`}>
                                                        <CremationPerformContainer
                                                            Column={column}
                                                            Machine={machine}
                                                            MachinesArray={MachinesArray}
                                                            updateParentState={updateParentState}
                                                        />
                                                    </div>
                                                )
                                            } else {
                                                return (
                                                    <div className="col-md-4 border-left border-right p-0 text-center mb-3" key={`${machine.machineId}-${row.row}-${column.column}`}>
                                                        <CreateCremationContainer
                                                            Column={column}
                                                            Machine={machine}
                                                            MachinesArray={MachinesArray}
                                                            updateParentState={updateParentState}
                                                        />
                                                    </div>
                                                )
                                            }
                                        })}
                                    </React.Fragment>
                                )
                            })}
                        </React.Fragment>
                    )
                })}
            </div>

        </div>
    )
}

// Content for when a column has a cremation in it
function CremationPerformContent(props) {
    const {
        Column,
        Column: { Cremation: { Order }},
        CremationCancel,
        CremationEnd,
        cremationEndMinutes,
        cremationEndTime,
        cremationEndTimeText,
        CremationStart,
        Machine,
        MachinesArray,
        setState,
        updateParentState
    } = props;

    // Set variable for determining if we show the START or END card
    const showCardStart = Column.Cremation.dateCremationStart === null ? true : false;
    const headBGClass = showCardStart === true ? 'bg-success' : 'bg-danger';

    async function cancelCremation() {
        const { data: { CremationCancel: { cremationLogClosed }} } = await CremationCancel({cremationId: parseInt(Column.Cremation.cremationId)})

        let TempMachinesArray = MachinesArray;
        // Update this specific row/column within the machine's array with the Cremation information that was just passed back
        let TempMachinesArrayColumn = TempMachinesArray.find((tempMachine) => parseInt(tempMachine.machineId) === parseInt(Machine.machineId)).Rows.find((tempRow) => parseInt(tempRow.row) === parseInt(Column.row)).Columns.find((tempColumn) => parseInt(tempColumn.column) === parseInt(Column.column));
        // Reset the Cremation object
        TempMachinesArrayColumn.Cremation = {};

        // If 'cremationLogClosed' is true, then we need to remove the cremationLogId from the machine so that a new cremation log can be started.
        if(cremationLogClosed === true) {
            // Reset cremationLogId for this machine.
            let ThisMachine = TempMachinesArray.find((tempMachine) => parseInt(tempMachine.cremationLogId) === parseInt(Machine.cremationLogId));
            ThisMachine.cremationLogId = null;
            ThisMachine.cremationType = null;
            // Each of this machine's Row's Column's has a machine object that needs to have the cremationLogId nulled also
            ThisMachine.Rows.forEach((tempRow) => {
                tempRow.Columns.forEach((tempColumn) => tempColumn.machine.cremationLogId = null)
            })
        }

        // Update the parent component's state for the MachinesArray that is passed to all of the children cards
        updateParentState('MachinesArray',TempMachinesArray)
    }

    async function endCremation(cremationEndScheduledMinutes) {
        const { data: { CremationEnd: { cremationLogClosed }}} = await CremationEnd({input: { calledFromCremationsPerform: true, cremationId: parseInt(Column.Cremation.cremationId), cremationEndScheduledMinutes}})

        let TempMachinesArray = MachinesArray;
        // Update this specific row/column within the machine's array with the Cremation information that was just passed back
        let TempMachinesArrayColumn = TempMachinesArray.find((tempMachine) => parseInt(tempMachine.machineId) === parseInt(Machine.machineId)).Rows.find((tempRow) => parseInt(tempRow.row) === parseInt(Column.row)).Columns.find((tempColumn) => parseInt(tempColumn.column) === parseInt(Column.column));
        // Reset the Cremation object
        TempMachinesArrayColumn.Cremation = {};

        // If 'cremationLogClosed' is true, then we need to remove the cremationLogId from the machine so that a new cremation log can be started.
        if(cremationLogClosed === true) {
            // Reset cremationLogId for this machine.
            let ThisMachine = TempMachinesArray.find((tempMachine) => parseInt(tempMachine.cremationLogId) === parseInt(Machine.cremationLogId));
            ThisMachine.cremationLogId = null;
            ThisMachine.cremationType = null;
            // Each of this machine's Row's Column's has a machine object that needs to have the cremationLogId nulled also
            ThisMachine.Rows.forEach((tempRow) => {
                tempRow.Columns.forEach((tempColumn) => tempColumn.machine.cremationLogId = null)
            })
        }

        // Update the parent component's state for the MachinesArray that is passed to all of the children cards
        updateParentState('MachinesArray',TempMachinesArray)
    }

    async function startCremation() {
        const { data: { CremationStart: { Cremation, CremationLog }}} = await CremationStart({input: { calledFromCremationsPerform: true, cremationId: parseInt(Column.Cremation.cremationId) }})

        let TempMachinesArray = MachinesArray;
        // Update this specific row/column within the machine's array with the Cremation information that was just passed back
        let TempMachinesArrayColumn = TempMachinesArray.find((tempMachine) => parseInt(tempMachine.machineId) === parseInt(Machine.machineId)).Rows.find((tempRow) => parseInt(tempRow.row) === parseInt(Column.row)).Columns.find((tempColumn) => parseInt(tempColumn.column) === parseInt(Column.column));
        TempMachinesArrayColumn.Cremation = Cremation;
        // Get the Order object out of the CremationLog via CremationStart, there can be more than one cremation in each log, so have to find this specific cremation's order info
        TempMachinesArrayColumn.Cremation.Order = CremationLog.Cremations.find((tempCremation) => parseInt(tempCremation.cremationId) === parseInt(Cremation.cremationId)).Order;

        // Update the parent component's state for the MachinesArray that is passed to all of the children cards
        updateParentState('MachinesArray',TempMachinesArray)
    }

    // Functionality for a Communal Cremation. This is start and end the cremation, and also end the cremation log.
    async function performCommunalCremation() {
        await startCremation();
        await endCremation(0);
    }

    // Calculate the time for the Cremation to end based on the number of minutes entered
    function handleTimeEnd(time) {
        console.log('Now: ', moment().format('h:mm A'))
        console.log('End: ', moment().add(time, 'm').format('h:mm A'))
        let tempCremationEndTime = time === '' ? '' : moment().add(time, 'm').format('h:mm A');
        
        setState({ 
            cremationEndMinutes: time, 
            cremationEndTime: tempCremationEndTime
        });
    }
    return (
        <div className="card mr-2 ml-2">
            <div className={`card-header h4 ${headBGClass} text-light`}>{Order.petReferenceNumber}</div>
            <div className="card-body" style={{height: 250 + 'px'}}>
                <div className="h6 border-bottom pb-1">{Machine.machineName}</div>
                {/* <div className="h6 border-bottom pb-1"><Translate id="Machine" /> {Machine.machineName}<br /> <Translate id="Row" /> {Column.row}, <Translate id="Column" /> {Column.column}</div> */}
                {/* <div className="h6 border-bottom pb-1"><Translate id="Cremation Log" />: {Column.machine.cremationLogId}</div> */}
                {/* <div>C: {Machine.doCommunal} | I: {Machine.doIndividual} | P: {Machine.doPrivate}</div> */}

                <div className="card-title mb-1">{Column.Cremation.cremationType} - {Order.companyName}</div>
				<div className="card-title">{Order.petFirstName} {Order.petLastName}</div>

                <div className="card-text">
                    <div>
                        {Order.species} ({Order.petBreed}, {Order.sex})
                    </div>
                    <div>
                        {Order.weight} {Order.weightUnits}
                    </div>
                    {Column.Cremation.dateCremationStart !== null && <div className="mt-3 h4">{moment(Column.Cremation.dateCremationStart).format('MMM D')} @ {moment(Column.Cremation.dateCremationStart).format('h:mm A')}</div>}
                </div>
            </div>
            <div className="card-footer">
                {/* When a Cremation has not been started yet */}
                {
                    showCardStart === true &&
                    <React.Fragment>
                        {
                            Column.Cremation.cremationType === 'Communal' &&
                            <button className="btn btn-success btn-sm btn-addon" onClick={() => performCommunalCremation()}><FontAwesomeIcon icon="check" /> <Translate id="PERFORM" /></button>
                        }
                        {
                            Column.Cremation.cremationType !== 'Communal' &&
                            <button type="button" className="btn btn-success btn-sm btn-addon" onClick={() => startCremation()}><FontAwesomeIcon icon="arrow-right" /> <Translate id="START" /></button>
                        }
                        <button type="button" className="btn btn-default btn-sm btn-addon ml-3" onClick={() => cancelCremation()}><FontAwesomeIcon icon="times" /> <Translate id="CANCEL" /></button>
                    </React.Fragment>
                }

                {/* When a Cremation has been started, show the END buttton. This is only for non-communal cremation */}
                {
                    showCardStart === false &&
                    Column.Cremation.cremationType !== 'Communal' &&
                    <React.Fragment>
                        {
                            cremationEndTime !== '' &&
                            <div className="">
                                <button type="button" className="btn btn-danger btn-sm btn-addon" onClick={() => endCremation(parseInt(cremationEndMinutes))}><FontAwesomeIcon icon="check" /> <Translate id="END" /> @ {cremationEndTime}</button>
                            </div>
                        }
                        {
                            cremationEndTime === '' &&
                            <div className="">
                                <button type="button" className="btn btn-danger btn-sm btn-addon" onClick={() => endCremation(0)}><FontAwesomeIcon icon="check" /> <Translate id="END" /></button>
                            </div>
                        }                        
                        <div className="mt-1">
                            Schedule End in <input type="text" className="small" style={{width: 30+'px'}} onChange={(event) => handleTimeEnd(event.target.value)} /> minutes{cremationEndTimeText}
                        </div>
                       

                    </React.Fragment>
                }
            </div>
        </div>
    )
}

const CremationPerformContainer = compose(
    withFormik(),
    withMutation(CremationCancelMutation, "CremationCancel", ["getOpenCremationLogs"]),
    withMutation(CremationEndMutation, "CremationEnd", ["getOpenCremationLogs"]),
    withMutation(CremationStartMutation, "CremationStart"),
    withState({
        cremationEndMinutes: '',
        cremationEndTime: '',
        cremationEndTimeText: '.'
    }),
	withTranslate
)(CremationPerformContent)

// Default view for a cremation column
function CreateCremationContent(props) {
    const {
        addPetMessage,
        addPetMessageClass,
        Column,
        CremationLogCreate,
        CremationSave,
        Machine,
        MachinesArray,
        petReferenceNumber,
        setState,
        updateParentState
    } = props;

    async function handlePetReferenceNumberChange(value) {
        let tempValue = value.trim();
        setState({
            addPetMessage: '',
            addPetMessageClass: '',
            petReferenceNumber: tempValue
        }, () => {
            if(tempValue.length === 7) {
                // This is where an auto-submit would happen
            }
        })
    }

    async function handleAddPet() {
        // Use the existing Cremation Save validation to see if this pet reference number can be cremated and works in this machine. This call will NOT save a record into the cremations db table because calledFromCremationsPerform: true
        const { data: { CremationSave: { Cremation, Response: CremationSaveResponse}} } = await CremationSave({ input: { calledFromCremationsPerform: true, cremationLogId: null, machineId: parseInt(Machine.machineId), doCommunal: parseInt(Machine.doCommunal), doIndividual: parseInt(Machine.doIndividual), doPrivate: parseInt(Machine.doPrivate), petReferenceNumber }});
        const cremationType = Cremation.cremationType;

        if(CremationSaveResponse.success === false) {
            // Display warning message of why the cremation cannot take place
            setState({ addPetMessage: CremationSaveResponse.message, addPetMessageClass: 'alert alert-danger'});
        } else {

            let TempMachinesArray = MachinesArray;
            let tempCremationLogId = Machine.cremationLogId === null ? 0 : parseInt(Machine.cremationLogId);
            if(tempCremationLogId === 0) {
                // Create a new cremationLogId for this machine.
                const { data } = await CremationLogCreate({ input: { cremationLogId: 0, cremationType, machineId: Machine.machineId } });

                tempCremationLogId = data.CremationLogCreate.CremationLogCreate.cremationLogId;
                // Take the new cremationLogId and update all of the machine's row's columns
                // Get this machine
                const machineIndex = TempMachinesArray.findIndex((tempMachine) => parseInt(tempMachine.machineId) === parseInt(Machine.machineId))
                // Update the cremationLogId for the top level array and also for all of the columns within the rows within this machine.
                TempMachinesArray[machineIndex].cremationLogId = tempCremationLogId;
                TempMachinesArray[machineIndex].cremationType = cremationType;
                TempMachinesArray[machineIndex].Rows.forEach((tempRow) => {
                    tempRow.Columns.forEach((column) => {
                        column.machine.cremationLogId = tempCremationLogId;
                    });
                });
            }

            // Save a Cremation record in the cremations db table for this cremationLogId and the row/column of this machine.
            const { data: { CremationSave: { Cremation, CremationLog, Response: CremationSaveResponse}} } = await CremationSave({ input: { calledFromCremationsPerform: true, column: Column.column, cremationLogId: tempCremationLogId, machineId: parseInt(Machine.machineId), doCommunal: parseInt(Machine.doCommunal), doIndividual: parseInt(Machine.doIndividual), doPrivate: parseInt(Machine.doPrivate), petReferenceNumber, row: Column.row }});

            if(CremationSaveResponse.success === true) {
                // Update this specific row/column within the machine's array with the Cremation information that was just passed back
                let TempMachinesArrayColumn = TempMachinesArray.find((tempMachine) => parseInt(tempMachine.machineId) === parseInt(Machine.machineId)).Rows.find((tempRow) => parseInt(tempRow.row) === parseInt(Column.row)).Columns.find((tempColumn) => parseInt(tempColumn.column) === parseInt(Column.column));
                TempMachinesArrayColumn.Cremation = Cremation;
                // Get the Order object out of the CremationLog via CremationSave, there can be more than one cremation in each log, so have to find this specific cremation's order info
                TempMachinesArrayColumn.Cremation.Order = CremationLog.Cremations.find((tempCremation) => parseInt(tempCremation.cremationId) === parseInt(Cremation.cremationId)).Order;

                // reset any warning message
                setState({
                    addPetMessage: '',
                    addPetMessageClass: ''
                }, async () => {
                    // Update the parent component's state for the MachinesArray that is passed to all of the children cards
                    updateParentState('MachinesArray',TempMachinesArray)
                });
            } else {
                setState({ addPetMessage: CremationSaveResponse.message, addPetMessageClass: 'alert alert-danger'});
            }
        }
        // Update this machine's cremationLogId for all of the chambers.
    }

    return (
        <div className="card mr-2 ml-2">
			<div className="card-header h4 p-2">
				<div className="input-group">
					<Field name="petReferenceNumber" className="form-control" onChange={(event) => handlePetReferenceNumberChange(event.target.value)} placeholder="Enter / Scan Reference #" />
					<div className="input-group-append">
						<button type="button" className="btn btn-success btn-addon" disabled={petReferenceNumber.length !== 7} onClick={() => handleAddPet()}><FontAwesomeIcon icon="plus" /> <Translate id="Add Pet" /></button>
					</div>
				</div>
			</div>
			<div className="card-body" style={{height: 250 + 'px'}}>
				<div className="h6 border-bottom pb-1">{Machine.machineName}</div>
				{/* <div className="h6 border-bottom pb-1">{Machine.machineName}<br /> <Translate id="Row" /> {Column.row}, <Translate id="Column" /> {Column.column}</div> */}
				{/* <div className="h6 border-bottom pb-1"><Translate id="Cremation Log" />: {Column.machine.cremationLogId}</div>
				<div>C: {Machine.doCommunal} | I: {Machine.doIndividual} | P: {Machine.doPrivate}</div> */}
				<h5 className="card-title">{
					Machine.cremationType && Machine.cremationType !== null && Machine.cremationType !== '' &&
					<Translate id={Machine.cremationType} />
				}</h5>
				{
					addPetMessage === '' &&
					<div className="display-3 text-muted  pt-4 pb-4">
						<FontAwesomeIcon icon="inbox" />
					</div>
				}
				{
					addPetMessage !== '' &&
					<div className={`${addPetMessageClass}`}>{addPetMessage}</div>
				}
			</div>
            <div className="card-footer">
                <button className="btn btn-secondary btn-sm btn-addon disabled">
                    <FontAwesomeIcon icon="times" /> <Translate id="EMPTY" />
                </button>
            </div>
        </div>
    )
}

const CreateCremationContainer = compose(
    withFormik(),
    withMutation(CremationLogCreateMutation, "CremationLogCreate"),
    withMutation(CremationSaveMutation, "CremationSave"),
    withState({
        addPetMessage: '',
        addPetMessageClass: '',
        petReferenceNumber: ''
    }),
	withTranslate
)(CreateCremationContent)

export const CremationsPerformAll = compose(
    queryWithLoading({
		gqlString: getMachinesQuery,
        name: 'Machines'
    }),
    queryWithLoading({
		gqlString: getOpenCremationLogsQuery,
        name: 'OpenCremationLogs',
        variablesFunction: (props) => ({ onlyOpenCremations: true })
    }),
    withFormik(),
    withRouter,
    withState({
        initialLoad: true,
        MachinesArray: [],
        petReferenceNumber: ''
    }),
	withTranslate
)(CremationsPerformAllContent)
