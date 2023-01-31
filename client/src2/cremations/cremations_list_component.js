import { compose } from "react-apollo";
import Math from 'mathjs';
import moment from 'moment';
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import React from 'react';
import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withState } from "react-state-hoc";
import Select from "react-select";

import { PrintButton } from '../orders/pdf_print_button_component';

// GRAPHQL QUERY
import {
	CremationsListPDFMutation,
	getCremationsListQuery
} from './cremations_graphql';

import {
	getMachinesQuery
} from '../machines/machines_graphql';

const CremationListContent = (props) => {
	const {
		data: { CremationsList }
	} = props;

	let tempCremationDate = '';
	let tempCremationWeight = 0;
	let tempTotalPets = 0;
	return (
		<table className="table table-striped mt-3">
			<thead>
				<tr>
					<th>Ref. No.</th>
					<th>Type</th>
					<th>Start</th>
					<th>End</th>
					<th>Pet Name</th>
					<th>Weight</th>
					<th>Machine</th>
					<th>Row / Column</th>
				</tr>
			</thead>
			<tbody>
				{CremationsList.length > 0 &&
					CremationsList.map((cremation) => {
						let dateChanged = false;
						if(tempCremationDate !== moment(cremation.dateCremationStart).format('YYYY-MM-DD')) {
							tempCremationDate = moment(cremation.dateCremationStart).format('YYYY-MM-DD');
							dateChanged = true;
							// Get all of the cremations that happened this day
							let newDaysCremations = CremationsList.filter((cremationFilter) => moment(cremationFilter.dateCremationStart).format('YYYY-MM-DD') === tempCremationDate);
							// Loop through the cremations for this day to get the weight totals. Reset the weight from the last day to 0
							tempCremationWeight = 0;
							tempTotalPets = 0;
							newDaysCremations.forEach((newDayCremation) => {
								tempCremationWeight = newDayCremation.petWeight !== null && newDayCremation.petWeight !== '' ? Math.add(tempCremationWeight, newDayCremation.petWeight).toFixed(2) : tempCremationWeight;
								tempTotalPets = Math.add(tempTotalPets, 1).toFixed(0);
							})
						}

						return (
							<React.Fragment key={cremation.cremationId}>
								{dateChanged === true &&
									<React.Fragment>
										<tr>
											<td colSpan="8"></td>
										</tr>
										<tr>
											<td colSpan="8"><span className="">Cremations on {moment(tempCremationDate).format('MM-DD-YYYY')}</span> <span className="float-right ml-5">Pets: {tempTotalPets}</span><span className="float-right">Total Weight: {tempCremationWeight} {cremation.petWeightUnits}</span></td>
										</tr>
									</React.Fragment>
								}
								<tr>
									<td>{cremation.petReferenceNumber}</td>
									<td>{cremation.cremationType}</td>
									<td>{moment(cremation.dateCremationStart).format('HH:mmA MM-DD-YY')}</td>
									<td>{moment(cremation.dateCremationEnd).format('HH:mmA MM-DD-YY')}</td>
									<td>{cremation.petFirstName}</td>
									<td>{cremation.petWeight} {cremation.petWeightUnits}</td>
									<td>{cremation.machineName}</td>
									<td>{cremation.machineRow} / {cremation.machineColumn}</td>
								</tr>
							</React.Fragment>
						)
					})
				}
				{CremationsList.length === 0 &&
					<tr key="0"><td colSpan="8">No Cremations</td></tr>
				}
			</tbody>
		</table>
	)
}

const CremationListContainer = compose(
	queryWithLoading({
		gqlString: getCremationsListQuery,
		variablesFunction: (props) => ({ dateEnd: props.dateEnd, dateStart: props.dateStart, machineIds: props.machineIds }),
		requiredPermission: { permission: "orders", permissionLevel: 1}
	}),
	withFormik(),
	withState({

	}),
	withTranslate
)(CremationListContent)

