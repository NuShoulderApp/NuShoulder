import React from 'react';
import { NavLink} from "react-router-dom";
// import { withState } from '@apollo/react-hoc';
import {flowRight as compose, withState} from 'lodash';
import { withFormik, Form, Field } from "../utilities/NSFormik.js";	// for wrapping forms
// import { withRouter } from 'react-router-dom'; // for URL routing
// import { withRouter } from '../utilities/IWDReactRouter'; // for URL routing
// import { withSession } from "../utilities/session";
// import { withState } from "react-state-hoc";
// import { Collapse, DropdownToggle, DropdownMenu, DropdownItem, Nav, Navbar, NavItem, NavbarToggler, UncontrolledDropdown } from 'reactstrap';
import { Collapse, Nav, Navbar, NavbarToggler } from 'reactstrap';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// import * as Yup from "yup";

// GRAPHQL QUERY
// import { LoginMutation } from './auth_graphql.js';

// import { UserCreateTemporaryPasswordMutation } from "../users/users_graphql";

// DOCS: https://www.apollographql.com/docs/react/get-started/
// Import everything needed to use the `useQuery` hook
import { useQuery, gql } from '@apollo/client';

const GET_USERS = gql`
            query GetUsers {
                users {
                    user_ID,
                    user_type_ID,
                    first_name,
                    last_name
                }
            }
        `;

function DisplayUsers() {
  const { loading, error, data } = useQuery(GET_USERS);
    console.log({data})
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return data.users.map(({ user_ID, user_type_ID, first_name, last_name }) => (
    <div key={user_ID}>
      <h3>{first_name} {last_name}</h3>
      <p>{user_ID} {user_type_ID}</p>
      <br />
    </div>
  ));
}

const GET_SCORE_CATEGORIES = gql`
            query GetScoreCategories {
                score_categories {
                    score_category_ID,
                    score_category_name,
                    score_category_percentage,
                    active,
                    archived,
                    creator_ID,
                    archiver_ID,
                    date_created,
                    date_archived
                }
            }
        `;

function DisplayScoreCategories() {
  const { loading, error, data } = useQuery(GET_SCORE_CATEGORIES);
    console.log({data})
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error.message}</p>;

  return data.score_categories.map(({ score_category_ID, score_category_name, score_category_percentage, active, archived, creator_ID, archiver_ID, date_created, date_archived }) => (
    <div key={score_category_ID}>
      <h3>{score_category_name} {score_category_percentage}</h3>
      <p>{active} {creator_ID}</p>
      <br />
    </div>
  ));
}

