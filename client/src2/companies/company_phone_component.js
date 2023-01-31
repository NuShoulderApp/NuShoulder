import React from 'react';
import { compose } from "react-apollo";
import { Form, Field } from 'formik';	// for wrapping forms
import { withModalState } from "../utilities/withModal";
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';


import { Translate, TranslateDefault, withTranslate } from '../translations/IWDTranslation';
import { formatPhone } from '../phones/phone_component';

const CompanyPhoneForm = (props) => {
	const {
        CompanyPhones,
        dirty,
        errors,
        isSubmitting,
        showRemove,
        status,
        touched,
        UserCompanyPhones
	} = props;

//onChange={(event) => handleCompanyPhoneSelect(event.target.value)}
	return (
		<React.Fragment>
			{/*  Display a resulting status message.  */}
			{ status &&	<div className="alert alert-success">{props.translate(status.message)}</div> }

			<Form>
                {CompanyPhones.length > 0 &&
                    <div>
                        {props.translate('Available Company Phones')}:
                        <Field component="select" name="companyPhoneId" className={`form-control ${errors.companyPhoneId && touched.companyPhoneId && 'is-invalid'}`}>
                            {/* This render to Static Markup is required because options don't like React children as the label */}
                                <option value="">{props.translate('Select a phone number')}</option>
                                {CompanyPhones.map((phone) => {
                                        const phoneOptionDisabled = UserCompanyPhones.length > 0 && UserCompanyPhones.findIndex((userCompanyPhone) => userCompanyPhone.companyPhoneId === phone.companyPhoneId) > -1 ? true : false;
                                        return <option value={phone.companyPhoneId} disabled={phoneOptionDisabled} key={phone.companyPhoneId}>{formatPhone(phone.phone)} {phone.phoneType} ({phone.phoneLabel})</option>
                                    }
                                )}
                        </Field>
                        <button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
                            <Translate id={isSubmitting ? "SAVING..." : "SAVE"} />
                        </button>
                    </div>
                }
				{props.translate('Connected Company Phones')}:
                {UserCompanyPhones.length > 0 &&
                    <div>
                    {UserCompanyPhones.map((phone) => {
                        return (
                            <div key={phone.userCompanyPhoneId}>
                                {formatPhone(phone.phone)}: {<TranslateDefault id={phone.phoneType}>{phone.phoneType}</TranslateDefault>} {phone.phoneLabel && `(${phone.phoneLabel})`}
                                {
                                    // If the remove button has been requested, show it.
                                    showRemove &&
                                        <React.Fragment>
                                            <button className="btn btn-danger float-right" onClick={props.modal.toggleModal}><Translate id="Remove"/></button>
                                            {/* Modal requires state, use withModal (in compose below) if needed. */}
                                            <Modal isOpen={props.modal.modalOpen} toggle={props.modal.toggleModal}>
                                                <ModalHeader><Translate id="Remove Phone Number"/></ModalHeader>
                                                <ModalBody>
                                                    {/*Are you sure you want to remove the Phone {formatPhone(initialValues.phone)} ({initialValues.phoneLabel}) for {props.entityName}.*/}
                                                    <Translate
                                                        id="Phone Remove Modal Confirmation"
                                                        data={{
                                                            phone: `${formatPhone(phone.phone)} (${phone.phoneLabel})`,
                                                            entityName: 'this user'
                                                        }} />
                                                </ModalBody>
                                                <ModalFooter>
                                                    <button onClick={() => props.removePhone({userCompanyPhoneId: phone.userCompanyPhoneId})} className="btn btn-danger"><Translate id="Remove Company Phone Connection"/></button>
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
                {UserCompanyPhones.length === 0 && <div>{props.translate('No company phones selected')}</div>}

			</Form>
		</React.Fragment>
	);
};

export const CompanyPhoneFormContent = compose(
   withModalState,
   withTranslate
)(CompanyPhoneForm);
