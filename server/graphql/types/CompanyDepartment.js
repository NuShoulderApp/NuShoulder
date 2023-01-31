// set of fields for both CompanyDepartment and CompanyDepartmentInput for Query and Mutation to use
const CompanyDepartmentFields = `
	companyDepartmentId: ID
    active: Int
	companyId: ID
	departmentName: String
`;

// main CompanyAddress types and inputs to be exported
export default `
	type CompanyDepartment {
        ${CompanyDepartmentFields}
        Route: [Route]
	}

	type CompanyDepartmentResponse {
		CompanyDepartment: CompanyDepartment
		Response: Response
	}

	input CompanyDepartmentInput {
		${CompanyDepartmentFields}
	}

	extend type RootQuery {
		CompanyDepartment(companyDepartmentId: ID): CompanyDepartment
		CompanyDepartments(companyId: ID): [CompanyDepartment]
	}

	extend type RootMutation {
		companyDepartmentSave(input: CompanyDepartmentInput): CompanyDepartmentResponse
		companyDepartmentRemove(companyDepartmentId: ID!): CompanyDepartmentResponse
	}
`;
