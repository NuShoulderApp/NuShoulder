import React from 'react';
import _ from "lodash";
import { Form, Field, withFormik } from 'formik';	// for wrapping forms
import { withRouter } from "react-router-dom";
import { compose } from "react-apollo";

import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import { Translate, withTranslate } from '../translations/IWDTranslation';

import * as Yup from "yup";

import {
	getTestimonialsQuery,
	TestimonialSaveMutation
} from './testimonials_graphql';


const TestimonialReviewFormContent = (props) => {
	const {
		dirty,
		errors,
		handleTestimonialReview,
        isSubmitting,
		previousResponse,
		TestimonialStatuses,
		touched
	} = props;

	return (
		<React.Fragment>
			<Form>
				{/*  Display a resulting response message, only when there is a response and the form is not dirty  */}
				{ dirty === false && previousResponse &&<div className="alert alert-success">{previousResponse.message}</div> }
				<div>
					<Translate id="Testimonial" /> *
					<Field component="textarea" name="testimonial" className={`form-control ${errors.testimonial && touched.testimonial && 'is-invalid'}`} />
						{errors.testimonial && touched.testimonial && <div className="invalid-feedback"><Translate id="Testimonial Add Prompt" /></div>}
				</div>
				<div>
					<Translate id="Creator Name" />
					<Field name="creatorName" className={`form-control ${errors.creatorName && touched.creatorName && 'is-invalid'}`} />
				</div>
				<div>
					<Translate id="Status" />
					<Field component="select" name="testimonialStatusId" className={`form-control ${errors.testimonialStatusId && touched.testimonialStatusId && 'is-invalid'}`}>
						{/* This render to Static Markup is required because options don't like React children as the label */}
						{TestimonialStatuses.map((status) => {
							return <option value={status.testimonialStatusId} key={status.testimonialStatusId}>{props.translate(status.testimonialStatus)}</option>
						})}
					</Field>
				</div>
				<div className="mt-1">
					<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"} />
					</button>
					<button href="" className="btn btn-default ml-2" onClick={() => handleTestimonialReview('', '', 0, 0)}>
						<Translate id={dirty ? "Cancel" : "Close"} />
					</button>
				</div>
			</Form>
		</React.Fragment>
	);
};

const TestimonialReviewForm = compose (
	withMutation(TestimonialSaveMutation, "TestimonialSave", ["getTestimonials"]),
	withFormik({
		enableReinitialize: true,
		// map the supplied initialValues structure to make sure no values are undfiend.
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( TestimonialInputValues, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result into  testimonialSave
			const {data: { testimonialSave: { Response, Testimonial: { creatorName, testimonial, testimonialId, testimonialStatusId }} }} = await FormikForm.props.TestimonialSave({ input: TestimonialInputValues });

			//FormikForm.resetForm();
			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.handleTestimonialReview(creatorName, testimonial, testimonialId, testimonialStatusId, Response);
	   },
	   // Require Address and Type
	   validationSchema: () => Yup.object().shape({
			testimonial: Yup.string().required("Please enter a testimonial")
	   })
   }),
   withTranslate
)(TestimonialReviewFormContent);

class TestimonialReviewContent extends React.Component {
	constructor(props) {
	    super(props)

		this.state= {
			creatorName: '',
			previousResponse: null,
			testimonial: '',
			testimonialId: 0, // this is the id of the testimonial that is being reviewed currently
			testimonialStatusId: 0
		}
	}

	// Handler for when an item is clicked, will display the proper form on the left side.
	handleTestimonialReview = (creatorName, testimonial, testimonialId, testimonialStatusId, previousResponse = null) => this.setState({ creatorName, testimonial, testimonialId, testimonialStatusId, previousResponse });

	// statusChangeHandler = (testimonialStatusId, testimonialId) =>
	render () {
		const { Testimonials, TestimonialStatuses } = this.props.data;
		return (
			<div className="w-100 p-1">
				<div className="card p-3">
					{this.state.testimonialId === 0 &&
						<table className="table table-striped">
							<thead>
								<tr>
									<th><Translate id="Testimonial" /></th>
									<th><Translate id="Name / Email" /></th>
									<th><Translate id="Status" /></th>
									<th><Translate id="Review" /></th>
								</tr>
							</thead>
							<tbody>
								{Testimonials.map((testimonial) => {
									return (
										<tr key={testimonial.testimonialId}>
											<td>{testimonial.testimonial}</td>
											<td>{testimonial.creatorName} / {testimonial.email}</td>
											<td>{testimonial.testimonialStatus}</td>
											<td className="pl-0 pr-0">
												<button className="btn btn-info btn-sm" onClick={() => this.handleTestimonialReview(testimonial.creatorName, testimonial.testimonial, testimonial.testimonialId, testimonial.testimonialStatusId)}><Translate id="Review"/></button>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					}
					{this.state.testimonialId > 0 &&
						<TestimonialReviewForm
							handleTestimonialReview={this.handleTestimonialReview}
							initialValues={{
								creatorName: this.state.creatorName,
								testimonial: this.state.testimonial,
								testimonialId: this.state.testimonialId,
								testimonialStatusId: this.state.testimonialStatusId
							}}
							previousResponse={this.state.previousResponse}
							TestimonialStatuses={TestimonialStatuses}
						/>
					}
				</div>
			</div>
		)
	}
}

export const TestimonialReview = compose(
    withRouter,
	queryWithLoading({ gqlString: getTestimonialsQuery, variablesFunction: (props) => ({testimonialStatusId: ''}) }),
)(TestimonialReviewContent);
