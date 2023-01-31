import { Response } from "../../utilities/helpers";

// NOTE: use camelCase for fields and PascalCase for types and objects

const TestimonialSubResolvers = {

}

// QUERIES
const TestimonialRootResolvers = {
	// Get Testimonial - gets an array and then returns the .first() entry
	// Set this function as async so we can wait on the knex calls.
	Testimonial(root, {testimonialId}, context) {
		return context.knex('testimonials')
			.where('testimonials.testimonialId', testimonialId )
			.where('accountId', context.Account.accountId)
			.first();
	},

	Testimonials: async (root, { testimonialStatusId }, context) => {
		if(testimonialStatusId !== '') {
			return await context.knex('testimonials')
				.join('testimonialStatuses', 'testimonialStatuses.testimonialStatusId', 'testimonials.testimonialStatusId')
				.where('testimonials.testimonialStatusId', testimonialStatusId)
				.where('accountId', context.Account.accountId)
				.orderBy('testimonialId','desc');
		} else {
			return await context.knex('testimonials')
				.join('testimonialStatuses', 'testimonialStatuses.testimonialStatusId', 'testimonials.testimonialStatusId')
				.where('accountId', context.Account.accountId)
				.orderBy('testimonialId','desc');
		}
	}
}

// MUTATIONS
const TestimonialMutations = {
	// input is a Testimonial object with the data to insert or update
	async testimonialSave(root, { input }, context) {
		const { creatorName, email, testimonial, testimonialId, testimonialStatusId } = input;

		if(testimonialId > 0) {
			await context.knex('testimonials')
				.where({ testimonialId })
				.update({creatorName, email, testimonial, testimonialStatusId})

			return Response(true,"Testimonial Successfully Updated", {Testimonial: input});
		} else {
			// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
			const [testimonialId] = await context.knex('testimonials')
				.insert({accountId: context.Account.accountId, creatorName, email, testimonial, testimonialStatusId: 1})

			return Response(true,"Testimonial Successfully Saved", {Testimonial: {...input, testimonialId} });
		}
	}
}

// EXPORT
export { TestimonialSubResolvers, TestimonialMutations, TestimonialRootResolvers }
