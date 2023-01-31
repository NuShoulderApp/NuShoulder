import _ from "lodash";
import { compose, graphql, withApollo } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from "moment";
import React from 'react';
import { Translate, TranslateDefault } from '../translations/IWDTranslation';
import { withFormik } from 'formik';	// for wrapping forms
import { withRouter } from '../utilities/IWDReactRouter'; // for URL routing
import { withState } from "react-state-hoc";
import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

// Contains the layout for columns
// import { DetailColumn } from '../layouts/application';

import { AddressFormContent } from '../addresses/address_component'; // generic address form
import { CompanyAddressFormContent } from "../companies/company_address_component"; // generic company address form
import { CompanyPhoneFormContent } from "../companies/company_phone_component"; // generic company phone form
import { PhoneFormContent, formatPhone } from "../phones/phone_component"; // generic phone form
import { UserEmailForm } from "./users_email_update_component";
import { UserPasswordForm } from "./users_passwords_update_component";
import { UserPermissionForm } from "./users_permissions_component";
import { UserForm } from "./user_details_component";

// GRAPHQL QUERY
import { LoginMutation, LogoutMutation } from '../auth/auth_graphql';

import {
	getUserProfileQuery,
	UserAddressSaveMutation,
	UserAddressRemoveMutation,
	UserCompanyAddressSaveMutation,
	UserCompanyAddressRemoveMutation,
	UserCompanyPhoneSaveMutation,
	UserCompanyPhoneRemoveMutation,
	UserCreateTemporaryPasswordMutation,
	UserPhoneSaveMutation,
	UserPhoneRemoveMutation
} from './users_graphql';

const CompanyAddressForm = compose (
	// Setup the mutation for saving the permission. We can use withMutation here because handleSubmit in the formik code can map userCompanyAddressId properly.
	withMutation(UserCompanyAddressSaveMutation, "UserCompanyAddressSave", ["getUserProfile"]),
	/* 	Set up the removal mutation, we use graphql here because we need to specify that the ID field is userCompanyAddressId.  The Address component
		is used in multiple places so it doesn't know which	field we till want to use.
	*/
	graphql(UserCompanyAddressRemoveMutation, { options: { refetchQueries: ["getUserProfile"] }, props: ({mutate}) => ({ removeAddress: ({userCompanyAddressId}) => mutate({ variables: { userCompanyAddressId } }) }) }),
	withFormik({
		enableReinitialize: true,
		// map the supplied initialValues structure to make sure no values are undfiend.
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( UserCompanyAddressInputValues, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result into  userAddressSave
			// const {data: { userCompanyAddressSave }} =
			await FormikForm.props.UserCompanyAddressSave({ input: UserCompanyAddressInputValues });

			FormikForm.resetForm();
			// "click" the edit button from the list to refresh the component.  Give it the response to display.
	   },
	   // Require Address and Type
	   validationSchema: () => Yup.object().shape({
			companyAddressId: Yup.number().required("Select a Address number")
	   })
	})
)(CompanyAddressFormContent);

const CompanyPhoneForm = compose (
	// Setup the mutation for saving the permission. We can use withMutation here because handleSubmit in the formik code can map userCompanyPhoneId properly.
	withMutation(UserCompanyPhoneSaveMutation, "UserCompanyPhoneSave", ["getUserProfile"]),
	/* 	Set up the removal mutation, we use graphql here because we need to specify that the ID field is userCompanyPhoneId.  The phone component
		is used in multiple places so it doesn't know which	field we till want to use.
	*/
	graphql(UserCompanyPhoneRemoveMutation, { options: { refetchQueries: ["getUserProfile"] }, props: ({mutate}) => ({ removePhone: ({userCompanyPhoneId}) => mutate({ variables: { userCompanyPhoneId } }) }) }),
	withFormik({
		enableReinitialize: true,
		// map the supplied initialValues structure to make sure no values are undfiend.
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( UserCompanyPhoneInputValues, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result into  userPhoneSave
			//const {data: { userCompanyPhoneSave }} =
			await FormikForm.props.UserCompanyPhoneSave({ input: UserCompanyPhoneInputValues });

			FormikForm.resetForm();
			// "click" the edit button from the list to refresh the component.  Give it the response to display.
	   },
	   // Require Phone and Type
	   validationSchema: () => Yup.object().shape({
			companyPhoneId: Yup.number().required("Select a phone number")
	   })
	})
)(CompanyPhoneFormContent);

