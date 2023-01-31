import React from 'react';
import { withRouter} from "react-router-dom";
import { compose } from "react-apollo";

import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withSession } from '../utilities/session';

class InfoPetLossSupportClass extends React.Component {
	render () {
		if(this.props.Account.accountPrefix === "loyalpaws") {
			return (
				<React.Fragment>
					<div className="w-100">
						<div className="card-deck mt-5">
							<div className="card">
								<div className="card-body">
									<h3><Translate id="Pet Loss Support" /></h3>
									<h5>At Loyal Paws we understand that the loss of a pet can be overwhelming, and sometimes seeking help to cope with the grief and pain of this loss can be difficult.</h5>
									<p>Although it may not feel like it at your time of loss, the old saying “time heals” does hold true when we are faced with the loss of a beloved pet. It’s important to recognize that loss and allow yourself the emotional time and space to grieve. The amount of sorrow, guilt and pain that may be experienced varies from person to person, but such feelings are natural.</p>
									<p>We have compiled some useful resources below, as well as a list of relevant books that may help you cope with your loss. As pet owners that have also experienced similar loss, the most comforting words we can offer during this difficult time are those of understanding. If we can help in any way, please contact us at 1-800-969-9523.</p>
								
									<h4>Pet Loss Resources</h4>
									<table className="table">
										<tr>
											<td>ONTARIO VETERINARY COLLEGE PET LOSS SUPPORT</td>
											<td>Phone: (519) 842-4120 ext 53694</td>
											<td><a href="http://ovc.uoguelph.ca/petloss">VIEW WEBSITE</a></td>
										</tr>
										<tr>
											<td>ONTARIO PET LOSS SUPPORT GROUP</td>
											<td>Email: info@ontariopetloss.org</td>
											<td><a href="http://www.ontariopetloss.org/">VIEW WEBSITE</a></td>
										</tr>
										<tr>
											<td>PET LOSS SUPPORT LINE</td>
											<td>Phone: (240) 389-8047</td>
											<td></td>
										</tr>
									</table>

									<h4>Pet Loss Books</h4>
									<table className="table">
										<tr>
											<td>FINAL ACT OF CARING</td>
											<td>by Mary Montgomery</td>
											<td><a href="http://www.amazon.ca/Final-Act-Caring-Ending-Animal/dp/1879779021">PURCHASE</a></td>
										</tr>
										<tr>
											<td>THE LOSS OF A PET</td>
											<td>by Wallace Sife</td>
											<td><a href="http://www.amazon.ca/Loss-Pet-Wallace-Sife/dp/0764579304">PURCHASE</a></td>
										</tr>
										<tr>
											<td>GOODBYE, FRIEND</td>
											<td>by Gary Kowalski</td>
											<td><a href="http://www.amazon.ca/Goodbye-Friend-Healing-Wisdom-Anyone/dp/160868086X">PURCHASE</a></td>
										</tr>
										<tr>
											<td>WHEN A PET DIES</td>
											<td>by Fred Rogers</td>
											<td><a href="http://www.amazon.ca/When-Pet-Dies-Fred-Rogers/dp/0698116666">PURCHASE</a></td>
										</tr>
										<tr>
											<td>I'LL ALWAYS LOVE YOU</td>
											<td>by Hans Wilhelm</td>
											<td><a href="http://www.amazon.ca/Ill-Always-Love-Hans-Wilhelm/dp/0517572656">PURCHASE</a></td>
										</tr>
										<tr>
											<td>WHEN A FAMILY PET DIES</td>
											<td>by JoAnn Tuzeo-Jarolmen</td>
											<td><a href="http://www.amazon.ca/When-Family-Pet-Dies-Childrens/dp/1843108364">PURCHASE</a></td>
										</tr>
									</table>
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

export const InfoPetLossSupport = compose(
	withRouter,
	withSession,
	withTranslate
)(InfoPetLossSupportClass);
