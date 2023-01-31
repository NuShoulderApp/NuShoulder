import gql from 'graphql-tag';

export const GetSpecies = gql`{
	Species {
		species
		speciesId
	}
}`;

export const getProductSpeciesQuery = gql`
	query getProductSpecies {
		ProductSpecies {
			productId
			productSpeciesId
			speciesId
		}
	}
`;
