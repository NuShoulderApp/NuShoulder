import React from 'react';
import IWDBreadcrumb from '../utilities/IWDBreadcrumb'; // for UI breadcrumbs based on Routing
import { withFormik } from "../utilities/IWDFormik";	// for wrapping forms
import { Redirect } from "react-router-dom";
import { Mutation } from "react-apollo";
import { withRouter } from '../utilities/IWDReactRouter'; // for URL routing

import * as Yup from "yup";

import { compose } from "react-apollo";

// GRAPHQL QUERY
import { AccountSaveMutation } from './accounts_graphql';

import { AccountFormContent } from "./account_details_component";
import { Translate, withTranslate } from '../translations/IWDTranslation';

export const AccountForm = compose (
	withFormik({
		handleSubmit: (input, { props: { AccountCreateMutation }}) => AccountCreateMutation({variables: { input}}),
		// Require Phone and Type
		validationSchema: () => Yup.object().shape({
			accountName: Yup.string().required("Account name is required"),
			url: Yup.string().required("URL is required")
		})
	}),
	withTranslate
)(AccountFormContent);

// RENDER COMPONENT:  main content that will render, need to wrap the output function in withRouter to get the Breadcrumb to have match.url
const AccountCreateContent = (props) => {
	// set breadcrumb and mutation based on whther we are inserting or updating - do we have a accountId
	// CREATE USER FORM
	return (
		<React.Fragment>
			<IWDBreadcrumb title={'Add Account'} pathname={props.match.url} />
			<h3><Translate id="Add New Account"/></h3>
			<Mutation mutation={AccountSaveMutation} refetchQueries={["getAccounts"]} key={0}>
				{ (AccountCreateMutation, AccountCreate) => {
					// AccountCreate is the object that gets returned from the mutation

					if(AccountCreate.data !== undefined) {
						const { Response, Account } = AccountCreate.data.accountSave;

						// if the account was successfully created, go to the details about that account
						if(Response.success === true) {
							return <Redirect to={`/account/${Account.accountId}`}/>
						} else {
							return <React.Fragment>
								<AccountForm
									key="0"
									initialValues={{
										accountId: 0,
										accountName: Account.accountName,
										accountPrefix: Account.accountPrefix,
										active: Account.active,
										url: Account.url
									}}
									AccountCreateMutation={AccountCreateMutation}
								/>
							</React.Fragment>
						}
					} else {
						return <React.Fragment>
							<AccountForm
								key="0"
								initialValues={{
									accountId: 0,
									accountName: "",
									accountPrefix: "",
									active: 1,
									url: ""
								}}
								AccountCreateMutation={AccountCreateMutation}
							/>
						</React.Fragment>
					}
				}}
			</Mutation>
		</React.Fragment>
	);
};

// Wrap the content in the router and export.
export const AccountCreate = withRouter(AccountCreateContent);
