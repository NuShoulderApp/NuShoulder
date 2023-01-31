export default `
	type PetReferenceNumber {
		petReferenceNumber: String
	}
	type PetReferenceNumberResponse {
		Response: Response,
		PetReferenceNumbers: [PetReferenceNumber]
	}

	input PetReferenceNumberInput {
		numberToGenerate: Int
	}

	extend type RootMutation {
		petReferenceNumberGenerate(input: PetReferenceNumberInput!): PetReferenceNumberResponse!
	}

`;
