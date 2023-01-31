// set of fields for both Company and CompanyInput for Query and Mutation to use
const CompanyFields = `
	accountId: ID
	accountNumber: String
	active: Int
	allowHomeMemorialization: Int
	bccHospitalForCustomerEmails: Int
	communalPawPrintAllowed: String
	companyId: ID
	companyName: String
	companyNameLegal: String
	companyDescription: String
	companyIconId: Int
	companyLogoId: Int
	companyTypeId: ID
	courierDeliveryOffered: Int
	crematoryPickupOffered: Int
	cremationTypesOffered: String
	defaultDiscount: Float
	defaultUnits: String
	expeditedCremationAllowed: Int
	homeMemorializationsEditCremation: Int
	hospitalDeliveryOffered: Int
	hoursOfOperation: String
	invoiceEmail: String
	payAtPickupOffered: Int
	payByCreditCardOffered: Int
	payVetOrderByCreditCardOffered: Int
	paymentTerms: String
	petReferenceNumberAutoGenerate: Int
	requireInitialsEditOrderDetails: Int
	sendOwnerEmailCompletedDelivered: Int
	visitationAllowed: Int
`;

// main Company types and inputs to be exported
export default `
	type Company {
		CompanyAddresses: [CompanyAddress]
		CompanyDepartments: [CompanyDepartment]
		CompanyPhones: [CompanyPhone]
		Users: [User]
		${CompanyFields}
		Products: [Product]
	}

	type CompanyResponse {
		Company: Company
		Response: Response
	}

	input CompanyInput {
		${CompanyFields}
	}

	extend type RootQuery {
		Companies(accountId: ID): [Company]
		Company(companyId: ID!): Company
		InvoiceableCompanies: [Company]
	}

	extend type RootMutation {
		companySave(input: CompanyInput!): CompanyResponse!
	}
`;
