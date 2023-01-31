export default `
	type ProductOptionType {
		productOptionTypeId: ID
		typeName: String
	}

	extend type RootQuery {
		ProductOptionTypes: [ProductOptionType]
	}
`;
