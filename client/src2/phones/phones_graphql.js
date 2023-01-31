import gql from 'graphql-tag';

export const PhoneTypes = gql`
	query getPhoneTypes {
		PhoneTypes {
			phoneType,
			phoneTypeId
		}
	}
`;

export const PhoneCreateMutation = gql`
	mutation phoneCreate($input: phoneInput!) {
		phoneCreate (input: $input) {
            accountId,
            phone,
            phoneLabel,
            phoneTypeId
		}
	}
`;
