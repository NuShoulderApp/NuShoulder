import React from 'react';
import _ from "lodash";
import { compose } from "react-apollo";
import { withRouter } from '../utilities/IWDReactRouter'; // for URL routing
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading } from '../utilities/IWDDb';

// Contains the layout for columns
import { DetailColumn, SidebarColumn} from '../layouts/application';

import { AccountForm } from "./account_details_component";
import { AccountSettingForm } from "./account_setting_component";
import { CompanyFormUpdate } from '../companies/company_details_component'; // generic company info form
import { AccountAdminUserCreate } from "../users/user_create_component";
import { Translate, TranslateDefault } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	getAccountQuery
} from './accounts_graphql';

const AccountDetails = (props) => {
	// In case the account is not found, show a warning.
	if(props.data.Account === null) {
		return <DetailColumn><div className="alert alert-danger">Account Not Found</div></DetailColumn>
	}

	const { accountId, accountName, accountPrefix, url, Settings, Companies, AccountAdmins } = props.data.Account;
	//const { Modules } = props.data;
	const { accountAdmin } = props;

	return (
		<DetailColumn>
			<h4><Translate id="Edit Account ID" data={{accountId, accountName}} />{/*Edit Account ID {`${accountId}: ${accountName}`}*/}</h4>
			<div>
				<h5>1. <Translate id="Account Information"/></h5>
				<div>{accountName}</div>
				<div>URL: {url}</div>
				<div><Translate id="Account Prefix"/>: {accountPrefix}</div>
				<button className="btn btn-sm btn-info btn-addon" disabled={false} onClick={() => props.editButtonClickHandler('demographics')}>
					<FontAwesomeIcon icon="pen" /> <Translate id="Edit"/>
				</button>
			</div>
			<div className="alert alert-info mt-3">Add a Company for the new Account / Crematory before adding an Account Admin so that the admin is tied correctly to the company.</div>
			<div className="mt-3">
				<h5>2. <Translate id="Companies"/></h5>
				{Companies.length > 0 && Companies.map((company) => {
					return (
						<div key={company.companyId} className="clearfix border-bottom pt-1 pb-1">
							<button className="btn btn-sm btn-info btn-addon ml-2 float-right" disabled={false} onClick={() => props.editButtonClickHandler('company', company.companyId)}>
								<FontAwesomeIcon icon="pen" /> <Translate id="Edit"/>
							</button>
							{company.companyName}
						</div>
					)
				})}
				{Companies.length === 0 &&
					<button className="btn btn-sm btn-info btn-addon" disabled={false} onClick={() => props.editButtonClickHandler('company', 0)}>
						<FontAwesomeIcon icon="plus" /> <Translate id="Add Crematory" />
					</button>
				}
			</div>
			<div className="mt-3">
				<h5>3. <Translate id="Account Admins"/></h5>
				{AccountAdmins.length > 0 && AccountAdmins.map((user) => {
					return (
						<div key={user.userId} className="clearfix border-bottom pt-1 pb-1">
							<Link to={`/users/user/${user.userId}`} className="btn btn-info btn-sm btn-addon ml-2 float-right"><FontAwesomeIcon icon="pen" /> <Translate id="Edit"/> </Link>
							{user.firstName} {user.lastName}
						</div>
					)
				})}
				{accountAdmin.firstName !== "" &&
					<React.Fragment>
						<div>{accountAdmin.firstName} {accountAdmin.lastName}</div>
						<div><Translate id="Account Admin Continue Prompt"/>{/*Please finish entering the Account Admin details. You must create a password for them to be able to login.*/}</div>
					</React.Fragment>
				}
				{AccountAdmins.length === 0 && accountAdmin.firstName === "" && <div><Translate id="Add Admin Prompt"/>{/*Please add an Account Admin that will be responsible for adding other users and companies.*/}</div>}
				{accountAdmin.firstName === "" &&
					<React.Fragment>
						<button className="btn btn-sm btn-info btn-addon mt-3" disabled={false} onClick={() => props.editButtonClickHandler('user', 0)}>
							<FontAwesomeIcon icon="plus" /> <Translate id="Add Account Admin"/>
						</button>
					</React.Fragment>
				}
			</div>
			<div className="mt-3">
				<h5> 4. <Translate id="Settings"/></h5>
				<table className="table table-striped">
					<thead>
						<tr>
							<th><Translate id="Setting Name"/></th>
							<th><Translate id="Account Value"/></th>
							<th>&nbsp;</th>
						</tr>
					</thead>
					<tbody>
						{ Settings.map((setting) => (
								<tr key={setting.accountSettingId}>
									<td><TranslateDefault id={setting.name}>{_.startCase(setting.name)}</TranslateDefault></td>
									<td><TranslateDefault id={setting.value}>{setting.value}</TranslateDefault></td>
									<td className="pl-0 pr-0">
										<button
											className="btn btn-sm btn-info btn-addon"
											disabled={false}
											onClick={() => props.editButtonClickHandler("setting", {...setting, accountId})}>
											<FontAwesomeIcon icon={"pen"} />
											<Translate id={"Edit"}/>
										</button>
									</td>
								</tr>
							))
						}
					</tbody>
				</table>
			</div>
		</DetailColumn>
	)
};
class AccountUpdateClass extends React.Component {
	constructor(props) {
		super(props);

		this.state= {
			accountAdmin: {
				firstName: "",
				lastName: ""
			},
			// The type of form we will be editing.
			editForm: "",
			// The id of the record we will be editing.
			editId: 0,
			// the response object from the previous mutation (To display "saved")
			previousResponse: null
		}
	}

