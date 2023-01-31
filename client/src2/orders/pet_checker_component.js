import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import React from 'react';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withRouter, NavLink } from "react-router-dom";
import { withState } from "react-state-hoc";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

import {
	OrderCremationSaveMutation,
	PetCheckerMutation
} from './orders_graphql';

const PetReferenceCheckFormContent = (props) => {
	const {
		message,
		messageStatus,
		Order,
		petReferenceNumber,
		PetReferenceNumberCheck,
		serviceType,
		setState,
		showMemorializationOption
	} = props;

	// Is Memorialization Time Open, Time Closed, Manually Completed, Reopened by Crematory?
	let memorializationOpen = true;			// memorialization is still available
	let memorializationCompleted = true;	// memorialization manually completed in clinic or at home
	let memorializationReopened = true;
	// if Reopened by Staff - OPEN
	if(Order && Order.tabMemorializationOpen === 1) {
		memorializationOpen = true;
		memorializationCompleted = false;
		memorializationReopened = true;
	}
	// else if Manually Completed - COMPLETED at ____
	else if (Order && Order.memorializationCheckedOut === 1) {
		memorializationOpen = false;
		memorializationCompleted = true;
		memorializationReopened = false;
	}
	// else if Time Closed - CLOSED
	else if (Order && moment().diff(moment(Order.dateMemorializationEnds)) > 0) {
		memorializationOpen = false;
		memorializationCompleted = false;
		memorializationReopened = false;
	}
	// else if Time Open - OPEN
	else if (Order && moment().diff(moment(Order.dateMemorializationEnds)) <= 0) {
		memorializationOpen = true;
		memorializationCompleted = false;
		memorializationReopened = false;
	}

	// Function for handling the actual submit of the pet reference number
	async function handleSubmitPetReferenceNumber(number) {
		const { data: { petReferenceNumberCheck }} = await PetReferenceNumberCheck({ input: { petReferenceNumber: number } });

		if(petReferenceNumberCheck.Response.success === false) {
			// re-initialize the form - the reference number entered is wrong
			// handlePetReferenceNumberSubmit(input.petReferenceNumber);
			// setResponse(petReferenceNumberCheck.Response);
			setState({message: petReferenceNumberCheck.Response.message, messageStatus: 'danger'})
		} else {
			if(props.match.path === "/order_scan") {
				// Redirect to the order details for this orderId
				props.history.push(`/orders/orderId/${petReferenceNumberCheck.Order.orderId}`)
			} else {
				// If there is a Cremation product on this order, get that product object for easier use below.
				const CremationProduct = petReferenceNumberCheck.Order.ProductsOrder.find((product) => product.productTypeId === '2');
				const MemorializationProduct = petReferenceNumberCheck.Order.ProductsOrder.find((product) => product.productTypeId === '3');
				const VetSupplyProduct = petReferenceNumberCheck.Order.ProductsOrder.find((product) => product.productTypeId === '4');

				let tempOrderType = '';
				if (VetSupplyProduct) {
					tempOrderType = "Vet Supply Order";
				} else if (MemorializationProduct && !CremationProduct) {
					tempOrderType = "Product Only Order";
				}

				let tempServiceType = '';
				let tempShowMemorializationOption = false;
				// Check if this is a Cremation productType
				if(CremationProduct) {
					// serviceType is the product name that we display, it is not editable in the order details page here.
					tempServiceType = CremationProduct.productName;

					// Show the memorialization information as long we it is not a Communal Cremation.
					tempShowMemorializationOption = CremationProduct.productName !== 'Communal Cremation' ? true : false;
				}

				setState({
					message: petReferenceNumberCheck.Response.message,
					messageStatus: 'success',
					success: true,
					Order: petReferenceNumberCheck.Order,
					orderType: tempOrderType,
					petReferenceNumber: '',
					serviceType: tempServiceType,
					showMemorializationOption: tempShowMemorializationOption
				});
			}
		}
	};

	async function handlePetReferenceNumberOnChange(petReferenceNumber) {
		setState({ message: '', messageStatus: '', petReferenceNumber: petReferenceNumber })

		// Auto submit if the length is 7
		if(petReferenceNumber.length === 7) {
			handleSubmitPetReferenceNumber(petReferenceNumber);
		}
	}


	return (
		<React.Fragment>
			<Form className="w-100">
				<div className="card p-3">
					{/*  Display a resulting status message.  */}
					<div className="row">
						<div className="col-md-auto">
							<label htmlFor="petReferenceNumber" className="mb-0"><Translate id="Pet Reference Number"/></label>
							<Field name="petReferenceNumber" value={petReferenceNumber} onChange={(event) => handlePetReferenceNumberOnChange(event.target.value)} className="form-control" />
						</div>
						<div className="col-md">
							<button type="button" onClick={() => handleSubmitPetReferenceNumber(petReferenceNumber)} className="btn btn-info btn-addon mt-4" disabled={petReferenceNumber.length !== 7}>
								<FontAwesomeIcon icon="search" /> <Translate id="Check Status" />
							</button>
						</div>
					</div>

					{ message !== "" && <div className="row"><div className={`col-12 alert alert-${messageStatus}`} >{props.translate(message)}</div></div> }

					{ Order && <div className="mt-3">
						<div className="card-header bg-dark text-light">
							<h3 className="float-md-right m-0"><FontAwesomeIcon icon="hospital" /> {Order.companyName}</h3>
							{/* Show Either Vet Supply Order, Product Only Order, OR Cremation Order Info Pet Name */}
							<h3 className="m-0">
								{ Order.orderTypeId === 1 &&
									<span className="m-0 mr-3"><Translate id="Vet Supply Order" /> </span>
								}
								{ Order.orderTypeId === 3 &&
									<span className="m-0 mr-3"><Translate id="Product Only Order" /> </span>
								}
								{ (Order.orderTypeId === 2 || Order.orderTypeId === null) &&
									<span className="m-0 mr-3">{Order.petFirstName} {Order.petLastName} </span>
								}
								<NavLink to={`/orders/orderId/${Order.orderId}`} activeClassName="active" className="btn btn-info btn-addon"><FontAwesomeIcon icon="angle-right" /> {Order.petReferenceNumber}</NavLink>
							</h3>
						</div>
						{Order.OrderHold.length > 0 &&
							<div className="card mb-3 border-warning bg-warning">
								<div className="card-header">
									<h4 className="m-0"><FontAwesomeIcon icon="hand-paper" /> <Translate id="Hold" /></h4>
								</div>
								<div className="card-body">
									<p className="m-0">{Order.OrderHold[0].orderHoldReason}</p>
								</div>
								{Order.OrderHold[0].dateCreated && <div className="card-footer">{moment(Order.OrderHold[0].dateCreated).format('MMM D, YYYY h:mm A')}</div>}
							</div>
						}
						<div className="card-deck">
							<div className="card">
								{/* check to see if the date MemorializationEnds is in the past */}
								{ Order.orderTypeId === 2 && Order.memorialization !== 'none' && <React.Fragment>
									{memorializationOpen === true && memorializationCompleted === false && <div className="card-header text-white bg-danger">
										<h5 className="m-0 text-light">
											<span className="h4 float-md-right m-0"><FontAwesomeIcon icon="tasks" /> {Order.orderStatus}</span>
											<FontAwesomeIcon icon="clock" />
											{memorializationReopened === false && <React.Fragment><Translate id=" Memorialization Open until" /> {moment(Order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}</React.Fragment>}
											{memorializationReopened === true && <React.Fragment><Translate id=" Memorialization Reopened" /></React.Fragment>}
										</h5>
									</div>}
									{memorializationOpen === false && memorializationCompleted === false && <div className="card-header text-white bg-warning">
										<h5 className="m-0 text-light">
											<span className="h4 float-md-right m-0"><FontAwesomeIcon icon="tasks" /> {Order.orderStatus}</span>
											<FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Window Closed at" /> {moment(Order.dateMemorializationEnds).format('MMM DD, YYYY h:mm A')}
										</h5>
									</div>}
									{memorializationOpen === false && memorializationCompleted === true && <div className="card-header text-white bg-success">
										<h5 className="m-0 text-light">
											<span className="h4 float-md-right m-0"><FontAwesomeIcon icon="tasks" /> {Order.orderStatus}</span>
											<FontAwesomeIcon icon="clock" /> <Translate id=" Memorialization Completed at" /> {Order.memorialization}
										</h5>
									</div>}
								</React.Fragment>}

								{ Order.orderTypeId === 2 && Order.memorialization === 'none' && <div className="card-header text-white bg-success">
									<h5 className="m-0 text-light">
										<span className="h4 float-md-right m-0"><FontAwesomeIcon icon="tasks" /> {Order.orderStatus}</span>
										<FontAwesomeIcon icon="clock" /> <Translate id=" No Memorialization" />
									</h5>
								</div>}

								{ Order.orderTypeId !== 2 &&
									<div className="card-header text-white bg-info">
										<h5 className="m-0">
											<FontAwesomeIcon icon="tasks" /> {Order.orderStatus}
										</h5>
									</div>
								}

								{/* Cremation, Visitation, and Memorialization */}
								{ Order.orderTypeId === 2 &&
									<div className="card-header">
										{showMemorializationOption === true &&
											<h5 className="float-md-right m-0">
												{ Order.memorialization === 'home' && <span><FontAwesomeIcon icon="home" /> <Translate id="Memorialization At Home" /></span> }
												{ Order.memorialization === 'clinic' && <span><FontAwesomeIcon icon="hospital" /> <Translate id="Memorialization In Hospital" /></span> }
											</h5>
										}
										<h5 className="m-0">
											<FontAwesomeIcon icon="fire" />  <Translate id={serviceType} />
											{ Order.ProductsOrder.find((product) => product.productName === 'Visitation & Viewing') && <span className="ml-3"><FontAwesomeIcon icon="users" /> <Translate id="Visitation & Viewing" /></span>}
										</h5>
									</div>
								}

								{/* Paw Prints & Fur Clippings */}
								<div className="card-body">
									{ ( Order.ProductsOrder.find((product) => parseInt(product.isPawPrint) === 1) || Order.ProductsOrder.find((product) => parseInt(product.requiresPawPrint) === 1) ) && <React.Fragment>
										<div className="h1 border-bottom">
											<span className="fa-layers fa-fw">
												<FontAwesomeIcon icon="circle" />
												<FontAwesomeIcon icon="paw" inverse transform="shrink-8" />
											</span> <Translate id="Paw Prints" />
										</div>
										{Order.ProductsOrder.filter(({isPawPrint}) => parseInt(isPawPrint) === 1).map((product) => {
											const iconPawPrintTakenBackgroundColor = product.statusPawPrintTaken === 1 ? 'black' : 'grey';
											const iconPawPrintTakenColor = product.statusPawPrintTaken === 1 ? 'lightgreen' : 'white';

											const iconPawPrintCompletedBackgroundColor = product.statusPawPrintCompleted === 1 ? 'black' : 'grey';
											const iconPawPrintCompletedColor = product.statusPawPrintCompleted === 1 ? 'lightgreen' : 'white';

											const iconCompletedPackagedBackgroundColor = product.statusCompletedAndPackaged === 1 ? 'black' : 'grey';
											const iconCompletedPackagedColor = product.statusCompletedAndPackaged === 1 ? 'lightgreen' : 'white';

											return (
												<React.Fragment key={product.orderProductId}>
													<h4 className="clearfix">
														<span className="float-left">
															<span className="fa-layers fa-fw h2">
																<FontAwesomeIcon icon="circle" color={iconPawPrintTakenBackgroundColor} />
																<FontAwesomeIcon icon="paw" color={iconPawPrintTakenColor} transform="shrink-8" />
															</span>

															<span className="fa-layers fa-fw h2">
																<FontAwesomeIcon icon="circle" color={iconPawPrintCompletedBackgroundColor} />
																<FontAwesomeIcon icon="fire" color={iconPawPrintCompletedColor} transform="shrink-8" />
															</span>

															<span className="fa-layers fa-fw h2">
																<FontAwesomeIcon icon="square" color={iconCompletedPackagedBackgroundColor} />
																<FontAwesomeIcon icon="check" color={iconCompletedPackagedColor} transform="shrink-6" />
															</span>
														</span>
														<span className="float-left mt-1 ml-2">
															{product.accountProductName !== null && product.accountProductName !== "" && <span>{product.accountProductName}</span>}
															{!(product.accountProductName !== null && product.accountProductName !== "") && <span>{product.productName}</span>}
														</span>
													</h4>
												</React.Fragment>
											);
										})}
									</React.Fragment>}


									{ Order.ProductsOrder.find((product) => parseInt(product.isFurClipping) === 1) && <React.Fragment>
										<div className="mt-3 h1 border-bottom">
											<span className="fa-layers fa-fw">
												<FontAwesomeIcon icon="circle" />
												<FontAwesomeIcon icon="cut" inverse transform="shrink-8" />
											</span> <Translate id="Fur Clippings" />
										</div>
										{Order.ProductsOrder.filter(({isFurClipping}) => parseInt(isFurClipping) === 1).map((product) => {
											const iconFurClippingTakenBackgroundColor = product.statusFurClippingCompleted === 1 ? 'black' : 'grey';
											const iconFurClippingTakenColor = product.statusFurClippingCompleted === 1 ? 'lightgreen' : 'white';

											const iconCompletedPackagedBackgroundColor = product.statusCompletedAndPackaged === 1 ? 'black' : 'grey';
											const iconCompletedPackagedColor = product.statusCompletedAndPackaged === 1 ? 'lightgreen' : 'white';

											return (
												<React.Fragment key={product.orderProductId}>
													<h4 className="clearfix">
														<span className="float-left">
															<span className="fa-layers fa-fw h2">
																<FontAwesomeIcon icon="circle" color={iconFurClippingTakenBackgroundColor} />
																<FontAwesomeIcon icon="cut" color={iconFurClippingTakenColor} transform="shrink-8" />
															</span>

															<span className="fa-layers fa-fw h2">
																<FontAwesomeIcon icon="square" color={iconCompletedPackagedBackgroundColor} />
																<FontAwesomeIcon icon="check" color={iconCompletedPackagedColor} transform="shrink-6" />
															</span>
														</span>
														<span className="float-left mt-1 ml-2">
															{product.accountProductName !== null && product.accountProductName !== "" && <span>{product.accountProductName}</span>}
															{!(product.accountProductName !== null && product.accountProductName !== "") && <span>{product.productName}</span>}
														</span>
													</h4>
												</React.Fragment>
											);
										})}
									</React.Fragment>}
								</div>
							</div>
						</div>
					</div>}
				</div>

			</Form>
		</React.Fragment>
	);
};

export const PetChecker = compose(
	withMutation(OrderCremationSaveMutation, "OrderCremationSave", ["getOrderProducts"]),
	withMutation(PetCheckerMutation, "PetReferenceNumberCheck"),
	withFormik(),
	withRouter,
	withState({
		autoSubmitted: false,
		message: "",
		messageStatus: "",
		Order: null,
		orderType: '',
		petReferenceNumber: '',
		serviceType: '',
		showMemorializationOption: false
	}),
	withTranslate
)(PetReferenceCheckFormContent)
