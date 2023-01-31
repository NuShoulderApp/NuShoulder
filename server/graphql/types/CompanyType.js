// set of fields for both CompanyType and CompanyTypeInput for Query and Mutation to use
const CompanyTypeFields = `
    companyType: String
`
// main CompanyType types and inputs to be exported
export default `
	type CompanyType {
        companyTypeId: ID
		${CompanyTypeFields}
	}

	input CompanyTypeInput {
        companyTypeId: ID
		${CompanyTypeFields}
	}

	extend type RootQuery {
		CompanyTypes: [CompanyType]
	}
`;


