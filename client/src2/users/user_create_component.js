import React from 'react';
import Breadcrumb from "../utilities/IWDBreadcrumb"; // for UI breadcrumbs based on Routing
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, Redirect } from "react-router-dom";
import moment from 'moment';
import { Mutation, compose } from "react-apollo";
import { withFormik, Form, Field } from "../utilities/IWDFormik";	// for wrapping forms
import { withRouter } from '../utilities/IWDReactRouter'; // for URL routing

import * as Yup from "yup";

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	getUserProfileQuery,
	UserCreateMutation
} from './users_graphql';

import { withSession } from '../utilities/session';
import { getCompanyQuery } from '../companies/companies_graphql';
import { queryWithLoading } from '../utilities/IWDDb';

import { UserUpdateClass } from './user_component';

// FORM COMPONENT - used within the larger UserComponent render component to render the user create/lookup form.
const UserFormContent = withTranslate((props) => {
	const {
		calledFrom,
		errors,
		isSubmitting,
		touched,
		dirty,
		cancelRedirect = () => '/users'
	} = props;

	return (
		<React.Fragment>
			<Form>
				<div>
					<Translate id="First Name"/> *
					<Field name="firstName" placeholder={props.translate("First Name Placeholder")} className={`form-control ${errors.firstName && touched.firstName && 'is-invalid'}`} />
						{errors.firstName  && <div className="invalid-feedback">{props.translate(errors.firstName)}</div>}
				</div>
				<div>
					<Translate id="Last Name"/> *
					<Field name="lastName" placeholder={props.translate("Last Name Placeholder")} className={`form-control ${errors.lastName && touched.lastName && 'is-invalid'}`} />
						{errors.lastName && <div className="invalid-feedback">{props.translate(errors.lastName)}</div>}
				</div>
				<div>
					<Translate id="Email"/> *
					<Field name="email" placeholder={props.translate("Email Placeholder")} className={`form-control ${errors.email && touched.email && 'is-invalid'}`} />
						{errors.email && <div className="invalid-feedback">{props.translate(errors.email)}</div>}
				</div>

				<div className="mt-1">
					<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"} />
					</button>
					{
						calledFrom !== 'company_details' &&
						<Link to={cancelRedirect(props)} className="btn btn-default ml-2">
							<Translate id="Cancel"/>
						</Link>
					}
				</div>
			</Form>
		</React.Fragment>
	);
});

// Wrap the UserFormContent in Formik
const UserForm = withFormik({
	handleSubmit: async ( UserInputValues, FormikUserForm) => {
		await FormikUserForm.props.submitMutation({ variables: { input: UserInputValues } });
		FormikUserForm.setSubmitting(false);
		// if this form was submitted from within the Account creation process, then update the Account Admins list
		if(UserInputValues.action === 'createAccountAdmin') {
			FormikUserForm.props.setAccountAdmin(UserInputValues.firstName, UserInputValues.lastName);
		}
	},
	validationSchema: () => Yup.object().shape({
		firstName: Yup.string().required("First name is required"),
		lastName: Yup.string().required("Last name is required"),
		email: Yup.string().required("Email is required"),
		userTypeId: Yup.number().required("User Type is Required")
	})
  })(UserFormContent);

const UserCreateFormContent = (props) => {
	const { isSubmitting } = props;

	return (
		<React.Fragment>
			<Form className="mb-3">
				<div>
					<Translate id="Otherwise Save User"/>
					{/*If none of the users listed above are the same as the one you are trying to create, click here to create this user.*/}
				</div>
				<div>
					<button type="submit" className="btn btn-success" disabled={isSubmitting}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"} />
					</button>
					<Link to="/users" className="btn btn-default ml-2">
						<Translate id="Cancel"/>
					</Link>
				</div>
			</Form>
		</React.Fragment>
	);
};

const UserCreateForm = withFormik({
	handleSubmit: async ( UserInputValues, FormikUserForm) => {
		await FormikUserForm.props.submitMutation({ variables: { input: UserInputValues }});
		FormikUserForm.setSubmitting(false);
	}
})(UserCreateFormContent);