const CremationFilterContent = (props) => {
	const {
		CremationsListPDF,
		data: { Machines },
		dateEnd,
		dateStart,
		jobId,
		machines,
		machineIds,
		setState,
		submitting
	} = props;


	const ALL_MACHINES_ARRAY = [{value: "ALL_MACHINES", label: "All Machines"}];
	const MachinesSelectValues = ALL_MACHINES_ARRAY.concat(Machines.map(({ machineId: value, machineName: label}) => ({ value, label }) ));

	function machineChange(selectedMachines, { option: newOption = {} }) {
		// Filter out the ALL_MACHINES item.
		const filteredMachines = selectedMachines.filter(( { value } ) => value !== "ALL_MACHINES");

		// After filtering, if there are no Machines to show, set it to ALL_MACHINES_ARRAY.
		if( newOption.value === "ALL_MACHINES" || filteredMachines.length === 0 ) {
			setState({jobId: 0, machines: ALL_MACHINES_ARRAY, machineIds: ''});
		} else {
			let machineIds = filteredMachines.map((machine) => {
				return machine.value;
			})
			machineIds = machineIds.join();
			setState({jobId: 0, machines: filteredMachines, machineIds });
		}
	}

	// Generate the PDF for the Cremations List
	async function handleGeneratePDF() {
		const { data: { CremationsListPDF: { jobId }}} = await CremationsListPDF({input: {dateEnd, dateStart, machineIds}});
		setState({jobId})
	}

	return (
		<div className="w-100 p-1">
			<div className="card p-3">
				<Form>
					<div className="row">
						<div className="col-12 form-row">
							<div className="col-md-auto"><Translate id="From" />* <Field type="date" name="dateStart" onChange={(event) => setState({dateStart: event.target.value, jobId: 0})} className="form-control" /></div>
							<div className="col-md-auto"><Translate id="To" />* <Field type="date" name="dateEnd" onChange={(event) => setState({dateEnd: event.target.value, jobId: 0})} className="form-control" /></div>
							<div className="col-3">
								<Translate id="Machines" />
								<Field component={Select}
									name="machines"
									className
									value={machines}
									options={MachinesSelectValues}
									onChange={ machineChange }
									isMulti
								/>
							</div>
							<div className="mt-4 ml-1"><button type="button" disabled={dateEnd === '' || dateStart === ''} onClick={() => setState({submitting: true})} className="btn btn-success btn-sm"><Translate id="Get Cremation List" /></button></div>
							<div className="mt-4 ml-2">
								{jobId === 0 &&
									<button type="button" disabled={dateEnd === '' || dateStart === ''} onClick={() => handleGeneratePDF()} className="btn btn-dark btn-sm"><Translate id="Generate PDF" /></button>
								}
								{jobId > 0 &&
									<PrintButton disableButton={false} jobId={jobId} orderId={null} printableName="Cremations List" tooltipGenerateButton="" />
								}
							</div>
						</div>
					</div>
					<div className="row">
						<div className="col-12">
							{dateEnd !== '' && dateStart !== '' && submitting &&
								<CremationListContainer
									dateEnd={dateEnd}
									dateStart={dateStart}
									machineIds={machineIds}
								/>
							}
						</div>
					</div>
				</Form>
			</div>
		</div>
	)
}

export const CremationsList = compose(
	queryWithLoading({
		gqlString: getMachinesQuery,
		variablesFunction: (props) => ({ active: 1 }),
		requiredPermission: { permission: "orders", permissionLevel: 1},
		options: {
			fetchPolicy: 'network-only', // we don't want to get the response from the Apollo cache
			pollInterval: 10000 // 10 seconds in milliseconds
		}
	}),
	withFormik(),
	withMutation(CremationsListPDFMutation, "CremationsListPDF"),
	withState({
		dateEnd: '2019-12-02',
		dateStart: '2018-12-02',
		jobId: 0,
		machines: [{value: "ALL_MACHINES", label: "All Machines"}],
		machineIds: '',
		submitting: false
	}),
	withTranslate
)(CremationFilterContent)
