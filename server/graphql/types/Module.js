// set of fields for both Module and ModuleInput for Query and Mutation to use
const ModuleFields = `
    active: ID
    label: String
    name: String
`;

// main Module types and inputs to be exported
export default `
	type Module {
        moduleId: ID
		${ModuleFields}
	}

	input ModuleInput {
        moduleId: ID
		${ModuleFields}
	}

	extend type RootQuery {
		Modules: [Module]
	}
`;
