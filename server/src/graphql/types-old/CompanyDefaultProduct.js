const CompanyDefaultProductFields = `
    companyDefaultProductId: ID
    companyId: ID
	productId: ID
	defaultProductId: ID
`;

// main CompanyDefaultProduct types and inputs to be exported
export default `
	type CompanyDefaultProduct {
        ${CompanyDefaultProductFields}
	}

	extend type RootQuery {
		CompanyDefaultProducts(companyId: ID, productId: ID): [CompanyDefaultProduct]
	}

`;
