import React from 'react';
import { NavLink} from "react-router-dom";
import { compose, graphql } from "react-apollo";
import { withFormik, Form, Field } from "../utilities/IWDFormik";	// for wrapping forms
import { withRouter } from '../utilities/IWDReactRouter'; // for URL routing
import { withSession } from "../utilities/session";
import { withState } from "react-state-hoc";
// import { Collapse, DropdownToggle, DropdownMenu, DropdownItem, Nav, Navbar, NavItem, NavbarToggler, UncontrolledDropdown } from 'reactstrap';
import { Collapse, Nav, Navbar, NavbarToggler } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import * as Yup from "yup";

// GRAPHQL QUERY
import { LoginMutation } from './auth_graphql';

import { UserCreateTemporaryPasswordMutation } from "../users/users_graphql";

import { Translate, withTranslate } from '../translations/IWDTranslation';

// MAIN RENDER COMPONENT:  main content that will render, need to wrap the output function in withRouter to get the Breadcrumb to have match.url
const LoginPasswordComponent = (props) => {
	const {
		errors,
		isSubmitting,
		setState,
		topNavOpen,
		touched,
		Response
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

	function toggleTopNav() {
		//e.preventDefault();
		setState({
			topNavOpen: !topNavOpen
		})
	}

	// Login FORM
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

							<div className="container text-center mt-2">
								<div className="row justify-content-center">
									<div className="col-auto text-white">
										<h4 className="mb-3"><Translate id="Veterinarian Login"/></h4>
										<React.Fragment>
											{ Response && <div className="alert alert-danger">{props.translate(Response.message)}</div> }
											<Form>
												<div>
													<Field style={{width: 350+'px'}} showError={true} name="username" placeholder={props.translate("Login Username Placeholder")} className={`form-control ${errors.username && touched.username && 'is-invalid'}`} />
												</div>
												<div className="mt-2">
													<Field showError={true} autoComplete="password" type="password" name="password" placeholder={props.translate("Password Placeholder")} className={`form-control ${errors.password && touched.password && 'is-invalid'} `} />
												</div>
												<button style={{width: 350+'px', backgroundColor: '#ec8333', borderColor: '#ec8333'}} type="submit" className="btn btn-warning btn-addon rounded mt-2" disabled={isSubmitting}>
													<FontAwesomeIcon icon="lock" />
													<Translate id={isSubmitting ? "LOGGING IN..." : "LOGIN"}/>
												</button>
												{/* <div>
													<Link to="/login/recoverPassword">Forgot Password</Link>
												</div> */}
											</Form>
										</React.Fragment>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
};

export const LoginPassword = compose(
	withRouter,
	graphql(LoginMutation),
	withFormik({
		// Always set the username and password to blank.
		mapPropsToValues: () => ({ username: "", password: "" }),
		handleSubmit: async ( LoginInputValues, FormikForm ) => {
			// Get the email and password values.
			const { username: email , password } = LoginInputValues;

			// Call the mutation and wait for it to return.
			const { data: { login } }  = await FormikForm.props.mutate({ variables: { email, password } });
			
			// If the result indicates success, redirect to the requested page.
			if (login.Response.success === true) {
				// If the logged in user is a Vet, them direct them to the dashboard instead of the login page.
				FormikForm.props.history.push('/dashboard');
				// if(parseInt(login.Session.User.userId) === 2) {
				// 	FormikForm.props.history.push('/dashboard_super_admin');
				// } else {
				// 	FormikForm.props.history.push('/dashboard');
				// }
			} else {
				FormikForm.props.setResponse(login.Response);
				// Update the submitting flag, we won't reset here
				FormikForm.setSubmitting(false);
			}
		},
		validationSchema: () => Yup.object().shape({
			username: Yup.string().required("Username name is required"),
			password: Yup.string().required("Password is required")
		})
	}),
	withSession,
	withState({
		topNavOpen: false
	}),
	withTranslate
)(LoginPasswordComponent);

const LoginTokenComponent = (props) => {
	const {
		errors,
		isSubmitting,
		touched,
		Response,
	} = props;

	// Login FORM
	return (
		<div className="container text-center">
			<div className="row justify-content-center">
				<div className="col-auto p-5">
					<h3><Translate id="Login Prompt"/>{/*Login to Crematory Software*/}</h3>
					<React.Fragment>
						{ Response && <div className="alert alert-danger">{props.translate(Response.message)}</div> }
						<Form>
							<div>
								<Field showError={true}
									name="username"
									placeholder={props.translate("Login Username Placeholder")}
									className={`form-control ${errors.username && touched.username && 'is-invalid'}`}
								/>
							</div>

							<button type="submit" className="btn btn-success mt-2" disabled={isSubmitting}>
								<Translate id={isSubmitting ? "LOGGING IN..." : "LOGIN"}/>
							</button>
						</Form>
					</React.Fragment>
				</div>
			</div>
		</div>
	);
};

export const LoginToken = compose(
	withRouter,
	graphql(LoginMutation),
	withFormik({
		// Always set the username and password to blank.
		mapPropsToValues: (props) => ({ username: "", token: props.match.params.token }),
		handleSubmit: async ( LoginInputValues, FormikForm ) => {
			// Get the email and password values.
			const { username: email , token } = LoginInputValues;

			// Call the mutation and wait for it to return.
			const { data: { login } }  = await FormikForm.props.mutate({ variables: { email, token } });

			// If the result indicates success, redirect to the requested page.
			if(login.Response.success === true) {
				// If the logged in user is a Vet, them direct them to the dashboard instead of the login page.
				FormikForm.props.history.push('/dashboard');
			} else {
				FormikForm.props.setResponse(login.Response);
				// Update the submitting flag, we won't reset here
				FormikForm.setSubmitting(false);
			}
		},
		validationSchema: () => Yup.object().shape({
			username: Yup.string().required("Username name is required")
		})
	}),
	withTranslate,
)(LoginTokenComponent);

const RecoverPasswordComponent = (props) => {
	const {
		isSubmitting,
		Response,
		errors,
		touched
	} = props;
	if( Response && Response.success ) {
		return (
			<div className="container text-center">
				<div className="row justify-content-md-center">
					<div className="col-6 bg-light p-5">
						A recovery email has been sent to {props.values.email}.
					</div>
				</div>
			</div>
		);
	} else {
		// Login FORM
		return (
			<div className="container text-center">
				<div className="row justify-content-center">
					<div className="col-auto p-5">
						<h3><Translate id="Recover Password"/>{/*Login to Crematory Software*/}</h3>
						<React.Fragment>
							{ Response && <div className="alert alert-danger">{Response.message}</div> }
							<Form>
								<div>
									<Field showError={true}
										name="email"
										placeholder={props.translate("Login Email Placeholder")}
										className={`form-control ${errors.email && touched.email && 'is-invalid'}`}
									/>
								</div>

								<button type="submit" className="btn btn-success mt-2" disabled={isSubmitting}>
									<Translate id={isSubmitting ? "Recovering Password..." : "Recover Password"}/>
								</button>
							</Form>
						</React.Fragment>
					</div>
				</div>
			</div>
		);
	}
};

export const RecoverPassword = compose(
	graphql(UserCreateTemporaryPasswordMutation),
	withFormik({
		// Always set the username and password to blank.
		mapPropsToValues: () => ({ email: "" }),
		handleSubmit: async ( RecoverPasswordValues, FormikForm ) => {
			// Get the email and password values.
			const { email } = RecoverPasswordValues;

			// // Call the mutation and wait for it to return.
			const { data: { temporaryPasswordCreate: Response }  }  = await FormikForm.props.mutate({ variables: { email, sendRecoveryEmail: true } });

			FormikForm.props.setResponse(Response);
		},
		validationSchema: () => Yup.object().shape({
			email: Yup.string().required("Email is required")
		})
	}),
	withTranslate,
)(RecoverPasswordComponent);
