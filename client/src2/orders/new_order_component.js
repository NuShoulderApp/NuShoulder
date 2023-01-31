import React from 'react';
import { withRouter, Link } from "react-router-dom";
import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Translate, withTranslate } from '../translations/IWDTranslation';
// UTILITY FUNCTION to offload Loading and Error handling in the React Query component

const NewOrdersContent = (props) => {
	// const {
    //     isExact
	// } = props.match;

	// <Link to={`/new_orders/burial`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="New Burial Order"/> </Link>
	// <Link to={`/new_orders/products`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Product Only Order"/> </Link>

	// Work around created to push history to the cremation create order page via the New Cremation button in the header nav
	if(props.match.params && props.match.params.create_new && props.match.params.create_new === 'cremation') {
		props.history.push('/new_orders/new_order_type/cremation');
	}
	let style = {};
	style.backgroundImage = `url(/images/ui/loyalpaws_background1.jpg)`;
	style.backgroundSize = 'cover';
	style.backgroundPosition = 'center center';
	style.backgroundRepeat = 'no-repeat';
	style.height = '1000px';

	return (
		<React.Fragment>
			<div className="w-100 p-1" style={style}>
				<div className="card-group mt-1">
					<div className="card border-0 p-3">
						<div className="card-body text-center">
							<h4><Translate id="New Cremation Order"/></h4>
							<div className="display-3 rounded-circle bg-secondary p-4 text-white ml-auto mr-auto" style={{width: 125 + 'px', height: 125 + 'px'}}>
								<div className="text-center mt-n-2">
									<svg height="90" viewBox="0 0 70 80" width="80" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd" stroke="#FFF" strokeLinecap="round" strokeWidth="3" transform="translate(1.727379 2.124724)"><path d="m33.6202771 8.87527632c4.8686523 10.64697268 8.9058982 12.24511718 13.5742187 12.24511718 4.6683206 0 6.3701172-6.8374023 4.5488282-14.76269531-1.8212891-7.92529297-34.2204119-7.92529297-36.0454102-2.84082031-1.8249984 5.08447265 0 5.35839844-2.5131836 11.87792972-2.5131836 6.5195312-12.19579029 1.1506202-13.06835937 7.1738281-.87256909 6.0232079 3.20937021 11.1427016 10.64697267 13.4716797 7.4376024 2.328978 10.5534136-2.5292203 15.4663518-3.2832031 4.9129382-.7539829 4.5699043 1.118164 11.5292537 1.118164 6.9593493 0 11.0876263-2.9803756 13.0908203-1.118164 2.003194 1.8622115-4.7426758 4.9330354-4.7426758 9.2163085 0 4.2832732 3.5688476 3.8880397 3.5688476 6.4965821 0 2.6085423-.2061024 4.2877097-1.3442382 7.1420898-1.1381359 2.8543802 1.6626256 2.3738347 0 5.6601563-1.6626257 3.2863215-1.6992386 4.9794922-8.1108399 4.9794922s-8.3397168-4.8552429-11.2939453-4.9794922c-2.9542285-.1242494-7.7902832 3.4682617-6.6040039 4.9794922"/><path d="m39.4889294 48.1633623c-.8850911 4.7721354.7158203 6.1567382 4.8027344 4.1538085"/><path d="m20.3829724 12.3357255c.1165364 3.7278646 1.2791341 5.5917969 3.487793 5.5917969 3.4240118 0 5.0688476-3.026123 5.0688476-4.8999023"/></g></svg>
								</div>
							</div>
						</div>
						<div className="card-footer border-0" style={{background: "none"}}>
							<Link to={`/new_orders/new_order_type/cremation`} className="w-100 btn btn-info"><FontAwesomeIcon icon="angle-right" />  <Translate id="Continue"/> </Link>
						</div>
					</div>
					<div className="card border-0 p-3">
						<div className="card-body border-left border-right pl-3 pr-3 text-center">
							<h4><Translate id="Order Supplies"/></h4>
							<div className="display-3 rounded-circle bg-secondary p-4 text-white ml-auto mr-auto" style={{width: 125 + 'px', height: 125 + 'px'}}><div className="text-center mt-n-1"><FontAwesomeIcon icon="user-md" /></div></div>
						</div>
						<div className="card-footer border-top-0 border-left border-right" style={{background: "none"}}>
							<Link to={`/new_orders/supplies`} className="w-100 btn btn-info"><FontAwesomeIcon icon="angle-right" /> <Translate id="Continue"/> </Link>
						</div>
					</div>
					<div className="card border-0 p-3">
						<div className="card-body text-center">
							<h4><Translate id="Product Only Order"/></h4>
							<div className="display-3 rounded-circle bg-secondary p-4 text-white ml-auto mr-auto" style={{width: 125 + 'px', height: 125 + 'px'}}><div className="text-center"><FontAwesomeIcon icon="cart-plus" /></div></div>
						</div>
						<div className="card-footer border-0" style={{background: "none"}}>
							<Link to={`/new_orders/new_order_type/products`} className="w-100 btn btn-info"><FontAwesomeIcon icon="angle-right" /> <Translate id="Continue"/> </Link>
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
};

export const OrdersNew = compose(
    withRouter,
    withTranslate
)(NewOrdersContent);
