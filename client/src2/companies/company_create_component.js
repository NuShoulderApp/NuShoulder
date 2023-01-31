import React from 'react';
import _ from "lodash";
import { Mutation, compose } from "react-apollo";
import { withFormik } from 'formik';	// for wrapping forms
import { withRouter, Redirect } from '../utilities/IWDReactRouter'; // for URL routing

import { withSession } from "../utilities/session";

import { queryWithLoading, castNumerics } from "../utilities/IWDDb";

import { getCompaniesQuery } from './companies_graphql';

// GRAPHQL QUERY
import { CompanySaveMutation } from './companies_graphql';

import { CompanyForm } from "./company_details_component";
import IWDBreadcrumb from '../utilities/IWDBreadcrumb';
import { Translate } from '../translations/IWDTranslation';

export const CompanyFormCreate = compose(
	queryWithLoading({gqlString: getCompaniesQuery, name: "Companies", variablesFunction: (props) => ({accountId: 0})}),
	withFormik({
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( CompanyInputValues, FormikForm) => {
			// If this is a crematory or cematary, then set the hospitalDeliveryOffered=0
			if(parseInt(CompanyInputValues.companyTypeId) === 1 || parseInt(CompanyInputValues.companyTypeId) === 2) {
				CompanyInputValues.hospitalDeliveryOffered = 0;
			}
			const castCompanyInputValues = castNumerics(CompanyInputValues,"allowHomeMemorialization,bccHospitalForCustomerEmails,courierDeliveryOffered,crematoryPickupOffered,defaultDiscount,expeditedCremationAllowed,homeMemorializationsEditCremation,hospitalDeliveryOffered,payAtPickupOffered,payByCreditCardOffered,payVetOrderByCreditCardOffered,petReferenceNumberAutoGenerate,requireInitialsEditOrderDetails,sendOwnerEmailCompletedDelivered,visitationAllowed",true);
			await FormikForm.props.submitMutation({ variables: { input: castCompanyInputValues } });	// send the mutation to the server
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

// RENDER COMPONENT:  main content that will render, need to wrap the output function in withRouter to get the Breadcrumb to have match.url
export const CompanyCreate = compose(
	withSession,
	withRouter
)((props) => (
	// set breadcrumb and mutation based on whther we are inserting or updating - do we have a companyId
	<React.Fragment>
		<IWDBreadcrumb title='Add Company' pathname={props.match.url} />
		<h3 className="text-white text-shadow mt-4"><Translate id="Add New Company" /></h3>
		<div className="card p-3">
			<Mutation mutation={CompanySaveMutation} refetchQueries={["getCompanies"]} key={0}>
				{ (CompanySaveMutate, CompanySaveResult) => {
					if(CompanySaveResult.called === true && CompanySaveResult.loading === false && CompanySaveResult.data.companySave.Company.companyId > 0) {
						return <Redirect to={`/company/${CompanySaveResult.data.companySave.Company.companyId}`}/>
					} else {
						return <CompanyFormCreate
								key="0"
								initialValues={{
									accountId: props.Account.accountId,
									accountNumber: "",
									allowHomeMemorialization: 0,
									bccHospitalForCustomerEmails: 0,
									companyName: "",
									companyNameLegal: "",
									companyDescription: "",
									companyTypeId: 0,
									communalPawPrintAllowed: "no",
									courierDeliveryOffered: 1,
									cremationTypesOffered: "private_only",
									crematoryPickupOffered: 1,
									defaultDiscount: "",
									defaultUnits: props.Account.getSettingValue("measurementSystem"),
									expeditedCremationAllowed: 1,
									homeMemorializationsEditCremation: props.Account.getSettingValue("homeMemorializationsEditCremation"),
									hospitalDeliveryOffered: 1,
									hoursOfOperation: "",
									invoiceEmail: "",
									payAtPickupOffered: 0,
									payByCreditCardOffered: 1,
									payVetOrderByCreditCardOffered: 0,
									paymentTerms: "net_30",
									petReferenceNumberAutoGenerate: props.Account.getSettingValue("petReferenceNumberAutoGenerate"),
									requireInitialsEditOrderDetails: props.Account.getSettingValue("requireInitialsEditOrderDetails"),
									sendOwnerEmailCompletedDelivered: props.Account.getSettingValue("sendOwnerEmailCompletedDelivered"),
									visitationAllowed: 1
								}}
								checkMatches={true}
								submitMutation={ CompanySaveMutate }
								cancelForm={() => props.history.push("/companies")}
							/>
					}
				}}
			</Mutation>
		</div>
	</React.Fragment>
));
