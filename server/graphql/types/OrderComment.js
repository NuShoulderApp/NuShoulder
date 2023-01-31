const OrderCommentFields = `
    orderComment: String
    orderCommentId: ID
    orderCommentInternal: Int
    orderCommentMadeBy: String
    orderCommentStatus: String
    orderCommentType: String
    orderId: ID
`

export default `
    type OrderComment {
        companyName: String
        dateCreated: DateTime
        dateEnded: DateTime
        firstName: String
        lastName: String
        orderComment: String
        orderCommentId: ID
        orderCommentInternal: Int
        orderCommentMadeBy: String
        orderCommentStatus: String
        orderCommentType: String
    }

    type OrderCommentResponse {
		OrderComment: OrderComment
		Response: Response
	}

	input OrderCommentInput {
		${OrderCommentFields}
	}

    extend type RootMutation {
        orderCommentSave(input: OrderCommentInput!): OrderCommentResponse
    }

`;
