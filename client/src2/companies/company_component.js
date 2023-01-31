import React from 'react';
import _ from "lodash";
import { compose, graphql } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Field, withFormik } from "../utilities/IWDFormik";

import { withRouter } from '../utilities/IWDReactRouter'; // for URL routing

import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation, castNumerics } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// Contains the layout for columns
import { DetailColumn } from '../layouts/application';

import { AddressFormContent } from '../addresses/address_component'; // generic address form
// import { CompanyDepartmentForm } from './company_department_component'; // company department info form
import { CompanyFormUpdate } from './company_details_component'; // generic company info form
import { PhoneFormContent, formatPhone } from "../phones/phone_component"; // generic phone form

import { ProductCategories } from "./company_product_component";

import { UserCreate } from "../users/user_create_component";
import { User } from "../users/user_component";
import { UsersContent } from "../users/users_component";

import { QueryTagWithLoading } from "../utilities/IWDDb";

// GRAPHQL QUERY
import {
	getCompanyQuery,
	CompanyAddressSaveMutation,
	CompanyAddressRemoveMutation,
	CompanyDepartmentSaveMutation,
	CompanyPhoneSaveMutation,
	CompanyPhoneRemoveMutation
} from './companies_graphql';

import {
	getProductCategoriesQuery
} from "../products/products_graphql";

import {
	getUsersQuery
} from "../users/users_graphql";

import {
	getDeliveryRoutesQuery
} from "../delivery_routes/delivery_routes_graphql";

export const Users = (props) => (
	<QueryTagWithLoading
		query={ getUsersQuery }
		variables={ { companyId: props.companyId, userTypeId: [2, 3, 4, 5] } }
		Component={ UsersContent }>
	</QueryTagWithLoading>
);