// MAIN RENDER COMPONENT:  main content that will render, need to wrap the output function in withRouter to get the Breadcrumb to have match.url
export const LoginPasswordComponent = (props) => {
	const {
		errors,
		isSubmitting,
		setState,
		topNavOpen,
		touched,
		Response
	} = props;
    //console.log({props})
	//let logoImage = "cs_logo_small.png";

    // set background images
	let style = {};

	// if(props.Account.accountPrefix === "loyalpaws") {
	// 	let bgNumber = 1;
	// 	style.backgroundImage = `url(/images/ui/${props.Account.accountPrefix}_background${bgNumber}.jpg)`;
	// 	style.backgroundSize = 'cover';
	// 	style.backgroundPosition = 'center center';
	// 	style.backgroundRepeat = 'no-repeat';
	// } else {
	// 	style.backgroundColor = '#DDD';
	// }

	// function toggleTopNav() {
	// 	//e.preventDefault();
	// 	setState({
	// 		topNavOpen: !topNavOpen
	// 	})
	// }

	// Login FORM
        // <div id="root-bg" style={style}></div>
		// 	<div id="top-container" className="flex-child column-parent">	{/* TOP CONTAINER INSIDE OF ROOT */}
		// 		{/* CONTENT CONTAINER */}
		// 		<div id="content-container" className="flex-child row-parent" style={{marginTop: 106 + 'px'}}>
		// 			{/* MAIN CONTENT CONTAINER */}
		// 			<div id="main-content-container" className="flex-child column-parent">
		// 				<div id="main-content" className="flex-child row-parent">	{/* MAIN CONTENT COLUMNS */}

		// 					<div className="container text-center mt-2">
		// 						<div className="row justify-content-center">
		// 							<div className="col-auto text-white">
		// 								<h4 className="mb-3">Login</h4>
		// 								<React.Fragment>
		// 									{ Response && <div className="alert alert-danger">{Response.message}</div> }
		// 									<Form>
		// 										<div>
		// 											<Field style={{width: 350+'px'}} showError={true} name="username" placeholder="Enter Email..." className={`form-control ${errors.username && touched.username && 'is-invalid'}`} />
		// 										</div>
		// 										<div className="mt-2">
		// 											<Field showError={true} autoComplete="password" type="password" name="password" placeholder="Enter Password..." className={`form-control ${errors.password && touched.password && 'is-invalid'} `} />
		// 										</div>
		// 										<button style={{width: 350+'px', backgroundColor: '#ec8333', borderColor: '#ec8333'}} type="submit" className="btn btn-warning btn-addon rounded mt-2" disabled={isSubmitting}>
		// 											<FontAwesomeIcon icon="lock" />
		// 											{isSubmitting ? "LOGGING IN..." : "LOGIN"}
		// 										</button>
		// 										<div>
		// 											<Link to="/login/recoverPassword">Forgot Password?</Link>
		// 										</div>
		// 										<div>
		// 											<Link to="/login/signup">Sign Up</Link>
		// 										</div>
		// 									</Form>
		// 								</React.Fragment>
		// 							</div>
		// 						</div>
		// 					</div>
		// 				</div>
		// 			</div>
		// 		</div>
		// 	</div>

	return (
		<React.Fragment>
        Login Form Goes here
        <DisplayUsers />
        <DisplayScoreCategories />
		</React.Fragment>
	);
};

// export const LoginPassword = compose(
// 	gql(LoginMutation),
// )(LoginPasswordComponent);

// export const LoginPassword = compose(
// 	withRouter,
// 	graphql(LoginMutation),
// 	withFormik({
// 		// Always set the username and password to blank.
// 		mapPropsToValues: () => ({ username: "", password: "" }),
// 		handleSubmit: async ( LoginInputValues, FormikForm ) => {
// 			// Get the email and password values.
// 			const { username: email , password } = LoginInputValues;

// 			// Call the mutation and wait for it to return.
// 			const { data: { login } }  = await FormikForm.props.mutate({ variables: { email, password } });

// 			// If the result indicates success, redirect to the requested page.
// 			if (login.Response.success === true) {
// 				// If the logged in user is a Vet, them direct them to the dashboard instead of the login page.
// 				FormikForm.props.history.push('/');
// 			} else {
// 				FormikForm.props.setResponse(login.Response);
// 				// Update the submitting flag, we won't reset here
// 				FormikForm.setSubmitting(false);
// 			}
// 		},
// 		// validationSchema: () => Yup.object().shape({
// 		// 	username: Yup.string().required("Email is required"),
// 		// 	password: Yup.string().required("Password is required")
// 		// })
// 	}),
// 	withSession,
// 	withState({
		
// 	})
// )(LoginPasswordComponent);

// const LoginTokenComponent = (props) => {
// 	const {
// 		errors,
// 		isSubmitting,
// 		touched,
// 		Response,
// 	} = props;

// 	// Login FORM
// 	return (
// 		<div className="container text-center">
// 			<div className="row justify-content-center">
// 				<div className="col-auto p-5">
// 					<h3><Translate id="Login Prompt"/>{/*Login to Crematory Software*/}</h3>
// 					<React.Fragment>
// 						{ Response && <div className="alert alert-danger">{props.translate(Response.message)}</div> }
// 						<Form>
// 							<div>
// 								<Field showError={true}
// 									name="username"
// 									placeholder={props.translate("Login Username Placeholder")}
// 									className={`form-control ${errors.username && touched.username && 'is-invalid'}`}
// 								/>
// 							</div>

