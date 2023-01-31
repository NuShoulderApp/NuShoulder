import React from 'react';
import { withRouter, NavLink} from "react-router-dom";
import { compose } from "react-apollo";

import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withSession } from '../utilities/session';

class InfoAboutServicesClass extends React.Component {
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
											<h4>At Loyal Paws, our mission, first and foremost, is to commemorate the special and unique lifelong bond that people have with their pets.</h4>
											<p>We are a family owned and operated pet crematory committed to providing the highest level of aftercare for all pets being placed in our care.</p>
											<p>Our crematory is located in the Township of Brandon / City of Clarkston. Our contact and address information can be found <NavLink to={`/info/contact`}>here</NavLink>.</p>
											<p>We offer <NavLink to={`/info/cremations`}>cremation services</NavLink> as well as a wide range of memorial products.</p>
											<p>Our facility operates on three important principles: <strong>Dignity, Compassion and Respect</strong>. It is our promise that once in our care, your pet will be cared for as if it were our own.</p>
											<p>Our crematory adheres to a strict code of ethics and practices in all aspects of our operation. All pets entering our facility are assigned a unique pet record and pet reference number (tagged and barcoded) that follows them through every step of the cremation process, ensuring accuracy and accountability.</p>
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

export const InfoAboutServices = compose(
	withRouter,
	withSession,
	withTranslate
)(InfoAboutServicesClass);
