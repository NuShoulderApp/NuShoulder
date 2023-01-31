import React from 'react';
import ReactDOM from 'react-dom';
import { Users } from './users_component';

import { MockedProvider } from 'react-apollo/test-utils';
import { getUsersQuery } from './users_graphql';

import { MemoryRouter } from '../utilities/IWDReactRouter';

const mocks = [
	{
		request: {
			query: getUsersQuery,
			variables: {
				accountId: 1
			}
		},
		result: {
			"data": {
				"Users": [
				  {
					"id": "1",
					"userId": "1",
					"accountId": "1",
					"dateCreated": "2018-08-27T18:04:58.000Z",
					"firstName": "Kevin",
					"lastName": "Hall",
					"middleName": "M",
					"salutation": "Mr",
					"userTypeId": "1"
				  }
				]
			}
		}
	}
]

test("Users Show Users", async () => {
	const div = document.createElement('div');
	const component = ReactDOM.render(
		<MockedProvider mocks={mocks} addTypename={false}>
		 	<MemoryRouter initialEntries={[ "/users" ]}>
				<Users accountId={1} />
			</MemoryRouter>
		</MockedProvider>, div
	);

	await new Promise((res) => setTimeout(res));

});
