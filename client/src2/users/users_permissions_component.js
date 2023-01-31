import React from 'react';
import { withFormik, Form, Field } from "../utilities/IWDFormik";
import { compose } from "react-apollo";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import { Translate, TranslateDefault, withTranslate } from "../translations/IWDTranslation";
import { withModalState } from "../utilities/withModal";

import * as Yup from "yup";

// GRAPHQL QUERY
import {
	getPermissionsQuery,
	UserPermissionSaveMutation
} from './users_graphql';

const UserPermissionFormContent = (props) => {
	const {
		errors,
		isSubmitting,
		Permissions: {
			Permissions
		},
		touched,
		dirty,
		initialValues,
		Response
	} = props;

	// Find the Permission in question.
	const Permission = Permissions.find(({permissionId}) => permissionId === parseInt(initialValues.permissionId, 10));

	// Get the permission label.
	const PermissionLabel = Permission.permission;

	// Get the default permission level.
	const defaultLevel = Permission.permissionDefaults[0].permissionLevel;

	// Translate the permission level strings.
	const permissionLevels = ["No Access", "Read Access", "Write Access", "Edit Access", "Delete Access"].map(props.translate);

	// Translated default string.
	const defaultStr = `(${props.translate("Default")})`;

	return (
		<React.Fragment>
			<h5><Translate id="User Permission"/></h5>

			{/*  Display a resulting status message.  */}
			{ Response && <div className="alert alert-success"><TranslateDefault id={Response.message}>{Response.message}</TranslateDefault></div> }

			<Form>
				<div>
					<Translate id="Permission"/>: <Translate id={PermissionLabel}/>
				</div>
				<div>
					<Translate id="Permission Level"/> *
					<Field component="select" name="permissionLevel" placeholder={props.translate("Permission Level Placeholder")} className={`form-control ${errors.permissionLevel && touched.permissionLevel && 'is-invalid'}`}>
						<option value={"NONE"}>{props.translate("Select Permission Value")}</option>
						{ 	permissionLevels.map( (permissionLevel, index) => (
								<option value={index} key={index}>
									{permissionLevel} { defaultLevel === index ? defaultStr: "" }
								</option>
							))
						}
					</Field>
					{errors.permissionLevel && touched.permissionLevel && <div className="invalid-feedback">{props.translate(errors.permissionLevel)}</div>}
				</div>
				<div className="mt-1">
					<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
						<Translate id={isSubmitting ? "SAVING..." : "SAVE"} />
					</button>

					<button className="btn btn-default ml-2" disabled={isSubmitting} onClick={props.cancelForm}><Translate id="Cancel"/></button>
				</div>
			</Form>
		</React.Fragment>
	);
};

export const UserPermissionForm = compose(
	// Get the list of possible permissions.
	queryWithLoading({gqlString: getPermissionsQuery, name: "Permissions", variablesFunction: (props) => ({ userTypeId: props.User.userTypeId})}),

	// Setup the mutation for saving the permission.
	withMutation(UserPermissionSaveMutation, "UserPermissionSave", ["getUserProfile"], true),

	// Set up the formik parameters.
	withFormik({
		handleSubmit: async ( UserPermissionsInputValues, FormikForm) => {
			// parse string to int
			UserPermissionsInputValues.permissionLevel = parseInt(UserPermissionsInputValues.permissionLevel);

			// Perform the mutation.
			const { data: { userPermissionSave } } = await FormikForm.props.UserPermissionSave({ input: UserPermissionsInputValues });

			// Reset the form to clear the save button and disable it.
			FormikForm.props.setResponse(userPermissionSave.Response);

			// "click" the edit button from the list to refresh the component.  Give it the response to display.
			FormikForm.props.editButtonClickHandler("permission", userPermissionSave.UserPermission);
	   },
	   // Require permissionId and permissionLevel
		validationSchema: () => Yup.object().shape({
			permissionLevel: Yup.number().required("Permission Level is required")
		})
	}),
	withTranslate,
	withModalState
)(UserPermissionFormContent);

