const OrderFileFields = `
    documentDisplayName: String
    fileId: ID!
    orderId: ID!
    orderFileId: ID
    uploaderId: ID
`

export default `
    type OrderFile {
        ${OrderFileFields}
        File: File
        firstName: String
        lastName: String
    }

    input OrderFileSaveInput {
        ${OrderFileFields}
	}

    extend type RootQuery {
		OrderFiles(orderId: ID): [OrderFile]
	}

    extend type RootMutation {
        orderFileSave(input: OrderFileSaveInput!): OrderFile
    }

`;
