import React from 'react';
import { compose } from "react-apollo";
import { Form, Field } from 'formik';	// for wrapping forms
import { withModalState } from "../utilities/withModal";
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

import { Translate, withTranslate } from '../translations/IWDTranslation';

const CompanyAddressForm = (props) => {
	const {
        CompanyAddresses,
        dirty,
        errors,
        isSubmitting,
        showRemove,
        status,
        touched,
        UserCompanyAddresses
	} = props;

	return (
		<React.Fragment>
			{/*  Display a resulting status message.  */}
			{ status &&	<div className="alert alert-success">{props.translate(status.message)}</div> }

			<Form>
                {CompanyAddresses.length > 0 &&
                    <div>
                        {props.translate('Available Company Addresses')}:
                        <Field component="select" name="companyAddressId" className={`form-control ${errors.companyAddressId && touched.companyAddressId && 'is-invalid'}`}>
                            {/* This render to Static Markup is required because options don't like React children as the label */}
                                <option value="">{props.translate('Select an address')}</option>
                                {CompanyAddresses.map((address) => {
                                        const addressOptionDisabled = UserCompanyAddresses.length > 0 && UserCompanyAddresses.findIndex((userCompanyAddress) => userCompanyAddress.companyAddressId === address.companyAddressId) > -1 ? true : false;
										return <option value={address.companyAddressId} disabled={addressOptionDisabled} key={address.companyAddressId}>{address.address1} {address.address2} ({address.city})</option>
                                    }
                                )}
                        </Field>
                        <button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
                            <Translate id={isSubmitting ? "SAVING..." : "SAVE"} />
                        </button>
                    </div>
                }
				{props.translate('Connected Company Addresses')}:
				{UserCompanyAddresses.length > 0 &&
					<div>
					{UserCompanyAddresses.map((address) => {
						return (
							<div key={address.userCompanyAddressId}>
								{address.addressName !== null && <div className="h6">{address.addressName}</div>}
								<div>{address.address1} {address.address2 !== null && address.address2}</div>
								<div>
									{address.city}, {address.state} {address.postalCode}
								</div>
								{
									// If the remove button has been requested, show it.
									showRemove &&
										<React.Fragment>
											<button className="btn btn-danger float-right" onClick={props.modal.toggleModal}><Translate id="Remove"/></button>
											{/* Modal requires state, use withModal (in compose below) if needed. */}
											<Modal isOpen={props.modal.modalOpen} toggle={props.modal.toggleModal}>
												<ModalHeader><Translate id="Remove Address"/></ModalHeader>
												<ModalBody>
													<Translate id="Company Address Remove Modal Confirmation" />
												</ModalBody>
												<ModalFooter>
													<button onClick={() => props.removeAddress({userCompanyAddressId: address.userCompanyAddressId})} className="btn btn-danger"><Translate id="Remove Company Address Connection"/></button>
													<button onClick={props.modal.toggleModal} className="btn btn-default ml-3"><Translate id="Cancel"/></button>
												</ModalFooter>
											</Modal>
										</React.Fragment>
								}
							</div>
						)
					})}
					</div>
				}
                {UserCompanyAddresses.length === 0 && <div>{props.translate('No company addresses selected')}</div>}

			</Form>
		</React.Fragment>
	);
};

export const CompanyAddressFormContent = compose(
   withModalState,
   withTranslate
)(CompanyAddressForm);
