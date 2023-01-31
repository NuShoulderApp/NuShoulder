import gql from 'graphql-tag';

export const getTestimonialsQuery = gql`
    query getTestimonials($testimonialStatusId: ID) {
		Testimonials (testimonialStatusId: $testimonialStatusId) {
		    accountId,
		    creatorName,
		    email,
		    testimonial,
            testimonialId,
            testimonialStatus,
            testimonialStatusId
		}
        TestimonialStatuses {
            testimonialStatus,
            testimonialStatusId
        }
    }`;

export const getTestimonialStatuses = gql`
	query getTestimonialStatuses {
		TestimonialStatuses {
			testimonialStatus,
			testimonialStatusId
		}
	}
`;

export const TestimonialSaveMutation = gql`
	mutation testimonialSave($input: TestimonialInput!) {
		testimonialSave (input: $input) {
			Response{
				success
				message
			}
			Testimonial {
				accountId,
				creatorName,
				email,
	            testimonial,
                testimonialId,
	            testimonialStatusId,
                testimonialStatus
			}
		}
	}
`;
