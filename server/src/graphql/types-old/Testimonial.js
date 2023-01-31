// import { ResponseFields } from "./Response" // Consistent set of fields for the status of a Query or Mutation to be sent back with every response from the graphql server

// set of fields for both Testimonial and TestimonialInput for Query and Mutation to use
const TestimonialFields = `
	accountId: ID
	creatorName: String
	email: String
	testimonial: String
	testimonialId: ID
	testimonialStatus: String
	testimonialStatusId: ID
`;

// main Testimonial types and inputs to be exported
export default `
	type Testimonial {
		${TestimonialFields}
	}

	type TestimonialResponse {
		Testimonial: Testimonial
		Response: Response
	}

	input TestimonialInput {
		${TestimonialFields}
	}

	extend type RootQuery {
		Testimonials(testimonialStatusId: ID): [Testimonial]
		Testimonial(testimonialId: ID!): Testimonial
	}

	extend type RootMutation {
		testimonialSave(input: TestimonialInput!): TestimonialResponse!
	}

`;
