import React from 'react';
import { NavLink} from "react-router-dom";
import _ from 'lodash';
import {flowRight as compose} from 'lodash';
import { castNumerics, queryWithLoading, withMutation } from '../utilities/NSDb.js';
import { graphql } from '@apollo/react-hoc';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery, useMutation } from '@apollo/client';


// GRAPHQL QUERY
// import { LoginMutation } from './auth_graphql';



export default class LoginClass extends React.Component {
	constructor(props) {
    	super(props)
        console.log({props})

        const {
            errors,
            isSubmitting,
            setState,
            topNavOpen,
            touched,
            Response
        } = props;

        this.state = {
            display_form: 'login',
            email: '',
            first_name: '',
            last_name: '',
            new_password: '',
            password: ''
        }
	}

	// let logoImage = "cs_logo_small.png";

    // set background images
	// let style = {};

	// if(props.Account.accountPrefix === "loyalpaws") {
	// 	let bgNumber = 1;
	// 	style.backgroundImage = `url(/images/ui/${props.Account.accountPrefix}_background${bgNumber}.jpg)`;
	// 	style.backgroundSize = 'cover';
	// 	style.backgroundPosition = 'center center';
	// 	style.backgroundRepeat = 'no-repeat';
	// } else {
	// 	style.backgroundColor = '#DDD';
	// }


    changeValue = (name, value, type='') => {
        console.log("name: ", name, " | value: ", value, " | type: ", type);
        let new_value = value;
        if(type == 'checkbox') {
            if(new_value == "" || new_value == false || new_value == 'false' || parseInt(new_value) == 0) {
                new_value = 1;
            } else {
                new_value = 0
            }
        }
        this.setState({
            [name]: new_value
        })

    };

    handleCodeSubmission = () => {
        console.log("handle code submission")
    }

    handleCreateAccount = (account_type) => {
        this.setState({
            create_account: account_type,
            display_form: 'create_account'
        })
    }

    handleLogin = () => {
        console.log("login clicked")
    }

    handlePasswordReset = () => {
        console.log("password reset clicked")
    }

    handleSignup = () => {
        console.log("signup clicked")
    }

