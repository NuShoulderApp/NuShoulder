// set of fields for both Memorial and MemorialInput for Query and Mutation to use
const MemorialFields = `
	authorEmail: String

	# pets table doesn't have breed.
	breed: String

	# duplicate from pets table.
	petName: String

	# Also duplicate from pets table.
	speciesId: ID

	memorialId: ID
	accountId: String
	dateCreated: DateTime
	dateBorn: Date
	dateDied: Date
	memorial: String
	memorialStatusId: ID
	memorialStatus: String

	# TODO: consider removing this in favor of using Pet type
	petId: ID
`;

// main Memorial types and inputs to be exported
export default`
	type Memorial {
		${MemorialFields}
		images: [MemorialImage]!

		# NOTE: this 'petSpecies' field is the same as the one inside the 'pet' field.
		#		Both are here because the petSpeciesId column is duplicated between the tables.

		# using species type so that client can easily + directly access related speciesId if they like
		petSpecies: Species

		# currently, client should prefer data in the memorials table -- this shouldn't be used often.
		pet: Pet
	}

	type MemorialResponse {
		Response: Response
		Memorial: Memorial
	}

	input MemorialListCursorInput {
		after: ID
	}

	type MemorialListCursor {
		after: ID
	}

	type MemorialList {
		memorials: [Memorial]!
		cursor: MemorialListCursor!
	}

	input MemorialInput {
		${MemorialFields}
		images: [ID!]
	}

	extend type RootQuery {
		Memorial(memorialId: ID!): Memorial
		Memorials(memorialStatusId: ID, cursor: MemorialListCursorInput): MemorialList!
	}

	extend type RootMutation {
		#memorialCreate(input: MemorialInput!): MemorialCreateResponse!
		memorialCreate(input: MemorialInput!): MemorialResponse!
		memorialUpdate(input: MemorialInput!): MemorialResponse!
	}
`;


