// set of fields for both TestimonialStatus and TestimonialStatusInput for Query and Mutation to use
const TestimonialStatusFields = `
    testimonialStatus: String
`;

// main TestimonialStatus types and inputs to be exported
export default `
	type TestimonialStatus {
        testimonialStatusId: ID
		${TestimonialStatusFields}
	}

	input TestimonialStatusInput {
        testimonialStatusId: ID
		${TestimonialStatusFields}
	}

	extend type RootQuery {
		TestimonialStatuses: [TestimonialStatus]
	}
`;
