import React from 'react';
import _ from "lodash";
import { withFormik, Form, Field } from "../utilities/IWDFormik";
import { withRouter, Link } from "react-router-dom";
import { compose } from "react-apollo";

import { withMutation } from '../utilities/IWDDb';
import { Translate, withTranslate } from '../translations/IWDTranslation';
import { SidebarColumn } from '../layouts/application';

import * as Yup from "yup";

import {
	TestimonialSaveMutation
} from './testimonials_graphql';


const TestimonialCreateFormContent = (props) => {
	const {
		dirty,
		errors,
        initialValues,
		isSubmitting,
		Response,
		touched
	} = props;

	return (
		<SidebarColumn>
			<Form className="card p-3">
				{/*  Display a resulting response message, only when there is a response and the form is not dirty  */}
				{ dirty === false && Response && <div className="alert alert-success">{props.translate(Response.message)}</div> }
				<div>
					<Translate id="Testimonial" /> *
					<Field component="textarea" name="testimonial" showError={true} className={`form-control ${errors.testimonial && touched.testimonial && 'is-invalid'}`} />
				</div>
				<div>
					<Translate id="Your Name" />
					<Field name="creatorName" showError={true} className={`form-control ${errors.creatorName && touched.creatorName && 'is-invalid'}`} />
				</div>
				<div>
					<Translate id="Your Email"/> *
					<Field name="email" showError={true} className={`form-control ${errors.email && touched.email && 'is-invalid'}`} />
				</div>
				<div className="mt-1">
	                <button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
	                    {initialValues.testimonialId === 0 && <Translate id={isSubmitting ? "SAVING..." : "SAVE"} />}
						{initialValues.testimonialId > 0 && <Translate id={"Update"} />}
	                </button>
					<Link to="/testimonials" className="btn btn-default ml-2">
						<Translate id="Cancel"/>
					</Link>
				</div>
			</Form>
		</SidebarColumn>
	);
};

const TestimonialCreateForm = compose (
	withMutation(TestimonialSaveMutation, "TestimonialSave"),
	withFormik({
		enableReinitialize: true,
		// map the supplied initialValues structure to make sure no values are undfiend.
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( TestimonialInputValues, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result into  testimonialSave
			const {data: { testimonialSave }} = await FormikForm.props.TestimonialSave({ input: TestimonialInputValues });

			FormikForm.props.setResponse(testimonialSave.Response);

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.testimonialSavedHandler(testimonialSave.Testimonial);
	   },
	   // Require Address and Type
	   validationSchema: () => Yup.object().shape({
			testimonial: Yup.string().required("Please enter a testimonial")
	   })
   }),
   withTranslate
)(TestimonialCreateFormContent);

class TestimonialCreateContent extends React.Component {
	constructor(props) {
	    super(props)

		this.state= {
			Testimonial: {
				creatorName: '',
				email: '',
				testimonial: '',
				testimonialId: 0
			}
		}
	}

	// Handler for when an item is clicked, will display the proper form on the left side.
	testimonialSavedHandler = (Testimonial) => this.setState({ Testimonial });

	render () {
		return (
			<React.Fragment>
				<TestimonialCreateForm
					initialValues={{
						creatorName: this.state.Testimonial.creatorName,
						email: this.state.Testimonial.email,
						testimonial: this.state.Testimonial.testimonial,
						testimonialId: this.state.Testimonial.testimonialId
					}}
					testimonialSavedHandler={this.testimonialSavedHandler}
				/>
			</React.Fragment>
		)
	}
}

export const TestimonialCreate = compose(
    withRouter
)(TestimonialCreateContent);
