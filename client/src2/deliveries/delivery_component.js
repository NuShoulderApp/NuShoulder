import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withFormik, Field } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import { compose } from "react-apollo";

import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import { Translate, withTranslate } from '../translations/IWDTranslation';
import { AddressFormContent } from '../addresses/address_component'; // generic address form

//import { ProductThumbnail } from '../products/product_images';

// GRAPHQL QUERY
import {
	AddressSaveMutation,
	getAddressQuery,
	getAddressTypes
} from '../addresses/address_graphql';
import { getProductsMemorializationQuery } from '../products/products_graphql';

const AddressSaveForm = compose (
	withMutation(AddressSaveMutation, "AddressSave"),
	withFormik({
		handleSubmit: async ( input, { props: {  AddressSave, handleDeliveryValuesUpdate, handleFormReload, setResponse }} ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			const addressSave  = await AddressSave({ input});

			// Rerender so that the form hides
			await handleFormReload(addressSave.data.AddressSave);
			// Function to pass the new addressId back up to the Order
			handleDeliveryValuesUpdate({name: 'deliveryAddressId', value: addressSave.data.AddressSave.addressId});
		}
	})
)(AddressFormContent);

class AddressSaveClass extends React.Component {
	constructor(props) {
    	super(props)
		let deliveryAddressId = props.initialValues && props.initialValues.deliveryAddressId > 0 ? props.initialValues.deliveryAddressId : 0;
		let deliveryMethodProductId = props.initialValues && props.initialValues.deliveryMethodProductId > 0 ? props.initialValues.deliveryMethodProductId : 0;
		let deliveryMethodName = deliveryMethodProductId > 0 ? props.ProductsMemorialization.ProductsMemorialization.find((product) => product.productId === deliveryMethodProductId).productName : '';

		let initialAddress = {
			address1: '',
			address2: '',
			addressId: 0,
			addressTypeId: 0,
			city: '',
			deliveryInstructions: '',
			postalCode: '',
			stateId: 0
		};

		// If there was an initialValues deliveryMethodProductId passed in, determine if it was the Courier Delivery option. If it is, then we can set the address form with the initialAddress values obtained from that Id - we do a queryWithLoading for this addressId.
		// The reason that we ONLY want to prepopulate the initialAddress values if the deliveryMethod is initial Courier is because for other options, specifically the Hospital Delivery, we will obviously have an address record for that addressId, and we do not
			// that addressId to be getting updated here, since that addressId would be getting passed to the address_component and that form would think that we are attempting to update the address for the Hospital Delivery, not adding a NEW address for Courier.
		// If there was an initialValues deliveryAddressId passed to this component, the queryWithLoading will get the Address object and we set the initialValues to it here
		if(props.Address && props.Address.Address) {
			if(deliveryMethodName === 'Courier Delivery') {
				initialAddress = props.Address.Address;
			} else if(props.orderDetails === true && deliveryMethodName === 'Hospital Delivery') {
				initialAddress = props.Address.Address;
			}
		}
		this.state= {
			address: initialAddress,
			deliveryAddressId,
			deliveryMethodProductId,
			showForm: deliveryAddressId > 0 && deliveryMethodName === 'Courier Delivery'? false : true
		}
	}

	componentWillReceiveProps(nextProps){
		// We need to reset the address form in certain scenarios where the deliveryAddressId being passed in as props is 0.
		// Example: For the case where an Order has not been saved, so there is no deliveryAddressId saved to the order in the db, if the delivery method is set as 'Courier Delivery', and an address is saved for that, then there will be a deliveryAddressId in the parent component's values object,
		// ... however it is not in the db. So if the user were to then click to a different delivery method, say 'No Delivery', then the deliveryAddressId for that case would be 0. If the user were to then click back to the 'Courier Delivery' option, we will have lost the deliveryAddressId of the old
		// ... courier delivery. We could get into a whole deal where we save the 'old' deliveryAddressId when we change options, but that is a rabbit hole that may be more trouble than its worth. So instead, what we are doing here is if the deliveryAddressId gets passed in as 0,
		// ... we are resetting the address form's values and you will have to re-enter them because you clicked to a different delivery method option. This will not be the case if we already have a deliveryAddressId saved into the Orders db record because from that Id, we can tell
		// ... if the currently saved deliveryMethod in the db is 'Courier Delivery', so we will show that addresses details for updating.

		if(nextProps.resetAddressFormWhenDeliveryAddressIdIsZero === true && nextProps.deliveryAddressId === 0) {
			this.setState({
				address: {
					address1: '',
					address2: '',
					addressId: 0,
					addressTypeId: 0,
					city: '',
					deliveryInstructions: '',
					ownerName: '',
					postalCode: '',
					stateId: 0
				},
				deliveryAddressId: 0,
				showForm: true
			});
		}

	}