const CompanyAddressForm = compose (
	queryWithLoading({gqlString: getDeliveryRoutesQuery, name: "DeliveryRoutes"}),
	// Setup the mutation for saving the permission. We can use withMutation here because handleSubmit in the formik code can map userPhoneId properly.
	withMutation(CompanyAddressSaveMutation, "CompanyAddressSave", ["getCompany"]),
	/* 	Set up the removal mutation, we use graphql here because we need to specify that the ID field is userAddressd.  The address component
		is used in multiple places so it doesn't know which	field we till want to use.
	*/
	graphql(CompanyAddressRemoveMutation, { options: { refetchQueries: ["getCompany"] }, props: ({mutate}) => ({ removeAddress: ({companyAddressId}) => mutate({ variables: { companyAddressId } }) }) }),
	withFormik({
		// map the supplied initialValues structure to make sure no values are undfiend.
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( CompanyAddressInputValues, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result into  userPhoneSave
			const { data: { companyAddressSave } } = await FormikForm.props.CompanyAddressSave({ input: CompanyAddressInputValues });

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.editButtonClickHandler("address", companyAddressSave.CompanyAddress.companyAddressId, companyAddressSave.Response);

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


const CompanyPhoneForm = compose (
	// Setup the mutation for saving the permission.
	withMutation(CompanyPhoneSaveMutation, "CompanyPhoneSave", ["getCompany"]),
	graphql(CompanyPhoneRemoveMutation, { options: { refetchQueries: ["getCompany"] }, props: ({mutate}) => ({ removePhone: ({companyPhoneId}) => mutate({ variables: { companyPhoneId } }) }) }),
	withFormik({
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( CompanyPhoneInputValues, FormikForm ) => {
			const { data : { companyPhoneSave } } = await FormikForm.props.CompanyPhoneSave({ input: CompanyPhoneInputValues });	// send the mutation to the server

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.editButtonClickHandler("phone", companyPhoneSave.CompanyPhone.companyPhoneId, companyPhoneSave.Response);

			// Reset the form to clear the save button and disable it.
			FormikForm.resetForm();
	   },
	   // Require Phone and Type
	   validationSchema: () => Yup.object().shape({
		phone: Yup.string().matches(/\d{10}/,"Invalid Phone Number").required("A phone number is required"),
		phoneTypeId: Yup.number().required("Phone Type is required")
   		})
	})
)(PhoneFormContent);
// END MUTATIONS

const CompanyDepartmentFormContent = (props)  => {
	const {
		dirty,
		errors,
		isSubmitting,
		previousResponse,
		touched,
	} = props;

	return (
		<React.Fragment>
			<h5><Translate id="Department Information"/></h5>

			{/*  Display a resulting status message.  */}
			{ previousResponse &&	<div className="alert alert-success">{props.translate(previousResponse.message)}</div> }

			<Form>
				<div className="row">
					<div className="col-md">
						<Translate id="Department Name"/> *
						<Field name="departmentName" placeholder={props.translate("Department Name Placeholder")} className={`form-control ${errors.departmentName && touched.departmentName && 'is-invalid'}`} />
							{errors.departmentName  && <div className="invalid-feedback">{props.translate(errors.departmentName)}</div>}
					</div>
					
				</div>
				<div className="row">
					<div className="col-md">
						<Translate id="Active"/>
						<Field component="select" name="active" showError={true} className={`form-control ${errors.active && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
				</div>

				<div className="mt-1">
					<button type="button" onClick={props.handleSubmit} className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
					</button>
					<button className="btn btn-default ml-2" disabled={isSubmitting} onClick={props.cancelForm}> <Translate id="Cancel"/> </button>
				</div>
			</Form>
		</React.Fragment>
	);
};

export const CompanyDepartmentForm = compose(
	withTranslate,
	withMutation(CompanyDepartmentSaveMutation, "CompanyDepartmentSaveMutate", ["getCompany"]),
	withFormik({
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( CompanyDepartmentInputValues, FormikForm) => {
			let castCompanyDepartmentInputValues = castNumerics(CompanyDepartmentInputValues,"active");

			const { data: { companyDepartmentSave: { Response, CompanyDepartment } } } = await FormikForm.props.CompanyDepartmentSaveMutate({ input: castCompanyDepartmentInputValues });

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.editButtonClickHandler("companyDepartment", CompanyDepartment.companyDepartmentId, Response);

			// Reset the form to get the new initial values.
			FormikForm.resetForm();
		},
		validate: (values) => {
			let errors = {};
			// If value is blank, create error struct key with message, else delete the struct key
			if(values.departmentName === '') { errors.departmentName = 'Company Department name is required'; } else { delete errors.departmentName; };

			return errors
		}
	})
)(CompanyDepartmentFormContent);

const CompanyDetails = (props) => {
	const {
		accountNumber,
		allowHomeMemorialization,
		bccHospitalForCustomerEmails,
		communalPawPrintAllowed,
		companyId,
		CompanyAddresses,
		CompanyDepartments,
		companyDescription,
		companyName,
		companyNameLegal,
		CompanyPhones,
		companyTypeId,
		courierDeliveryOffered,
		crematoryPickupOffered,
		cremationTypesOffered,
		defaultDiscount,
		defaultUnits,
		expeditedCremationAllowed,
		homeMemorializationsEditCremation,
		hospitalDeliveryOffered,
		hoursOfOperation,
		invoiceEmail,
		payAtPickupOffered,
		payByCreditCardOffered,
		payVetOrderByCreditCardOffered,
		paymentTerms,
		petReferenceNumberAutoGenerate,
		requireInitialsEditOrderDetails,
		sendOwnerEmailCompletedDelivered,
		visitationAllowed
	} = props.Company.Company;

	const {
		Users: {Users},
		UsersLoginsSave,
		userTypeId
	} = props;

	return (
		<React.Fragment>
			<div className="col">
				<h4 className="text-white text-shadow" id={companyId}><Translate id="Edit Company Name" data={{companyName}}/>{/*Edit Company ID {`${companyId}: ${companyName} ${companyNameLegal}`}*/}</h4>
				<div className="card">
					<div className="card-header">
						{
							parseInt(userTypeId) !== 5 &&
							<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => props.editButtonClickHandler("companyDetails")}>
								<FontAwesomeIcon icon="pen" /> <Translate id="Edit"/>
							</button>
						}
						<h4 className="m-0"><Translate id="Company Information"/> for {companyName}</h4>
					</div>
					<div className="card-body">
						<p className="mb-1">{companyNameLegal}</p>
						<p className="mb-1">{companyDescription}</p>
						<p className="mb-1"><span className="text-muted"><Translate id="Hours of Operation"/>:</span>  {hoursOfOperation}</p>
						<p className="mb-1"><span className="text-muted"><Translate id="Default Discount"/>:</span>  {defaultDiscount}%</p>

						{/* COMPANY OPTIONS - Vets only */}
						{companyTypeId === '3' && <div className="mt-3">
							<p className="mb-1"><span className="text-muted"><Translate id="Invoice Account #"/>:</span> {accountNumber}</p>
							<p className="mb-1"><span className="text-muted"><Translate id="Invoice Email To"/>:</span> {invoiceEmail}</p>
							<p className="mb-3"><span className="text-muted"><Translate id="Payment Terms"/>:</span>
								{paymentTerms === 'net_15' && <span> Net 15</span>}
								{paymentTerms === 'net_30' && <span> Net 30</span>}
							</p>

							<p className="mb-1"><span className="text-muted"><Translate id="Pay at Pickup Offered"/>:</span> {payAtPickupOffered === 1 ? <span>Yes</span> : <span>No</span>}</p>
							<p className="mb-1"><span className="text-muted"><Translate id="Pay by Credit Card Offered"/>:</span>  {payByCreditCardOffered === 1 ? <span>Yes</span> : <span>No</span>}</p>
							<p className="mb-3"><span className="text-muted"><Translate id="Pay Vet Order by Credit Card Offered"/>:</span>  {payVetOrderByCreditCardOffered === 1 ? <span>Yes</span> : <span>No</span>}</p>

							<p className="mb-1"><span className="text-muted"><Translate id="Pickup at Crematory Offered"/>:</span>  {crematoryPickupOffered === 1 ? <span>Yes</span> : <span>No</span>}</p>
							<p className="mb-1"><span className="text-muted"><Translate id="Hospital Delivery Offered"/>:</span>  {hospitalDeliveryOffered === 1 ? <span>Yes</span> : <span>No</span>}</p>
							<p className="mb-3"><span className="text-muted"><Translate id="Courier Delivery Offered"/>:</span>  {courierDeliveryOffered === 1 ? <span>Yes</span> : <span>No</span>}</p>

							<p className="mb-1"><span className="text-muted"><Translate id="Paw Prints for Communal Cremations"/>:</span>
								{communalPawPrintAllowed === 'no' && <span> NOT Offered</span>}
								{communalPawPrintAllowed === 'clinic_only' && <span> In Hospital Online</span>}
								{communalPawPrintAllowed === 'home_and_clinic' && <span> At Home and In Hospital</span>}
							</p>
							<p className="mb-1"><span className="text-muted"><Translate id="Ashes Returned Cremations Offered"/>:</span>
								{cremationTypesOffered === 'individual_and_private' && <span> Individual, and Private is offered as an upgrade</span>}
								{cremationTypesOffered === 'individual_only' && <span> Individual, but NOT Private</span>}
								{cremationTypesOffered === 'private_only' && <span> Private, but NOT Individual</span>}
							</p>
							<p className="mb-3"><span className="text-muted"><Translate id="Home Memorialization Edit Cremation"/>:</span>
								{(parseInt(homeMemorializationsEditCremation) === 1 || homeMemorializationsEditCremation === true) && <span> Yes</span>}
								{(parseInt(homeMemorializationsEditCremation) === 0 || homeMemorializationsEditCremation === false) && <span> No</span>}
							</p>

							<p className="mb-1"><span className="text-muted"><Translate id="Expedited Cremation Allowed"/>:</span>
								{(parseInt(expeditedCremationAllowed) === 1 || expeditedCremationAllowed === true) && <span> Yes</span>}
								{(parseInt(expeditedCremationAllowed) === 0 || expeditedCremationAllowed === false) && <span> No</span>}
							</p>
							<p className="mb-3"><span className="text-muted"><Translate id="Visitation Allowed"/>:</span>
								{(parseInt(visitationAllowed) === 1 || visitationAllowed === true) && <span> Yes</span>}
								{(parseInt(visitationAllowed) === 0 || visitationAllowed === false) && <span> No</span>}
							</p>

							<p className="mb-1"><span className="text-muted"><Translate id="Default Units"/>:</span>
								<span> {defaultUnits}</span>
							</p>
							<p className="mb-1"><span className="text-muted"><Translate id="Require Initials to Edit Order Details"/>:</span>
								{(parseInt(requireInitialsEditOrderDetails) === 1 || requireInitialsEditOrderDetails === true) && <span> Yes</span>}
								{(parseInt(requireInitialsEditOrderDetails) === 0 || requireInitialsEditOrderDetails === false) && <span> No</span>}
							</p>
							<p className="mb-1"><span className="text-muted"><Translate id="Send Pet Owner an Email when Order has status Completed and Delivered"/>:</span>
								{(parseInt(sendOwnerEmailCompletedDelivered) === 1 || sendOwnerEmailCompletedDelivered === true) && <span> Yes</span>}
								{(parseInt(sendOwnerEmailCompletedDelivered) === 0 || sendOwnerEmailCompletedDelivered === false) && <span> No</span>}
							</p>
							<p className="mb-1"><span className="text-muted"><Translate id="Bcc Hospital Email for all customer pet owner emails"/>:</span>
								{(parseInt(bccHospitalForCustomerEmails) === 1 || bccHospitalForCustomerEmails === true) && <span> Yes</span>}
								{(parseInt(bccHospitalForCustomerEmails) === 0 || bccHospitalForCustomerEmails === false) && <span> No</span>}
							</p>
							<p className="mb-1"><span className="text-muted"><Translate id="Allow Home Memorialization"/>:</span>
								{(parseInt(allowHomeMemorialization) === 1 || allowHomeMemorialization === true) && <span> Yes</span>}
								{(parseInt(allowHomeMemorialization) === 0 || allowHomeMemorialization === false) && <span> No</span>}
							</p>
							<p className="mb-1"><span className="text-muted"><Translate id="Auto-Generate Pet Reference Numbers"/>:</span>
								{(parseInt(petReferenceNumberAutoGenerate) === 1 || petReferenceNumberAutoGenerate === true) && <span> Yes</span>}
								{(parseInt(petReferenceNumberAutoGenerate) === 0 || petReferenceNumberAutoGenerate === false) && <span> No</span>}
							</p>
						</div>}
					</div>
				</div>
				<div className="card mt-3">
					<div className="card-header">
						<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => props.editButtonClickHandler('phone', 0)}>
							<FontAwesomeIcon icon="plus" /> <Translate id="Add New Phone"/>
						</button>
						<h4 className="m-0"><Translate id="Phones"/></h4>
					</div>
					<div className="card-body">
						{CompanyPhones.length > 0 && CompanyPhones.map((phone) => {
							return (
								<div key={phone.companyPhoneId} className="border-bottom clearfix">
									<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => props.editButtonClickHandler('phone', phone.companyPhoneId)}>
									<FontAwesomeIcon icon="pen" /> <Translate id="Edit"/>
									</button>
									{formatPhone(phone.phone)}: {phone.phoneType} {phone.phoneLabel && `(${phone.phoneLabel})`}
								</div>
							)
						})}
					</div>
				</div>
				<div className="card mt-3">
					<div className="card-header">
						<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => props.editButtonClickHandler('companyDepartment', 0)}>
							<FontAwesomeIcon icon="plus" /> <Translate id="Add New Department"/>
						</button>
						<h4 className="m-0"><Translate id="Departments"/></h4>
					</div>
					<div className="card-body">
						{CompanyDepartments.length > 0 && CompanyDepartments.map((department) => {
							return (
								<div key={department.companyDepartmentId} className="border-bottom clearfix">
									<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => props.editButtonClickHandler('companyDepartment', department.companyDepartmentId)}>
									<FontAwesomeIcon icon="pen" /> <Translate id="Edit"/>
									</button>
									{department.departmentName}
								</div>
							)
						})}
					</div>
				</div>
				<div className="card mt-3">
					<div className="card-header">
						<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => props.editButtonClickHandler('address', 0)}>
							<FontAwesomeIcon icon="plus" /> <Translate id="Add New Address"/>
						</button>
						<h4 className="m-0"><Translate id="Addresses"/></h4>
					</div>
					<div className="card-body">
						{CompanyAddresses.length > 0 && CompanyAddresses.map((address) => {
							return (
								<div key={address.companyAddressId} className="border-bottom pt-1 pb-1">
									<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => props.editButtonClickHandler('address', address.companyAddressId)}>
										<FontAwesomeIcon icon="pen" /> <Translate id="Edit"/>
									</button>
									{address.addressName !== null && <p className="h5 mb-1">{address.addressName}</p>}
									<p className="mb-1">{address.address1} {address.address2 !== null && address.address2}</p>
									<p className="mb-1">
										{address.city}, {address.state} {address.postalCode}
									</p>
									<p className="mb-1">
										{address.deliveryInstructions}
									</p>
								</div>
							)
						})}
					</div>
				</div>
				<div className="card mt-3">
					<div className="card-header">
						{
							parseInt(userTypeId) !== 5 &&
							<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => props.editButtonClickHandler('user', 0)}>
								<FontAwesomeIcon icon="plus" /> <Translate id="Add New User"/>
							</button>
						}
						<h4 className="m-0"><Translate id="Company User List Header" data={{companyName}}/>{/*Users at {companyName}*/}</h4>
					</div>
					<div className="card-body">
						{Users.length > 0 && Users.map((user) => {
							// Get the userLoginId if there is one.
							const userLoginId = user.UserLogin.length > 0 && user.UserLogin.find((login) => parseInt(login.userLoginTypeId) === 1) ? user.UserLogin.find((login) => parseInt(login.userLoginTypeId) === 1).userLoginId : 0;
							return (
								<div key={user.userId} className="mb-2 border-bottom pt-1 pb-3">
									{/* For Vet Staff, only allow them to deactivate a user. For Crematory staff, they can edit */}
									{
										parseInt(userTypeId) === 5 && userLoginId > 0 &&
										<React.Fragment>
											{
												user.UserLogin.find((login) => parseInt(login.userLoginTypeId) === 1).active === 1 &&
												<button className="btn btn-sm btn-danger btn-addon float-right" disabled={false} onClick={() => UsersLoginsSave({input: { userLoginId, active: 0 }})}>
													<Translate id="De-Activate"/>
												</button>
											}
											{
												user.UserLogin.find((login) => parseInt(login.userLoginTypeId) === 1).active === 0 &&
												<button className="btn btn-sm btn-success btn-addon float-right" disabled={false} onClick={() => UsersLoginsSave({input: { userLoginId, active: 1 }})}>
													<Translate id="Activate"/>
												</button>
											}
										</React.Fragment>
									}
									{
										parseInt(userTypeId) === 5 && user.UserLogin.length === 0 &&
										<button className="btn btn-sm float-right" disabled={true}>
											<Translate id="No Login Information"/>
										</button>
									}
									{
										parseInt(userTypeId) !== 5 &&
										<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => props.editButtonClickHandler('user', user.userId)}>
											<FontAwesomeIcon icon="pen" /> <Translate id="Edit"/>
										</button>
									}
									{`${user.firstName} ${user.lastName}`}
								</div>
							)
						})}
					</div>
				</div>
			</div>
		</React.Fragment>
	)
};

export class CompanyUpdateClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state= {
			// The type of form we will be editing.
			editForm: "",
			// The id of the record we will be editing.
			editId: 0,
			// the response object from the previous mutation (To display "saved")
			previousResponse: null,

			// Reference to the selected product.
			selectedProduct: {}
		}
	}

	// If the user clicks cancel on a form, clear it out.
	cancelForm = () => this.setState({editForm:'', editId: 0, previousResponse: null});

	// Handler for when an item is clicked, will display the proper form on the left side.
	editButtonClickHandler = (editForm, editId, previousResponse = null) => {
		window.scrollTo(0,0); // doesnt appear to be doing anything
		this.setState({ editForm, editId, previousResponse });
	}

	renderEditForm() {
		const { PhoneTypes, Company } = this.props.Company;

		if(this.state.editForm === 'address') {
			const companyAddress = Company.CompanyAddresses.find((Address) => Address.companyAddressId === this.state.editId) ||
				{
					'active': 1,
					'addressName': '',
					'address1': '',
					'address2': '',
					'addressTypeId': 0,
					'billingCode': null,
					'city': '',
					'postalCode': '',
					'stateId': 0,
					'companyId': Company.companyId,
					'companyAddressId': 0,
					'deliveryInstructions': "",
					"routeId":""
				};

			return (
				<CompanyAddressForm
					key={companyAddress.companyAddressId}
					allowEditAddressType={parseInt(this.props.Session.User.userTypeId) === 5 ? false : true}
					cancelForm={ this.cancelForm }
					editButtonClickHandler={this.editButtonClickHandler}
					heading="Company Address"
					includeHomeAddressType={false}
					initialValues={companyAddress}
					previousResponse={this.state.previousResponse}
					showBillingCode={true}
					showDeliveryInstructions={true}
					showDeliveryRoutes={parseInt(this.props.Session.User.userTypeId) === 5 ? false : true}
					showRemove={companyAddress.companyAddressId > 0}
				/>
			)
		}
		else if(this.state.editForm === "companyDepartment") {
			const companyDepartment = Company.CompanyDepartments.find((Department) => Department.companyDepartmentId === this.state.editId) ||
				{
					'active': 1,
					'companyDepartmentId': null,
					'companyId': Company.companyId,
					'departmentName': ''
				};

			return (
				<CompanyDepartmentForm
					key={companyDepartment.companyDepartmentId}
					initialValues={companyDepartment}
					cancelForm={this.cancelForm}
					editButtonClickHandler={this.editButtonClickHandler}
					previousResponse={this.state.previousResponse}
				/>
			)
		}
		else if(this.state.editForm === "companyDetails") {
			return (
				<CompanyFormUpdate
					key={this.props.Company.Company.companyId}
					initialValues={_.pick(this.props.Company.Company, ["accountNumber", "allowHomeMemorialization", "bccHospitalForCustomerEmails", "communalPawPrintAllowed", "companyDescription", "companyId", "companyName", "companyNameLegal", "companyTypeId", "courierDeliveryOffered", "crematoryPickupOffered", "cremationTypesOffered", "defaultDiscount", "defaultUnits", "expeditedCremationAllowed", "homeMemorializationsEditCremation", "hospitalDeliveryOffered", "hoursOfOperation", "invoiceEmail", "payAtPickupOffered", "payByCreditCardOffered", "payVetOrderByCreditCardOffered", "paymentTerms", "petReferenceNumberAutoGenerate", "requireInitialsEditOrderDetails", "sendOwnerEmailCompletedDelivered", "visitationAllowed"])}
					cancelForm={this.cancelForm}
					editButtonClickHandler={this.editButtonClickHandler}
					previousResponse={this.state.previousResponse}
				/>
			)
		}
		else if(this.state.editForm === 'phone') {
			let companyPhoneIndex = Company.CompanyPhones.findIndex((phone) => phone.companyPhoneId === this.state.editId);
			let companyPhone = companyPhoneIndex > -1 ? Company.CompanyPhones[companyPhoneIndex] : {'active': 1, 'phone': '', 'phoneId': 0, 'phoneLabel': '', 'phoneTypeId': 0, 'companyId': Company.companyId, 'companyPhoneId': 0}
			return (
				<CompanyPhoneForm
					key={companyPhoneIndex}
					entityName={Company.companyName}
					phoneTypes={PhoneTypes}
					initialValues={companyPhone}
					cancelForm={ this.cancelForm }
					heading={"Company Phone"}
					previousResponse={this.state.previousResponse}
					editButtonClickHandler={this.editButtonClickHandler}
					showRemove={companyPhone.companyPhoneId > 0}
				/>
			)
		}
		else if(this.state.editForm === 'user') {
			if(parseInt(this.state.editId) === 0) {
				return (
					<React.Fragment>
						<UserCreate
							calledFrom="company_details"
						/>
						<p className="text-right"><button type="button" className="btn btn-default btn-sm btn-addon" onClick={() => this.editButtonClickHandler("")}><FontAwesomeIcon icon="times" /> <Translate id="Close User Details" /></button></p>
					</React.Fragment>
				)
			} else if(parseInt(this.state.editId) > 0) {
				return (
					<React.Fragment>
						<p className="text-right"><button type="button" className="btn btn-default btn-sm btn-addon" onClick={() => this.editButtonClickHandler("", 0)}><FontAwesomeIcon icon="times" /> <Translate id="Close User Details" /></button></p>
						<User
							calledFrom="company_details"
							userId={this.state.editId}
						/>
						<p className="text-right"><button type="button" className="btn btn-default btn-sm btn-addon" onClick={() => this.editButtonClickHandler("", 0)}><FontAwesomeIcon icon="times" /> <Translate id="Close User Details" /></button></p>
					</React.Fragment>
				)
			}
			// return (
			// 	<CompanyUserForm
			// 		key={"user"}
			// 		companyId={this.props.Company.Company.companyId}
			// 	/>
			// )
		}
		else {
			return null;
		}
	}

	render () {
		// Store the edit form content so we can wrap it in a col if there is any content.
		const editForm = this.renderEditForm();

		return (
			<DetailColumn>
				<div className="row">
					<CompanyDetails
						editButtonClickHandler={this.editButtonClickHandler.bind(this)}
						Company={this.props.Company}
						Users={this.props.Users}
						UsersLoginsSave={this.props.UsersLoginsSave}
						userTypeId={this.props.Session.User.userTypeId}
					/>

					{
						editForm &&
						<div className="col">
							<div className="card p-3 mt-5">
								{editForm}
							</div>
						</div>
					}
				</div>

				<div className="card mt-3">
					{/* Memorialization product information goes here for Vet Pricing Overrides */}
					<div className="card-header"><h4 className="m-0">Memorialization Product Pricing for {this.props.Company.Company.companyName}</h4></div>
					<div className="card-body">
						<ProductCategories
							Company={this.props.Company}
							ProductCategories={ this.props.ProductCategories }
							userTypeId={ this.props.Session.User.userTypeId }
						/>
					</div>
				</div>
			</DetailColumn>
		);
	}
}

export const CompanyUpdate = compose(
	withRouter,
	// Add in the Product Categories.
	queryWithLoading({gqlString: getProductCategoriesQuery, name: "ProductCategories"}),
	queryWithLoading({
		gqlString: getCompanyQuery,
		variablesFunction: (props) => ({companyId: props.match.params.companyId}),
		requiredPermission: { permission: "companies", permissionLevel: 4},
		name: "Company",
		notFoundCheck: ({Company}) => Company.Company === null
	}),
	queryWithLoading({
		gqlString: getUsersQuery,
		variablesFunction: (props) => ({companyId: props.match.params.companyId, userTypeId: [2, 3, 4, 5]}),
		name: "Users"
	})

)(CompanyUpdateClass)
