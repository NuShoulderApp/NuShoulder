import React from 'react';
import { withRouter, NavLink} from "react-router-dom";
import { compose } from "react-apollo";

import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withSession } from '../utilities/session';

class InfoAboutFacilityClass extends React.Component {
	render () {
		if(this.props.Account.accountPrefix === "loyalpaws") {
			return (
				<React.Fragment>
					<div className="w-100">
						<div className="card-deck mt-5">
							<div className="card">
								<div className="card-body">
									<h3><Translate id="About Loyal Paws" /></h3>
									<div className="row">
										<div className="col-md-3">
											<p className="mb-1"><NavLink to={`/info/services`} className="btn btn-dark w-100 text-left" activeClassName="btn-info">{this.props.translate('Our Services')}</NavLink></p>
											<p className="mb-1"><NavLink to={`/info/facility`} className="btn btn-dark w-100 text-left" activeClassName="btn-info">{this.props.translate('Our Facility')}</NavLink></p>
										</div>
										<div className="col-md-9">
											<p><img src={process.env.PUBLIC_URL + "/images/photos/loyalpaws_facility_1.png"} alt="" /> <img src={process.env.PUBLIC_URL + "/images/photos/loyalpaws_facility_2.png"} alt="" /></p>
											<p><img src={process.env.PUBLIC_URL + "/images/photos/loyalpaws_facility_3.png"} alt="" /></p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</React.Fragment>
			)
		} else {
			return (<React.Fragment></React.Fragment>);
		}
	}
}

export const InfoAboutFacility = compose(
	withRouter,
	withSession,
	withTranslate
)(InfoAboutFacilityClass);
