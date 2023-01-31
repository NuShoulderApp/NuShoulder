export default `
	type ProductView {
    accountId: ID
    loggedIn: Int
    orderId: ID
		productGroupId: ID
		productId: ID
    viewTimeEnd: DateTime
    viewTimeStart: DateTime
	}

	input ProductViewInput {
    orderId: ID
		productGroupId: ID
		productId: ID
	}

  type ProductViewResponse {
		Response: Response
	}

	extend type RootMutation {
		productViewSave(input: ProductViewInput!): ProductViewResponse!
	}

`;
