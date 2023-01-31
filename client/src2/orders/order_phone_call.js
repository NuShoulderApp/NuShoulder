import { compose } from "react-apollo";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withFormik, Field } from "../utilities/IWDFormik";
// import moment from 'moment';
import { queryWithLoading } from '../utilities/IWDDb';
import React from 'react';
import ReactStopwatch from 'react-stopwatch';
import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withState } from "react-state-hoc";

// GRAPHQL QUERY
import {
  getCremationProductsQuery,
} from '../products/products_graphql';

const CremationPricingContent = (props) => {
  const {
    CremationProducts: { CremationProducts }
  } = props;
    console.log({props})
    return (
        <div className="row mt-2">
            <div className="col text-center">
                {
                    CremationProducts.length > 0 &&
                    <div className="card-deck">
                        {CremationProducts.map((Cremation) => {
                            return(
                                <div className="card" key={`${Cremation.productId}`}>
                                    <div className="card-header h5 text-secondary">{Cremation.productName}</div>
                                    <div className="card-body">
                                        {
                                            Cremation.ProductCompanyWeightTierPrice.length > 0 &&
                                            Cremation.ProductCompanyWeightTierPrice.map((price, index) => {
                                                return (
                                                    <div key={`${price.productId}-${index}`} className="row mb-2">
                                                        <div className="col-6 pr-1"><div className="float-right">{price.weightMin}-{price.weightMax} {price.weightUnits}</div></div>
                                                        <div className="col-6 pl-0"><div className="float-left">@ ${price.priceRetail}</div></div>
                                                    </div>
                                                )
                                            })
                                        }
                                        {Cremation.ProductCompanyWeightTierPrice.length === 0 && <div className="alert alert-danger">No pricing</div>}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                }
            </div>
        </div>
    );

}

const CremationPricingContainer = compose(
	queryWithLoading({ 
        gqlString: getCremationProductsQuery,
        variablesFunction: (props) => ({ companyId: (props.Session.User ? props.Session.User.companyId : 0) }),
        name: "CremationProducts"
    }),
    withTranslate
)(CremationPricingContent);

const PhoneCallContent = (props) => {
  const {
    callNotes,
    callType,
    // ClinicEmployee,
    // ExistingOrder,
    foundUsMethod,
    GeneralQuestion,
    // NewOrder,
    setState
  } = props;

    // Function for generic setState
    function handleGenericSetState(name, value='', parentObject='') {
        console.log(`Name: ${name} | Val: ${value} | Parent: ${parentObject}`)
        if(parentObject !== '') {
            console.log('update parent')
            setState({
                [parentObject]: {
                    [name]: value
                }
            })
        } else {
            setState({
                [name]: value
            })
        }
    }
    console.log({props})

    // End the call functionality - save any data and close the tab that was opened.
    async function handleCompleteCall() {
        window.close()
    }

    return (
        <div className="card-body">
            <div className="row">
                <div className="col text-center">
                    <div><Translate id="How did you find us" />?</div>
                    <div className="btn-group p-0" role="group">
                        <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-left border-secondary ${(foundUsMethod === 'Google Search' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('foundUsMethod', 'Google Search')}>Google Search</button>
                        <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(foundUsMethod === 'Google Ad' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('foundUsMethod', 'Google Ad')}>Google Ad</button>
                        <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(foundUsMethod === 'Clinic Referral' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('foundUsMethod', 'Clinic Referral')}>Clinic Referral</button>
                        <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(foundUsMethod === 'Friend Referral' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('foundUsMethod', 'Friend Referral')}>Friend Referral</button>
                        <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-right border-secondary ${(foundUsMethod === 'Facebook' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('foundUsMethod', 'Facebook')}>Facebook</button>
                    </div>
                </div>
            </div>
            <div className="row mt-5">
                <div className="col text-center">
                    <div className="btn-group p-0" role="group">
                        <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-left border-secondary ${(callType === 'General Question' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callType', 'General Question')}>General Question</button>
                        <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(callType === 'New Order' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callType', 'New Order')}>New Order</button>
                        <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(callType === 'Clinic Employee' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callType', 'Clinic Employee')}>Clinic Employee</button>
                        <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-right border-secondary ${(callType === 'Existing Order' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callType', 'Existing Order')}>Existing Order</button>
                    </div>
                </div>
            </div>
            {
                callType === 'General Question' &&
                <React.Fragment>
                    <div className="row mt-5">
                        <div className="col text-center">
                            <div className="btn-group p-0" role="group">
                                <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-left border-secondary ${(GeneralQuestion.callReason === 'Cremation Pricing' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'Cremation Pricing', 'GeneralQuestion')}>Cremation Pricing</button>
                                <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(GeneralQuestion.callReason === 'Product Pricing' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'Product Pricing', 'GeneralQuestion')}>Product Pricing</button>
                                <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(GeneralQuestion.callReason === 'Hours' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'Hours', 'GeneralQuestion')}>Hours</button>
                                <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(GeneralQuestion.callReason === 'Location' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'Location', 'GeneralQuestion')}>Location</button>
                                <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-right border-secondary ${(GeneralQuestion.callReason === 'Other' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'Other', 'GeneralQuestion')}>Other</button>
                            </div>
                        </div>
                    </div>
                    { GeneralQuestion.callReason === 'Cremation Pricing' && <CremationPricingContainer /> }
                </React.Fragment>
            }
            {/* {
                callReason === 'New Order' &&
                <div className="row mt-5">
                    <div className="col text-center">
                    New Order
                        <div className="btn-group p-0" role="group">
                            <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-left border-secondary ${(callReason === 'General Question' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'General Question')}>General Question</button>
                            <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(callReason === 'New Order' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'New Order')}>New Order</button>
                            <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(callReason === 'Clinic Employee' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'Clinic Employee')}>Clinic Employee</button>
                            <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-right border-secondary ${(callReason === 'Existing Order' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'Existing Order')}>Existing Order</button>
                        </div>
                    </div>
                </div>
            }
            {
                callReason === 'Clinic Employee' &&
                <div className="row mt-5">
                    <div className="col text-center">
                    Clinic Employee
                        <div className="btn-group p-0" role="group">
                            <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-left border-secondary ${(callReason === 'General Question' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'General Question')}>General Question</button>
                            <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(callReason === 'New Order' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'New Order')}>New Order</button>
                            <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(callReason === 'Clinic Employee' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'Clinic Employee')}>Clinic Employee</button>
                            <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-right border-secondary ${(callReason === 'Existing Order' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'Existing Order')}>Existing Order</button>
                        </div>
                    </div>
                </div>
            }
            {
                callReason === 'Existing Order' &&
                <div className="row mt-5">
                    <div className="col text-center">
                    Existing Order
                        <div className="btn-group p-0" role="group">
                            <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-left border-secondary ${(callReason === 'General Question' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'General Question')}>General Question</button>
                            <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(callReason === 'New Order' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'New Order')}>New Order</button>
                            <button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(callReason === 'Clinic Employee' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'Clinic Employee')}>Clinic Employee</button>
                            <button type="button" style={{boxShadow: 'none'}} className={`btn rounded-right border-secondary ${(callReason === 'Existing Order' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('callReason', 'Existing Order')}>Existing Order</button>
                        </div>
                    </div>
                </div>
            } */}
            <div className="mt-5">
                <div className="text-center"><Translate id="Notes From Call" /></div>
                <Field name="callNotes" value={callNotes} component="textarea" onChange={(event) => handleGenericSetState('callNotes', event.target.value)} style={{minHeight: 125+'px'}} className={`form-control`} />
                <div className="mt-2 text-center"><button type="button" className="btn btn-success" onClick={() => handleCompleteCall()}>Complete Call</button></div>
            </div>

        </div>
    )
}

const PhoneCallContainer = compose(
    withFormik(),
    withState({
        callNotes: '',
        callType: '',
        ClinicEmployee: {
            callReason: ''
        },
        ExistingOrder: {
            callReason: ''
        },
        foundUsMethod: '',
        GeneralQuestion: {
            callReason: ''
        },
        NewOrder: {
            callReason: ''
        }
    }),
    withTranslate
)(PhoneCallContent);

export const OrderPhoneCall = (props) => {
//   const {
    
//   } = props;

  return (
    <div className="w-100">
        <div className="card m-2">
            <div className="card-header">
                <div className="row">
                    <div className="col text-center">
                        <span className="mr-2" style={{maxWidth: 100+'px'}}>
                            {/* Stopwatch will reset whenever this container is loaded or anything changes, so we have to make this as the parent most container where nothing else changes */}
                            <ReactStopwatch seconds={0} minutes={0} hours={0} onChange={({ hours, minutes, seconds }) => {}}
                                render={({ formatted, hours, minutes, seconds }) => {
                                return (<span>{ formatted }</span>);
                                }}
                            />
                        </span>
                        {/* <button type="button" className={`btn btn-sm btn-success float-right`} onClick={() => handleCustomerCall('start')}><FontAwesomeIcon icon="phone" className="mr-1" /> Start Call</button> */}
                    </div>
                </div> 
            </div>
            {/* Card Body for the phone call tree of logic */}
            <PhoneCallContainer />
        </div>
    </div>
    )

}





