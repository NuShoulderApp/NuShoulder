// set of fields for both CompanyPhone and CompanyPhoneInput for Query and Mutation to use
const CompanyPhoneFields = `
    accountId: ID
    active: Int
	phone: String
    phoneId: ID
    phoneLabel: String
    phoneType: String
    phoneTypeId: ID
    companyId: ID
    companyPhoneId: ID

`
// main CompanyPhone types and inputs to be exported
export default `
	type CompanyPhone {
        ${CompanyPhoneFields}
	}

	type CompanyPhoneSaveResponse {
		Response: Response
		CompanyPhone: CompanyPhone
	}

	input CompanyPhoneInput {
		${CompanyPhoneFields}
	}

	extend type RootQuery {
		CompanyPhones(companyId: ID, userId: ID): [CompanyPhone]
	}

	extend type RootMutation {
		companyPhoneSave(input: CompanyPhoneInput!): CompanyPhoneSaveResponse!
		companyPhoneRemove(companyPhoneId: ID!): CompanyPhoneSaveResponse!
	}
`;