// List of users that match the first and last name.
const UserListConst = (props) => (
	<table className="table table-striped">
		<thead>
			<tr>
				<th><Translate id="Created"/></th>
				<th><Translate id="First Name"/></th>
				<th><Translate id="Middle Name"/></th>
				<th><Translate id="Last Name"/></th>
				<th><Translate id="Select"/></th>
			</tr>
		</thead>
		<tbody>
			{props.Users.map((user) => (
				<tr key={user.userId}>
					{/* LOCALIZE TODO: date format might be region-dependent */}
					<td>{moment(user.dateCreated).format('MMM DD, YYYY h:mm A')}</td>
					<td>{user.firstName}</td>
					<td>{user.middleName}</td>
					<td>{user.lastName}</td>
					<td>
						<Link to={`/user/${user.userId}`} className="btn btn-info btn-sm float-right"><Translate id="Select"/> </Link>
					</td>
				</tr>
				)
			)}
		</tbody>
	</table>
);

const UserUpdateClassContainer = compose(
	withRouter,
	queryWithLoading({ gqlString: getUserProfileQuery, variablesFunction: (props) => ({ userId: props.userId }) })
)(UserUpdateClass);

// RENDER COMPONENT:  main content that will render, need to wrap the output function in withRouter to get the Breadcrumb to have match.url
const UserCreateContent = (props) => {
	const {
		calledFrom
	} = props;
	// set breadcrumb and mutation based on whther we are inserting or updating - do we have a userId
	// CREATE USER FORM
	return (
		<React.Fragment>
			{calledFrom !== 'company_details' &&
				<React.Fragment>
					<Breadcrumb title='Add User' pathname={props.match.url} />
					<h3><Translate id="Add New User"/></h3>
				</React.Fragment>
			}
			<Mutation mutation={UserCreateMutation} refetchQueries={["getUsers"]} key={0}>
				{ (UserCreateMutate, UserCheck) => {
					// UserCheck is the object that gets returned from the mutation
					if(UserCheck.data !== undefined) {
						const { action, User } = UserCheck.data.userCreate;
						if(action === 'userCreated' || action === 'accountAdminCreated') {
							// If the user is created from within the company details, then we want to load the User component with full user details. Otherwise go to the redirect URL
							if(props.match.path === "/company/:companyId") {
								// This compose function will call user_component.js's UserUpdateClass, we do a new queryQithLoading here because the
								return (
									<div>
										<UserUpdateClassContainer userId={User.userId} />
									</div>
								)
							} else {
								return <Redirect to={props.saveRedirect ? props.saveRedirect(User.userId) :  `/users/user/${User.userId}`}/>
							}
						} else if(action === 'exactMatch') {
							// push to edit page
							return (
								<div>
									<UserForm
										initialValues={{
											...props.initialValues,
											action: "",
											email: User.email,
											firstName: User.firstName,
											lastName: User.lastName
										}}
										cancelRedirect={props.cancelRedirect}
										submitMutation={ UserCreateMutate }
									/>
									<div>
										<Translate id="User Exists Prompt"/>{/*This user already exists. Do you want to edit their information?*/}
										<Link to={`/users/user/${User.userId}`} className="btn btn-info btn-sm btn-addon float-right"><FontAwesomeIcon icon="pen" /> <Translate id="EDIT"/> </Link>
									</div>
								</div>
							)
						} else if(action === 'emailMatch') {
							const { Users } = UserCheck.data.userCreate;
							// warning about this email already exists, give option to login with this email
							return (
								<div>
									<UserForm
										initialValues={{
											...props.initialValues,
											action: "",
											email: User.email,
											firstName: User.firstName,
											lastName: User.lastName
										}}
										cancelRedirect={props.cancelRedirect}
										submitMutation={ UserCreateMutate }
									/>
									<div>
										<Translate id="Email Exists Prompt" data={Users[0]}/>
										{/*This email is already in use for {Users[0].firstName} {Users[0].lastName}. Please change the email address above, or do you want to edit account information for {Users[0].firstName} {Users[0].lastName}?*/}
										<Link to={`/users/user/${Users[0].userId}`} className="btn btn-info btn-sm btn-addon float-right"><FontAwesomeIcon icon="pen" /> <Translate id="EDIT"/> </Link>
									</div>
								</div>
							)
						} else if(action === 'nameMatch') {
							// show list of possible names
							return (
								<div>
									<div className="p-3">
										<p><Translate id="Duplicate Username Prompt"/>{/*This name already exists, confirm that it is not one of the accounts below*/}</p>
										<UserListConst Users={UserCheck.data.userCreate.Users} />
									</div>
									<UserCreateForm
										initialValues={{
											...props.initialValues,
											action: 'forceAddUser',
											email: User.email,
											firstName: User.firstName,
											lastName: User.lastName
										}}
										cancelRedirect={props.cancelRedirect}
										submitMutation={ UserCreateMutate }
									/>

									<UserForm
										initialValues={{
											...props.initialValues,
											action: "",
											email: User.email,
											firstName: User.firstName,
											lastName: User.lastName
										}}
										cancelRedirect={props.cancelRedirect}
										submitMutation={ UserCreateMutate }
									/>
								</div>
							)
						}
					} else {
						// this form can also be called from within the Account setup page, for creating the first Account Admin. In which case, there would be an accountId and userTypeId passed in.
						let initialValues = { action: "", email: "", firstName: "", lastName: "" };
						if(props.initialValues && props.initialValues.action === 'createAccountAdmin') {
							initialValues = { ...props.initialValues,
											  ...initialValues,
											  action: props.initialValues.action }
							return <React.Fragment>
								<UserForm
									key="0"
									setAccountAdmin={props.setAccountAdmin}
									initialValues={initialValues}
									submitMutation={ UserCreateMutate }
									cancelRedirect={props.cancelRedirect}
								/>
							</React.Fragment>
						} else {
							return <React.Fragment>
								<UserForm
									key="0"
									calledFrom={calledFrom}
									cancelRedirect={props.cancelRedirect}
									initialValues={{
										...props.initialValues,
										...initialValues}
									}
									submitMutation={ UserCreateMutate }
								/>
							</React.Fragment>
						}
					}
				}}
			</Mutation>
		</React.Fragment>
	);
};

