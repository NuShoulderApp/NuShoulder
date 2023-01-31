import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, withRouter } from "react-router-dom";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { QueryTagWithLoading } from '../utilities/IWDDb';
import { Translate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import { getCompaniesQuery } from './companies_graphql';

export const Companies = withRouter(({ match: { isExact } }) =>
	<QueryTagWithLoading
		query={ getCompaniesQuery }
		requiredPermission={{ permission: "companies", permissionLevel: 4 }}
		variables={ { accountId: 0 } }>

		{ (props) => (
			<React.Fragment>
				<div className="w-100 p-1">
					<h3><span className="text-white text-shadow"><Translate id="Hospitals"/></span>
						{ 	// If we are in the create route then do not show the Add Company button.
							isExact &&
							<Link to={`/companies/create`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="ADD HOSPITAL"/> </Link>
						}</h3>
					<div className="card p-3">
						{ props.data.Companies.map(({ companyId, companyName, companyNameLegal }) => (
							<div key={companyId}>
								<p className="border-bottom clearfix">
									<Link to={`/company/${companyId}`} className="btn btn-info btn-sm btn-addon float-right"><FontAwesomeIcon icon="pen" />  <Translate id="EDIT"/> </Link>
									<Link to={`/company/${companyId}`} className="text-dark h6"> {`${companyName} / ${companyNameLegal}`} </Link>
								</p>
							</div>
							))
						}
					</div>
				</div>
			</React.Fragment>
		)}
	</QueryTagWithLoading>
);
