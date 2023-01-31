export default `
	type ProductSpecies {
		productSpeciesId: ID
		productId: ID
		speciesId: ID
	}

	extend type RootQuery {
		ProductSpecies: [ProductSpecies]
	}

`;