const UserAddressForm = compose (
	// Setup the mutation for saving the permission. We can use withMutation here because handleSubmit in the formik code can map userPhoneId properly.
	withMutation(UserAddressSaveMutation, "UserAddressSave", ["getUserProfile"]),
	/* 	Set up the removal mutation, we use graphql here because we need to specify that the ID field is userAddressd.  The address component
		is used in multiple places so it doesn't know which	field we till want to use.
	*/
	graphql(UserAddressRemoveMutation, { options: { refetchQueries: ["getUserProfile"] }, props: ({mutate}) => ({ removeAddress: ({userAddressId}) => mutate({ variables: { userAddressId } }) }) }),
	withFormik({
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( UserAddressInputValues, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result into  userPhoneSave
			const { data: { userAddressSave } } = await FormikForm.props.UserAddressSave({ input: UserAddressInputValues });

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.editButtonClickHandler("address", userAddressSave.UserAddress.userAddressId, userAddressSave.Response);

			// Reset the form to clear the save button and disable it.
			FormikForm.resetForm();
	   },
	   validationSchema: () => Yup.object().shape({
			address1: Yup.string().required("Address Line 1 is required"),
			city:  Yup.string().required("City is required"),
			stateId:  Yup.number().required("State is required"),
			postalCode: Yup.string().required("Postal Code is required"),
			addressTypeId: Yup.string().required("Address Type is required")
	   })
	})
)(AddressFormContent);

const UserPhoneForm = compose (
	// Setup the mutation for saving the permission. We can use withMutation here because handleSubmit in the formik code can map userPhoneId properly.
	withMutation(UserPhoneSaveMutation, "UserPhoneSave", ["getUserProfile"]),
	/* 	Set up the removal mutation, we use graphql here because we need to specify that the ID field is userPhoneId.  The phone component
		is used in multiple places so it doesn't know which	field we till want to use.
	*/
	graphql(UserPhoneRemoveMutation, { options: { refetchQueries: ["getUserProfile"] }, props: ({mutate}) => ({ removePhone: ({userPhoneId}) => mutate({ variables: { userPhoneId } }) }) }),
	withFormik({
		enableReinitialize: true,
		// map the supplied initialValues structure to make sure no values are undfiend.
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( UserPhoneInputValues, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result into  userPhoneSave
			const {data: { userPhoneSave }} = await FormikForm.props.UserPhoneSave({ input: UserPhoneInputValues });

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.editButtonClickHandler("phone", userPhoneSave.UserPhone.userPhoneId, userPhoneSave.Response);
	   },
	   // Require Phone and Type
	   validationSchema: () => Yup.object().shape({
			phone: Yup.string().matches(/\d{10}/,"Invalid Phone Number").required("A phone number is required"),
			phoneTypeId: Yup.number().required("Phone Type is required")
	   })
	})
)(PhoneFormContent);
// END MUTATIONS

// Given a url string, packge it in a proper url based on server environment.
function getUrlStr(url, token) {
	let {
		host,
		port,
		protocol
	} = window.location;

	// If there is a port specified, prepend a colon.
	if(port !== "") {
		port = `:${port}`;
	}

	// Get the subdomains by splitting the host and taking all but the last two elements.
	const subdomains = host.split(".").slice(0,-2)

	// Concat the url and then join to form final url.
	const finalUrl = subdomains.concat(url).join(".");

	// Return the full url string.
	return `${protocol}//${finalUrl}${port}/login/${token}`;
}

