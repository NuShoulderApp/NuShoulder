// set of fields for both UserPhone and UserPhoneInput for Query and Mutation to use
const UserPhoneFields = `
    accountId: ID
    active: Int
	phone: String
    phoneId: ID
    phoneLabel: String
    phoneType: String
    phoneTypeId: ID
    userId: ID
    userPhoneId: ID

`;

const UserCompanyPhoneFields = `
    userCompanyPhoneId: ID
    userId: ID
    companyPhoneId: ID
`;

// main UserPhone types and inputs to be exported
export default `
	type UserPhone {
        ${UserPhoneFields}
	}

	type UserPhoneSaveResponse {
		Response: Response
		UserPhone: UserPhone
	}

    input UserPhoneInput {
        ${UserPhoneFields}
    }

    type UserCompanyPhone {
        phone: String
        phoneLabel: String
        phoneType: String
        ${UserCompanyPhoneFields}
    }

    type UserCompanyPhoneSaveResponse {
        Response: Response
        UserCompanyPhone: UserCompanyPhone
    }

	input UserCompanyPhoneInput {
		${UserCompanyPhoneFields}
	}

	extend type RootQuery {
        UserCompanyPhones(userId: ID!): [UserCompanyPhone]
		UserPhones(userId: ID!): [UserPhone]
	}

	extend type RootMutation {
        userCompanyPhoneSave(input: UserCompanyPhoneInput!): UserCompanyPhoneSaveResponse!
		userCompanyPhoneRemove(userCompanyPhoneId: ID!): UserCompanyPhoneSaveResponse!
        userPhoneSave(input: UserPhoneInput!): UserPhoneSaveResponse!
		userPhoneRemove(userPhoneId: ID!): UserPhoneSaveResponse!
	}
`;
