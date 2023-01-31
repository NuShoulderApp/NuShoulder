import gql from 'graphql-tag';

/*
	This is the same as the memorials query, just use that for now

// get list of memorials (for current account) -- for showcase page
export const GetMemorials = gql`
query MemorialList ($memorialStatusId: ID) {
	Memorials (memorialStatusId: $memorialStatusId) {
		memorialId
		authorEmail
		breed
		dateBorn
		dateDied
		memorial
		petName
		petId
		petSpecies {
			species
			speciesId
		}
	}
}`;
*/

export const updateMemorialStatus = gql`
mutation updateMemorialStatus($newStatusId: ID!, $memorialId: ID!) {
	memorialUpdate(input: { memorialStatusId: $newStatusId, memorialId: $memorialId}) {
		# return Memorial with updated statusId in result
		Memorial {
			memorialId
			memorialStatusId
		}	
		Response {
			message
			success
		}
	}
}
`;