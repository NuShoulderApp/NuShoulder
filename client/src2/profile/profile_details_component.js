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

import { formatPhone } from "../phones/phone_component"; // generic phone form

// Build the full name: make array, filter out all blanks, then join on a space.
const fullName = ({firstName, lastName, middleName, salutation}) => [salutation, firstName, middleName, lastName ].filter((str) => str !== "").join(' ')

export const ProfileDetails = (props) => {
	const { Permissions, email, userId, UserAddresses, UserPhones } = props.data.User;

	const fullNameStr = fullName(props.data.User);

	return (
		<React.Fragment>
			<DetailColumn>
				<h4><Translate id={"Edit User"} data={{userId, fullNameStr}} />{/*Edit User ID {`${userId}: ${fullNameStr}`*/}</h4>
				<div>
					<div><strong><Translate id={"User Information"}/></strong></div>
					<div>{fullNameStr}</div>
					<button className="btn btn-sm btn-info btn-addon mt-2" disabled={false} onClick={() => props.editButtonClickHandler('demographics')}>
						<FontAwesomeIcon icon="pen" /><Translate id="Edit" />
					</button>
				</div>
				<div className="mt-3">
					<div><strong><Translate id="Phones" />{/*Phones*/}</strong></div>
					{UserPhones.length > 0 && UserPhones.map((phone) => {
						return (
							<div key={phone.userPhoneId}>
								{formatPhone(phone.phone)}: {<TranslateDefault id={phone.phoneType}>{phone.phoneType}</TranslateDefault>} {phone.phoneLabel && `(${phone.phoneLabel})`}
								<button className="btn btn-sm btn-info btn-addon ml-2" disabled={false} onClick={() => props.editButtonClickHandler('phone', phone.userPhoneId)}>
									<FontAwesomeIcon icon="pen" /><Translate id="Edit"/>
								</button>
							</div>
						)
					})}

					<button className="btn btn-sm btn-info btn-addon mt-2" disabled={false} onClick={() => props.editButtonClickHandler('phone', 0)}>
						<FontAwesomeIcon icon="plus" /><Translate id="Add New Phone" />{/* Add New Phone */}
					</button>
				</div>
				<div className="mt-3">
					<div><strong><Translate id="Addresses"/>{/* Addresses */}</strong></div>
					{UserAddresses.length > 0 && UserAddresses.map((address) => {
						return (
							<div key={address.userAddressId}>
								<div>{address.address1} {address.address2 !== null && address.address2}</div>
								<div>
									{address.city}, {address.state} {address.postalCode}
									<button className="btn btn-sm btn-info btn-addon ml-2" disabled={false} onClick={() => props.editButtonClickHandler('address', address.userAddressId)}>
										<FontAwesomeIcon icon="pen" /><Translate id="Edit"/>
									</button>
								</div>
							</div>
						)
					})}
					<button className="btn btn-sm btn-info btn-addon mt-2" disabled={false} onClick={() => props.editButtonClickHandler('address', 0)}>
						<FontAwesomeIcon icon="plus" /><Translate id="Add New Address" />
					</button>
				</div>
				<div className="mt-3">
					<div><strong><Translate id="Permissions" />{/*Permissions*/}</strong></div>
					{Permissions.length > 0 && Permissions.map((permission) => {
						return (
							<div key={permission.userPermissionId}>
								{permission.Permission.permission} {permission.permissionLevelString}

								<button className="btn btn-sm btn-info" disabled={false} onClick={() => props.editButtonClickHandler("permission", permission.userPermissionId)}>
									<Translate id="Edit" />
								</button>
							</div>
						)
					})}

					<button className="btn btn-sm btn-info" disabled={false} onClick={() => props.editButtonClickHandler("permission")}>
						<Translate id="Add Permission" />
						{/*Add Permission*/}
					</button>
				</div>

				<div className="mt-3">
					<div><strong><Translate id="Email" />{/*Email*/}</strong></div>
					<div>{email}</div>
					<button className="btn btn-sm btn-info btn-addon mt-2" disabled={false} onClick={() => props.editButtonClickHandler("email")}>
						{/*Edit*/}
						<FontAwesomeIcon icon="pen" /><Translate id="Edit" />
					</button>
				</div>

				<div className="mt-3">
					<div><strong><Translate id="Manage Password" />{/*Manage Password*/}</strong></div>
					<button className="btn btn-sm btn-info btn-addon mt-2" disabled={false} onClick={() => props.editButtonClickHandler('password')}>
						{/*Edit*/}
						<FontAwesomeIcon icon="pen" /><Translate id="Edit" />
					</button>
				</div>
			</DetailColumn>
		</React.Fragment>
	)
};
