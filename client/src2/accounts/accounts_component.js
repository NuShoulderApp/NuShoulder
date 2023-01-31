import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withRouter, Link } from "react-router-dom";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { QueryTagWithLoading } from '../utilities/IWDDb';

import { Translate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import { getAccountsQuery } from './accounts_graphql';

export const Accounts = withRouter(({ match: { isExact } }) => (
	<QueryTagWithLoading
		requiredPermission={{ userTypeId: 1 }}
		query={ getAccountsQuery }>
		{ (props) => (
			<React.Fragment>
				<div className="flex-child flex-auto flex-child-header">
					<Translate id="Accounts"/>
					{
						// If we are not in the create route, show the add account button.
						isExact &&
						<Link to={`/accounts/account_create`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="ADD ACCOUNT"/> </Link>
					}
				</div>
				<div className="flex-child flex-scroll">
					{ props.data.Accounts.map(({ accountId, accountName }) => (
						<div key={accountId}>
							<p className="border-bottom">
								<Link to={`/account/${accountId}`} className="btn btn-light"> {accountName} </Link>
								<Link to={`/account/${accountId}`} className="btn btn-info btn-sm btn-addon float-right"><FontAwesomeIcon icon="pen" />  <Translate id="EDIT"/> </Link>
							</p>
						</div>
						))
					}
				</div>
				</React.Fragment>
		)}
	</QueryTagWithLoading>
));