// Build the full name: make array, filter out all blanks, then join on a space.
const fullName = ({firstName, lastName, middleName, salutation}) => [salutation, firstName, middleName, lastName ].filter((str) => str !== "").join(' ')

const ProfileDetailsContent = (props) => {
	const { email, Permissions, UserAddresses, UserCompanyAddresses, UserCompanyPhones, userId, UserPhones, accountId } = props.data.User;
	const {
		companyPhoneId,
		data,
		editForm,
		editId,
		page,
		setState,
		tempPasswordCreated,
		tempPasswordToken,
		url,
		userTypeId
	} = props;

	// Password variables
	const UserLogin = data.User.UserLogin.find(({userLoginTypeId}) => parseInt(userLoginTypeId) === 1);
	const userLoginId = UserLogin ? UserLogin.userLoginId : null;

	const userAddress = data.User.UserAddresses.find((Address) => parseInt(Address.userAddressId) === parseInt(editId)) || {'active': 1, 'address1': "", 'address2': '', 'addressTypeId': 0, 'city': '',  'postalCode': '', 'stateId': 0, 'userId': userId, 'userAddressId': 0};

	const userPhone = data.User.UserPhones.find((phone) => parseInt(phone.userPhoneId) === parseInt(editId)) || {'active': 1, 'phone': '', 'phoneId': 0, 'phoneLabel': '', 'phoneTypeId': 0, 'userId': userId, 'userPhoneId': 0};

	const { CompanyAddresses, CompanyPhones } = props.data;
	const fullNameStr = fullName(props.data.User);

	const passwordLogin = props.data.User.UserLogin.find(({userLoginTypeId}) => parseInt(userLoginTypeId) === 1);

	// Get the list of temporary passwords.
	const temporaryPasswords = props.data.User.UserLogin.filter(({userLoginTypeId}) => parseInt(userLoginTypeId) === 2);

	// Function for creating a temp password and then updating the list of them
	async function handleCreateTemporaryPassword() {

		const { data: { temporaryPasswordCreate: { token }}} = await props.createTemporaryPassword({ email, accountId, sendRecoveryEmail: true });

		if(token !== "" && token !== undefined && token !== null) {
			setState({tempPasswordCreated: true, tempPasswordToken: token});
		}
	}

	// Function to handle crematory admin being able to login as the user
	async function handleLoginImmediately(email, accountId) {
		// Create a temp password and get back to token needed to login as this user
		const { data: { temporaryPasswordCreate: { token }}} = await props.createTemporaryPassword({ email, accountId, sendRecoveryEmail: false });

		// Execute the Logout mutate to alert the server that we are logging out. This is copied from logout_component.js
		await props.Logout().then(() => {
			// Reset the cache and call the session query.
			//sessionStorage.clear()
			//props.client.clearStore().then(() => {
				//props.client.resetStore();
				props.history.push('/dashboard')
			//});
		});

		// Execute Login to start session as this user
		await props.Login({email: email, token: token});
	}

	return (
		<React.Fragment>
			<div className="w-100">
				<div className="w-100">
					{page !== 'my_account' && <h4><Translate id={"Edit User"} data={{userId, fullNameStr}} /></h4>}{/*Edit User ID {`${userId}: ${fullNameStr}`*/}
					<div className="card mt-3">
						<div className="card-header">
							<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => setState({editForm: 'demographics', tempPasswordCreated: false})}>
								<FontAwesomeIcon icon="pen" /> <Translate id="Edit" />
							</button>
							<h5><Translate id={"User Information"}/></h5>
						</div>
						<div className="card-body">
							{
								editForm === 'demographics' &&
								<div className="mb-2">
									<UserForm
										initialValues={_.pick(data.User,["firstName", "lastName", "middleName", "salutation", "userId"])}
										cancelForm={() => setState({editForm: '', editId: 0, tempPasswordCreated: false})}
									/>
								</div>
							}
							{fullNameStr}
						</div>
					</div>

					<div className="card mt-3">
						<div className="card-header">
							<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => setState({editForm: 'email', tempPasswordCreated: false})}>
								{/*Edit*/}
								<FontAwesomeIcon icon="pen" /> <Translate id="Edit" />
							</button>
							<h5><Translate id="Email" />{/*Email*/}</h5>
						</div>
						<div className="card-body clearfix">
							{
								editForm === 'email' &&
								<div className="mb-2">
									<UserEmailForm
										data={data}
										initialValues={_.pick(data.User, ["email", "userEmailId","userId","userLoginId"])}
										cancelForm={() => setState({editForm: '', editId: 0, tempPasswordCreated: false})}
									/>
								</div>
							}
							{email}
						</div>
					</div>

					<div className="card mt-3">
						<div className="card-header">
							<button className="btn btn-sm btn-info btn-addon float-right" onClick={() => setState({editForm: 'password', tempPasswordCreated: false})}>
								<FontAwesomeIcon icon="pen" />
								<Translate id="Edit" />
							</button>
							<h5><Translate id="Manage Password" />{/*Manage Password*/}</h5>
						</div>
						<div className="card-body clearfix">
							{
								editForm === 'password' &&
								<div className="mb-2">
									<UserPasswordForm
										initialValues={{
											passwordNew: "",
											passwordNewConfirm: "",
											userLoginId,
											userId
										}}
										editButtonClickHandler={(editForm, editId) => setState({editForm: editForm, editId: editId})}
										cancelForm={() => setState({editForm: '', editId: 0})}
									/>
								</div>
							}
							{ passwordLogin === undefined && <div>No Password Saved</div> }
							{ passwordLogin !== undefined && passwordLogin.passwordLastUpdated !== null && <div> <b>Password Last Updated: </b> { moment(passwordLogin.passwordLastUpdated).format("MMM D, YYYY h:mm A") }</div> }
							{ passwordLogin !== undefined && passwordLogin.passwordLastUpdated === null && <div> <b>Password Created: </b> { moment(passwordLogin.dateCreated).format("MMM D, YYYY h:mm A") }</div> }
						</div>
					</div>

					<div className="card mt-3">
						<div className="card-header">
							<button className="btn btn-sm btn-info btn-addon float-right" onClick={() => handleCreateTemporaryPassword()}>
								<FontAwesomeIcon icon="plus" /> <Translate id="Add Temporary Password" />{/* Add Temporary Password */}
							</button>
							<h5><Translate id="Temporary Password" />{/*Temporary Password*/}</h5>
						</div>
						<div className="card-body">
							{
								tempPasswordCreated === true &&
								<div className="alert alert-success">Temporary Password Created</div>
							}
							{(parseInt(userTypeId) === 1 || parseInt(userTypeId) === 2) &&
								<p><button className="btn btn-success btn-addon" onClick={() => handleLoginImmediately(email, accountId)}>
									<FontAwesomeIcon icon="lock" /> <Translate id="Login Immediately as" /> {fullNameStr}
								</button></p>
							}
							<table className="table table-striped">
								<thead>
									<tr>
										<th>Created By</th>
										<th>Expires</th>
										<th>&nbsp;</th>
									</tr>
								</thead>
								<tbody>
									{
										tempPasswordCreated === true &&
										<tr key={0}>
											<td>Temp Password</td>
											<td></td>
											<td><a target="_blank" href={getUrlStr(url,tempPasswordToken)} rel="noopener noreferrer" className="float-right"><Translate id="Login" /></a></td>
										</tr>
									}
									{
										temporaryPasswords &&
											temporaryPasswords.map(({userLoginId, dateExpiration, token, updatedBy, Account: { url }}) => (
												<tr key={userLoginId}>
													<td>{ updatedBy !== null ? `${updatedBy.lastName}, ${updatedBy.firstName}` : "External User"}</td>
													<td>{moment(dateExpiration).format("MMM D, YYYY h:mm A")}</td>
													<td><a target="_blank" href={getUrlStr(url,token)} rel="noopener noreferrer" className="float-right"><Translate id="Login" /></a></td>
												</tr>
											))
									}
								</tbody>
							</table>
						</div>
					</div>

					<div className="card mt-3">
						<div className="card-header">
							<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => setState({editForm: 'phone', tempPasswordCreated: false})}>
								<FontAwesomeIcon icon="plus" /> <Translate id="Add New Phone" />{/* Add New Phone */}
							</button>
							<h5><Translate id="Phones" />{/*Phones*/}</h5>
						</div>
						<div className="card-body">
							{
								editForm === 'phone' &&
								<div className="mb-2">
									<UserPhoneForm
										key={userPhone.userPhoneId}
										cancelForm={() => setState({editForm: '', editId: 0})}
										CompanyPhones={CompanyPhones}
										editButtonClickHandler={(editForm, editId) => setState({editForm: editForm, editId: editId})}
										handleCompanyPhoneSelect={(companyPhoneId) => setState({companyPhoneId: companyPhoneId})}
										initialValues={userPhone}
										page={page}
										phoneNumberDisabled={companyPhoneId > 0}
										entityName={fullName(data.User)}
										showRemove={userPhone.userPhoneId > 0}
										heading={"User Phone"}
									/>
								</div>
							}

							{UserPhones.length > 0 && UserPhones.map((phone) => {
								return (
									<div key={phone.userPhoneId}>
										{formatPhone(phone.phone)}: {<TranslateDefault id={phone.phoneType}>{phone.phoneType}</TranslateDefault>} {phone.phoneLabel && `(${phone.phoneLabel})`}
										<button className="btn btn-sm btn-info btn-addon" disabled={false} onClick={() => setState({editForm: 'phone', editId: phone.userPhoneId, tempPasswordCreated: false})}>
											<FontAwesomeIcon icon="pen" /> <Translate id="Edit"/>
										</button>
									</div>
								)
							})}
							<div className="mt-3">
								<CompanyPhoneForm
									key={0}
									CompanyPhones={CompanyPhones}
									initialValues={{userId: userId}}
									showRemove={true}
									UserCompanyPhones={UserCompanyPhones}
								/>
							</div>
						</div>
					</div>
					<div className="card mt-3">
						<div className="card-header">
							<button className="btn btn-sm btn-addon btn-info float-right" disabled={false} onClick={() => setState({editForm: 'address', editId: 0, tempPasswordCreated: false})}>
								<FontAwesomeIcon icon="plus" /> <Translate id="Add New Address" />
							</button>
							<h5><Translate id="Addresses"/>{/* Addresses */}</h5>
						</div>
						<div className="card-body">
							{
								editForm === 'address' &&
								<div className="mb-2">
									<UserAddressForm
										key={userAddress.userAddressId}
										cancelForm={() => setState({editForm: '', editId: 0})}
										initialValues={userAddress}
										showAddressName={false}
										page={page}
										editButtonClickHandler={(editForm, editId) => setState({editForm: editForm, editId: editId})}
										showRemove={userAddress.userAddressId > 0}
									/>
								</div>
							}
							{UserAddresses.length > 0 && UserAddresses.map((address) => {
								return (
									<div key={address.userAddressId}>
										<div>{address.address1} {address.address2 !== null && address.address2}</div>
										<div>
											{address.city}, {address.state} {address.postalCode}
											<button className="btn btn-sm btn-info" disabled={false} onClick={() => setState({editForm: 'address', editId: address.userAddressId, tempPasswordCreated: false})}>
												<Translate id="Edit"/>
											</button>
										</div>
									</div>
								)
							})}

							<div className="mt-3">
								<CompanyAddressForm
									key={0}
									CompanyAddresses={CompanyAddresses}
									initialValues={{userId: userId}}
									showRemove={true}
									UserCompanyAddresses={UserCompanyAddresses}
								/>
							</div>
						</div>
					</div>

					{page !== 'my_account' &&
						<div className="card mt-3">
							<div className="card-header">
								<h5><Translate id="Permissions" /></h5>
							</div>
							<div className="card-body">
								{
									editForm === 'permission' &&
									<div className="mb-2">
										<UserPermissionForm
											key={editId.userPermissionId}
											cancelForm={() => setState({editForm: '', editId: 0})}
											initialValues={{
												userPermissionId: editId.userPermissionId,
												permissionId: editId.Permission.permissionId,
												permissionLevel: editId.permissionLevel + "",
												userId: userId
											}}
											UserName={fullName(data.User)}
											User={data.User}
											editButtonClickHandler={(editForm, editId) => setState({editForm: editForm, editId: editId})}
											showRemove={editId.userPermissionId > 0}
										/>
									</div>
								}
								{Permissions.length > 0 && Permissions.map((permission) => {
									return (
										<p key={permission.Permission.permissionId} className="border-bottom pb-2">
											<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => setState({editForm: "permission", editId: permission, tempPasswordCreated: false})}>
												<FontAwesomeIcon icon="pen" /> <Translate id="Edit" />
											</button>
											<span className="float-right mr-2">{permission.permissionLevelString}</span>
											{_.startCase(permission.Permission.permission)}
										</p>
									)
								})}
							</div>
						</div>
					}
				</div>
			</div>
		</React.Fragment>
	)
};

