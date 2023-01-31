import React from 'react';
import { withRouter, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Translate } from '../translations/IWDTranslation';
import { compose } from "react-apollo";

import { withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
// import { GetCremationOrders } from './cremations_graphql';

const BurialOrdersPerformContent = (props) => {
	return (
		<React.Fragment>
			<div className="container">
				{/* SELECT THE MACHINE TO USE & THE CREMATION TYPE TO PERFORM */}
				<div className="border bg-light p-3 mt-3 mb-3">
					<div className="row">
						<div className="col-md">
							<label>Cemetary</label>
							<select name="cemetaryId" vale="" className="form-control">
								<option>LP Cemetary</option>
							</select>
						</div>
						<div className="col-md">
							<label>Plot</label>
							<input type="text" className="form-control" name="burialPlot" />
						</div>
					</div>
					<div className="row">
						{/* CHECK OFF THE CREMATION TYPE FROM THE TYPES ALLOWED FOR THIS MACHINE - Communal, Individual, Private */}
						<div className="col-md-auto">
							<div className="form-check h5 mt-2 pl-0">
								<div className="pretty p-default p-pulse mr-0">
									<input className="form-check-input" type="checkbox" id="cemetaryBurial" />
									<div className="state p-primary form-check-label"><label htmlFor="cemetaryBurial"><Translate id="Cemetary Burial" /></label></div>
								</div>
							</div>
						</div>
						<div className="col-md-auto">
							<div className="form-check h5 mt-2 pl-0">
								<div className="pretty p-default p-pulse mr-0">
									<input className="form-check-input" type="checkbox" id="communalBurial" checked="checked" />
									<div className="state p-primary form-check-label"><label htmlFor="communalBurial"><Translate id="Communal Burial" /></label></div>
								</div>
							</div>
						</div>
						<div className="col-md-auto">
							<div className="form-check h5 mt-2 pl-0">
								<div className="pretty p-default p-pulse mr-0">
									<input className="form-check-input" type="checkbox" id="communalScatter" checked="checked" />
									<div className="state p-primary form-check-label"><label htmlFor="communalScatter"><Translate id="Communal Scatter" /></label></div>
								</div>
							</div>
						</div>
					</div>

					{/* IF LOG IS STARTED - FORM TO ENTER OR SCAN REFERENCE NUMBERS FOR CREMATION - MUST VALIDATE THAT THEY ARE READY - no holds, vistations, paw prints, etc. still needed */}
					<div className="form-inline mt-3 border-top pt-3">
						<label>Enter / Scan Reference #</label>
						<input type="text" name="petReferenceNumber" value="" className="form-control ml-3" />
						<Link to={`/new_orders/cremation`} className="btn btn-success btn-addon"><FontAwesomeIcon icon="plus" /> <Translate id="Add Pet"/> </Link>
					</div>
				</div>

				<ul className="list-group">
					<li className="list-group-item">
						<Link to={`/new_orders/cremation`} className="btn btn-danger btn-addon btn-sm float-right"><FontAwesomeIcon icon="trash" /> <Translate id="Remove"/> </Link>
						<div className="mt-1"><span className="h5">SC24KER</span> Spotty Hall</div>
					</li>
					<li className="list-group-item">
						<Link to={`/new_orders/cremation`} className="btn btn-danger btn-addon btn-sm float-right"><FontAwesomeIcon icon="trash" /> <Translate id="Remove"/> </Link>
						<div className="mt-1"><span className="h5">NKCCEGZ</span> Fido Hall</div>
					</li>
				</ul>

				<div className="col-md-auto mt-3">
					{/* SAVE THE BURIAL LOG ENTRIES */}
					<Link to={`/new_orders/cremation`} className="btn btn-success btn-addon"><FontAwesomeIcon icon="check" /> <Translate id="Save Burial Log"/> </Link>
				</div>

			</div>
		</React.Fragment>
	);
};

export const BurialOrdersPerform = compose(
	withRouter,
	withTranslate
)(BurialOrdersPerformContent);
