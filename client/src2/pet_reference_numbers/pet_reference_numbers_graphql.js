import gql from 'graphql-tag';

export const PetReferenceNumberGenerateMutation = gql`
    mutation petReferenceNumberGenerate($input: PetReferenceNumberInput!) {
		petReferenceNumberGenerate (input: $input) {
			Response{
				success
				message
			}
            PetReferenceNumbers {
                petReferenceNumber
            }
		}
	}
`;
