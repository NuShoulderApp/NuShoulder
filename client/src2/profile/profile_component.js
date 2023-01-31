import React from 'react';
import _ from "lodash";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compose, graphql } from "react-apollo";
import { withFormik } from 'formik';	// for wrapping forms
import { withRouter } from '../utilities/IWDReactRouter'; // for URL routing
import { Translate, TranslateDefault } from '../translations/IWDTranslation';

import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import { clientSessionObject, withSession } from '../utilities/session';

// Contains the layout for columns
import { DetailColumn, SidebarColumn} from '../layouts/application';

import { AddressFormContent } from '../addresses/address_component'; // generic address form
import { PhoneFormContent, formatPhone } from "../phones/phone_component"; // generic phone form
import { ProfileDetails } from "./profile_details_component";
import { UserEmailForm } from "../users/users_email_update_component";
import { UserPasswordForm } from "../users/users_passwords_update_component";
import { UserPermissionForm } from "../users/users_permissions_component";
import { UserForm } from "../users/user_details_component";

// GRAPHQL QUERY
import {
	getUserProfileQuery,
	UserAddressSaveMutation,
	UserAddressRemoveMutation,
	UserPhoneSaveMutation,
	UserPhoneRemoveMutation
} from '../users/users_graphql';
// END FORMS AREA

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

// END FORMIK AREA

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

// Build the full name: make array, filter out all blanks, then join on a space.
const fullName = ({firstName, lastName, middleName, salutation}) => [salutation, firstName, middleName, lastName ].filter((str) => str !== "").join(' ')

class ProfileClass extends React.Component {
	constructor(props) {
	    super(props)

		this.state= {
			// The type of form we will be editing.
			editForm: "",
			// The id of the record we will be editing.
			editId: 0,
			// the response object from the previous mutation (To display "saved")
			previousResponse: null
		}
	}

	// If the user clicks cancel on a form, clear it out.
	cancelForm = () => this.setState({editForm:'', editId: 0, previousResponse: null});

	// Handler for when an item is clicked, will display the proper form on the left side.
	editButtonClickHandler = (editForm, editId, previousResponse = null) => this.setState({ editForm, editId, previousResponse });

	// Render function to display the form content in the side column.
	renderEditForm() {
		const { User } = this.props.data;

		if(this.state.editForm === "address") {
			const userAddress = User.UserAddresses.find((Address) => Address.userAddressId === this.state.editId) || {'active': 1, 'address1': "", 'address2': '', 'addressTypeId': 0, 'city': '',  'postalCode': '', 'stateId': 0, 'userId': User.userId, 'userAddressId': 0};
			return (
				<UserAddressForm
					key={userAddress.userAddressId}
					cancelForm={this.cancelForm}
					initialValues={userAddress}
					previousResponse={this.state.previousResponse}
					editButtonClickHandler={this.editButtonClickHandler}
					showRemove={userAddress.userAddressId > 0}
				/>
			)
		}
		else if(this.state.editForm === 'demographics') {
			return (
				<UserForm
					initialValues={_.pick(this.props.data.User,["firstName", "lastName", "middleName", "salutation", "userId"])}
					cancelForm={this.cancelForm}
				/>
			)
		}
		else if(this.state.editForm === "email") {
			return (
				<UserEmailForm
					data={this.props.data}
					initialValues={_.pick(this.props.data.User, ["email", "userEmailId","userId","userLoginId"])}
					cancelForm={this.cancelForm}
				/>
			)
		}
		else if(this.state.editForm === 'password') {
			return (
				<UserPasswordForm
					userLoginId={this.props.data.User.userLoginId}
					cancelForm={this.cancelForm}
				/>
			)
		}
		else if(this.state.editForm === 'phone') {
			const userPhone = User.UserPhones.find((phone) => phone.userPhoneId === this.state.editId) || {'active': 1, 'phone': '', 'phoneId': 0, 'phoneLabel': '', 'phoneTypeId': 0, 'userId': User.userId, 'userPhoneId': 0};
			return (
				<UserPhoneForm
					editButtonClickHandler={this.editButtonClickHandler}
					key={userPhone.userPhoneId}
					cancelForm={this.cancelForm}
					initialValues={userPhone}
					previousResponse={this.state.previousResponse}
					entityName={fullName(this.props.data.User)}
					showRemove={userPhone.userPhoneId > 0}
					heading={"User Phone"}
				/>
			)
		}
		else {
			return null;
		}
	}

	render () {
		 return (
			<React.Fragment>
				<ProfileDetails
					editButtonClickHandler={this.editButtonClickHandler}
					data={this.props.data}
				/>
				<SidebarColumn>
					{this.renderEditForm()}
				</SidebarColumn>
			</React.Fragment>
		)
	}
}

export const Profile = compose(
	withRouter,
	queryWithLoading({ gqlString: getUserProfileQuery, variablesFunction: (props) => ({userId: props.Session.User.userId}) })
)(ProfileClass);