	// If the account clicks cancel on a form, clear it out.
	cancelForm = () => this.setState({editForm:'', editId: 0, previousResponse: null});

	// Handler for when an item is clicked, will display the proper form on the left side.
	editButtonClickHandler = (editForm, editId, previousResponse = null) => this.setState({ editForm, editId, previousResponse });

	// Handler for when the Account Admin is first created.
	setAccountAdmin = (firstName, lastName) => this.setState({accountAdmin: {firstName, lastName}});

	// Render function to display the form content in the side column.
	renderEditForm() {
		const { Account, Account: { Companies } } = this.props.data;

		if(this.state.editForm === 'demographics') {
			return (
				<AccountForm
					initialValues={_.pick(this.props.data.Account,["accountName", "accountPrefix", "accountId", "active","url"])}
					cancelForm={this.cancelForm}
					editButtonClickHandler={this.editButtonClickHandler}
					previousResponse={this.state.previousResponse}
				/>
			)
		}
		else if(this.state.editForm === 'company') {
			let company = {};
			// if editing a company, grab its object out of the Companies array, then pick out the variables that we actually want to pass into the form.
			if(this.state.editId > 0) {
				const tempCompany = Companies.find((company) => company.companyId === this.state.editId);
				company = _.pick(tempCompany, ["companyDescription", "companyId", "companyName", "companyNameLegal", "companyTypeId"])
			} else {
				company = {'companyDescription': '', 'companyId': 0, 'companyName': '', 'companyNameLegal': '', 'companyTypeId': 2, 'accountId': Account.accountId};
			}

			return <CompanyFormUpdate
						key={company.companyId}
						crematoryOnly={true}
						initialValues={company}
						cancelForm={this.cancelForm}
						editButtonClickHandler={this.editButtonClickHandler}
						previousResponse={this.state.previousResponse}
					/>
		}
		else if(this.state.editForm === 'setting') {
			const accountSetting = this.state.editId;

			return <AccountSettingForm
						key={accountSetting.accountSettingId}
						initialValues={accountSetting}
						cancelForm={this.cancelForm}
						editButtonClickHandler={this.editButtonClickHandler}
					/>
		}
		else if(this.state.editForm === 'user') {
			const Companies = this.props.data.Account.Companies.find(({ companyTypeId }) => parseInt(companyTypeId) === 2);
			const companyId = Companies ? Companies.companyId : 0;

			const initialValues = {'accountId': Account.accountId, 'action': 'createAccountAdmin', 'userTypeId': 2, companyId };

			return <AccountAdminUserCreate
						key={0}
						initialValues={initialValues}
						cancelForm={this.cancelForm}
						editButtonClickHandler={this.editButtonClickHandler}
						setAccountAdmin={this.setAccountAdmin}
						previousResponse={this.state.previousResponse}
					/>
		}
		else if(this.state.editForm === 'userDemographics') {
			// TODO: make sure translations get set up here
			return <div>Show user demographics</div>
		}
		else {
			return null;
		}
	}

	render() {
		return (
		   <React.Fragment>
			   <AccountDetails
				   accountAdmin={this.state.accountAdmin}
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

export const Account = compose(
	withRouter,
	queryWithLoading({
		gqlString: getAccountQuery,
		variablesFunction: (props) => ({accountId: props.match.params.accountId, userTypeId: 2}),
		requiredPermission: { permission: "accounts", permissionLevel: 3}
	})
)(AccountUpdateClass);