const ProfileDetails = compose(
	withApollo,
	withRouter,
	// Setup the mutation for creating the new password.
	withMutation(LoginMutation, "Login"),
	withMutation(LogoutMutation, "Logout"),
	withMutation(UserCreateTemporaryPasswordMutation, "createTemporaryPassword"),
	withState({
		companyPhoneId: 0,
		editForm: '',
		editId: 0,
		tempPasswordCreated: false,
		tempPasswordToken: ''
	})

)(ProfileDetailsContent);

export class UserUpdateClass extends React.Component {
	state = {
		// If on 'Phone' form, this is the Id of the companyPhone which is selected. Need it in state to be able to disable the phone input if a companyPhone is selected.
		companyPhoneId: 0,
		// The type of form we will be editing.
		editForm: "",
		// The id of the record we will be editing.
		editId: 0,
		// the response object from the previous mutation (To display "saved")
		previousResponse: null
	}

	// Scroll to the top automatically in case the page is scrolled down already.
	componentDidMount = () => window.scrollTo(0,0);

	// If the user clicks cancel on a form, clear it out.
	cancelForm = () => this.setState({companyPhoneId: 0, editForm:'', editId: 0, previousResponse: null});

	// Handler for when an item is clicked, will display the proper form on the left side.
	editButtonClickHandler = (editForm, editId, previousResponse = null) => {
		window.scrollTo(0,0);
		this.setState({ editForm, editId, previousResponse });
	}

