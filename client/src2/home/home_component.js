import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withFormik, Field } from "../utilities/IWDFormik";
import { withRouter, NavLink } from "react-router-dom";
import { withSession } from "../utilities/session";
import { withState } from "react-state-hoc";
import { compose } from "react-apollo";
// import { Collapse, DropdownToggle, DropdownMenu, DropdownItem, Nav, Navbar, NavItem, NavbarToggler, UncontrolledDropdown } from 'reactstrap';
import { Collapse, Nav, Navbar, NavbarToggler } from 'reactstrap';
import { withMutation } from '../utilities/IWDDb';
import * as Yup from "yup";
import moment from 'moment';


// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
//import { QueryTagWithLoading } from '../utilities/IWDDb';

// GRAPHQL QUERIES
//import { getUsersQuery } from './users_graphql';

import { Translate, withTranslate } from '../translations/IWDTranslation';

import {
	OrderCremationSaveMutation,
	PetReferenceNumberCheckMutation
} from '../orders/orders_graphql';

const HomeFormContent = (props) => {
	const {
		dirty,
		errors,
		handlePetReferenceNumberSubmit,
		history,
		OrderCremationSave,
		PetReferenceNumberCheck,
		Response,
		setResponse,
		setState,
		topNavOpen,
		touched,
		values
	} = props;

	let logoImage = "cs_logo_small.png";
	if(props.Account.accountPrefix) {
		logoImage = `${props.Account.accountPrefix}_logo.png`;
	}
	// set background images
	let style = {};
	if(props.Account.accountPrefix === "loyalpaws") {
		let bgNumber = 1;
		style.backgroundImage = `url(/images/ui/${props.Account.accountPrefix}_background${bgNumber}.jpg)`;
		style.backgroundSize = 'cover';
		style.backgroundPosition = 'center center';
		style.backgroundRepeat = 'no-repeat';
	} else {
		style.backgroundColor = '#DDD';
	}

	// change the alert message class if the message is successful or fails
	let responseAlertClass = Response && Response.success === false ? 'alert-danger' : 'alert-success';

	// Function for submitting the actual Reference Number form.
	async function submitForm() {
		// Async/Await Perform the mutation (to the server) and decompose the result.
		const { data: { petReferenceNumberCheck }} = await PetReferenceNumberCheck({ input: { petReferenceNumber: values.petReferenceNumber }});

		if(petReferenceNumberCheck.Response.success === false) {

			// re-initialize the form - the reference number entered is wrong
			handlePetReferenceNumberSubmit(values.petReferenceNumber);
			setResponse(petReferenceNumberCheck.Response);

		} 
		else if(petReferenceNumberCheck.Order.memorialization === 'clinic'){
			// Show Order Status Log Page to Pet Owner
			history.push(`/memorialization/status/${values.petReferenceNumber}`)
			
			// // re-initialize the form - this is an In Hospital memorialization
			// handlePetReferenceNumberSubmit(values.petReferenceNumber);
			// // show warning that this memorialization is being done at the Vet office.
			// setResponse({message: "Pet Reference Number Warning", success: false});

		} 
		else if(petReferenceNumberCheck.Order.memorialization === 'home'){

			// check to see if the dateMemorializationEnds is in the past
			if(moment().diff(moment(petReferenceNumberCheck.Order.dateMemorializationEnds)) > 0) {
				// Even though the memorialization window has closed, check to see if the 'tabMemorializationOpen' flag is set via the order details.
				if(parseInt(petReferenceNumberCheck.Order.tabMemorializationOpen) === 1) {
					// push to the memorialization process, this is a good reference number and memorialization is to be completed at home
					history.push(`/memorialization/referenceNumber/${values.petReferenceNumber}`)
				}

				// Show Order Status Log Page to Pet Owner
				history.push(`/memorialization/status/${values.petReferenceNumber}`)

				// // re-initialize the form to be able to see error message
				// handlePetReferenceNumberSubmit(values.petReferenceNumber);

				// // show warning that this memorialization window has closed
				// setResponse({message: "Memorialization Window Closed Warning", success: false});
			} else if(moment(petReferenceNumberCheck.Order.dateMemorializationEnds).diff(moment(), 'minutes') < 60) {
				// if the dateMemorializationEnds is within the next hour, add an extra hour on to it so that they have more time when they get to the memorialization page;
				const newdateMemorializationEnds = moment(petReferenceNumberCheck.Order.dateMemorializationEnds).add(1, 'hours').format();

				// update the dateMemorializationEnds
				await OrderCremationSave({ input: { orderId: petReferenceNumberCheck.Order.orderId, dateMemorializationEnds: newdateMemorializationEnds } });

				// push to the memorialization process, this is a good reference number and memorialization is to be completed at home
				history.push(`/memorialization/referenceNumber/${values.petReferenceNumber}`)
			} else {
				// push to the memorialization process, this is a good reference number and memorialization is to be completed at home
				history.push(`/memorialization/referenceNumber/${values.petReferenceNumber}`)
			}
		}
	}
//QTYZ2DZ
	function toggleTopNav() {
		//e.preventDefault();
		setState({
			topNavOpen: !topNavOpen
		})
	}

	return (
		<React.Fragment>
			<div id="root-bg" style={style}></div>
			<div id="top-container" className="flex-child column-parent">	{/* TOP CONTAINER INSIDE OF ROOT */}
				{/* TOP NAVIGATION */}
				<Navbar color="white" light expand="sm" className="fixed-top flex-child flex-auto">
					<NavLink to={`/`} className="navbar-brand" activeClassName="" exact><img src={process.env.PUBLIC_URL + "/images/logos/" + logoImage} alt="Home" style={{maxHeight: 75 + 'px'}} /></NavLink>
					<NavbarToggler onClick={() => toggleTopNav()}/>

					<Collapse isOpen={topNavOpen} navbar className="mt-4">
						<Nav className="mr-auto" navbar>
							{/* <NavItem><NavLink to={`/memorialize`} className="nav-link" activeClassName="active">{this.props.translate('Memorialize')}</NavLink></NavItem> */}
						</Nav>
						<div className="nav-item float-right"><NavLink to={`/`} className="nav-link text-secondary" activeClassName="false">Pet Owners</NavLink></div>
						<div className="nav-item float-right"><NavLink to={`/login`} className="nav-link text-secondary" activeClassName="false">Veterinarians</NavLink></div>
					</Collapse>
				</Navbar>

				{/* CONTENT CONTAINER */}
				<div id="content-container" className="flex-child row-parent" style={{marginTop: 106 + 'px'}}>
					{/* MAIN CONTENT CONTAINER */}
					<div id="main-content-container" className="flex-child column-parent">
						<div id="main-content" className="flex-child row-parent">	{/* MAIN CONTENT COLUMNS */}
							<div className="container pt-2">
								<div className="row text-center justify-content-center">
									<div className="col-auto text text-white">
										{/* <h4><Translate id="Reference Number Prompt"/>Enter Your Pet Reference Number Here</h4>
										<p><Translate id="Reference Number Prompt 2"/>Enter to Memorialize Your Pet</p> */}
										<h4 className="mb-3"><Translate id="Pet Owner Login"/></h4>
										<div>
											<Field name="petReferenceNumber" showError={true} placeholder={props.translate("Memorialization Placeholder")} className={`form-control text-center ${errors.petReferenceNumber && touched.petReferenceNumber && 'is-invalid'}`} />
										</div>
										<div className="mt-2">
											<button type="button" className="btn btn-warning btn-addon rounded" style={{backgroundColor: '#ec8333', borderColor: '#ec8333'}} onClick={() => submitForm()}><FontAwesomeIcon icon="paw" /> <Translate id="Reference Number Prompt"/></button>
										</div>
										{/*  Display a resulting status message.  */}
										{ Response && dirty === false && <div className="row mt-2"><div className={`col-12 mb-0 alert ${responseAlertClass}`} >{props.translate(Response.message)}</div></div> }
									</div>
								</div>

									{/*<div className="card">
										<div className="card-body">
											<h3><Translate id="Aftercare Prompt"/></h3>
											<p>{
												<Link to={`/memorialize`} className="btn btn-default btn-addon"><FontAwesomeIcon icon="angle-right" /> <Translate id="Start Here"/></Link>
											}</p>
										</div>
										</div>*/}

									{/* <div className="card">
										<div className="card-body">
											<h3><Translate id="Veterinarians"/></h3>
											<p>Login or Learn More</p>
											<p>{
												<Link to={`/login`} className="btn btn-default btn-addon"><FontAwesomeIcon icon="angle-right" /> <Translate id="Proceed"/></Link>
											}</p>
										</div>
									</div> */}
							</div>
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
};

const HomeForm = compose (
	withMutation(OrderCremationSaveMutation, "OrderCremationSave", ["getOrderProducts"]),
	withMutation(PetReferenceNumberCheckMutation, "PetReferenceNumberCheck"),
	withFormik({
		handleSubmit: async ( input, { props: { handlePetReferenceNumberSubmit, history, OrderCremationSave, PetReferenceNumberCheck, setResponse, }} ) => {

		},
		validationSchema: () => Yup.object().shape({
			petReferenceNumber: Yup.string().required("Enter a Pet Reference Number")
	   })
	}),
	withState({
		topNavOpen: false
	}),
	withTranslate
)(HomeFormContent);

class HomeClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			petReferenceNumber: ''
		}
	}

	handlePetReferenceNumberSubmit = (petReferenceNumber) => this.setState({petReferenceNumber});

	render () {
		return (
			<React.Fragment>
				<HomeForm
					Account={this.props.Account}
					handlePetReferenceNumberSubmit={this.handlePetReferenceNumberSubmit}
					history={this.props.history}
					initialValues={{
						petReferenceNumber: this.state.petReferenceNumber
					}}
				/>

			</React.Fragment>
		)
	}
}

export const Home = compose(
	withRouter,
	withSession,
	withTranslate
)(HomeClass);