	handleFormReload = (values) => {

		this.setState({
			address: {
				address1: values.address1,
				address2: values.address2,
				addressId: values.addressId,
				addressTypeId: values.addressTypeId,
				city: values.city,
				deliveryInstructions: values.deliveryInstructions,
				ownerName: values.ownerName,
				postalCode: values.postalCode,
				stateId: values.stateId
			},
			showForm: false
		})
	};

	// function to get the productName from the Products array for the deliveryMethodProductId selected
	getDelivery(deliveryMethodProductId) {
		if(parseInt(deliveryMethodProductId) > 0) {
			return this.props.ProductsMemorialization.ProductsMemorialization.find((product) => parseInt(product.productId) === parseInt(deliveryMethodProductId)).productName;
		} else {
			return false
		}
	};

	onChangeValue(name, value) {
		this.setState({
			[name]: value
		});

		// Update parent component's value.deliveryMethodProductId and value.deliveryMethodName
		this.props.handleDeliveryValuesUpdate({name, value});
	};

	// pass in a price string, and return without '.00' if it is an exact dollar.
	removeZeroCents(price) {
		// Remove the decimal zeros if the price is $85.00, then show $85.
		let tempPrice = price;
		tempPrice = tempPrice.substring(tempPrice.length-2, tempPrice.length) === '00' ? tempPrice.substring(0, tempPrice.length-3) : tempPrice;
		if(tempPrice !== 0) {
			return tempPrice;
		}
	}