// 							<button type="submit" className="btn btn-success mt-2" disabled={isSubmitting}>
// 								<Translate id={isSubmitting ? "LOGGING IN..." : "LOGIN"}/>
// 							</button>
// 						</Form>
// 					</React.Fragment>
// 				</div>
// 			</div>
// 		</div>
// 	);
// };

// export const LoginToken = compose(
// 	withRouter,
// 	graphql(LoginMutation),
// 	withFormik({
// 		// Always set the username and password to blank.
// 		mapPropsToValues: (props) => ({ username: "", token: props.match.params.token }),
// 		handleSubmit: async ( LoginInputValues, FormikForm ) => {
// 			// Get the email and password values.
// 			const { username: email , token } = LoginInputValues;

// 			// Call the mutation and wait for it to return.
// 			const { data: { login } }  = await FormikForm.props.mutate({ variables: { email, token } });

// 			// If the result indicates success, redirect to the requested page.
// 			if(login.Response.success === true) {
// 				// If the logged in user is a Vet, them direct them to the dashboard instead of the login page.
// 				FormikForm.props.history.push('/dashboard');
// 			} else {
// 				FormikForm.props.setResponse(login.Response);
// 				// Update the submitting flag, we won't reset here
// 				FormikForm.setSubmitting(false);
// 			}
// 		},
// 		validationSchema: () => Yup.object().shape({
// 			username: Yup.string().required("Username name is required")
// 		})
// 	}),
// 	withTranslate,
// )(LoginTokenComponent);

// const RecoverPasswordComponent = (props) => {
// 	const {
// 		isSubmitting,
// 		Response,
// 		errors,
// 		touched
// 	} = props;
// 	if( Response && Response.success ) {
// 		return (
// 			<div className="container text-center">
// 				<div className="row justify-content-md-center">
// 					<div className="col-6 bg-light p-5">
// 						A recovery email has been sent to {props.values.email}.
// 					</div>
// 				</div>
// 			</div>
// 		);
// 	} else {
// 		// Login FORM
// 		return (
// 			<div className="container text-center">
// 				<div className="row justify-content-center">
// 					<div className="col-auto p-5">
// 						<h3><Translate id="Recover Password"/>{/*Login to Crematory Software*/}</h3>
// 						<React.Fragment>
// 							{ Response && <div className="alert alert-danger">{Response.message}</div> }
// 							<Form>
// 								<div>
// 									<Field showError={true}
// 										name="email"
// 										placeholder={props.translate("Login Email Placeholder")}
// 										className={`form-control ${errors.email && touched.email && 'is-invalid'}`}
// 									/>
// 								</div>

// 								<button type="submit" className="btn btn-success mt-2" disabled={isSubmitting}>
// 									<Translate id={isSubmitting ? "Recovering Password..." : "Recover Password"}/>
// 								</button>
// 							</Form>
// 						</React.Fragment>
// 					</div>
// 				</div>
// 			</div>
// 		);
// 	}
// };

// export const RecoverPassword = compose(
// 	graphql(UserCreateTemporaryPasswordMutation),
// 	withFormik({
// 		// Always set the username and password to blank.
// 		mapPropsToValues: () => ({ email: "" }),
// 		handleSubmit: async ( RecoverPasswordValues, FormikForm ) => {
// 			// Get the email and password values.
// 			const { email } = RecoverPasswordValues;

// 			// // Call the mutation and wait for it to return.
// 			const { data: { temporaryPasswordCreate: Response }  }  = await FormikForm.props.mutate({ variables: { email, sendRecoveryEmail: true } });

// 			FormikForm.props.setResponse(Response);
// 		},
// 		validationSchema: () => Yup.object().shape({
// 			email: Yup.string().required("Email is required")
// 		})
// 	}),
// 	withTranslate,
// )(RecoverPasswordComponent);

// const SignUpComponent = (props) => {
// 	const {
// 		errors,
// 		isSubmitting,
// 		setState,
// 		topNavOpen,
// 		touched,
// 		Response
// 	} = props;

// 	let logoImage = "cs_logo_small.png";

//     // set background images
// 	let style = {};

