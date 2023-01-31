import _ from 'lodash';
import React from 'react';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withState } from "react-state-hoc";
import { withRouter, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compose } from "react-apollo";
//import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { castNumerics, queryWithLoading, withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import { getMachineQuery, getMachinesQuery, MachineSaveMutation } from './machines_graphql';


// define the form to use with the handlers below
const MachineCreateFormContent = (props) => {
	const {
		active,
		columns,
		doCommunal,
		doIndividual,
		doPrivate,
		errors,
		isMultiChamber,
		isSubmitting,
		machineName,
		rows,
		setState,
		touched,
		values
	} = props;

	values.active = active;
	values.columns = columns;
	values.doCommunal = doCommunal;
	values.doIndividual = doIndividual;
	values.doPrivate = doPrivate;
	values.isMultiChamber = isMultiChamber;
	values.machineName = machineName;
	values.rows = rows;

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				{/* SELECT THE MACHINE TO USE & THE CREMATION TYPE TO PERFORM */}
				<h3><span className="text-white text-shadow"><FontAwesomeIcon icon="plus" /> Create a Machine</span></h3>
				<div className="card p-3">
					<Form>
						<div className="row">
							<div className="col-md-auto">
								<label htmlFor="machineName"><Translate id="Machine Name"/></label>
								<Field name="machineName" className={`form-control ${errors.machineName && touched.machineName && 'is-invalid'}`} onChange={(props) => setState({"machineName": props.target.value}) } />
									{errors.machineName && touched.machineName && <div className="invalid-feedback">{props.translate(errors.machineName)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="active"><Translate id="Active"/></label>
								<Field component="select" value={active} name="active" className={`form-control ${errors.active && touched.active && 'is-invalid'}`} onChange={(props) => setState({"active": props.target.value}) }>
									<option value="">{props.translate('Select One')}</option>
									<option value="1">{props.translate('Yes')}</option>
									<option value="0">{props.translate('No')}</option>
								</Field>
							</div>
						</div>
						<div className="row mt-3">
							<div className="col-md-auto">
								<label htmlFor="doCommunal"><Translate id="Does Communal"/></label>
								<Field component="select" value={doCommunal} name="doCommunal" className={`form-control ${errors.doCommunal && touched.doCommunal && 'is-invalid'}`} onChange={(props) => setState({"doCommunal": props.target.value}) }>
									<option value="">{props.translate('Select One')}</option>
									<option value="1">{props.translate('Yes')}</option>
									<option value="0">{props.translate('No')}</option>
								</Field>
							</div>
							<div className="col-md-auto">
								<label htmlFor="doIndividual"><Translate id="Does Individual"/></label>
								<Field component="select" value={doIndividual} name="doIndividual" className={`form-control ${errors.doIndividual && touched.doIndividual && 'is-invalid'}`} onChange={(props) => setState({"doIndividual": props.target.value}) }>
									<option value="">{props.translate('Select One')}</option>
									<option value="1">{props.translate('Yes')}</option>
									<option value="0">{props.translate('No')}</option>
								</Field>
							</div>
							<div className="col-md-auto">
								<label htmlFor="doPrivate"><Translate id="Does Private"/></label>
								<Field component="select" value={doPrivate} name="doPrivate" className={`form-control ${errors.doPrivate && touched.doPrivate && 'is-invalid'}`} onChange={(props) => setState({"doPrivate": props.target.value}) }>
									<option value="">{props.translate('Select One')}</option>
									<option value="1">{props.translate('Yes')}</option>
									<option value="0">{props.translate('No')}</option>
								</Field>
							</div>
						</div>
						<div className="row mt-3">
							<div className="col-md-auto">
								<label htmlFor="isMultiChamber"><Translate id="Multi-Chamber"/></label>
								<Field component="select" value={isMultiChamber} name="isMultiChamber" className={`form-control ${errors.isMultiChamber && touched.isMultiChamber && 'is-invalid'}`} onChange={(props) => setState({"isMultiChamber": props.target.value}) }>
									<option value="">{props.translate('Select One')}</option>
									<option value="1">{props.translate('Yes')}</option>
									<option value="0">{props.translate('No')}</option>
								</Field>
							</div>
							<div className="col-md-auto">
								<label htmlFor="rows"><Translate id="Rows"/></label>
								<Field name="rows" className={`form-control form-control-num ${errors.rows && touched.rows && 'is-invalid'}`} onChange={(props) => setState({"rows": props.target.value}) } />
									{errors.rows && touched.rows && <div className="invalid-feedback">{props.translate(errors.rows)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="columns"><Translate id="Columns"/></label>
								<Field name="columns" className={`form-control form-control-num ${errors.columns && touched.columns && 'is-invalid'}`} onChange={(props) => setState({"columns": props.target.value}) } />
									{errors.columns && touched.columns && <div className="invalid-feedback">{props.translate(errors.columns)}</div>}
							</div>
						</div>
						<div className="row mt-3">
							<div className="col-md-12">
								<Link to={`/machines`} className="btn btn-default btn-addon float-right"><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/> </Link>
								<button type="submit" className="btn btn-success btn-addon" disabled={isSubmitting}><FontAwesomeIcon icon="plus" /> <Translate id="Create the Machine"/> </button>
							</div>
						</div>
					</Form>
				</div>
			</div>
		</React.Fragment>
	);
};

// Define the handlers for the form above
const MachineCreateContent = compose (
	withState(({initialValues: {machineId, active, columns, doCommunal, doIndividual, doPrivate, isMultiChamber, machineName, rows}}) => ({machineId, active, columns, doCommunal, doIndividual, doPrivate, isMultiChamber, machineName, rows})),
	withMutation(MachineSaveMutation, "MachineSaveMutation", [{query: getMachineQuery},{query: getMachinesQuery}]),
	withFormik({
		handleSubmit: async ( input, { props: { MachineSaveMutation, history }}, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			let castInput = castNumerics(input,"active,columns,doCommunal,doIndividual,doPrivate,isMultiChamber,rows")
			const { data: { MachineSave }} = await MachineSaveMutation({ input: castInput });
			
			if(MachineSave.Response.success === true) {
				history.push(`/machines/machine/${MachineSave.Machine.machineId}`);	
			}

		},
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value)
	}),
	withTranslate
)(MachineCreateFormContent);

class MachineCreateClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			machineId: 0,
			active: 1,
			columns: 1,
			doCommunal: 1,
			doIndividual: 1,
			doPrivate: 1,
			isMultiChamber: 1,
			machineName: "",
			rows: 1
		}
	}
	
	handleSetState = (valueObject) => {
		this.setState(valueObject)
	};

	render () {
		const Machine = { machineId: 0, active: 1, columns: 1, doCommunal: 1, doIndividual: 1, doPrivate: 1, isMultiChamber: 1, machineName: "", rows: 1 }; // if we don't get back a machine then setup an empty one to use
		return (
			<React.Fragment>
				<MachineCreateContent
					initialValues={Machine}
					Machine={Machine}
					handleSetState={this.handleSetState}
					history={this.props.history}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}

// get the data for the ID in the URL
export const MachineCreate = compose(
	withRouter,
	queryWithLoading({
        gqlString: getMachineQuery,
        variablesFunction: (props) => ({machineId: 0})
    }),
	withTranslate
)(MachineCreateClass);
