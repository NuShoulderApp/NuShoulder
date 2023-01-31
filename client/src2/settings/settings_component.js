import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withFormik, Form, Field } from "../utilities/IWDFormik";	// for wrapping forms
import { withRouter } from "react-router-dom";
import { compose } from "react-apollo";
import * as Yup from "yup";
import _ from "lodash";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

// Contains the layout for columns
import { DetailColumn, SidebarColumn} from '../layouts/application';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	getSettingsQuery,
	SettingSaveMutation
} from './settings_graphql';

const SettingFormContent = (props) => {
	const {
		cancelForm,
		dirty,
		errors,
		isSubmitting,
		Response,
		touched
	} = props;

	return (
		<React.Fragment>
			{/* Display the heading if there is one. */}
			{ props.heading && <h5>{props.heading}</h5> }

			{/*  Display a resulting status message.  */}
			{ Response &&	<div className="alert alert-success">{props.translate(Response.message)}</div> }

			<Form>
				<div>
					<Translate id="Setting Name"/> *
					<Field showError={true} name="name" placeholder={props.translate("Setting Name Placeholder")} className={`form-control ${errors.name && touched.name && 'is-invalid'}`} />
				</div>
				<div>
					<Translate id="Default Value"/> *
					<Field showError={true}  name="value" placeholder={props.translate("Default Value Placeholder")} className={`form-control ${errors.value && touched.value && 'is-invalid'}`} />
				</div>
				<div>
					<Translate id="Description"/> *
					<Field showError={true} name="description" placeholder={props.translate("Description Placeholder")} className={`form-control ${errors.description && touched.description && 'is-invalid'}`} />
				</div>
				<div>
					<Translate id="Server Only"/> *
					<Field showError={true} component="select" name="serverOnly" placeholder={props.translate("Server Only Placeholder")} className={`form-control ${errors.serverOnly && touched.serverOnly && 'is-invalid'}`}>
						<option value="1">{props.translate("Yes")}</option>
						<option value="0">{props.translate("No")}</option>
					</Field>
				</div>
				<div className="mt-1">
					<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
					</button>
					<button className="btn btn-sm btn-default btn-addon float-right ml-2" onClick={() => cancelForm()}>
						<FontAwesomeIcon icon="times" /> <Translate id="Cancel"/>
					</button>
				</div>
			</Form>
		</React.Fragment>
	);
};

const SettingForm = compose (
	// Setup the mutation for saving the setting. We can use withMutation here because handleSubmit in the formik code can map settingId properly.
	withMutation(SettingSaveMutation, "SettingSave", ["getSettings"]),
	/* 	Set up the removal mutation, we use graphql here because we need to specify that the ID field is settingId.  The address component
		is used in multiple places so it doesn't know which	field we till want to use.

	graphql(UserAddressRemoveMutation, { options: { refetchQueries: ["getUserProfile"] }, props: ({mutate}) => ({ removeAddress: ({userAddressId}) => mutate({ variables: { userAddressId } }) }) }),
	*/
	withFormik({
		handleSubmit: async ( SettingInputValues, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result into settingSave
			const { data: { AccountSettingSave } } = await FormikForm.props.SettingSave({ input: SettingInputValues });

			FormikForm.props.setResponse(AccountSettingSave.Response);

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.editButtonClickHandler(AccountSettingSave.AccountSetting.accountSettingId);
	   },
	   validationSchema: () => Yup.object().shape({
			name: Yup.string().required("Setting Name is required"),
			description:  Yup.string().required("Description is required")
	   })
	}),
	withTranslate
)(SettingFormContent);

class SettingsClass extends React.Component {
	// The id of the record we will be editing.
	state = { accountSettingId: "" };

	// If the user clicks cancel on a form, clear it out.
	cancelForm = () => this.setState({accountSettingId: ''});

	// Handler for when an item is clicked, will display the proper form on the left side.
	editButtonClickHandler = (accountSettingId) => this.setState({ accountSettingId });

	renderEditForm() {
		const { AccountSettings } = this.props.data;

		if(this.state.accountSettingId !== '') {
			const setting = AccountSettings.find((AccountSetting) => AccountSetting.accountSettingId === this.state.accountSettingId) ||
				{ 'accountSettingId': 0, 'name': '', 'description': '', 'value': '', serverOnly: "0" };

			return (
				<SettingForm
					key={this.state.accountSettingId}
					cancelForm={this.cancelForm}
					editButtonClickHandler={this.editButtonClickHandler}
					initialValues={setting}
				/>
			)
		} else {
			return null;
		}
	}

	render () {
		 return (
			<React.Fragment>
				{this.props.Session.isLoggedIn() === true && parseInt(this.props.Session.User.userTypeId) === 1 && <React.Fragment>
					<DetailColumn>
						<div className="h3 border-bottom p-1 clearfix">
							<button className="btn btn-sm btn-info btn-addon float-right" disabled={false} onClick={() => this.editButtonClickHandler(0)}>
								<FontAwesomeIcon icon="plus" /> <Translate id="ADD SETTING"/>
							</button>
							<Translate id="Settings"/>
						</div>
						<p className="alert alert-danger">Do NOT change the setting names without developer review - this WILL BREAK the system.</p>
						{ this.props.data.AccountSettings.map(({ accountSettingId, name }) => (
							<div key={accountSettingId}>
								<p className="border-bottom p-1 clearfix">
									<button className="btn btn-sm btn-info btn-addon ml-2 float-right" disabled={false} onClick={() => this.editButtonClickHandler(accountSettingId)}>
										<FontAwesomeIcon icon="pen" /> <Translate id="Edit"/>
									</button>
									{_.startCase(name)} ({name})
								</p>
							</div>
							))
						}
					</DetailColumn>
					<SidebarColumn>
						{this.renderEditForm()}
					</SidebarColumn>
				</React.Fragment>}
			</React.Fragment>
		)
	}
}

export const Settings = compose(
	withRouter,
	queryWithLoading({
		gqlString: getSettingsQuery,
		requiredPermission: { permission: "settings", permissionLevel: 4}
	})
)(SettingsClass);
