import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withRouter} from "react-router-dom";
import { compose } from "react-apollo";

import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withSession } from '../utilities/session';

class InfoContactClass extends React.Component {
	render () {
		if(this.props.Account.accountPrefix === "loyalpaws") {
			return (
				<React.Fragment>
					<div className="w-100">
						<div className="card-deck mt-5">
							<div className="card">
								<div className="card-header"><h3 className="m-0"><Translate id="Email us" /></h3></div>
								<div className="card-body">
									<h5>Always a fast response</h5>
									<a href="mailto:info@loyalpaws.com" className="btn btn-outline-dark"><FontAwesomeIcon icon="paper-plane" /> info@loyalpaws.com</a>
								</div>
							</div>
							<div className="card">
								<div className="card-header"><h3 className="m-0"><Translate id="Call us" /></h3></div>
								<div className="card-body">
									<h5>Here to help you</h5>
									<p><a href="tel:800-969-9523" className="btn btn-outline-dark"><FontAwesomeIcon icon="phone" /> (800) 969-9523</a></p>
									<p><a href="tel:519-766-9999" className="btn btn-outline-dark"><FontAwesomeIcon icon="phone" /> (519) 766-9999</a></p>
								</div>
							</div>
							<div className="card">
								<div className="card-header"><h3 className="m-0"><Translate id="Visit us" /></h3></div>
								<div className="card-body">
									<h5><Translate id="Address" /></h5>
									<p>Loyal Paws<br />
										3779 S. Ortonville Rd,<br />
										Clarston, MI 48348</p>
									<p><a href="https://www.google.ca/maps/place/7076+Wellington+County+Road+124,+Guelph%2FEramosa,+ON+N0B/@43.4977988,-80.2756654,17z/data=!3m1!4b1!4m2!3m1!1s0x882b857cc50c4a5b:0x7de17d61fdd2b083" target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark"><FontAwesomeIcon icon="map-marker-alt" /> Map</a></p>
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

export const InfoContact = compose(
	withRouter,
	withSession,
	withTranslate
)(InfoContactClass);