	render () {
		const { Address: { Address }, CompanyAddresses, hospitalOptions, initialValues, memorialization, orderDetails=false, orderDetailsEditingEnabled=false, orderTypeId, ownerName='', showNoDelivery } = this.props;
		const { address } = this.state;
		const addressValue = address.address2 === '' ? address.address1 : `${address.address1} ${address.address2}`;

		let DeliveryProducts = this.props.ProductsMemorialization.ProductsMemorialization.filter((product) => product.productCategory === 'Delivery');
		// For Vet Supply Orders, always and only show Hospital Delivery
		if(orderTypeId === 1) {
			DeliveryProducts = DeliveryProducts.filter((product) => product.productName === "Hospital Delivery");
		}

		let DeliveryProductsToDisplay = [];
		DeliveryProducts.forEach((delivery) =>{
				// Check for the Company settings which are applied to each order as variables for 'Hospital Options' in the Order Details.
				if(
					(delivery.productName === 'No Delivery' && showNoDelivery) ||
					(delivery.productName === "Courier Delivery" && hospitalOptions.courierDeliveryOffered === 1) ||
					(delivery.productName === "Pickup at Crematory" && hospitalOptions.crematoryPickupOffered === 1) ||
					(delivery.productName === "Hospital Delivery" && hospitalOptions.hospitalDeliveryOffered === 1 && CompanyAddresses.length > 0) ||
					(delivery.productName !== 'No Delivery' && delivery.productName !== 'Courier Delivery' && delivery.productName !== 'Pickup at Crematory' && delivery.productName !== 'Hospital Delivery')
				) {
					DeliveryProductsToDisplay.push(delivery);
				}
		});


		// If the Courier Delivery address has already been added, use the owner name on that. Other wise the owner name passed in from the parent component.
		const addressOwnerName = Address && Address.ownerName !== "" ? Address.ownerName : ownerName;

		return (
			<React.Fragment>
				<div className={`${(DeliveryProducts.length > 1 && 'card-deck')} row justify-content-center`}>
					{/* This top conditional section is for the Delivery form in the memorialization process */}
					{orderDetails === false &&
						<React.Fragment>
							{DeliveryProducts.sort(function(a,b) { return parseInt(a.sortOrder) - parseInt(b.sortOrder)}).map((delivery) => {
								let buttonClass = this.state.deliveryMethodProductId === delivery.productId ? 'border p-3 border-info' : 'border p-3';

								// Check for the Company settings which are applied to each order as variables for 'Hospital Options' in the Order Details.
								if(
									(delivery.productName === 'No Delivery' && showNoDelivery) ||
									(delivery.productName === "Courier Delivery" && hospitalOptions.courierDeliveryOffered === 1) ||
									(delivery.productName === "Pickup at Crematory" && hospitalOptions.crematoryPickupOffered === 1) ||
									(delivery.productName === "Hospital Delivery" && hospitalOptions.hospitalDeliveryOffered === 1 && CompanyAddresses.length > 0) ||
									(delivery.productName !== 'No Delivery' && delivery.productName !== 'Courier Delivery' && delivery.productName !== 'Pickup at Crematory' && delivery.productName !== 'Hospital Delivery')
								) {
									return(
										<div key={delivery.productId} className="mb-2 col-lg-3 col-md-6 col-sm-12">
											<div className="card border-secondary ml-3 mr-3">
												<div className="card-header border-secondary text-center">
													{delivery.accountProductName !== null && delivery.accountProductName !== "" && <h5 className="m-0">{delivery.accountProductName}</h5>}
													{!(delivery.accountProductName !== null && delivery.accountProductName !== "") && <h5 className="m-0">{delivery.productName}</h5>}
												</div>
												{/* <div className="card-body text-justify p-4">
													<div className="text-primary display-3">
														{ delivery.productName === "Pickup at Crematory" && <FontAwesomeIcon icon="walking" className="mr-3" /> }
														{ delivery.productName === "Hospital Delivery" && <FontAwesomeIcon icon="ambulance" className="mr-3" /> }
														{ delivery.productName === "Courier Delivery" && <FontAwesomeIcon icon="truck-moving" className="mr-3" /> }

														{ delivery.productName !== "No Delivery" && <FontAwesomeIcon icon="arrow-right" className="mr-3" />}

														{ delivery.productName === "Pickup at Crematory" && <FontAwesomeIcon icon="warehouse" /> }
														{ delivery.productName === "Hospital Delivery" && <FontAwesomeIcon icon="hospital" /> }
														{ delivery.productName === "Courier Delivery" && <FontAwesomeIcon icon="home" /> }

														{ delivery.productName === "No Delivery" && <FontAwesomeIcon icon="ban" />}
													</div>
													
													{delivery.accountDescriptionShort !== null && delivery.accountDescriptionShort !== "" && <h5>{delivery.accountDescriptionShort}</h5>}
													{!(delivery.accountDescriptionShort !== null && delivery.accountDescriptionShort !== "") && delivery.descriptionShort !== null && <h5>{delivery.descriptionShort}</h5>}
													
													{delivery.accountDescriptionLong !== null && delivery.accountDescriptionLong !== "" && <div>{delivery.accountDescriptionLong}</div>}
													{!(delivery.accountDescriptionLong !== null && delivery.accountDescriptionLong !== "" ) && delivery.descriptionLong !== null && <div>{delivery.descriptionLong}</div>}
												</div> */}

												<div className="card-footer bg-white border-0 pb-5">
													<div className="mt-3 text-center">
														<span className={buttonClass}>
															<div className="pretty p-default p-pulse p-round">
																<Field name="deliveryMethodProductId" component="input" type="radio" value={delivery.productId} checked={this.state.deliveryMethodProductId === delivery.productId} onClick={() => this.onChangeValue('deliveryMethodProductId', delivery.productId)} className="form-control" />
																<div className="state p-primary">
																	<label>
																		{delivery.calculatedPriceRetail !== "0.00" && `(+$${this.removeZeroCents(delivery.calculatedPriceRetail)}) `}
																		{this.state.deliveryMethodProductId === delivery.productId && "SELECTED"}
																		{this.state.deliveryMethodProductId !== delivery.productId && "SELECT"}
																	</label>
																</div>
															</div>
														</span>
													</div>
												</div>
											</div>
										</div>
									)
								}
								return null
							})}
						</React.Fragment>
					}
					{/* This address output is specifically for Hospital Delivery in the Order Details. The address.city check is just to verify that an address made it into state, otherwise the output will just be 2 commas */}
					{orderDetails === true && orderDetailsEditingEnabled === false && this.getDelivery(this.state.deliveryMethodProductId) === "Hospital Delivery" && address.city !== '' &&
						<div className="ml-3">
							<div>{address.ownerName}</div>
							<div>{addressValue}, {address.city}, {address.state} {address.postalCode}</div>
							<div>{address.deliveryInstructions !== '' && address.deliveryInstructions !== null && `Delivery Instructions: ${address.deliveryInstructions}`}</div>
						</div>
					}
					{orderDetails === true && orderDetailsEditingEnabled === true &&
						<React.Fragment>
							<Field component="select" showError={true} name="deliveryMethodProductId" onClick={(event) => this.onChangeValue('deliveryMethodProductId', event.target.value)}className="form-control ml-3 mr-3">
								{/* Do not show the select option if they already selected a method */}
								{
									(
										(orderDetails === true && parseInt(initialValues.deliveryMethodProductId) === 0) ||
										orderDetails === false
									) &&
									<option value="0" key="0">{this.props.translate("Please Select")}</option>
								}
								{DeliveryProductsToDisplay.map((product) => {
									let productName = product.accountProductName !== null && product.accountProductName !== "" ? product.accountProductName : product.productName;
									return (<option value={product.productId} key={product.productId}>{productName}</option>)
								})}
							</Field>
						</React.Fragment>
					}
					{/* Check that either this component is being called from somewhere other than Order Details (and it is not a home memorialization), or if it is Order Details, that editing is enabled */}
					{((orderDetails === true && orderDetailsEditingEnabled === true) || (orderDetails === false && memorialization !== 'home')) && this.getDelivery(this.state.deliveryMethodProductId) === "Hospital Delivery" &&
						<div className="col-12 mt-3">
							<Translate id="Delivery Location"/> *
							<Field component="select" name="deliveryAddressId" onChange={(event) => this.onChangeValue('deliveryAddressId', event.target.value)} className="form-control">
								{CompanyAddresses.length !== 1 && <option value="0">{this.props.translate("Please Select")}</option>}
								{CompanyAddresses.map((address) => {
										const addressName = address.addressName !== '' && address.addressName !== null ? address.addressName : address.companyName;
										const addressValue = address.address2 === '' ? address.address1 : `${address.address1} ${address.address2}`;
										return <option value={address.addressId} key={address.addressId}>{addressName}: {addressValue}, {address.city}, {address.state} {address.postalCode}</option>
									}
								)}
							</Field>
							{orderDetails === true && orderDetailsEditingEnabled === true && <div className="alert alert-warning mt-1 mb-0"><Translate id="Order Details Save Needed Address Warning" /></div>}
						</div>
					}
					{/* 
						Check that either this component is being called from somewhere other than Order Details, or if it is Order Details, that editing is enabled 
						|| orderDetails === false
					*/}
					{((orderDetails === true && orderDetailsEditingEnabled === true) || (orderDetails === false && memorialization === 'clinic')) && this.getDelivery(this.state.deliveryMethodProductId) === "Courier Delivery" && this.state.showForm === true &&
						<div className="col-12 mt-3">
							<AddressSaveForm
								handleDeliveryValuesUpdate={this.props.handleDeliveryValuesUpdate}
								handleFormReload={this.handleFormReload}
								initialValues={{...this.state.address, ownerName: addressOwnerName }}
								orderDetails={orderDetails}
								showAddressName={false}
								showDeliveryInstructions={true}
								showOwnersName={true}
							/>
						</div>
					}
					{/* 
						Check that either this component is being called from somewhere other than Order Details, or if it is Order Details, that editing is enabled 
						 || orderDetails === false
					*/}
					{((orderDetails === true && orderDetailsEditingEnabled === true) || (orderDetails === false && memorialization === 'clinic')) && this.getDelivery(this.state.deliveryMethodProductId) === "Courier Delivery" && this.state.showForm === false &&
						<div className="col-12 mt-3">
							<div>Delivery Address:</div>
							<div>{address.ownerName}</div>
							<div>{addressValue}, {address.city}, {address.state} {address.postalCode}</div>
							<div>{address.deliveryInstructions !== '' && `Delivery Instructions: ${address.deliveryInstructions}`}</div>
							<div><button type="button" className="btn btn-sm btn-info btn-addon" onClick={() => this.setState({showForm: true})}><FontAwesomeIcon icon="pen" /><Translate id="Edit" /></button></div>
							{orderDetails === true && orderDetailsEditingEnabled === true && <div className="alert alert-warning mt-1 mb-0"><Translate id="Order Details Save Needed Address Warning" /></div>}
						</div>
					}
				</div>
			</React.Fragment>
		)
	}
}

export const DeliveryComponent = compose(
	withRouter,
	queryWithLoading({
		gqlString: getAddressQuery,
		variablesFunction: (props) => ({addressId: props.initialValues && props.initialValues.deliveryAddressId > 0 ? props.initialValues.deliveryAddressId : 0}),
		name: "Address"
	}),
	queryWithLoading({
		gqlString: getAddressTypes,
		name: "AddressTypes"
	}),
	queryWithLoading({
		gqlString: getProductsMemorializationQuery,
		variablesFunction: (props) => ({petReferenceNumber: props.petReferenceNumber, productTypeId: props.productTypeId}),
		name: "ProductsMemorialization"
	}),
	withTranslate
)(AddressSaveClass)