// 	if(props.Account.accountPrefix === "loyalpaws") {
// 		let bgNumber = 1;
// 		style.backgroundImage = `url(/images/ui/${props.Account.accountPrefix}_background${bgNumber}.jpg)`;
// 		style.backgroundSize = 'cover';
// 		style.backgroundPosition = 'center center';
// 		style.backgroundRepeat = 'no-repeat';
// 	} else {
// 		style.backgroundColor = '#DDD';
// 	}

// 	function toggleTopNav() {
// 		//e.preventDefault();
// 		setState({
// 			topNavOpen: !topNavOpen
// 		})
// 	}

// 	// Login FORM
// 	return (
// 		<React.Fragment>
// 			<div id="root-bg" style={style}></div>
// 			<div id="top-container" className="flex-child column-parent">	{/* TOP CONTAINER INSIDE OF ROOT */}
// 				{/* CONTENT CONTAINER */}
// 				<div id="content-container" className="flex-child row-parent" style={{marginTop: 106 + 'px'}}>
// 					{/* MAIN CONTENT CONTAINER */}
// 					<div id="main-content-container" className="flex-child column-parent">
// 						<div id="main-content" className="flex-child row-parent">	{/* MAIN CONTENT COLUMNS */}

// 							<div className="container text-center mt-2">
// 								<div className="row justify-content-center">
// 									<div className="col-auto text-white">
//                                         <div>
//                                             <Link to="/login">ALREADY HAVE AN ACCOUNT?</Link>
//                                         </div>
// 										<h4 className="mb-3">Elite Rotator Cuff Training</h4>
//                                         <button onClick={setState({create_account: "player"})} style={{width: 350+'px', backgroundColor: '#ec8333', borderColor: '#ec8333'}} type="button" className="btn btn-warning btn-addon rounded mt-2" disabled={isSubmitting}>
//                                             <FontAwesomeIcon icon="lock" />
//                                             {isSubmitting ? "LOADING..." : "CREATE PLAYER ACCOUNT"}
//                                         </button>                                        
//                                         <button onClick={setState({create_account: "coach"})} style={{width: 350+'px', backgroundColor: '#ec8333', borderColor: '#ec8333'}} type="button" className="btn btn-warning btn-addon rounded mt-2" disabled={isSubmitting}>
//                                             <FontAwesomeIcon icon="lock" />
//                                             {isSubmitting ? "LOADING..." : "CREATE COACH ACCOUNT"}
//                                         </button>                                        
// 										<React.Fragment>
// 											{ Response && <div className="alert alert-danger">{Response.message}</div> }
// 											<Form>
// 												<div>
// 													<Field style={{width: 350+'px'}} showError={true} name="email" placeholder="Enter Email..." className={`form-control ${errors.username && touched.username && 'is-invalid'}`} />
// 												</div>
// 												<div className="mt-2">
// 													<Field showError={true} autoComplete="password" type="password" name="password" placeholder="Enter Password..." className={`form-control ${errors.password && touched.password && 'is-invalid'} `} />
// 												</div>
// 												<div>
// 													<Field style={{width: 350+'px'}} showError={true} name="first_name" placeholder="Enter First Name..." className={`form-control ${errors.first_name && touched.first_name && 'is-invalid'}`} />
// 												</div>
// 												<div>
// 													<Field style={{width: 350+'px'}} showError={true} name="last_name" placeholder="Enter First Name..." className={`form-control ${errors.last_name && touched.last_name && 'is-invalid'}`} />
// 												</div>
// 												<button style={{width: 350+'px', backgroundColor: '#ec8333', borderColor: '#ec8333'}} type="submit" className="btn btn-warning btn-addon rounded mt-2" disabled={isSubmitting}>
// 													<FontAwesomeIcon icon="lock" />
// 													{isSubmitting ? "SIGNING UP..." : "SIGN UP"}
// 												</button>
//                                                 <div>
//                                                     <Link to="/login">ALREADY HAVE AN ACCOUNT?</Link>
//                                                 </div>
// 											</Form>
// 										</React.Fragment>
// 									</div>
// 								</div>
// 							</div>
// 						</div>
// 					</div>
// 				</div>
// 			</div>
// 		</React.Fragment>
// 	);
// };

