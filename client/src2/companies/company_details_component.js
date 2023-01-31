import React from 'react';
import { Form, Field, withFormik } from "../utilities/IWDFormik";	// for wrapping forms

import {  compose } from "react-apollo";

import { withState } from "react-state-hoc";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from "react-router-dom";

import { Translate, withTranslate } from '../translations/IWDTranslation';
import { queryWithLoading, withMutation, castNumerics } from "../utilities/IWDDb";

// GRAPHQL QUERY
import {
	CompanySaveMutation,
	CompaniesTypesQuery
} from './companies_graphql';

const CompanyFormContent = (props)  => {
	const {
		checkMatches,
		CompanyTypes: {
			CompanyTypes
		},
		crematoryOnly=false,
		dirty,
		errors,
		initialValues,
		isSubmitting,
		previousResponse,
		touched,
		values: {
			companyName,
			companyNameLegal
		},
		values
	} = props;

	// If defaultUnits is blank, then set it to the accountSetting for units
	if(initialValues.defaultUnits === "" && values.defaultUnits === "") {
		values.defaultUnits = props.Account.getSettingValue("measurementSystem") === "Metric" ? "Metric" : "English";
	}

	function submitForm() {
		// If checkMatches is not true we will always submit.
		if(checkMatches !== true) {
			return props.submitForm();
		} else {
			// We will check for matches.

			// If the form is not valid, we submit it right away to show where it is invalid.
			if(props.isValid === false) {
				props.submitForm();
			} else {
				// Check the list of companies for matching names.
				const  matchingCompanies = props.Companies.Companies.filter((company) => companyName === company.companyName || companyNameLegal === company.companyNameLegal );

				// If there are no matching companies, we can just submit.
				if ( matchingCompanies.length === 0 ) {
					props.submitForm();
				}

				// Update the state to show the possible matches after they click save the first time.
				props.setState({matchingCompanies});
			}
		}
	}

	return (
		<React.Fragment>
			<h5><Translate id="Company Information"/></h5>

			{/*  Display a resulting status message.  */}
			{ previousResponse &&	<div className="alert alert-success">{props.translate(previousResponse.message)}</div> }

			<Form>
				<div className="row">
					<div className="col-md">
						<Translate id="Company Name"/> *
						<Field name="companyName" placeholder={props.translate("Company Name Placeholder")} className={`form-control ${errors.companyName && touched.companyName && 'is-invalid'}`} />
							{errors.companyName  && <div className="invalid-feedback">{props.translate(errors.companyName)}</div>}
					</div>
					<div className="col-md">
						<Translate id="Company Legal Name"/> *
						<Field name="companyNameLegal" placeholder={props.translate("Company Legal Name Placeholder")} className={`form-control ${errors.companyNameLegal && touched.companyNameLegal && 'is-invalid'}`} />
							{errors.companyNameLegal && <div className="invalid-feedback">{props.translate(errors.companyNameLegal)}</div>}
					</div>
				</div>
				<div>
					<Translate id="Company Description"/>
					<Field name="companyDescription" placeholder={props.translate("Company Description Placeholder")} className={`form-control ${errors.companyDescription && touched.companyDescription && 'is-invalid'}`} />
						{errors.companyDescription && touched.companyDescription && <div className="invalid-feedback">{props.translate(errors.companyDescription)}</div>}
				</div>
				<div>
					<Translate id="Hours of Operation"/>
					<Field
						name="hoursOfOperation"
						placeholder={props.translate("Hours of Operation")}
						className={`form-control ${errors.hoursOfOperation && touched.hoursOfOperation && 'is-invalid'}`}
					/>
				</div>
				<div className="row">
					<div className="col-md">
						<Translate id="Company Type"/> *
						{crematoryOnly === false &&
							<Field component="select" name="companyTypeId" className={`form-control ${errors.companyTypeId && touched.companyTypeId && 'is-invalid'}`}>
								<option value="0">{props.translate('Select Type')}</option>
								{CompanyTypes.map((type) => <option value={type.companyTypeId} key={type.companyTypeId}>{props.translate(type.companyType)}</option>)}
							</Field>
						}
						{crematoryOnly === true &&
							<Field component="select" name="companyTypeId" className={`form-control ${errors.companyTypeId && touched.companyTypeId && 'is-invalid'}`}>
								{CompanyTypes.map((type) => {
									if(type.companyType === 'Crematory') {
									return <option value={type.companyTypeId} key={type.companyTypeId}>{props.translate(type.companyType)}</option>
									} else {
										return null;
									}
								})}
							</Field>
						}
						{errors.companyTypeId && <div className="invalid-feedback">{props.translate(errors.companyTypeId)}</div>}
					</div>
					<div className="col-md-auto">
						<Translate id="Default Discount"/>
						<div className="input-group">
							<Field
								name="defaultDiscount"
								placeholder={props.translate("Default Discount")}
								className={`form-control form-control-num ${errors.defaultDiscount && touched.defaultDiscount && 'is-invalid'}`}
							/>
							<div className="input-group-append">
								<div className="input-group-text">%</div>
							</div>
						</div>
					</div>
				</div>
				{(parseInt(values.companyTypeId) === 2 || parseInt(values.companyTypeId) === 3) &&
					<div className="row">
						<div className="col-md">
							<Translate id="Home Memorialization Edit Cremation"/>
							<Field component="select" name="homeMemorializationsEditCremation" className={`form-control ${errors.homeMemorializationsEditCremation && touched.homeMemorializationsEditCremation && 'is-invalid'}`}>
								<option value={0}>{props.translate("No")}</option>
								<option value={1}>{props.translate("Yes")}</option>
							</Field>
						</div>
					</div>
				}
				<div className="row">
					<div className="col-md">
						<Translate id="Invoice Account #"/>
						<Field
							name="accountNumber"
							placeholder={props.translate("Invoice Account #")}
							className={`form-control ${errors.accountNumber && touched.accountNumber && 'is-invalid'}`}
						/>
					</div>
					<div className="col-md">
						<Translate id="Invoice Email To"/>
						<Field
							name="invoiceEmail"
							placeholder={props.translate("Invoice Email To")}
							className={`form-control ${errors.invoiceEmail && touched.invoiceEmail && 'is-invalid'}`}
						/>
					</div>
					<div className="col-md">
						<Translate id="Payment Terms"/>
						<Field component="select" name="paymentTerms" className={`form-control ${errors.paymentTerms && touched.paymentTerms && 'is-invalid'}`}>
							<option value="">{props.translate('Select Payment Terms')}</option>
							<option value="net_15">{props.translate('Net 15')}</option>
							<option value="net_30">{props.translate('Net 30')}</option>
						</Field>
					</div>
				</div>

				<div className="row">
					<div className="col-md">
						<Translate id="Pay at Pickup"/>
						<Field component="select" name="payAtPickupOffered" className={`form-control ${errors.payAtPickupOffered && touched.payAtPickupOffered && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
					<div className="col-md">
						<Translate id="Pay by Credit Card"/>
						<Field component="select" name="payByCreditCardOffered" className={`form-control ${errors.payByCreditCardOffered && touched.payByCreditCardOffered && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
					<div className="col-md">
						<Translate id="Pay Vet Order by CC"/>
						<Field component="select" name="payVetOrderByCreditCardOffered" className={`form-control ${errors.payVetOrderByCreditCardOffered && touched.payVetOrderByCreditCardOffered && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
				</div>

				<div className="row">
					<div className="col-md">
						<Translate id="Pickup at Crematory"/>
						<Field component="select" name="crematoryPickupOffered" showError={true} className={`form-control ${errors.crematoryPickupOffered && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
					{parseInt(values.companyTypeId) === 3 &&
						<div className="col-md">
							<Translate id="Hospital Delivery"/>
							<Field component="select" name="hospitalDeliveryOffered" showError={true} className={`form-control ${errors.hospitalDeliveryOffered && 'is-invalid'}`}>
								<option value="1">{props.translate('Yes')}</option>
								<option value="0">{props.translate('No')}</option>
							</Field>
						</div>
					}
					<div className="col-md">
						<Translate id="Courier Delivery"/>
						<Field component="select" name="courierDeliveryOffered" showError={true} className={`form-control ${errors.courierDeliveryOffered && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
				</div>

				<div className="row">
					<div className="col-md">
						<Translate id="Allow paw prints for communal cremations?"/>
						<Field component="select" name="communalPawPrintAllowed" className={`form-control ${errors.communalPawPrintAllowed && touched.communalPawPrintAllowed && 'is-invalid'}`}>
							<option value="no">{props.translate('No')}</option>
							<option value="clinic_only">{props.translate('In Hospital Only')}</option>
							<option value="home_and_clinic">{props.translate('At Home and In Hospital')}</option>
						</Field>
					</div>
					<div className="col-md">
						<Translate id="Offer private cremations?"/>
						<Field component="select" name="cremationTypesOffered" className={`form-control ${errors.cremationTypesOffered && touched.cremationTypesOffered && 'is-invalid'}`}>
							<option value="individual_and_private">{props.translate('Offer Individual, Offer Private as an Upgrade')}</option>
							<option value="individual_only">{props.translate('Offer Individual, NO Private')}</option>
							<option value="private_only">{props.translate('Offer Private, NO Individual')}</option>
						</Field>
					</div>
				</div>

				<div className="row">
					<div className="col-md">
						<Translate id="Expedited Cremation Allowed"/>
						<Field component="select" name="expeditedCremationAllowed" showError={true} className={`form-control ${errors.expeditedCremationAllowed && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
					<div className="col-md">
						<Translate id="Visitation Allowed"/>
						<Field component="select" name="visitationAllowed" showError={true} className={`form-control ${errors.visitationAllowed && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
				</div>

				<div className="row">
					<div className="col-md">
						<Translate id="Default Units"/>
						<Field component="select" name="defaultUnits" showError={true} className={`form-control ${errors.defaultUnits && 'is-invalid'}`}>
							<option value="English">{props.translate('English')}</option>
							<option value="Metric">{props.translate('Metric')}</option>
						</Field>
					</div>
					<div className="col-md">
						<Translate id="Require Initials to Edit Order Details"/>
						<Field component="select" name="requireInitialsEditOrderDetails" showError={true} className={`form-control ${errors.requireInitialsEditOrderDetails && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
				</div>

				<div className="row">
					<div className="col-md">
						<Translate id="Send Pet Owner an Email when Order is Completed and Delivered"/>
						<Field component="select" name="sendOwnerEmailCompletedDelivered" showError={true} className={`form-control ${errors.sendOwnerEmailCompletedDelivered && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
				</div>

				<div className="row">
					<div className="col-md">
						<Translate id="Bcc Hospital Email for all customer pet owner emails"/>
						<Field component="select" name="bccHospitalForCustomerEmails" showError={true} className={`form-control ${errors.bccHospitalForCustomerEmails && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
				</div>

				<div className="row">
					<div className="col-md">
						<Translate id="Allow Home Memorialization"/>
						<Field component="select" name="allowHomeMemorialization" showError={true} className={`form-control ${errors.allowHomeMemorialization && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
				</div>

				<div className="row">
					<div className="col-md">
						<Translate id="Auto-Generate Pet Reference Numbers"/>
						<Field component="select" name="petReferenceNumberAutoGenerate" showError={true} className={`form-control ${errors.petReferenceNumberAutoGenerate && 'is-invalid'}`}>
							<option value="1">{props.translate('Yes')}</option>
							<option value="0">{props.translate('No')}</option>
						</Field>
					</div>
				</div>

				<div className="mt-1">
					<button type="button" onClick={submitForm} className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
					</button>
					<button className="btn btn-default ml-2" disabled={isSubmitting} onClick={props.cancelForm}> <Translate id="Cancel"/> </button>
				</div>

				{/* When creating new companies we want to check for any possible duplicaties. */}
				{ checkMatches && props.matchingCompanies.length > 0 &&
					<div className="mt-2">
						<h5><Translate id="Possible Matching Companies"/></h5>
						{props.matchingCompanies.map(({companyId, companyName, companyNameLegal}) => (
							<div key={companyId}>
								<p className="border-bottom">
									<Link to={`/company/${companyId}`} className="btn btn-light"> {`${companyName} / ${companyNameLegal}`} </Link>
									<Link to={`/company/${companyId}`} className="btn btn-info btn-sm btn-addon float-right"><FontAwesomeIcon icon="pen" /> <Translate id="EDIT"/> </Link>
								</p>
							</div>
						))}

						<div className="mt-1">
							<div><Translate id="Company Create Continue Prompt"/>{/*If none of the companies listed above are the same as the one you are trying to create, click here to create this company.*/}</div>
							<button type="submit" onClick={submitForm} className="btn btn-success" disabled={isSubmitting || dirty === false}>
								<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
							</button>
							<button className="btn btn-default ml-2" disabled={isSubmitting} onClick={props.cancelForm}> <Translate id="Cancel"/> </button>
						</div>
					</div>
				}
			</Form>
		</React.Fragment>
	);
};

// Main export, wrap the content in with the Company Types query.
export const CompanyForm = compose(
	// Add in the company types.
	queryWithLoading({gqlString: CompaniesTypesQuery, name: "CompanyTypes"}),
	withState({ "matchingCompanies": [] }),
	withTranslate
)(CompanyFormContent);

export const CompanyFormUpdate = compose(
	withMutation(CompanySaveMutation, "CompanySaveMutate", ["getAccount"]),
	withFormik({
		handleSubmit: async ( CompanyInputValues, FormikForm) => {
			let castCompanyInputValues = castNumerics(CompanyInputValues,"allowHomeMemorialization,bccHospitalForCustomerEmails,courierDeliveryOffered,crematoryPickupOffered,defaultDiscount,expeditedCremationAllowed,homeMemorializationsEditCremation,hospitalDeliveryOffered,payAtPickupOffered,payByCreditCardOffered,payVetOrderByCreditCardOffered,petReferenceNumberAutoGenerate,requireInitialsEditOrderDetails,sendOwnerEmailCompletedDelivered,visitationAllowed")

			const { data: { companySave: { Response, Company } } } = await FormikForm.props.CompanySaveMutate({ input: castCompanyInputValues });

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.editButtonClickHandler("companyDetails", Company.companyId, Response);

			// Reset the form to get the new initial values.
			FormikForm.resetForm();
		},
		validate: (values) => {
			let errors = {};
			// If value is blank, create error struct key with message, else delete the struct key
			if(values.companyName === '') { errors.companyName = 'Company name is required'; } else { delete errors.companyName; };
			if(values.companyNameLegal === '') { errors.companyNameLegal = 'Company legal name is required'; } else { delete errors.companyNameLegal; };
			if(parseInt(values.companyTypeId) === 0) { errors.companyTypeId = 'Company Type is required'; } else { delete errors.companyTypeId; };
			// For Crematories, do not worry about Hospital delivery, because there is not a hospital involved.
			if(parseInt(values.companyTypeId) === 2) {
				if(parseInt(values.crematoryPickupOffered) === 0 && parseInt(values.courierDeliveryOffered) === 0) {
					errors.crematoryPickupOffered = 'Must choose pickup or delivery';
					errors.courierDeliveryOffered = 'Must choose pickup or delivery';
				} else {
					delete errors.crematoryPickupOffered;
					delete errors.courierDeliveryOffered;
				};
				// Just delete this in case they just switched company types
				delete errors.hospitalDeliveryOffered;
			} else if(parseInt(values.companyTypeId) === 3) {
				if(parseInt(values.crematoryPickupOffered) === 0 && parseInt(values.courierDeliveryOffered) === 0 && parseInt(values.hospitalDeliveryOffered) === 0) {
					errors.crematoryPickupOffered = 'Must choose pickup or delivery';
					errors.courierDeliveryOffered = 'Must choose pickup or delivery';
					errors.hospitalDeliveryOffered = 'Must choose pickup or delivery';
				} else {
					delete errors.crematoryPickupOffered;
					delete errors.courierDeliveryOffered;
					delete errors.hospitalDeliveryOffered;
				};
			}

			return errors
		}
	})
)(CompanyForm);
