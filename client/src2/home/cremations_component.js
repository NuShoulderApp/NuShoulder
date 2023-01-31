import React from 'react';
import { withRouter} from "react-router-dom";
import { compose } from "react-apollo";

import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withSession } from '../utilities/session';

class InfoCremationsClass extends React.Component {
	render () {
		if(this.props.Account.accountPrefix === "loyalpaws") {
			return (
				<React.Fragment>
					<div className="w-100">
						<div className="card-deck mt-1">
							<div className="card">
								<img src={process.env.PUBLIC_URL + "/images/photos/loyalpaws_cremation_communal.jpg"} alt="" className="card-img-top" />
								<div className="card-body">
									<h3><Translate id="Communal Cremation" /></h3>
									<p>During a communal cremation, your pet is gently placed in the crematorium in a group setting among other pets. </p>
									<p>The communally cremated remains are later interred in a communal burial plot at the Loyal Paws Memorial Gardens as a final tribute. Each communal burial plot is identified with a Loyal Paws cemetery marker. </p>
									<p>It is important to note that with this service, the cremated remains of your beloved pet will not be returned to you. You may want to consider creating a lasting keepsake of your pet with one of our beautiful kiln fired paw prints.</p>
								</div>
							</div>
							<div className="card">
							<img src={process.env.PUBLIC_URL + "/images/photos/loyalpaws_cremation_private.jpg"} alt="" className="card-img-top" />
								<div className="card-body">
									<h3><Translate id="Private Cremation" /></h3>
									<p>With our private cremation service, the crematory is reserved exclusively for your pet. Your pet will be cremated alone, and the cremated remains will be returned to you as a treasured keepsake. </p>
									<p>We no longer offer the outdated service of “individual” (partitioned) cremations at Loyal Paws - only 100% truly private cremations. </p>
									<p>Upon completion of the private cremation, the cremated remains of your pet will be carefully removed and secured in the urn of your choice and returned to your veterinary hospital, or held for pick up at our location. A signed certificate of cremation is included with this service.</p>
								</div>
							</div>
							<div className="card">
							<img src={process.env.PUBLIC_URL + "/images/photos/loyalpaws_cremation_visitation.jpg"} alt="" className="card-img-top" />
								<div className="card-body">
									<h3><Translate id="Viewing & Visitation" /></h3>
									<p>During this difficult and emotional time we offer you the opportunity to use our comfortable visitation room and say a private, final farewell to your pet. </p>
									<p>Upon completion of the visitation and private cremation at our facility, you will be able to take the cremated remains of your beloved pet home with you. </p>
									<p>If you select this service we will contact you to arrange an appointment that fits your schedule. We are the only crematory to offer this service after regular working hours and on weekends.</p>
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

export const InfoCremations = compose(
	withRouter,
	withSession,
	withTranslate
)(InfoCremationsClass);
