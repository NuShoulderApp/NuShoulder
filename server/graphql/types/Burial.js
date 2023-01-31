const BurialFields = `
    accountId: ID
	burialId: ID
    burialLogId: ID
    orderId: ID
    orderProductId: ID
    petReferenceNumber: String
`;

export default `
	type Burial {
        ${BurialFields}
	}

	input BurialInput {
		${BurialFields}
	}

	extend type RootMutation {
		BurialSave(input: BurialInput!): Burial
	}

    extend type RootQuery {
		Burial(burialId: ID!): Burial
		Burials(burialLogId: ID!): [Burial]
    }

`;