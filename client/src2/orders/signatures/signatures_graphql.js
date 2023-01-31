import gql from 'graphql-tag';

export const SaveSignatureTest = gql`mutation testSignatures($sigInput:SignatureUpload!, $userId:ID) {
	saveSignature(signatureInput:$sigInput, userId:$userId) {
		Response{
			message
			success
		}
		Signature{
			signatureData
			signatureName
			signatureId
		}
	}
}`;