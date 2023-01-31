// main User types and inputs to be exported
const SignatureTypes = `
	type Signature {
		signatureId: ID
		collectedBy: User
		dateCreated: Date
		signatureData: String
		signatureFilename: String
		signatureName: String
	}

	input SignatureUpload {
		#collectedById: ID
		signatureData: String!
		signatureFilename: String
		signatureName: String
	}

	type SignatureSaveResult {
		Response: Response
		Signature: Signature
	}

	extend type RootMutation {
		saveSignature(signatureInput: SignatureUpload!, userId: ID): SignatureSaveResult
	}
`;

export default SignatureTypes;