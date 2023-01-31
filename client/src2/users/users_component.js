import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withRouter, Link } from "react-router-dom";
import { Translate } from '../translations/IWDTranslation';

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { QueryTagWithLoading } from '../utilities/IWDDb';

// GRAPHQL QUERY
import { getUsersQuery } from './users_graphql';

export const UsersContent = withRouter((props) => (
	<React.Fragment>
		<h4 className="flex-child flex-auto flex-child-header">
			{
				// If we are not in the create route, show the add user button.
				props.match.isExact &&
				<Link to={`${props.match.url}/user_create`} className="btn btn-info btn-addon float-right">
					<FontAwesomeIcon icon="plus" />
					<Translate id="ADD USER"/>
				</Link>
			}
			<Translate id="Users"/>
		</h4>
		<div className="flex-child flex-scroll">
			{ props.data.Users.map(({ userId, firstName, lastName }) => (
				<div key={userId}>
					<h5 className="clearfix border-bottom">
						<Link to={`${props.match.url}/user/${userId}`} className="btn btn-info btn-sm btn-addon float-right">
							<FontAwesomeIcon icon="pen" />
							<Translate id="EDIT"/>
						</Link>
						<Link to={`${props.match.url}/user/${userId}`} className="btn btn-light"> {firstName} {lastName} </Link>
					</h5>
				</div>
				))
			}
		</div>
	</React.Fragment>
));

export const Users = (props) => (
	<QueryTagWithLoading
		query={ getUsersQuery }
		variables={ { accountId: 1, userTypeId: 1 } }
		Component={ UsersContent } />
);