    CreateAccountForm() {
        // Disable Login button if the email or password are not completed inputs.
        let signup_btn_class = this.state.email == "" || this.state.new_password == "" || this.state.first_name == "" || this.state.last_name == "" ? 'disabled' : '';

        return (
            <div className="">
                <div className="h4 text-center" style={{color: '#e05900'}}>Create {this.state.create_account} Account</div>
                <div className="form-floating">
                    <input className="form-control" id="email" value={this.state.email} onChange={(event) => this.changeValue('email', event.target.value)} />
                    <label htmlFor="email">Email</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="email" value={this.state.new_password} onChange={(event) => this.changeValue('new_password', event.target.value)} />
                    <label htmlFor="password">Password</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="first_name" value={this.state.first_name} onChange={(event) => this.changeValue('first_name', event.target.value)} />
                    <label htmlFor="first_name">First Name</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="last_name" value={this.state.last_name} onChange={(event) => this.changeValue('last_name', event.target.value)} />
                    <label htmlFor="last_name">Last Name</label>
                </div>
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white ${signup_btn_class}`} style={{backgroundColor: '#e05900'}} onClick={() => this.changeValue('display_form', 'enter_code')}>SIGNUP</button>
                </div>
                <img src={"/images/nushoulder_logo.png"} alt="" className="img-fluid" />
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white`} style={{backgroundColor: '#e05900'}} onClick={() => this.changeValue('display_form', 'login')}>ALREADY HAVE AN ACCOUNT?</button>
                </div>
            </div>
        )
    }

    EnterCodeForm() {
        // Disable Login button if the email or password are not completed inputs.
        let signup_btn_class = this.state.code == "" ? 'disabled' : '';

        return (
            <div className="">
                <div className="h4 text-center" style={{color: '#e05900'}}>Create {this.state.create_account} Account</div>
                <div className="h4 text-center" style={{color: '#e05900'}}>The NuShoulder App is only available for elite athletes. Enter your team's {this.state.create_account} code to be assigned to the correct program.</div>
                <div className="form-floating">
                    <input className="form-control" id="email" value={this.state.code} onChange={(event) => this.changeValue('code', event.target.value)} />
                    <label htmlFor="code">Enter {this.state.create_account} Code</label>
                </div>
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white ${signup_btn_class}`} style={{backgroundColor: '#e05900'}} onClick={() => this.handleCodeSubmission()}>SUBMIT</button>
                </div>
            </div>
        )
    }

    LoginForm() {
        // Disable Login button if the email or password are not completed inputs.
        let login_btn_class = this.state.email == "" || this.state.password == "" ? 'disabled' : '';

        return (
            <div className="">
                <div className="h4 text-center" style={{color: '#e05900'}}>Login</div>
                <div className="form-floating">
                    <input className="form-control" id="email" value={this.state.email} onChange={(event) => this.changeValue('email', event.target.value)} />
                    <label htmlFor="email">Email</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="email" value={this.state.password} onChange={(event) => this.changeValue('password', event.target.value)} />
                    <label htmlFor="password">Password</label>
                </div>
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white ${login_btn_class}`} style={{backgroundColor: '#e05900'}} onClick={() => this.handleLogin()}>Login</button>
                </div>
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white`} style={{backgroundColor: '#e05900'}} onClick={() => this.changeValue('display_form', 'password_reset')}>FORGOT PASSWORD?</button>
                </div>
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white`} style={{backgroundColor: '#e05900'}} onClick={() => this.changeValue('display_form', 'signup')}>SIGNUP</button>
                </div>
            </div>
        )
    }

    PasswordResetForm() {
        let login_btn_class = this.state.email == "" ? 'disabled' : '';
   
        return (
            <div className="">
                <div className="h4 text-center" style={{color: '#e05900'}}>Password Reset</div>
                <div className="h5">Enter your email address and we'll send you instructions on how to reset your password.</div>
                <div className="form-floating">
                    <input className="form-control" id="email" value={this.state.email} onChange={(event) => this.changeValue('email', event.target.value)} />
                    <label htmlFor="email">Email</label>
                </div>
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white ${login_btn_class}`} style={{backgroundColor: '#e05900'}} onClick={() => this.handlePasswordReset()}>SUBMIT</button>
                </div>
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white`} style={{backgroundColor: '#e05900'}} onClick={() => this.changeValue('display_form', 'login')}>CANCEL</button>
                </div>
            </div>
        )
    }

    SignupForm() {
        return (
            <div className="center">
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white`} style={{backgroundColor: '#e05900'}} onClick={() => this.changeValue('display_form', 'login')}>ALREADY HAVE AN ACCOUNT?</button>
                </div>
                {/* <img src={process.env.PUBLIC_URL + "/images/photos/loyalpaws_cremation_visitation.jpg"} alt="" className="card-img-top" /> */}
                <img src={"/images/nushoulder_logo.png"} alt="" className="img-fluid" />
                <div className="h4">Elite Rotator Cuff Training</div>
                <div className="h5">Which type of account do you need?</div>
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white`} style={{backgroundColor: '#e05900'}} onClick={() => this.handleCreateAccount('Player')}>TEAM ATHLETE</button>
                </div>
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white`} style={{backgroundColor: '#e05900'}} onClick={() => this.handleCreateAccount('Coach')}>COACH</button>
                </div>
                <div className="mt-2">
                    <button type="button" className={`btn btn-sm text-white`} style={{backgroundColor: '#e05900'}} onClick={() => this.handleCreateAccount('Regular')}>REGULAR ACCOUNT</button>
                </div>
            </div>
        )
    }

    render () {
        console.log("props: ", this.props)

        return (
            <React.Fragment>

                {/* Default login form for email / password entry */}
                {this.state.display_form == 'login' && this.LoginForm()}

                {/* Display Password Reset form */}
                {this.state.display_form == 'password_reset' && this.PasswordResetForm()}

                {/* Display Signup form */}
                {this.state.display_form == 'signup' && this.SignupForm()}

                {/* Display Create Account form */}
                {this.state.display_form == 'create_account' && this.CreateAccountForm()}

                {/* Display Enter Code form */}
                {this.state.display_form == 'enter_code' && this.EnterCodeForm()}


            </React.Fragment>
        );
    }
};


                    // <div>
                    //     {/* <Link to="/login">ALREADY HAVE AN ACCOUNT?</Link> */}
                    // </div>
                    // <h4 className="mb-3">Elite Rotator Cuff Training</h4>
                    // <button onClick={() => this.setState({create_account: "player"})} style={{width: 350+'px', backgroundColor: '#ec8333', borderColor: '#ec8333'}} type="button" className="btn btn-warning btn-addon rounded mt-2">
                    // {/*  disabled={isSubmitting} */}
                    //     <FontAwesomeIcon icon="lock" />
                    //     {/* {isSubmitting ? "LOADING..." : "CREATE PLAYER ACCOUNT"} */}
                    // </button>                                        
                    // <button onClick={() => this.setState({create_account: "coach"})} style={{width: 350+'px', backgroundColor: '#ec8333', borderColor: '#ec8333'}} type="button" className="btn btn-warning btn-addon rounded mt-2">
                    //     <FontAwesomeIcon icon="lock" />
                    //     {/* {isSubmitting ? "LOADING..." : "CREATE COACH ACCOUNT"} */}
                    // </button>                                        
                    // <React.Fragment>
                    //     { Response && <div className="alert alert-danger">{Response.message}</div> }
                    //         <div>
                    //             <Field style={{width: 350+'px'}} showError={true} name="email" placeholder="Enter Email..." className={`form-control ${errors.username && touched.username && 'is-invalid'}`} />
                    //         </div>
                    //         <div className="mt-2">
                    //             <Field showError={true} autoComplete="password" type="password" name="password" placeholder="Enter Password..." className={`form-control ${errors.password && touched.password && 'is-invalid'} `} />
                    //         </div>
                    //         <div>
                    //             <Field style={{width: 350+'px'}} showError={true} name="first_name" placeholder="Enter First Name..." className={`form-control ${errors.first_name && touched.first_name && 'is-invalid'}`} />
                    //         </div>
                    //         <div>
                    //             <Field style={{width: 350+'px'}} showError={true} name="last_name" placeholder="Enter First Name..." className={`form-control ${errors.last_name && touched.last_name && 'is-invalid'}`} />
                    //         </div>
                    //         <button style={{width: 350+'px', backgroundColor: '#ec8333', borderColor: '#ec8333'}} type="submit" className="btn btn-warning btn-addon rounded mt-2" disabled={isSubmitting}>
                    //             <FontAwesomeIcon icon="lock" />
                    //             {isSubmitting ? "SIGNING UP..." : "SIGN UP"}
                    //         </button>
                    //         <div>
                    //             <Link to="/login">ALREADY HAVE AN ACCOUNT?</Link>
                    //         </div>
                    // </React.Fragment>

// export const LoginComponent = compose(
//     graphql(SaveScoreMetric)
// )(LoginClass)