	// Handler for when a Company Phone is selected in the phone form.
	handleCompanyPhoneSelect = (companyPhoneId) => this.setState({companyPhoneId});

	// Render function to display the form content in the side column.
	// renderEditForm() {
	// 	const { CompanyPhones, User } = this.props.data;
	//
	// 	const page = this.props.match.path === "/my_account" ? 'my_account' : 'user';

		// if(this.state.editForm === "address") {
		// 	const userAddress = User.UserAddresses.find((Address) => Address.userAddressId === this.state.editId) || {'active': 1, 'address1': "", 'address2': '', 'addressTypeId': 0, 'city': '',  'postalCode': '', 'stateId': 0, 'userId': User.userId, 'userAddressId': 0};
		// 	return (
		// 		<UserAddressForm
		// 			key={userAddress.userAddressId}
		// 			cancelForm={this.cancelForm}
		// 			initialValues={userAddress}
		// 			showAddressName={false}
		// 			page={page}
		// 			previousResponse={this.state.previousResponse}
		// 			editButtonClickHandler={this.editButtonClickHandler}
		// 			showRemove={userAddress.userAddressId > 0}
		// 		/>
		// 	)
		// }
		// else if(this.state.editForm === 'demographics') {
		// 	return (
		// 		<UserForm
		// 			initialValues={_.pick(this.props.data.User,["firstName", "lastName", "middleName", "salutation", "userId"])}
		// 			cancelForm={this.cancelForm}
		// 		/>
		// 	)
		// }
		// else if(this.state.editForm === "email") {
		// 	return (
		// 		<UserEmailForm
		// 			data={this.props.data}
		// 			initialValues={_.pick(this.props.data.User, ["email", "userEmailId","userId","userLoginId"])}
		// 			cancelForm={this.cancelForm}
		// 		/>
		// 	)
		// }
		//else
		// if(this.state.editForm === "permission") {
		// 	let initialValues;
		// 	const Permission = this.state.editId;
		//
		// 	initialValues = {
		// 		userPermissionId: Permission.userPermissionId,
		// 		permissionId: Permission.Permission.permissionId,
		// 		permissionLevel: Permission.permissionLevel + "",
		// 		userId: this.props.data.User.userId
		// 	}
		//
		// 	return (
		// 		<UserPermissionForm
		// 			key={initialValues.userPermissionId}
		// 			cancelForm={this.cancelForm}
		// 			initialValues={initialValues}
		// 			UserName={fullName(this.props.data.User)}
		// 			User={this.props.data.User}
		// 			editButtonClickHandler={this.editButtonClickHandler}
		// 			previousResponse={this.state.previousResponse}
		// 			showRemove={initialValues.userPermissionId > 0}
		// 		/>
		// 	);
		// }
		// else if(this.state.editForm === 'password') {
		// 	const UserLogin = this.props.data.User.UserLogin.find(({userLoginTypeId}) => parseInt(userLoginTypeId) === 1);
		// 	const userLoginId = UserLogin ? UserLogin.userLoginId : null;

