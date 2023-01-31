const TestimonialStatusRootResolvers = {
	async TestimonialStatuses(root, args, context) {
		return await context.knex('testimonialStatuses');
	}
}

// EXPORT
export { TestimonialStatusRootResolvers }
