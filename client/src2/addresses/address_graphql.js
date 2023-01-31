import gql from 'graphql-tag';

export const getAddressQuery = gql`
    query getAddress($addressId: ID!){
        Address(addressId: $addressId) {
			accountId
			address1
			address2
			addressId
			addressTypeId
			city
            countryId
            ownerName
			postalCode
            state
			stateId
			deliveryInstructions
        }
	}
`;

export const getAddressTypes = gql`
    query getAddressTypes{
        AddressTypes {
            addressType,
            addressTypeId
        }
        Countries {
			countryId
			country
			States {
            	state,
            	stateId
			}
		}
	}
`;

export const AddressSaveMutation = gql`
    mutation AddressSave($input: AddressInput!) {
		AddressSave (input: $input) {
            accountId
			address1
			address2
			addressId
			addressTypeId
			city
            countryId
            ownerName
			postalCode
            state
			stateId
			deliveryInstructions
		}
	}
`;
