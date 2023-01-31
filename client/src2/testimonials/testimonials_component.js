import React from 'react';
import { withRouter, Link } from "react-router-dom";
import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Translate, withTranslate } from '../translations/IWDTranslation';
// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading } from '../utilities/IWDDb';
import { DetailColumn } from '../layouts/application';

import {
	getTestimonialsQuery
} from './testimonials_graphql';


const TestimonialsContent = (props) => {
	const {
		data: {
            Testimonials
        },
        match: {
            isExact
        }
	} = props;

	return (
		<DetailColumn>
            <div className="container card p-3">
				<h3 className="">
					{
	                    // If we are on the testimonial page and we are logged out, show the add testimonial button.
	                    isExact && props.Session.LoggedIn === false &&
	                    <Link to={`/testimonials/testimonial_create`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="ADD TESTIMONIAL"/> </Link>
	                }
	                {
	                    // If we are on the testimonial page and we are logged in, show the review testimonials button.
	                    isExact && props.Session.LoggedIn === true &&
	                    <Link to={`/testimonials_review`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="pen" /> <Translate id="REVIEW TESTIMONIALS"/> </Link>
	                }
					<Translate id="Testimonials"/>
				</h3>
				<div className="">
					{ Testimonials.map((testimonial) => {
		                return (
		                    <blockquote className="blockquote border-bottom pb-3 pt-3" key={testimonial.testimonialId}>
		                        <p className="mb-0">&ldquo;{testimonial.testimonial}&rdquo;</p>
								<footer className="blockquote-footer">{testimonial.creatorName}</footer>
		                    </blockquote>
		                )
		            })}
				</div>
			</div>

		</DetailColumn>
	);
};

export const Testimonials = compose(
    withRouter,
    queryWithLoading({ gqlString: getTestimonialsQuery, variablesFunction: (props) => ({testimonialStatusId: 3}) }),
    withTranslate
)(TestimonialsContent);