// This component is only for use when creating crematory software administrators userTypeId 1, (Not account admins userTypeId: 2)
export const CCAdminUserCreate = compose(
	withRouter
)((props) => <UserCreateContent {...props} initialValues={{accountId: 1, companyId: 1, userTypeId: 1}}/>);

// Componnt for creating the Account Admin users.
export const AccountAdminUserCreate = withRouter(UserCreateContent);

// This component is only for creating staff level users (userTypeId > 4)
export const UserCreate = compose(
	withRouter,
	withSession,
	queryWithLoading({
		gqlString: getCompanyQuery,
		variablesFunction: (props) => ({companyId: props.match.params.companyId}),
		requiredPermission: { permission: "companies", permissionLevel: 4},
		name: "Company"
	}),
	UserCreateMapUserTypeHOC
)((props) => <UserCreateContent
	{...props}
	saveRedirect={(userId) => `/company/${props.match.params.companyId}/user/${userId}`}
	cancelRedirect={() => `/company/${props.match.params.companyId}`}
/>);

/*
	This is a HOC function to calculate the proper userType from the company type.  Since
	this component is called through the router we do not have access to the company information
	directly so we have to go through a query.
*/
function UserCreateMapUserTypeHOC(UserCreateComponent) {
	return function (props) {
		const {
			Company: {
				Company: {
					accountId,
					companyId,
					companyTypeId
				}
			}
		} = props;

		// Company Types
		const CEMETERY = 1;
		const CREMATORY = 2;
		const VET = 3;

		// User Types
		const CREMATORY_STAFF = 3
		const CEMETERY_STAFF = 4
		const VET_STAFF = 5

		// Company type to user type map.
		const userTypeMap = { [CEMETERY]: CEMETERY_STAFF, [CREMATORY]: CREMATORY_STAFF, [VET]: VET_STAFF };

		// Look up the new userTypeId
		const userTypeId = userTypeMap[companyTypeId];

		// Render the form with the calculated initial balues.
		return (
			<div className="">
				<UserCreateComponent
					{...props}
					initialValues={{accountId, companyId, userTypeId }}
				/>
			</div>
		);
	}
}
