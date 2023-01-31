import React from 'react';
import { withFormik, Form, Field } from "../utilities/IWDFormik";	// for wrapping forms
import { withRouter } from "react-router-dom";
import { compose } from "react-apollo";
import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	PetReferenceNumberGenerateMutation
} from './pet_reference_numbers_graphql';

const PetReferenceNumberFormContent = (props) => {
	const {
		dirty,
		errors,
		isSubmitting,
		Response,
		touched
	} = props;

	return (
		<React.Fragment>
			{/*  Display a resulting status message.  */}
			{ Response && <div className="alert alert-success">{props.translate(Response.message)}</div> }

			<Form>
				<div>
					<Translate id="Number of Pet Reference Numbers to generate"/> *
					<Field showError={true} name="numberToGenerate" className={`form-control ${errors.numberToGenerate && touched.numberToGenerate && 'is-invalid'}`} />
				</div>
				<div className="mt-1">
					<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "Generating..." : "Generate"}/>
					</button>
				</div>
			</Form>
		</React.Fragment>
	);
};

const PetReferenceNumberForm = compose (
	withMutation(PetReferenceNumberGenerateMutation, "PetReferenceNumberGenerate"),
	withFormik({
		handleSubmit: async ( input, { props: { handleFormReload, PetReferenceNumberGenerate, setResponse }} ) => {
			//console.log({input})
			// Async/Await Perform the mutation (to the server) and decompose the result into settingSave
			const { data: { petReferenceNumberGenerate }} = await PetReferenceNumberGenerate({ input: { numberToGenerate: parseInt(input.numberToGenerate)} });

			setResponse(petReferenceNumberGenerate.Response)

			handleFormReload(input);
	   },
	   validationSchema: () => Yup.object().shape({
			numberToGenerate: Yup.number().required("Number of Pet Reference Numbers to generate is required")
	   })
	}),
	withTranslate
)(PetReferenceNumberFormContent);

class PetReferenceNumberClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state= {
			numberToGenerate: ''
		}
	}

	handleFormReload = (values) => {
		this.setState({
			numberToGenerate: values.numberToGenerate
		})
	};

	render () {
		 return (
			<React.Fragment>
				<PetReferenceNumberForm
					handleFormReload={this.handleFormReload}
					initialValues={{
						numberToGenerate: this.state.numberToGenerate
					}}
				/>
			</React.Fragment>
		)
	}
}

export const PetReferenceCreate = compose(
	withRouter,
	withTranslate
)(PetReferenceNumberClass);
