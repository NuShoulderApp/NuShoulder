// QUERIES
const ModuleRootResolvers = {
	// Get modules
	Modules(root, args, context) {
		return context.knex('modules');
	}
}
// EXPORT
export { ModuleRootResolvers as RootResolvers }