				// 	return (
		// 		<UserPasswordForm
		// 			initialValues={{
		// 				passwordNew: "",
		// 				passwordNewConfirm: "",
		// 				userLoginId,
		// 				userId: this.props.data.User.userId
		// 			}}
		// 			editButtonClickHandler={this.editButtonClickHandler}
		// 			cancelForm={this.cancelForm}
		// 		/>
		// 	)
		// }
		// else if(this.state.editForm === 'phone') {
		// 	const userPhone = User.UserPhones.find((phone) => phone.userPhoneId === this.state.editId) || {'active': 1, 'phone': '', 'phoneId': 0, 'phoneLabel': '', 'phoneTypeId': 0, 'userId': User.userId, 'userPhoneId': 0};
		// 	return (
		// 		<UserPhoneForm
		// 			editButtonClickHandler={this.editButtonClickHandler}
		// 			key={userPhone.userPhoneId}
		// 			cancelForm={this.cancelForm}
		// 			CompanyPhones={CompanyPhones}
		// 			handleCompanyPhoneSelect={this.handleCompanyPhoneSelect}
		// 			initialValues={userPhone}
		// 			page={page}
		// 			phoneNumberDisabled={this.state.companyPhoneId > 0}
		// 			previousResponse={this.state.previousResponse}
		// 			entityName={fullName(this.props.data.User)}
		// 			showRemove={userPhone.userPhoneId > 0}
		// 			heading={"User Phone"}
		// 		/>
		// 	)
		// }
	// 	else {
	// 		return null;
	// 	}
	// }

	render () {
		const page = this.props.match.path === "/my_account" ? 'my_account' : 'user';
		const userTypeId = this.props.Session.LoggedIn === true ? this.props.Session.User.userTypeId : 0;

		return (
			<React.Fragment>
				<ProfileDetails
					editButtonClickHandler={this.editButtonClickHandler}
					data={this.props.data}
					page={page}
					url={this.props.Account.url}
					userTypeId={userTypeId}
				/>

			</React.Fragment>
		)
	}
}

export const User = compose(
	withRouter,
	queryWithLoading({ gqlString: getUserProfileQuery, variablesFunction: (props) => ({userId: props.userId ? props.userId : (props.match.params.userId ? props.match.params.userId : props.Session.User.userId)}) })
)(UserUpdateClass);
