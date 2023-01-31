import _ from 'lodash';
import React from 'react';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withState } from "react-state-hoc";
import { withRouter } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compose } from "react-apollo";
import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import { getCremationLogQuery, getCremationLogsQuery, CremationLogSaveMutation } from './cremations_graphql';


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

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				{/* SELECT THE MACHINE TO USE & THE CREMATION TYPE TO PERFORM */}
				<h3 className="text-white text-shadow">Create a Cremation Log</h3>
				<div className="card p-3 mt-3 mb-3">
					<Form className="row">
						<div className="col-md-auto">
							<Field component="select" showError={true} value={machineId} disabled={cremationLogClosed || cremationLogOpen} name="machineId" className={`form-control ${errors.machineId && touched.machineId && 'is-invalid'}`} onChange={(props) => setState({"machineId": props.target.value}) }>
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
							<Field component="select" showError={true} value={cremationType} disabled={cremationLogClosed || cremationLogOpen} name="cremationType" className={`form-control ${errors.cremationType && touched.cremationType && 'is-invalid'}`}  onChange={(props) => setState({"cremationType": props.target.value}) }>
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
						</div>
					</Form>
				</div>
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
				history.push(`/cremations/logs/${CremationLogSave.CremationLog.cremationLogId}`);
			}
		},
		validationSchema: () => Yup.object().shape({
			cremationType: Yup.string().required("Select a Cremation Type"),
			machineId: Yup.number().required("Select a Machine")
	   })
	}),
	withTranslate
)(CremationOrdersPerformFormContent);

class CremationOrdersPerformClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			cremationType: '',
			machineId: ''
		}
	}

	render () {
		const CremationLog = this.props.data.CremationLog || { cremationLogId: 0, cremationType: "", machineId: "", Machine: {} }; // if we don't get back a cremation log then setup an empty one to use
		const Machines = this.props.data.Machines;

		return (
			<React.Fragment>
				<CremationOrdersPerformContent
					initialValues={_.pick(CremationLog, ["cremationLogId", "cremationType", "machineId"])}
					CremationLog={CremationLog}
					history={this.props.history}
					Machines={Machines}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}

// get the data for the ID in the URL
export const CremationLogCreate = compose(
	withRouter,
	queryWithLoading({
        gqlString: getCremationLogQuery,
        variablesFunction: (props) => ({cremationLogId: ''})
    }),
	withTranslate
)(CremationOrdersPerformClass);
