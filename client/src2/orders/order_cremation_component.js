import _ from "lodash";
import { compose } from "react-apollo";
import { DetailColumn} from '../layouts/application';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import React from 'react';
import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withFormik, Field } from "../utilities/IWDFormik";
import { withRouter, Link } from "react-router-dom";
import { withState } from "react-state-hoc";

import { PrintButton } from './pdf_print_button_component';
// import { AddressFormContent } from '../addresses/address_component'; // generic address form
// import { DeliveryComponent } from '../deliveries/delivery_component';

// GRAPHQL QUERY
import {
	getCremationOrderQuery,
	OrderCremationSaveMutation
} from './orders_graphql';

import {
	getProductCompanyPromotionsCremationsQuery,
	getProductCompanyPromotionsProductsQuery
} from '../products/products_graphql';

import {
	PetReferenceNumberGenerateMutation
} from '../pet_reference_numbers/pet_reference_numbers_graphql';

import {
	getCompanyAddressesQuery,
	getCompanyOptionsQuery
} from '../companies/companies_graphql';

// import {
// 	getJobQuery
// } from '../jobs/jobs_graphql';
//
// // Show Download Tag button - must poll for compelted jobId and then once completed get the associated
// const DownloadTagContent = (props) => {
// 	let Job = props.data.Job;

// 	if(Job.status === "complete") {
// 		props.data.stopPolling();
// 	}
//
// 	return (<React.Fragment>
// 		{Job.status === "complete" && <a className="btn btn-info btn-addon" rel="noopener noreferrer" target="_blank" href={Job.File.location}><FontAwesomeIcon icon="print" /> <Translate id="Print Tag" /></a>}
// 		{Job.status === "pending" && <button className="btn btn-info disabled" type="button" disabled="disabled"><FontAwesomeIcon icon="spinner" spin /> <Translate id="Generating Tag" /></button>}
// 	</React.Fragment>);
// };
// const DownloadTag = compose(
// 	withRouter,
// 	queryWithLoading({
// 		gqlString: getJobQuery,
// 		variablesFunction: (props) => ({jobId: props.jobId}),
// 		fetchPolicy: 'network-only', // we don't want to get the response from the cache
// 	}),
// 	withTranslate
// )(DownloadTagContent)

// GRAPHQL QUERY
import {
	AddressSaveMutation,
	getAddressTypes
} from '../addresses/address_graphql';

const DepartmentFormContent = (props) => {
	const {
		CompanyDepartments,
		handleLocationSelect
	 } = props;

	 // Because we have {CompanyAddresses.map()...} we cannot use {} to do conditionals, so we had to make a separate function here so that we can do if statements outside of the return
	if(CompanyDepartments.length > 1) {
		return (
	 		<div className="card border-secondary mt-3">
	 			<div className="card-header">
	 				<h5 className="m-0"><Translate id="Department" /></h5>
	 			</div>
	 			<div className="card-body">
	 				<div className="form-row">
						<div className="col-12">
	 						<Field component="select" showError={false} name="companyDepartmentId" onChange={(event) => handleLocationSelect("companyDepartmentId", event.target.value)} className={`form-control`}>
	 							<option value="0">{props.translate("Please Select")}</option>
	 							{CompanyDepartments.map((department) => {
	 									return <option value={department.companyDepartmentId} key={department.companyDepartmentId}>{department.departmentName}</option>
	 								}
	 							)}
	 						</Field>
	 					</div>
	 				</div>
	 			</div>
	 		</div>
	 	)
	} else {
		return null;
	}
};

const PickupLocationFormContent = (props) => {
	const {
		CompanyAddresses,
		handleLocationSelect
	 } = props;

	 // Because we have {CompanyAddresses.map()...} we cannot use {} to do conditionals, so we had to make a separate function here so that we can do if statements outside of the return
	if(CompanyAddresses.length > 1) {
		return (
	 		<div className="card border-secondary mt-3">
	 			<div className="card-header">
	 				<h5 className="m-0"><Translate id="Pickup and Delivery" /></h5>
	 			</div>
	 			<div className="card-body">
	 				<div className="form-row">
						<div className="col-12">
	 						<Translate id="Pickup Location"/> *
	 						<Field component="select" showError={false} name="pickupAddressId" onChange={(event) => handleLocationSelect("pickupAddressId", event.target.value)} className={`form-control`}>
	 							<option value="">{props.translate("Please Select")}</option>
	 							<option value="0">{props.translate("Client Drop Off at Crematory")}</option>
	 							{CompanyAddresses.map((address) => {
	 									const addressValue = address.address2 === '' ? address.address1 : `${address.address1} ${address.address2}`;
	 									return <option value={address.addressId} key={`address-${address.addressId}`}>{addressValue}, {address.city}, {address.state} {address.postalCode}</option>
	 								}
	 							)}
	 						</Field>
	 					</div>
						<div className="col-12 mt-2">
	 						<Translate id="Delivery Location"/> *
	 						<Field component="select" showError={false} name="deliveryAddressId" onChange={(event) => handleLocationSelect("deliveryAddressId", event.target.value)} className={`form-control`}>
	 							<option value="">{props.translate("Please Select")}</option>
	 							{CompanyAddresses.map((address) => {
	 									const addressValue = address.address2 === '' ? address.address1 : `${address.address1} ${address.address2}`;
	 									return <option value={address.addressId} key={`address-${address.addressId}`}>{addressValue}, {address.city}, {address.state} {address.postalCode}</option>
	 								}
	 							)}
	 						</Field>
	 					</div>
	 					{/*<div className="col-12 mt-3"> */}
	 						{/* Here initialValues is useless because this component is only used for the initial order creation, so the values will always be 0, so we need to pass in the real time values of deliveryAddressId and deliveryMethodProductId to be able to make appropriate changes in this component */}
	 						{/*<DeliveryComponent
	 							CompanyAddresses={CompanyAddresses}
	 							deliveryAddressId={values.deliveryAddressId}
	 							DeliveryProducts={DeliveryProducts}
	 							handleDeliveryValuesUpdate={handleDeliveryValuesUpdate}
	 							initialValues={{
	 								deliveryAddressId: values.deliveryAddressId,
	 								deliveryMethodProductId: values.deliveryMethodProductId
	 							}}
	 							resetAddressFormWhenDeliveryAddressIdIsZero={true}
	 						/>
	 				</div> */}
	 				</div>
	 			</div>
	 		</div>
	 	)
	} else {
		return null;
	}
};

const OrderCremationFormContent = (props) => {
	const {
		addressTypes: { Countries },
		CompanyAddresses: { CompanyAddresses },
		CompanyOptions: { Company },
		CremationPromotions,
		errors,
		handleFormReload,
		handleSubmit,
		initialLoad,
		isSubmitting,
		NavClasses,
		OrderCremationSave,
		OrderStatuses,
		ownerPhoneNumber,
		petOwnerInformationViewed,
		PetReferenceNumberGenerate,
		Products,
		ProductsPromotions,
		Response,
		setState,
		showOwnerAddress,
		Species,
		touched,
		userId,
		userTypeId,
		values
	} = props;

	if(initialLoad === true) {
		let tempActiveNavClass = values.newOrderType === 'products' ? 'PetOwner' : 'Memorialization';
		// Update state for initial load values
		setState({
			initialLoad: false,
			NavClasses: {
				...NavClasses,
				activeClass: tempActiveNavClass
			}
		})
	}

	// Are there errors on the page?
	//let pageHasErrors = _.isEmpty(errors) ? false : true;

	// change the alert message class if the message is successful or fails
	let responseAlertClass = Response && Response.success === false ? 'alert-danger' : 'alert-success';

	// Set the translation id for the disclaimers if communal paw print or private is selected.
	// let atHomeDisclaimerTranslationId = getProductId('Private Cremation') === values.productId || getProductId('Individual Cremation') === values.productId ? 'Memorialization At Home Private Disclaimer' : 'Memorialization At Home Communal Disclaimer';
	// let inClinicDisclaimerTransalationId = getProductId('Private Cremation') === values.productId || getProductId('Individual Cremation') === values.productId ? 'Memorialization In Hospital Private Disclaimer' : 'Memorialization In Hospital Communal Disclaimer';

	// function to get the productId from the Products array for the 3 cremation options, incase the productId were to ever change.
	// function getProductId(productName) {
	// 	let Product = Products.filter((product) => {
	// 		return product.productName === productName
	// 	});
	// 	return Product.productId;
	// };

	// function to update the pickupAddressId in values when the select input is changed - need this because the input is in a different function
	function handleLocationSelect(name, addressId) {
		values[name] = parseInt(addressId); // set the value
		handleFormReload(values); // rerender the form
	};

	// Navigation functionality
	function handleNavClasses(navClass) {
		// Only show the save button once the PetOwner section has been viewed
		let tempPetOwnerInformationViewed = navClass === 'PetOwner' ? true : petOwnerInformationViewed;
		// set the previous active class to have the in-active classes
		let previousActiveClass = NavClasses.activeClass;
		setState({
			NavClasses: {
				...NavClasses,
				activeClass: navClass,
				[previousActiveClass]: 'btn-secondary',
				[navClass]: 'btn-secondary'
			},
			petOwnerInformationViewed: tempPetOwnerInformationViewed
		})
	}
	// bullshit functionality to get the staff pet flag to set correctly, this entire form needs to be rebuild do that it doesnt use formik.
	// function handleValueChange(name, value) {
	// 	if(name === 'staffEmployeePet') {
	// 		if(values.staffEmployeePet === 0 || values.staffEmployeePet === '0' || values.staffEmployeePet === false) {
	// 			values.staffEmployeePet = 1;
	// 		} else {
	// 			values.staffEmployeePet = 0;
	// 		}
	// 	}
	// 	// values[name] = value); // set the value
	// 	handleFormReload(values); // rerender the form
	// }

	// If there is a Response and it is successful, then hide the form. Otherwise, even if there is a response, if it is failed, then still show the form so they an fix it.
	let showForm = Response && Response.success === true ? false : true;

	// Function called to make a random number
	async function handleGenerateRandomPetReferenceNumber() {
		// This is the generic function for making X number of petReferenceNumbers
		const { data: { petReferenceNumberGenerate }} = await PetReferenceNumberGenerate({ input: { numberToGenerate: 1} });
		// update the value of the petReferenceNumber
		values.petReferenceNumber = petReferenceNumberGenerate.PetReferenceNumbers[0].petReferenceNumber;
		// call the form reload with the new value in it
		handleFormReload(values);
	}

	function handlePhoneChange(value) {
		values.ownerPhoneNumber = value;
		setState({ownerPhoneNumber: value})
	}

	// TESTING PURPOSES - function to auto fill values with test data so I dont have to fill out the form everytime
	function clickTestingData() {
		values.memorialization = "clinic"
		values.newOrderType = "cremation"
		values.orderServiceStatusId = "3"
		values.ownerEmail = "barrettjhall@gmail.com"
		values.ownerFirstName = "Barrett"
		values.ownerLastName = "Hall"
		values.ownerPhoneNumber = "2484952366"
		values.petBreed = "tiger"
		values.petColor = "Blk"
		values.petFirstName = "Test Test"	
		values.previousProductId = "27"
		values.productId = "27"
		values.sex = "Female"
		values.speciesId = "1"
		values.weight = "15"
		values.weightUnits = "lbs"
	}

	// Remove the 'viewing' products from the list of available cremation products
	let filteredProducts = Products.filter((product) => product.productCategory === 'Cremations').sort(function(a,b) { return parseInt(b.productId) - parseInt(a.productId)});
	// const otherCremationServicesProducts = Products.filter((product) => product.productCategory === 'Optional Services');

	if(Company.cremationTypesOffered === 'private_only') {
		filteredProducts = filteredProducts.filter((product) => product.productName !== 'Individual Cremation');
	} else if(Company.cremationTypesOffered === 'individual_only') {
		filteredProducts = filteredProducts.filter((product) => product.productName !== 'Private Cremation');
	}

	// This function is passed to the Delivery component, and it receives back an object with the values and names that are saved/updated in that component
	// function handleDeliveryValuesUpdate(DeliveryObject) {
	// 	values[DeliveryObject.name] = DeliveryObject.value;
	// 	// if there is not yet a deliveryAddressId in the values, it means that there is not a deliveryAddressId on the Order. Which could mean that the Order has not yet been created (New Cremation Order),
	// 	// or that they simply skipped the delivery step in the initial Order save, and we are on the Order Details page doing an update - On this component, it is always the case that an order has not been created since this is the Order Create component.
	// 	// In either case, until there is a deliveryAddressId on the Order record itself, then we reset the deliveryAddressId in this component each time the deliveryMethodProductId changes, because each method would save a different deliveryAddressId, so we don't want issues of previous Ids carrying over.
	// 	if(DeliveryObject.name === 'deliveryMethodProductId') {
	// 		values.deliveryAddressId = 0;
	// 	}
	// }

	// This functionality will auotmatically check the In Hospital/Clinic option for memorialization if At Home memorialization is not allowed and the cremation service selected is Individual or Private.
	let autoCheckInClinicMemorialization = false;
	// This functionality will auto check None memorialization when communal cremation is selected.
	let autoCheckNoneMemorialization = false;
	if(parseInt(Company.allowHomeMemorialization) === 0 && values.memorialization !== 'clinic') {
		const NonCommunalCremation = filteredProducts.filter((product) => product.productName === 'Individual Cremation' || product.productName === 'Private Cremation');
		// There does not need to be an extra check here comparing productId to previousProductId because whenever memorialization is changed to one of these, the only option is In Clinic.
		if(NonCommunalCremation && NonCommunalCremation.find((product) => parseInt(product.productId) === parseInt(values.productId))) {
			autoCheckInClinicMemorialization = true;
			values.memorialization = 'clinic';
		}
	} else if(values.memorialization === 'clinic') {
		autoCheckInClinicMemorialization = true;
	}
	// There is an extra check in this condition for the previous product Id being different than the values.productId so that memorialization only gets set to NONE on the initial change over to Communal
	if(values.memorialization !== 'none') {
		const CommunalCremation = filteredProducts.filter((product) => product.productName === 'Communal Cremation');
		if(CommunalCremation && CommunalCremation.find((product) => parseInt(product.productId) === parseInt(values.productId)) && parseInt(values.productId) !== parseInt(values.previousProductId) && values.previousProductId !== undefined) {
			autoCheckNoneMemorialization = true;
			values.memorialization = 'none'
		}
	} 
	else if(values.memorialization === 'none') {
		autoCheckNoneMemorialization = true;
		if(parseInt(values.productId) === parseInt(filteredProducts.find((product) => product.productName === 'Private Cremation').productId)) {
			autoCheckInClinicMemorialization = true;
			values.memorialization = 'clinic';
		}
	}

	// Check if the Cremation product was changed.
	if(parseInt(values.productId) > 0 && parseInt(values.productId) !== parseInt(values.previousProductId)) {
		// If Communal was just selected, if so, make urn selection none selected
		if(parseInt(values.productId) === parseInt(filteredProducts.find((product) => product.productName === 'Communal Cremation').productId)) {
			values.selectedPawPrintProductId = -1;
			values.selectedFurClippingProductId = -1;
			values.selectedUrnProductId = 0;
		} 
		// If Private, pre-select the Furclipping and PP.
		else if(parseInt(values.productId) === parseInt(filteredProducts.find((product) => product.productName === 'Private Cremation').productId)) {
			values.selectedPawPrintProductId = 32;
			values.selectedFurClippingProductId = 33;
		}
	} 

	// Set a previousProductId to be able to compare if the Cremation Product was changed above.
	values.previousProductId = values.productId;

	// Create array of PromotionsProducts that will be shown for each Cremation product option
	let TempPromotionsProducts = [];
	if(parseInt(values.productId) === 0) {
		// If there is no cremation product selected, then reset the selected urn and paw print
		values.selectedFurClippingProductId = -1;
		values.selectedPawPrintProductId = 0;
		values.selectedUrnProductId = 0;
		// Set the cremation productId if the page is first loaded
		//values.productId = filteredProducts[0].productId;

		// Only default the selection to Clinic if the At Home option is not available for this hospital
		if(values.memorialization === '') {
			values.memorialization = 'clinic';
			autoCheckInClinicMemorialization = true;
		}
	} 

	if(parseInt(values.productId) > 0) {		
		// Filter the CremationsPromotions (all of the promotions for this company) down to just the promtions for the selected Cremation Product
		let TempCremationProductPromotions = CremationPromotions.filter((product) => parseInt(product.productId) === parseInt(values.productId));

		if(TempCremationProductPromotions.length > 0) {
			// Sort the TempCremationProductPromotionses by category for each of use in the next step
			let SortedPromotions = TempCremationProductPromotions.sort(function(a,b) { return parseInt(b.productCategoryId) - parseInt(a.productCategoryId)})
			let tempCategory = '';

			SortedPromotions.forEach((promotion) => {
				// If this next array of the SortedPromotions is for a new category, create the next TempPromotionsProducts array
				if(tempCategory !== promotion.productCategory) {
					tempCategory = promotion.productCategory;
					// Get the product for promotion
					let TempProduct = ProductsPromotions.filter((product) => parseInt(product.productCompanyPromotionId) === parseInt(promotion.productCompanyPromotionId));
					// Create the new category object for the promotion - there will be an object for each category of products that are promotional, and that object will have an array of the products available for the category's promotion
					let TempPromotionCategory = { promotionCategory: tempCategory, PromotionProducts: TempProduct};
					TempPromotionsProducts.push(TempPromotionCategory);
					// If this is the first time through the array setting, and the values.selectedXXXProductId = 0, set it as a default
					if(tempCategory === 'Paw Prints' && parseInt(values.selectedPawPrintProductId) === 0) {
						//values.selectedPawPrintProductId = TempProduct[0].promotionalProductId;
					} else if(tempCategory === 'Urns' && parseInt(values.selectedUrnProductId) === 0) {
						values.selectedUrnProductId = TempProduct[0].promotionalProductId;
					}
				} else {
					// If this is a promotion product that is in an exisiting category already in the promotional products top level array, just push the product's object to the category's products
					let TempProduct = ProductsPromotions.find((product) => parseInt(product.productCompanyPromotionId) === parseInt(promotion.productCompanyPromotionId));
					TempPromotionsProducts.find((category) => category.promotionCategory === promotion.productCategory).PromotionProducts.push(TempProduct);
				}
			})

			// If there are Paw Prints in the TempPromotionsProducts, sort them so that the isFurClipping flag goes last if there are furclippings.
			let pawPrintPromotionIndex = TempPromotionsProducts.findIndex((promotion) => promotion.promotionCategory === 'Paw Prints');
			if(pawPrintPromotionIndex > -1) {
				// Sort the PromotionProducts array so that the FurClippings are last.
				TempPromotionsProducts[pawPrintPromotionIndex].PromotionProducts = TempPromotionsProducts[pawPrintPromotionIndex].PromotionProducts.sort(function(a,b) { return parseInt(b.isFurClipping) - parseInt(a.isFurClipping)})
			}

			// Check that when we change the cremation selection (values.productId), that any selectedPP or selectedUrn is available as the promotion for the service
			// This is specifically to make sure that when communal cremation is selected, we change the selectedUrn if it is not available as a promotion for communals
			if(parseInt(values.selectedUrnProductId) > 0) {
				// Loop through the available CremationProductPromotions for the selected Cremation, and find if there is one matching the currently selectedUrn.
				let tempIndex = TempCremationProductPromotions.findIndex((promotion) => {
					return ProductsPromotions.findIndex((product) => parseInt(product.promotionalProductId) === parseInt(values.selectedUrnProductId) && parseInt(product.productCompanyPromotionId) === parseInt(promotion.productCompanyPromotionId)) > -1
				});
				if(tempIndex === -1) {
					values.selectedUrnProductId = -1;
					//values.selectedUrnProductId = TempPromotionsProducts.find((category) => category.promotionCategory === 'Urns').PromotionProducts[0].promotionalProductId;
				}
			}

			// If 'Other Urn' is selected, make it so that memorializationCheckedOut = 0, and disable @1
			if(parseInt(values.selectedUrnProductId) === -1 || values.memorialization === 'home') {
				values.memorializationCheckedOut = 0
			}

			// If this is a communal, and they have selected a PP or FC, then change the memorialization to 'clinic' if it was 'none'. 'None' also gets disabled at the input level if there are PP or FC
			if(parseInt(values.productId) === parseInt(filteredProducts.find((product) => product.productName === 'Communal Cremation').productId)) {
				if((parseInt(values.selectedPawPrintProductId) > 0 || parseInt(values.selectedFurClippingProductId) > 0) && values.memorialization === 'none') {
					values.memorialization = 'clinic';
					autoCheckInClinicMemorialization = true;
				}
			}
		} else {
			// If there are no promotional products with the selected cremation, then reset the selected urn and paw print
			values.selectedFurClippingProductId = -1;
			values.selectedPawPrintProductId = 0;
			values.selectedUrnProductId = 0;
		}
	} 

	// Function after New Order Cremation created, and they meant to mark the order as Checked Out
	// async function handleCheckOutMemorialization(orderId) {
	// 	const tempResponse = await OrderCremationSave({ input: {orderId, generateNewCremationTag: true, memorializationCheckedOut: 1}});
	// }

	let selectedCommunal = parseInt(values.productId) === parseInt(filteredProducts.find((product) => product.productName === 'Communal Cremation').productId) ? true : false;

	let style = {};
	// style.backgroundImage = `url(/images/ui/loyalpaws_background6.png)`;
	// style.backgroundSize = 'cover';
	// style.backgroundPosition = 'center center';
	// style.backgroundRepeat = 'no-repeat';
	style.minHeight = '1200px';
	console.log({props})

	return (
		<div className="bg-light w-100 p-2" style={style}>
			{/*  Display a resulting status message.  */}
			{ Response && Response.success === true && values.newOrderType === 'cremation' &&
				<React.Fragment>
					<div className="row justify-content-center">
						<div className="col-lg-3 col-md-2 col-sm-1" />
						
							<div className="col-lg-6 col-md-8 col-sm-10">
								<div className="text-center pb-2">
									<p><img src={process.env.PUBLIC_URL + "/images/logos/lp_transparent.png"} className="pt-5 w-75" alt="Loyal Paws" /></p>
								</div>
								{/* <div className={`text-center alert ${responseAlertClass}`}>{props.translate(Response.message)}</div> */}
								{	
									(
										parseInt(Response.OrderCremation.memorializationCheckedOut) === 1 
										||
										Response.OrderCremation.memorialization === "home"
									)
									&&
									<div className="card bg-transparent">
										<div className="card-header">
											<h5 className="text-center text-secondary m-0">Memorialization Order Created</h5>
										</div>
										<div className="card-body">
											<div className="alert alert-success h6 mb-4">
												<FontAwesomeIcon icon="check-circle" color="green" className="mr-2" /> Your order was placed successfully.
											</div>
											<div className="display-3 row text-center">
												<div className="col-md-3">&nbsp;</div>
												<div className="col-4 col-md-2"><FontAwesomeIcon icon="print" /></div>
												<div className="col-4 col-md-2"><FontAwesomeIcon icon="arrow-right" /></div>
												<div className="col-4 col-md-2"><FontAwesomeIcon icon="tag" /></div>
												<div className="col-md-3">&nbsp;</div>
											</div>
											<div className="text-center">
												{/* Disable button until polling for jobId returns a completed status, then refetch the order info to get the fileId for the tag */}
												{/*<DownloadTag jobId={Response.jobId} />*/}
												<PrintButton jobId={Response.jobId} orderId={Response.orderId} printableId="3" printableName="Order Tag" generatingButtonText="Creating Order Tag" />
											</div>
											{/* CREMATORY / CLINIC ORDERS (NOT AT-HOME) */}
											{
												Response.OrderCremation.memorialization !== "home" &&
												<React.Fragment>
													{/* CREMATORY CREATED THE ORDER - SO ITS A WALK-IN */}
													{
														parseInt(Response.OrderCremation.companyTypeId) === 2 &&
														<div className="mt-4 h6 text-secondary">
															<div className="">
																<Translate id="Please go to the Order Details to complete the remaining 2 steps of this Order" />.
															</div>
															<div className="mt-2 ml-3">
																1) <Translate id="Collect payment using Credit Card, Cash, or Check" />.
															</div>
															<div className="mt-2 ml-3">
																2) <Translate id="Print out a Walk-in Receipt for the pet owner, and an Order Tag for our use." />
															</div>
															<div className="mt-3 text-center">
																{/* <a href={`/orders/orderId/${Order.orderId}`} className="btn text-white rounded" style={{backgroundColor: '#ec8333'}}><Translate id="Go To Order Details" /></a> */}
																<a href={`/orders/orderId/${Response.OrderCremation.orderId}`} className="btn btn-success text-white rounded"><Translate id="Go To Order Details" /></a>
															</div>
														</div>
													}
													{/* CLINIC CREATED THE ORDER */}
													{
														parseInt(Response.OrderCremation.companyTypeId) === 3 &&
														<div className="mt-3 text-secondary">
															<h6><Translate id="Prepare For Crematory Pickup" /></h6>
															<p className="pt-4 text-center"><a href={`/memorialization/referenceNumber/${Response.OrderCremation.petReferenceNumber}`} className="btn btn-lg text-white rounded" style={{backgroundColor: '#ec8333'}}><FontAwesomeIcon icon="paw" className="mr-2" /> <Translate id="Add Memorialization Products"/> </a></p>
														</div>
													}
												</React.Fragment>
											}
											{/* AT HOME MEMORIALIZATION, CREATED BY CREMATORY OR CLINIC */}
											{
												Response.OrderCremation.memorialization === "home" &&
												<div className="mt-3 h6 text-secondary">
													<Translate id="Give Owner Order Tag" data={{ownerFirstName:Response.OrderCremation.ownerFirstName}} />
													{/* CREMATORY CREATED THE ORDER */}
													{
														parseInt(Response.OrderCremation.companyTypeId) === 2 &&
														<div className="mt-4 h6">
															<div className="">
																<Translate id="Please go to the Order Details to complete the remaining 2 steps of this Order" />.
															</div>
															<div className="mt-2">
																1) <Translate id="Collect payment using Credit Card, Cash, or Check" />.
															</div>
															<div className="mt-2">
																2) <Translate id="Print out a Walk-in Receipt for the pet owner, and an Order Tag for our use." />
															</div>
															<div className="mt-3 text-center">
																{/* <a href={`/orders/orderId/${Order.orderId}`} className="btn text-white rounded" style={{backgroundColor: '#ec8333'}}><Translate id="Go To Order Details" /></a> */}
																<a href={`/orders/orderId/${Response.OrderCremation.orderId}`} className="btn btn-success text-white rounded"><Translate id="Go To Order Details" /></a>
															</div>
														</div>
													}
													{/* CLINIC CREATED - ALLOW TO ADD PRODUCTS TO AT-HOME INITIALLY */}
													{
														parseInt(Response.OrderCremation.companyTypeId) === 3 &&
														<React.Fragment>
															<div className="h6 mt-2 text-secondary">Click below to add or change any of the Memorialization Services or Products.</div>
															<p className="pt-4 text-center"><a href={`/memorialization/referenceNumber/${Response.OrderCremation.petReferenceNumber}`} className="btn btn-lg text-white rounded" style={{backgroundColor: '#ec8333'}}><FontAwesomeIcon icon="paw" className="mr-2" /> <Translate id="Add Memorialization Products"/> </a></p>
														</React.Fragment>
													}

													
												</div>
											}
										</div>
									</div>
								}
								{/* NON AT-HOME ORDERS THAT HAVE NOT BEEN CHECKED OUT, STILL NEED TO GO THROUGH THE MEMORIALIZATION PROCESS */}
								{	
									parseInt(Response.OrderCremation.memorializationCheckedOut) === 0 &&
									Response.OrderCremation.memorialization === "clinic" &&
									<div className="card bg-transparent">
										<div className="card-header">
											<h6 className="text-center text-secondary m-0">Memorialization Order Created</h6>
										</div>
										<div className="card-body text-justify">
											<div className="alert alert-success h6 mb-4">
												<FontAwesomeIcon icon="check-circle" color="green" className="mr-2" /> Your order was placed successfully.
											</div>
											{parseInt(Response.OrderCremation.companyTypeId) === 3 && <div className="h6 text-secondary"><p>Please click below to add or change any of the Memorialization Services or Products.</p><p>You must go through the Memorialization process and checkout in order to print out the Order Tag PDF and prepare for crematory pickup.</p></div>}
											{parseInt(Response.OrderCremation.companyTypeId) === 2 && <div className="h6 text-secondary"><p>Please click below to add or change any of the Memorialization Services or Products.</p><p>You must go through the Memorialization process and checkout in order to print out the Order Tag PDF.</p></div>}
											<p className="pt-4 text-center"><a href={`/memorialization/referenceNumber/${Response.OrderCremation.petReferenceNumber}`} className="btn btn-lg text-white rounded" style={{backgroundColor: '#ec8333'}}><FontAwesomeIcon icon="paw" className="mr-2" /> <Translate id="Add Memorialization Products"/> </a></p>
										</div>
									</div>
								}
							</div>
						<div className="col-lg-3 col-md-2 col-sm-1" />
					</div>
				</React.Fragment>
			}
			{ Response && Response.success === true && values.newOrderType === 'products' && <DetailColumn><div className={`alert ${responseAlertClass}`}>{props.translate(Response.message)} <a href={`/memorialization/referenceNumber/${Response.OrderCremation.petReferenceNumber}`}><Translate id="Click Here" /></a></div></DetailColumn> }

			{ 
				showForm && 
				<React.Fragment>
					{ /* DISCLAIMER for Product Only orders */}
					{values.newOrderType === 'products' && <div className="alert alert-info text-center">
						<b>IMPORTANT:</b> Products ordered using this form will NOT be linked to an active cremation order. If you would like to an a product to an existing cremation order please contact us.
					</div>}

					{/* NAVIGATION FOR SECTIONS */}
					<div className="card mt-2 ml-5 mr-5">
						{values.newOrderType === 'cremation' && 
							<div className="card-header p-0">
								<ul className="nav nav-pills nav-justified">
									<li className="nav-item">
										{
											(NavClasses.activeClass !== 'Memorialization' &&
											<button style={{opacity: 65+'%'}} className={`p-3 nav-link w-100 rounded btn btn-sm border border-secondary ${NavClasses.Memorialization}`} onClick={() => handleNavClasses('Memorialization')}>
												<span className="h3"><Translate id="Memorialization Service and Products" /></span>
												<div>(<Translate id="Click Here To View This Section" />)</div>
											</button>) ||
											<button className={`p-3 nav-link w-100 rounded btn btn-sm border border-secondary ${NavClasses.Memorialization}`} onClick={() => handleNavClasses('Memorialization')}>
												<span className="h3"><Translate id="Memorialization Service and Products" /></span>
												<div style={{opacity: 0+'%'}}>(<Translate id="Click Here To View This Section" />)</div>
											</button>
										}
									</li>
									<li className="nav-item">
										{
											(NavClasses.activeClass !== 'PetOwner' &&
											<button style={{opacity: 65+'%'}} className={`p-3 nav-link w-100 rounded btn btn-sm border border-secondary ${NavClasses.PetOwner}`} onClick={() => handleNavClasses('PetOwner')}>
												<span className="h3"><Translate id="Pet / Owner Information" /></span>
												<div>(<Translate id="Click Here To View This Section" />)</div>
											</button>) ||
											<button className={`p-3 nav-link w-100 rounded btn btn-sm border border-secondary ${NavClasses.PetOwner}`} onClick={() => handleNavClasses('PetOwner')}>
												<span className="h3"><Translate id="Pet / Owner Information" /></span>
												<div style={{opacity: 0+'%'}}>(<Translate id="Click Here To View This Section" />)</div>
											</button>
										}
									</li>
								</ul>
							</div>}

						{values.newOrderType === 'products' &&
							<div className="card-header bg-secondary border-secondary"><div className="w-100 text-white text-center"><span className="h3"><Translate id="Pet / Owner Information" /></span></div></div>}
						
						{
								values.newOrderType === 'cremation' && 
								NavClasses.activeClass === 'Memorialization' &&
								<React.Fragment>
									{
										(parseInt(userId) === 14 || parseInt(userId) === 2) &&
										<div className="w-100">
											<button type="button" className="btn btn-success" onClick={() => clickTestingData()}>Testing</button>
										</div>
									}
									<div className="border-secondary">
											{/* <div className="card-header text-center text-secondary border-secondary">
												<h5 className="m-0"><Translate id="Select Cremation Service" /></h5>
											</div> */}
											<div className="card-body" style={{minHeight: 500+'px'}}>
												<div className="row">
													{filteredProducts.map((product) => {
														if(product.productName === 'Communal and Paw Print') return null;
														return (
															<div key={product.productId} className="col-md mb-3 pr-1 pl-1">
																<label className="w-100 mb-0" htmlFor={`productId_${product.productId}`}>
																	<div className={` w-100 btn ${values.productId === product.productId && 'btn-outline-info'} ${(values.productId !== product.productId && ((errors.productId && 'btn-outline-danger') || 'btn-outline-secondary'))}`}>
																		<p className="text-center h5 mt-1 m-0">
																			{product.accountProductName !== null && product.accountProductName !== "" && <span>{props.translate(product.accountProductName)}</span>}
																			{!(product.accountProductName !== null && product.accountProductName !== "") && <span>{props.translate(product.productName)}</span>}
																		</p>
																		<p className="text-center m-0">
																			<Field name="productId" id={`productId_${product.productId}`} checked={parseInt(product.productId) === parseInt(values.productId)} component="input" type="radio" value={product.productId} className="m-0" />
																		</p>
																	</div>
																</label>
															</div>
														)
													})}
												</div>
												<div className="row mb-2">
													<div className="col-md pr-1 pl-1">
														<label className="w-100" htmlFor="memorializeNone">
															<div className={`w-100 ${(!selectedCommunal || (selectedCommunal && (parseInt(values.selectedFurClippingProductId) > 0 || parseInt(values.selectedPawPrintProductId) > 0))) && 'disabled'} btn ${(values.memorialization === 'none' && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																<p className="text-center h5 mt-1 m-0"><Translate id="None" /></p>
																{/* <p className="text-center"><img src={process.env.PUBLIC_URL + "/images/icons/order_memorialization_none.png"} alt="" style={{maxHeight: 75 + 'px'}} /></p> */}
																<p className="text-center m-0">
																	<Field name="memorialization" 
																		checked={autoCheckNoneMemorialization} 
																		id="memorializeNone" 
																		component="input" type="radio" value="none" 
																		className="m-0" 
																		disabled={!selectedCommunal}
																	/>
																</p>
															</div>
														</label>
													</div>
													<div className="col-md pr-1 pl-1">
														<label className="w-100" htmlFor="memorializeInClinic">
															<div className={`w-100 btn ${(values.memorialization === 'clinic' && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																<p className="text-center h5 mt-1 m-0"><Translate id="In Hospital" /></p>
																{/* <p className="text-center"><img src={process.env.PUBLIC_URL + "/images/icons/order_memorialization_hospital.png"} alt="" style={{maxHeight: 75 + 'px'}} /></p> */}
																<p className="text-center m-0">
																	<Field name="memorialization" 
																		checked={autoCheckInClinicMemorialization} 
																		id="memorializeInClinic" 
																		component="input" 
																		type="radio" 
																		value="clinic" 
																		className="m-0" 
																	/>
																</p>
															</div>
														</label>
													</div>
													{
														parseInt(Company.allowHomeMemorialization) === 1 &&
														<div className="col-md pr-1 pl-1">
															<label className="w-100" htmlFor="memorializeAtHome">
																<div className={`w-100 btn ${(values.memorialization === 'home' && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																	<p className="text-center h5 mt-1 m-0"><Translate id="At Home" /></p>
																	{/* <p className="text-center"><img src={process.env.PUBLIC_URL + "/images/icons/order_memorialization_home.png"} alt="" style={{maxHeight: 75 + 'px'}} /></p> */}
																	<p className="text-center m-0"><Field name="memorialization" id="memorializeAtHome" component="input" type="radio" value="home" className="m-0" /></p>
																</div>
															</label>
														</div>
													}
												</div>
												{/* {
													values.memorialization !== '' &&
													<div className="row">
														<div className="col-12 pr-1 pl-1">
															<div className="card border-info">
																<div className="card-header text-info border-info text-center">
																	<Translate id="IMPORTANT - PLEASE ENSURE PET OWNER UNDERSTANDING" />
																</div>
																<div className="card-body text-justify">
																	{values.memorialization === "none" && <p><Translate id="No Memorialization Disclaimer" /></p>}
																	{values.memorialization === "home" && <p><Translate id={atHomeDisclaimerTranslationId} /></p>}
																	{values.memorialization === "clinic" && <p><Translate id={inClinicDisclaimerTransalationId} /></p>}
																</div>
															</div>
														</div>
													</div>
												} */}

												{/* If this companyId has promotional products for the selected cremation product, show them below */}
												{
													TempPromotionsProducts.length > 0 &&
													TempPromotionsProducts.map((promotion) => {
														if(promotion.promotionCategory === 'Paw Prints') {
															// Determine the FurClipping Products if there are any
															let FurClippingPromotions = promotion.PromotionProducts.filter((product) => product.isFurClipping === 1);
															let PawPrintPromotions = promotion.PromotionProducts.filter((product) => product.isPawPrint === 1);

															let furClippingFlag = FurClippingPromotions.length > 0 ? true : false;

															// This is a one-off check for MedVet - Toledo. ALWAYS give them a FurClipping with privates, so do not give the option of deselecting FC
															if(parseInt(Company.companyId) === 1221 && !selectedCommunal) furClippingFlag = false;
															
															return (
																<React.Fragment key={promotion.promotionCategory}>
																	{
																		furClippingFlag === true &&
																		<div className="row mt-3">

																			{FurClippingPromotions.map((product, index) => {
																				return (
																					<React.Fragment key={product.promotionalProductId}>
																						<div className="col-3 pr-1 pl-1">
																							<label className="w-100 m-0" htmlFor={`productId_${product.promotionalProductId}`}>
																								<div className={`w-100 btn ${((parseInt(values.selectedFurClippingProductId) === parseInt(product.promotionalProductId)) && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																									<p className="text-center h6 mt-1 m-0">{product.productName}</p>
																									<p className="text-center m-0">
																										<Field name="selectedFurClippingProductId" 
																											checked={parseInt(product.promotionalProductId) === parseInt(values.selectedFurClippingProductId)} 
																											id={`productId_${product.promotionalProductId}`} 
																											component="input" 
																											type="radio" 
																											value={product.promotionalProductId} 
																											className="m-0 mr-1" 
																										/>
																									</p>
																								</div>
																							</label>
																						</div>
																						{
																							index+1 === FurClippingPromotions.length &&
																							<div className="col-3 pr-1 pl-1">
																								<label className="w-100 m-0" htmlFor="no_furclipping">
																									<div className={`w-100 btn ${(parseInt(values.selectedFurClippingProductId) === -1 && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																										<p className="text-center h6 mt-1 m-0">No Fur Clipping</p>
																										<p className="text-center m-0">
																											<Field name="selectedFurClippingProductId" 
																												checked={parseInt(values.selectedFurClippingProductId) === -1} 
																												id="no_furclipping"
																												component="input" 
																												type="radio" 
																												value={-1}
																												className="m-0 mr-1" 
																											/>
																										</p>
																									</div>
																								</label>
																							</div>
																						}
																					</React.Fragment>
																				)
																			})}
																		</div>
																	}	
																	<div className="row mt-3">
																		{
																			PawPrintPromotions.map((product, index) => {
																				let ppName = product.productName.replace('Paw Print', 'PP');
																				return (
																					<React.Fragment key={product.promotionalProductId}>
																						<div className="col-3 pr-1 pl-1">
																							<label className="w-100 m-0" htmlFor={`productId_${product.promotionalProductId}`}>
																								<div className={`w-100 btn ${((parseInt(values.selectedPawPrintProductId) === parseInt(product.promotionalProductId)) && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																									<p className="text-center h6 mt-1 m-0">{ppName}</p>
																									<p className="text-center m-0">
																										<Field name="selectedPawPrintProductId" 
																											checked={parseInt(product.promotionalProductId) === parseInt(values.selectedPawPrintProductId)} 
																											id={`productId_${product.promotionalProductId}`} 
																											component="input" 
																											type="radio" 
																											value={product.promotionalProductId} 
																											className="m-0 mr-1" 
																										/>
																									</p>
																								</div>
																							</label>
																						</div>
																						{
																							index+1 === PawPrintPromotions.length &&
																							<div className="col-3 pr-1 pl-1">
																								<label className="w-100 m-0" htmlFor="no_pawprint">
																									<div className={`w-100 btn ${(parseInt(values.selectedPawPrintProductId) === -1 && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																										<p className="text-center h6 mt-1 m-0">No PP</p>
																										<p className="text-center m-0">
																											<Field name="selectedPawPrintProductId" 
																												checked={parseInt(values.selectedPawPrintProductId) === -1} 
																												id="no_pawprint"
																												component="input" 
																												type="radio" 
																												value={-1}
																												className="m-0 mr-1" 
																											/>
																										</p>
																									</div>
																								</label>
																							</div>
																						}
																					</React.Fragment>
																				)
																			})
																		}
																	</div>
																</React.Fragment>
															)
														}
														else if(promotion.promotionCategory === 'Urns') {
															return (
																<div className="row mt-3" key={promotion.promotionCategory}>
																		{
																			promotion.PromotionProducts.map((product, index) => {
																				let urnName = product.productName.replace(' Urn', '');
																				return (
																					<React.Fragment key={product.promotionalProductId}>
																						<div className={`col-3 pr-1 pl-1 ${index > 3 && 'mt-3'}`}>
																							<label className="w-100 m-0" htmlFor={`productId_${product.promotionalProductId}`}>
																								<div className={`w-100 btn ${((values.selectedUrnProductId === product.promotionalProductId) && 'btn-outline-info') || 'btn-outline-secondary'}`} style={{minHeight: 85+'px'}}>
																									<p className="text-center h6 mt-1 m-0">{urnName}</p>
																									{
																										urnName === 'Acacia' &&
																										<p className="text-center h6 mt-1 m-0">(No Engraving)</p>
																									}
																									<p className="text-center m-0">
																											<Field name="selectedUrnProductId" 
																												checked={parseInt(product.promotionalProductId) === parseInt(values.selectedUrnProductId)} 
																												id={`productId_${product.promotionalProductId}`} 
																												component="input" 
																												type="radio" 
																												value={product.promotionalProductId} 
																												className="m-0 mr-1" 
																											/>
																									</p>
																								</div>
																							</label>
																						</div>
																						{
																							index+1 === promotion.PromotionProducts.length &&
																							<div className={`col-3 pr-1 pl-1 ${index > 2 && 'mt-3'}`}>
																								<label className="w-100 m-0" htmlFor="no_urn">
																									<div className={`w-100 btn ${((parseInt(values.selectedUrnProductId) === -1) && 'btn-outline-info') || 'btn-outline-secondary'}`} style={{minHeight: 85+'px'}}>
																										<p className="text-center h6 mt-1 m-0">Other Urns</p>
																										<p className="text-center h6 mt-1 m-0">(or Engravings)</p>
																										<p className="text-center m-0">
																												<Field name="selectedUrnProductId" 
																													checked={parseInt(values.selectedUrnProductId) === -1} 
																													id="no_urn"
																													component="input" 
																													type="radio" 
																													value={-1} 
																													className="m-0 mr-1" 
																												/>
																										</p>
																									</div>
																								</label>
																							</div>
																						}
																					</React.Fragment>
																				)
																			})
																		}
																		{/* <div className="col-12 mt-2 pl-1 pr-1">
																			<div className="alert alert-info">
																				If the pet owner wants engraving on the Acacia, please select the last option "Other Urns (or Engravings)". Then add the Acacia Urn and engraving information within the Memorialization process.<br/>For any other Urn choices, please select "Other Urns (or Engravings)" as normal.
																			</div>
																		</div> */}
																</div>
															)
														} else {
															return false;
														}
													})
												}
												{
													values.productId > 0 &&
													<React.Fragment>
														<div className="mt-3 pt-2 border-top">
															<div className="text-center mb-2">
																<Translate id="When this Cremation Order is created here, do you still need to add more products, or do you want to mark this Order as completed" />?
															</div>
															<div className="row pt-2 pb-2 text-center">
																<label className="col-6 mb-0 pr-2" htmlFor="memorializationCheckedOut-yes">
																	<div className={` w-100 btn ${(parseInt(values.memorializationCheckedOut) === 1 && 'btn-outline-info') || 'btn-outline-secondary'} ${(parseInt(values.selectedUrnProductId) === -1 || values.memorialization === 'home') && 'disabled'}`}>
																		<p className="text-center mt-1 m-0">This Order is complete, I'm done adding products.</p>
																		<p className="text-center m-0">
																			<Field name="memorializationCheckedOut" id="memorializationCheckedOut-yes" disabled={parseInt(values.selectedUrnProductId) === -1 || values.memorialization === 'home'} checked={parseInt(values.memorializationCheckedOut) === 1} component="input" type="radio" value={1} className="m-0" />
																		</p>
																	</div>
																</label>
																<label className="col-6 mb-0 pl-2" htmlFor="memorializationCheckedOut-no">
																	<div className={` w-100 btn ${(parseInt(values.memorializationCheckedOut) === 0 && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																		<p className="text-center mt-1 m-0">I need to add other products.</p>
																		<p className="text-center m-0">
																			<Field name="memorializationCheckedOut" id="memorializationCheckedOut-no" checked={parseInt(values.memorializationCheckedOut) === 0} component="input" type="radio" value={0} className="m-0" />
																		</p>
																	</div>
																</label>
															</div>
														</div>
														{
															(parseInt(props.Session.User.userTypeId) === 2 || parseInt(props.Session.User.userTypeId) === 3) &&
															<div className="mt-3 pt-2 border-top">
																<div className="text-center mb-2">
																	<Translate id="Set Cremation Order Status As" />
																</div>
																<div className="row pt-2 pb-2 text-center">
																	<label className="col-6 mb-0 pr-2" htmlFor="orderStatus-AtCrematory">
																		<div className={` w-100 btn ${(parseInt(values.orderStatusId) === parseInt(OrderStatuses.find((status) => status.orderStatus === 'At Crematory').orderStatusId) && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																			<p className="text-center mt-1 m-0">At Crematory</p>
																			<p className="text-center m-0">
																				<Field name="orderStatusId" id="orderStatus-AtCrematory" checked={parseInt(values.orderStatusId) === parseInt(OrderStatuses.find((status) => status.orderStatus === 'At Crematory').orderStatusId)} component="input" type="radio" value={parseInt(OrderStatuses.find((status) => status.orderStatus === 'At Crematory').orderStatusId)} className="m-0" />
																			</p>
																		</div>
																	</label>
																	<label className="col-6 mb-0 pl-2" htmlFor="orderStatus-Waiting">
																		<div className={` w-100 btn ${(parseInt(values.orderStatusId) === parseInt(OrderStatuses.find((status) => status.orderStatus === 'Waiting for Pet').orderStatusId) && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																			<p className="text-center mt-1 m-0">Waiting For Pet</p>
																			<p className="text-center m-0">
																				<Field name="orderStatusId" id="orderStatus-Waiting" checked={parseInt(values.orderStatusId) === parseInt(OrderStatuses.find((status) => status.orderStatus === 'Waiting for Pet').orderStatusId)} component="input" type="radio" value={parseInt(OrderStatuses.find((status) => status.orderStatus === 'Waiting for Pet').orderStatusId)} className="m-0" />
																			</p>
																		</div>
																	</label>
																</div>
															</div>
														}
													</React.Fragment>
												}
												{parseInt(values.petReferenceNumberAutoGenerate) === 0 &&
													<div>
														<Translate id="Pet Reference Number"/> *
														<div className="input-group">
															<Field name="petReferenceNumber" showError={false} className={`form-control ${errors.petReferenceNumber && touched.petReferenceNumber && 'is-invalid'}`} />
															<div className="input-group-append">
																<button type="button" className="btn btn-dark" onClick={() => handleGenerateRandomPetReferenceNumber()}><Translate id="Generate Number"/></button>
															</div>
														</div>
													</div>
												}
												
											</div>
										</div>
								</React.Fragment>
							} {/* This is the end tag of the cremation and memorialization selections col-md */}

							{
								NavClasses.activeClass === 'PetOwner' &&
								<div className="border-secondary">
									{/* <div className="card-header text-center text-secondary border-secondary">
										<h5 className="m-0"><Translate id="Pet Owner Information" /></h5>
									</div> */}

									<div className="card-body">
										<div className="form-row">
											<div className={`col ${(errors.ownerFirstName && touched.ownerFirstName && 'text-danger')}`}>
												<Translate id="Owner First Name"/> *
												<Field name="ownerFirstName" showError={false} required={true} className={`form-control ${errors.ownerFirstName && touched.ownerFirstName && 'is-invalid'}`} />
											</div>
											<div className={`col ${(errors.ownerLastName && touched.ownerLastName && 'text-danger')}`}>
												<Translate id="Owner Last Name"/> *
												<Field name="ownerLastName" showError={false} className={`form-control ${errors.ownerLastName && touched.ownerLastName && 'is-invalid'}`} />
											</div>
										</div>
										<div className="form-row mt-2 mb-4">
											<div className={`col ${(errors.ownerPhoneNumber && touched.ownerPhoneNumber && 'text-danger')}`}>
												<div className="row m-0 p-0">
													<div className="col m-0 p-0">
														<Translate id="Phone Number"/> *
														<PhoneInput
															country="us"
															disableCountryCode={true}
															disableDropdown={true}
															onlyCountries={["us"]}
															placeholder={""}
															value={ownerPhoneNumber}
															onChange={ownerPhoneNumber => handlePhoneChange(ownerPhoneNumber)} />
														{errors.ownerPhoneNumber && touched.ownerPhoneNumber && <span className="text-danger">{errors.ownerPhoneNumber}</span>}
														{/* <Field name="ownerPhoneNumber" showError={false} className={`form-control ${errors.ownerPhoneNumber && touched.ownerPhoneNumber && 'is-invalid'}`} /> */}
													</div>
													<div className="col m-0 p-0">
														<div><Translate id="Address" /></div>
														<div><button type="button" className={`btn ${(showOwnerAddress === false && 'btn-success') || 'btn-default'} btn-addon float-left`} onClick={() => setState({showOwnerAddress: !showOwnerAddress})}>{showOwnerAddress === false && <React.Fragment><FontAwesomeIcon icon="plus" className="mr-2" /><Translate id="Add" /></React.Fragment>}{showOwnerAddress === true && <Translate id="Cancel" />}</button></div>
													</div>
												</div>
												{/* <div className="float-right">
												</div>
												<div className="float-left" style={{maxWidth: 100+'px'}}>
												</div> */}
											</div>
											<div className="col">
												<div className="row m-0 p-0">
													<div className={`col m-0 p-0 mr-3 ${(errors.ownerEmail && touched.ownerEmail && 'text-danger')}`}>
														<Translate id="Email"/> *
														<Field name="ownerEmail" showError={false} className={`form-control ${errors.ownerEmail && touched.ownerEmail && 'is-invalid'}`} />
													</div>
													<div className="col-auto m-0 p-0">
														<div><Translate id="No Email" />?</div>
														<div><button type="button" className="btn btn-default btn-addon float-left" onClick={() => {values.ownerEmail = 'No Email'}}><FontAwesomeIcon icon="times" className="mr-2" /><Translate id="Skip" /></button></div>
													</div>
												</div>
											</div>
										</div>
										{
											showOwnerAddress === true &&
											<div className="mb-3 mt-n-1 pt-3 pb-4 border-top border-bottom">
												<div className="form-row">
													<div className="col">
														<Translate id="Address Line 1" /> *
														<Field name="ownerAddress1" className={`form-control`} />
													</div>
													<div className="col">
														<Translate id="Address Line 2" />
														<Field name="ownerAddress2" className={`form-control`} />
													</div>
												</div>
												<div className="form-row mt-1">
													<div className="col">
														<Translate id="City"/> *
														<Field name="ownerCity" className={`form-control`} />
													</div>
													<div className="col-md-auto">
														<Translate id="State"/> *
														<Field component="select" name="ownerStateId" className={`form-control`}>
															<option>{props.translate("Select State")}</option>
															{Countries.map((country) => (
																<optgroup key={country.countryId} label={props.translate(country.country)}>
																	{country.States.map((state) => (<option value={state.stateId} key={state.stateId}>{props.translate(state.state)}</option>))}
																</optgroup>
															))}
														</Field>
													</div>
													<div className="col">
														<Translate id="Postal Code"/> *
														<Field name="ownerPostalCode" className={`form-control form-control-num`} />
													</div>
												</div>
											</div>
										}
										<div className="form-row">
											<div className={`col-6 ${(errors.petFirstName && touched.petFirstName && 'text-danger')}`}>
												<Translate id="Pet First Name"/> *
												<Field name="petFirstName" showError={false} className={`form-control ${errors.petFirstName && touched.petFirstName && 'is-invalid'}`} />
											</div>
											<div className="col-6">
												<div className="form-row">
													<div className={`col-6 ${(errors.weight && touched.weight && 'text-danger')}`}>
														<Translate id="Weight"/> *
														<Field name="weight" showError={false} className={`form-control ${errors.weight && touched.weight && 'is-invalid'}`} />
													</div>
													<div className="col-3 mb-3 pr-1 pl-1">
														<label className="w-100 mb-0" htmlFor="weightUnits_lbs">
															<div className={` w-100 btn ${(values.weightUnits === 'lbs' && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																<p className="text-center h6 mt-1 m-0">lbs</p>
																<p className="text-center m-0">
																	<Field name="weightUnits" id="weightUnits_lbs" checked={values.weightUnits === 'lbs'} component="input" type="radio" value="lbs" className="m-0" />
																</p>
															</div>
														</label>
													</div>
													<div className="col-3 mb-3 pr-1 pl-1">
														<label className="w-100 mb-0" htmlFor="weightUnits_kg">
															<div className={` w-100 btn ${(values.weightUnits === 'kg' && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																<p className="text-center h6 mt-1 m-0">kg</p>
																<p className="text-center m-0">
																	<Field name="weightUnits" id="weightUnits_kg" checked={values.weightUnits === 'kg'} component="input" type="radio" value="kg" className="m-0" />
																</p>
															</div>
														</label>
													</div>
												</div>
											</div>

											<div className={`col ${(errors.petColor && touched.petColor && 'text-danger')}`}>
												<Translate id="Pet Color"/> *
												<Field name="petColor" showError={false} className={`form-control ${errors.petColor && touched.petColor && 'is-invalid'}`} />
											</div>
											<div className={`col ${(errors.petBreed && touched.petBreed && 'text-danger')}`}>
												<Translate id="Pet Breed"/> *
												<Field name="petBreed" showError={false} className={`form-control ${errors.petBreed && touched.petBreed && 'is-invalid'}`} />
											</div>
										</div>
										<div className="form-row mt-4">
											<div className="col">
												<div className="form-row">
													{Species.map((species) => {
															return (
																<div key={`species-${species.speciesId}`} className="col-md mb-3 pr-1 pl-1">
																	<label className="w-100 mb-0" htmlFor={`speciesId_${species.speciesId}`}>
																		<div className={` w-100 btn ${(values.speciesId === species.speciesId && 'btn-outline-info') || (errors.speciesId && touched.speciesId && 'btn-outline-danger') || 'btn-outline-secondary'}`}>
																			<p className="text-center h6 mt-1 m-0">{species.species}</p>
																			<p className="text-center m-0">
																				<Field name="speciesId" id={`speciesId_${species.speciesId}`} checked={parseInt(species.speciesId) === parseInt(values.speciesId)} component="input" type="radio" value={species.speciesId} className="m-0" />
																			</p>
																		</div>
																	</label>
																</div>
															)
														}
													)}
												</div>
											</div>
										</div>
										<div className="form-row">
											<div className="col-4 mb-3 pr-1 pl-1">
												<label className="w-100 mb-0" htmlFor="sex_male">
													<div className={` w-100 btn ${(values.sex === 'Male' && 'btn-outline-info') || (errors.sex && touched.sex && 'btn-outline-danger') || 'btn-outline-secondary'}`}>
														<p className="text-cente mt-1 m-0">Male</p>
														<p className="text-center m-0">
															<Field name="sex" id="sex_male" checked={values.sex === 'Male'} component="input" type="radio" value="Male" className="m-0" />
														</p>
													</div>
												</label>
											</div>
											<div className="col-4 mb-3 pr-1 pl-1">
												<label className="w-100 mb-0" htmlFor="sex_female">
													<div className={` w-100 btn ${(values.sex === 'Female' && 'btn-outline-info') || (errors.sex && touched.sex && 'btn-outline-danger') || 'btn-outline-secondary'}`}>
														<p className="text-center mt-1 m-0">Female</p>
														<p className="text-center m-0">
															<Field name="sex" id="sex_female" checked={values.sex === 'Female'} component="input" type="radio" value="Female" className="m-0" />
														</p>
													</div>
												</label>
											</div>
											<div className="col-4 mb-3 pr-1 pl-1">
												<label className="w-100 mb-0" htmlFor="sex_unspecified">
													<div className={` w-100 btn ${(values.sex === 'Unspecified' && 'btn-outline-info') || (errors.sex && touched.sex && 'btn-outline-danger') || 'btn-outline-secondary'}`}>
														<p className="text-center mt-1 m-0">Unspecified</p>
														<p className="text-center m-0">
															<Field name="sex" id="sex_unspecified" checked={values.sex === 'Unspecified'} component="input" type="radio" value="Unspecified" className="m-0" />
														</p>
													</div>
												</label>
											</div>
										</div>
										<div className="form-row">
											<div className="col-8">
												<Translate id="Special Instructions"/><br />
												<Field name="orderComment" component="textarea" style={{height: 66+'px'}} showError={false} className={`form-control ${errors.orderComment && touched.orderComment && 'is-invalid'}`} />
											</div>
											<div className="col-4">
												{/* <input name="staffEmployeePet" id="staffEmployeePet" type="checkbox" value="1" checked={values.staffEmployeePet === true || values.staffEmployeePet === 1} onChange={() => handleValueChange('staffEmployeePet')} /> */}
												<div className="row">
													<div className="col-12 text-center"><Translate id="Staff Member's Pet" /></div>
													<div className="col-6">
														<label className="w-100 mb-0" htmlFor="staffEmployeePet-yes">
															<div className={` w-100 btn ${(parseInt(values.staffEmployeePet) === 1 && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																<p className="text-center mt-1 m-0">Yes</p>
																<p className="text-center m-0">
																	<Field name="staffEmployeePet" id="staffEmployeePet-yes" checked={parseInt(values.staffEmployeePet) === 1} component="input" type="radio" value="1" className="m-0" />
																</p>
															</div>
														</label>
													</div>
													<div className="col-6">
														<label className="w-100 mb-0" htmlFor="staffEmployeePet-no">
															<div className={` w-100 btn ${(parseInt(values.staffEmployeePet) === 0 && 'btn-outline-info') || 'btn-outline-secondary'}`}>
																<p className="text-center mt-1 m-0">No</p>
																<p className="text-center m-0">
																	<Field name="staffEmployeePet" id="staffEmployeePet-no" checked={parseInt(values.staffEmployeePet) === 0} component="input" type="radio" value="0" className="m-0" />
																</p>
															</div>
														</label>	
													</div>												
												</div>
											</div>
										</div>
									</div>
								</div>
							}
					</div>
				

				<div className="">
					{
						values.newOrderType === 'cremation' && 
						<div className="row mt-4 mb-5 justify-content-center">
							{/* <div className="col-auto mb-2">
								<div className="card">
									<div className="card-header">
										<Translate id="Mark Cremation Complete Print Tag" />
									</div>
									<div className="card-body pt-2 pb-2 text-center">
										<label className="mb-0 pr-5" htmlFor="memorializationCheckedOut-yes">
											<div className={` w-100 btn ${(parseInt(values.memorializationCheckedOut) === 1 && 'btn-outline-info') || 'btn-outline-secondary'} ${(parseInt(values.selectedUrnProductId) === -1 || values.memorialization === 'home') && 'disabled'}`}>
												<p className="text-center mt-1 m-0">Yes</p>
												<p className="text-center m-0">
													<Field name="memorializationCheckedOut" id="memorializationCheckedOut-yes" disabled={parseInt(values.selectedUrnProductId) === -1 || values.memorialization === 'home'} checked={parseInt(values.memorializationCheckedOut) === 1} component="input" type="radio" value={1} className="m-0" />
												</p>
											</div>
										</label>
										<label className="mb-0 pl-5" htmlFor="memorializationCheckedOut-no">
											<div className={` w-100 btn ${(parseInt(values.memorializationCheckedOut) === 0 && 'btn-outline-info') || 'btn-outline-secondary'}`}>
												<p className="text-center mt-1 m-0">No</p>
												<p className="text-center m-0">
													<Field name="memorializationCheckedOut" id="memorializationCheckedOut-no" checked={parseInt(values.memorializationCheckedOut) === 0} component="input" type="radio" value={0} className="m-0" />
												</p>
											</div>
										</label>
									</div>
								</div>
							</div> */}
							{/* {_.isEmpty(errors) === false && isSubmitting === true &&
								<div className="col-auto"><div className="alert alert-danger">There are errors in the form</div></div>
							} */}
							{petOwnerInformationViewed === true &&
							<div className="col-12 text-center pr-2">
								<button type="submit" onClick={() => handleSubmit(OrderCremationSave)} className="btn btn-lg text-white rounded" style={{backgroundColor: '#ec8333'}} disabled={isSubmitting || (parseInt(userTypeId) === 5 && parseInt(Company.requireInitialsEditOrderDetails) === 1 && values.creatorInitials === '')}>
									<FontAwesomeIcon icon="paw" className="mr-2" /> <Translate id={isSubmitting ? "SAVING..." : "Create Memorialization Service"}/>
								</button>
							</div>}
						</div>
					}
				</div>{/* End tag for the Row containing cremation/memorialization info and pet owner info containers */}

				<div className="row">
					<div className="col-md mr-2">
						<PickupLocationForm
							CompanyAddresses={CompanyAddresses}
							handleLocationSelect={handleLocationSelect}
							initialValues={{ pickupAddressId: values.pickupAddressId }}
						/>

						<DepartmentForm
							CompanyDepartments={Company.CompanyDepartments}
							handleLocationSelect={handleLocationSelect}
							initialValues={{ companyDepartmentId: values.companyDepartmentId }}
						/>
					</div>
				</div>
				{/* <div className="row">
					<div className="col-md pr-2">
						<div className="card border-secondary mt-3">
							<div className="card-header text-secondary border-secondary">
								<h5 className="m-0"><Translate id="Comments" /></h5>
							</div>
							<div className="card-body">
								<Field name="orderComment" component="textarea" showError={false} className={`form-control ${errors.orderComment && touched.orderComment && 'is-invalid'}`} />
							</div>
						</div>
					</div>
				</div> */}

				{
					values.newOrderType !== 'cremation' && 
					<div className="mt-3">
						{
							Response && Response.success === false &&
							<div className={`alert ${responseAlertClass}`}>{props.translate(Response.message)}</div>
						}
						<div className="row float-left">
							<div className="col-auto">
								<button type="submit" onClick={() => handleSubmit({showOwnerAddress})} className="btn btn-success" disabled={isSubmitting || (parseInt(userTypeId) === 5 && parseInt(Company.requireInitialsEditOrderDetails) === 1 && values.creatorInitials === '')}>
									<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
								</button>
							</div>
							{
								parseInt(userTypeId) === 5 && parseInt(Company.requireInitialsEditOrderDetails) === 1 &&
								<div className="col-auto">
									<Field name="creatorInitials" placeholder="Initials *" showError={false} className='form-control is-valid' />
								</div>
							}
						</div>
						<div className="float-right">
							<Link to={`/new_orders`} className="btn btn-default btn-addon float-right"><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/> </Link>
						</div>
					</div>
				}
			</React.Fragment>
			}

		</div>
	);
};

const DepartmentForm = compose (
	withFormik({
		handleSubmit: async ( input ) => {}
			// Set the deliveryMethodName to save into the orders db
	}),
	withTranslate
)(DepartmentFormContent);

const PickupLocationForm = compose (
	withFormik({
		handleSubmit: async ( input ) => {}
			// Set the deliveryMethodName to save into the orders db
	}),
	withTranslate
)(PickupLocationFormContent);

const OrderCremationForm = compose (
	queryWithLoading({ gqlString: getAddressTypes, name: "addressTypes"}),
	withMutation(AddressSaveMutation, "AddressSave"),
	withMutation(OrderCremationSaveMutation, "OrderCremationSave", ["getOrders"]),
	withMutation(PetReferenceNumberGenerateMutation, "PetReferenceNumberGenerate"),
	withFormik({
		handleSubmit: async ( input, { props: { AddressSave, CompanyAddresses, CompanyOptions, DeliveryProducts, handleFormReload, OrderCremationSave, OrderStatuses, PetReferenceNumberGenerate, Products, setResponse, }} ) => {
			// If there is only 1 company address, we can set defaults for Delivery Address and the method. Only do this for Cremation Orders though.
			if(CompanyAddresses.CompanyAddresses.length === 1 && input.newOrderType === 'cremation') {
				const CremationProduct = Products.find((product) => product.productId === input.productId);
				// If this is getting created from a Vet's Office:
				if(parseInt(CompanyOptions.Company.companyTypeId) === 3) {
					// And it is a Private or Individual Cremation, we can default the deliveryAddressId to their single address, and add the delivery product for 'Hospital Delivery'.
					if((CremationProduct.productName === 'Individual Cremation' || CremationProduct.productName === 'Private Cremation')) {
						input.deliveryAddressId = parseInt(CompanyAddresses.CompanyAddresses[0].addressId);
						const DeliveryProduct = DeliveryProducts.find((product) => product.productName === 'Hospital Delivery');
						// Check that there is a Hospital Delivery product available, otherwise set to 0.
						input.deliveryMethodProductId = DeliveryProduct.productId > 0 ? DeliveryProduct.productId : 0;
						input.deliveryMethodName = input.deliveryMethodProductId > 0 ? 'Hospital Delivery' : '';
						// NOTE: In the orderCremationSave mutation, we check for a deliveryMethodProductId and then add that productId into the ordersProducts table with the newly created orderId, so do not worry about that here.
					}
					// If it is a Communal Cremation with No Memorialization selected, then set delivery as 'No Delivery'
					else if(CremationProduct.productName === 'Communal Cremation' && input.memorialization === 'none') {
						input.deliveryAddressId = 0;
						const DeliveryProduct = DeliveryProducts.find((product) => product.productName === 'No Delivery');
						// Check that there is a No Delivery product available, otherwise set to 0.
						input.deliveryMethodProductId = DeliveryProduct.productId > 0 ? DeliveryProduct.productId : 0;
						input.deliveryMethodName = input.deliveryMethodProductId > 0 ? 'No Delivery' : '';
					}
					// If it is a Communal Cremation w/Memorialization, do not set the Delivery Address or method yet. - so do nothing for this screnatio.

				} else if(parseInt(CompanyOptions.Company.companyTypeId) === 2) {
					// For Crematory created orders, pickup should be No Pickup and the delivery method should be Pickup At Crematory.
					input.deliveryAddressId = 0;
					input.pickupAddressId = 0;
					const DeliveryProduct = DeliveryProducts.find((product) => product.productName === 'Pickup at Crematory');
					// Check that there is a Pickup at Crematory Delivery product available, otherwise set to 0.
					input.deliveryMethodProductId = DeliveryProduct.productId > 0 ? DeliveryProduct.productId : 0;
					input.deliveryMethodName = input.deliveryMethodProductId > 0 ? 'Pickup at Crematory' : '';
				}
			}

			// The orderStatusId is automatically set to "Awaiting pickup from hospital" in the constructor. If this is a crematory initiated order, or a Vet Supply or a Product Only order, then set the status to "Preparing Order"
			if(input.newOrderType === 'products') {
				input.orderStatusId = OrderStatuses.find((status) => status.orderStatus === 'Preparing Order').orderStatusId;
			}
			// if((parseInt(CompanyOptions.Company.companyTypeId) === 2 && OrderStatuses.length > 0) && input.newOrderType !== 'products') {
			// 	input.orderStatusId = OrderStatuses.find((status) => status.orderStatus === 'Waiting for Pet').orderStatusId;
			// }

			// Set the deliveryMethodName to save into the orders db
			//input.deliveryMethodName = input.deliveryMethodProductId > 0 ? DeliveryProducts.find((product) => product.productId === input.deliveryMethodProductId).productName : '';
			// Clean up any old data that was saved into the databases previous which is now outdated because the delivery method has changed.
			// IMPORTant: This same functionality is in the Products Memorialization component for Delivery save (products_memorialization_component.js, in the async function handleProceedToCheckoutClick() of the DeliveryFormContent), so if you add things here, change them there also.
			if(input.deliveryMethodName !== 'Courier Delivery' && input.deliveryMethodName !== 'Hospital Delivery') {
				// Current options are Hand or No Delivery, so there is not going to be a deliveryAddressId, so set it to 0
				input.deliveryAddressId = 0;
				// LATER - we will want to delete the address if it is a 'Home' type because we have no use for a customer's address in the database if we are not delivering to their home.
			}

			// If the account setting for petReferenceNumberAutoGenerate = 1, then we need to automatically get one right here
			// For product only orders we hide the cremation service / referenceNumber generator, so get a reference number here
			if(input.newOrderType === 'products' || parseInt(input.petReferenceNumberAutoGenerate) === 1) {
				const { data: { petReferenceNumberGenerate }} = await PetReferenceNumberGenerate({ input: { numberToGenerate: 1} });
				input.petReferenceNumber = petReferenceNumberGenerate.PetReferenceNumbers[0].petReferenceNumber;
			}
			if(input.newOrderType === 'products') {
				input.memorialization = 'clinic'; // product only orders will only be for vets to do
			}

			if (input.companyDepartmentId === '') {
				input.companyDepartmentId = null;
			}

			if(parseInt(input.selectedFurClippingProductId) === -1) { 
				input.selectedFurClippingProductId = 0;
			} else if(input.selectedFurClippingProductId !== 0) { 
				input.selectedFurClippingProductId = parseInt(input.selectedFurClippingProductId) 
			};
			if(parseInt(input.selectedPawPrintProductId) === -1) { 
				input.selectedPawPrintProductId = 0;
			} else if(input.selectedPawPrintProductId !== 0) { 
				input.selectedPawPrintProductId = parseInt(input.selectedPawPrintProductId) 
			};
			if(parseInt(input.selectedUrnProductId) === -1) { 
				input.selectedUrnProductId = 0;
			} else if(input.selectedUrnProductId !== 0) { 
				input.selectedUrnProductId = parseInt(input.selectedUrnProductId) 
			};

			input.memorializationCheckedOut = parseInt(input.memorializationCheckedOut);
			input.orderStatusId = input.orderStatusId === null ? 1 : input.orderStatusId;
			input.staffEmployeePet = parseInt(input.staffEmployeePet);

			// Pet Owner Address Entered via the "+Add Address" button. AddressTypeId 3 is 'Home'
			input.ownerAddressId = 0;
			if(input.ownerAddress1 !== '' && input.ownerCity !== '') {
				let ownerNameAddress = `${input.ownerFirstName} ${input.ownerLastName}`;
				const addressSave  = await AddressSave({ input: {address1: input.ownerAddress1, address2: input.ownerAddress2, addressTypeId: 3, city: input.ownerCity, ownerName: ownerNameAddress, postalCode: input.ownerPostalCode, stateId: input.ownerStateId }});
				if(parseInt(addressSave.data.AddressSave.addressId) > 0) input.ownerAddressId = parseInt(addressSave.data.AddressSave.addressId)
			}
			// Async/Await Perform the mutation (to the server) and decompose the result.
			const { data: { orderCremationSave }} = await OrderCremationSave({ input: _.omit(input, "CompanyAddresses", "orderServiceStatus", "orderStatus", "OrderComments", "ownerAddress1", "ownerAddress2", "ownerCity", "ownerPostalCode", "ownerStateId", "petReferenceNumberAutoGenerate", "previousProductId")});
			if(orderCremationSave.Response.success === false) {
				handleFormReload(orderCremationSave.OrderCremation);
			} 
			window.scrollTo(0, 0);
			setResponse({...orderCremationSave.Response, jobId: orderCremationSave.jobId, orderId: orderCremationSave.OrderCremation.orderId, OrderCremation: orderCremationSave.OrderCremation});
		},
		validate: (values) => {
			let errors = {};
			// If value is blank, create error struct key with message, else delete the struct key
			if(values.ownerEmail === '') { errors.ownerEmail = 'Enter an owner email'; } else { delete errors.ownerEmail; };
			if(values.ownerFirstName === '') { errors.ownerFirstName = 'Enter an owner first name'; } else { delete errors.ownerFirstName; };
			if(values.ownerLastName === '') { errors.ownerLastName = 'Enter an owner last name'; } else { delete errors.ownerLastName; };
			if(values.ownerPhoneNumber === '' || values.ownerPhoneNumber.length !== 10) { errors.ownerPhoneNumber = 'Enter a 10 digit owner phone number'; } else { delete errors.ownerPhoneNumber; };
			if(values.petBreed === '') { errors.petBreed = 'Enter a pet breed'; } else { delete errors.petBreed; };
			if(values.petColor === '') { errors.petColor = 'Enter a pet color'; } else { delete errors.petColor; };
			if(values.petFirstName === '') { errors.petFirstName = 'Enter a pet first name'; } else { delete errors.petFirstName; };
			//if(values.petLastName === '') { errors.petLastName = 'Enter a pet last name'; } else { delete errors.petLastName; };
			if(values.newOrderType === 'cremation') {
				if(values.petReferenceNumber === '' && parseInt(values.petReferenceNumberAutoGenerate) === 0) { errors.petReferenceNumber = 'Enter a reference number'; } else { delete errors.petReferenceNumber; };
				if(values.productId === 0) { errors.productId = 'Please select a cremation service'; } else { delete errors.productId; };
				if(values.memorialization === '') { errors.memorialization = 'Please choose a Memorialization Option'; } else { delete errors.memorialization; };
				if(values.sex === '') { errors.sex = 'Choose a sex'; } else { delete errors.sex; };
				
			}
			if(values.speciesId === '') { errors.speciesId = 'Select a species'; } else { delete errors.speciesId; };
			if(values.weight === '' || isNaN(parseFloat(values.weight)) || !isFinite(values.weight)) { errors.weight = 'Enter the numeric weight'; } else { delete errors.weight; };
			return errors
		}
	}),
	withState({
		initialLoad: true,
		NavClasses: {
			activeClass: 'Memorialization',
			Memorialization: 'btn-secondary',
			PetOwner: 'btn-secondary',
		},
		ownerPhoneNumber: '',
		petOwnerInformationViewed: false,
		showOwnerAddress: false
	}),
	withTranslate
)(OrderCremationFormContent);

class OrderCremationClass extends React.Component {
	constructor(props) {
    	super(props)
		const { OrderServiceStatuses, OrderStatuses } = props.data;
		const { Company } = props.Company;

		// If there are OrderServiceStatuses, get the Id of the 'Pending' status to passed in as initialValues. We want the order to have that status.
		let orderServiceStatusId = 0;
		if(OrderServiceStatuses.length > 0) {
			let OrderServiceStatus = OrderServiceStatuses.find((status) => status.orderServiceStatus === 'Pending');
			orderServiceStatusId = OrderServiceStatus.orderServiceStatusId;
		}

		let orderStatusId = 1;
		if(OrderStatuses.length > 0) {
			// if((parseInt(props.Session.User.userTypeId) === 2 || parseInt(props.Session.User.userTypeId) === 3))
			if(parseInt(Company.companyTypeId) === 3) {
				let OrderStatus = OrderStatuses.find((status) => status.orderStatus === 'Awaiting pickup from hospital');
				orderStatusId = OrderStatus.orderStatusId;
			} else {
				let OrderStatus = OrderStatuses.find((status) => status.orderStatus === 'At Crematory');
				orderStatusId = OrderStatus.orderStatusId;
			}

		}

		// If there is a 'defaultUnits' on the company, then use that for the weightUnits, otherwise use the accountSetting for measurementSystem
		let weightUnits = '';
		if(Company && Company.defaultUnits !== null && Company.defaultUnits !== '') {
			weightUnits = Company.defaultUnits === 'Metric' ? 'kg' :'lbs';
		} else {
			weightUnits = props.Account.Settings.find((setting) => setting.name === 'measurementSystem').value === ' English' ? 'lbs' : 'kg';
		}

		this.state= {
			companyDepartmentId: null,
			creatorInitials: '',
			deliveryAddressId: 0,
			deliveryMethodProductId: 0,
			expeditedCremation: false,
			memorialization: Company && parseInt(Company.allowHomeMemorialization) === 0 ? 'clinic' : '',
			memorializationCheckedOut: 0,
			newOrderType: props.match.params.newOrderType ? props.match.params.newOrderType : '',
			orderComment: '',
			orderId: 0,
			orderServiceStatusId: orderServiceStatusId,
			orderStatusId: orderStatusId,
			ownerAddress1: '',
			ownerAddress2: '',
			ownerCity: '',
			ownerEmail: '',
			ownerFirstName: '',
			ownerLastName: '',
			ownerPhoneNumber: '',
			ownerPostalCode: '',
			ownerStateId: props.CompanyAddresses.CompanyAddresses.length > 0 ? parseInt(props.CompanyAddresses.CompanyAddresses[0].stateId) : 0,
			petBreed: '',
			petColor: '',
			petFirstName: '',
			petLastName: '',
			petReferenceNumber: '',
			petReferenceNumberAutoGenerate: parseInt(Company.petReferenceNumberAutoGenerate),
			pickupAddressId: props.CompanyAddresses.CompanyAddresses.length === 1 ? parseInt(props.CompanyAddresses.CompanyAddresses[0].addressId) : 0, // If there is only a single companyAddress, then automatically set the pickupAddressId and we will not show the form for picking it.
			productId: 0,
			selectedFurClippingProductId: -1,
			selectedPawPrintProductId: 0,
			selectedUrnProductId: 0,
			sex: '',
			speciesId: '',
			staffEmployeePet: 0,
			weight: '',
			weightUnits: weightUnits
		}
	}

	handleFormReload = (values) => {
		this.setState({
			companyDepartmentId: values.companyDepartmentId,
			creatorInitials: values.creatorInitials,
			deliveryAddressId: values.deliveryAddressId,
			deliveryMethodProductId: values.deliveryMethodProductId,
			expeditedCremation: values.expeditedCremation,
			memorialization: values.memorialization,
			memorializationCheckedOut: values.memorializationCheckedOut,
			orderComment: values.orderComment,
			orderId: values.orderId,
			orderServiceStatusId: values.orderServiceStatusId,
			orderStatusId: values.orderStatusId,
			ownerEmail: values.ownerEmail,
			ownerFirstName: values.ownerFirstName,
			ownerLastName: values.ownerLastName,
			ownerPhoneNumber: values.ownerPhoneNumber,
			petBreed: values.petBreed,
			petColor: values.petColor,
			petFirstName: values.petFirstName,
			petLastName: values.petLastName,
			petReferenceNumber: values.petReferenceNumber,
			pickupAddressId: values.pickupAddressId,
			productId: values.productId,
			selectedFurClippingProductId: values.selectedFurClippingProductId,
			selectedPawPrintProductId: values.selectedPawPrintProductId,
			selectedUrnProductId: values.selectedUrnProductId,
			sex: values.sex,
			speciesId: values.speciesId,
			staffEmployeePet: values.staffEmployeePet,
			weight: values.weight,
			weightUnits: values.weightUnits
		})
	};

	render () {
		const { CremationProducts, DeliveryProducts, OrderServiceStatuses, OrderStatuses, Species } = this.props.data;
		const { Company, CompanyAddresses, CremationPromtions: {ProductCompanyPromotionsCremations}, PromotionProducts: {ProductCompanyPromotionsProducts}, Session: { User: { userId, userTypeId } } } = this.props;
		
		// Filter the CremationsPromotions (all of the promotions for this company) down to just the promtions for the selected Cremation Product
		//let TempCremationProductPromotions = ProductCompanyPromotionsCremations.filter((product) => parseInt(product.productId) === parseInt(values.productId));

		// // Create array of PromotionsProducts that will be shown for each Cremation product option
		// let TempPromotionsProducts = [];

		// if(ProductCompanyPromotionsCremations.length > 0) {
		// 	// Sort these by category for each of use in the next step
		// 	let SortedPromotions = ProductCompanyPromotionsCremations.sort(function(a,b) { return parseInt(b.productCategoryId) - parseInt(a.productCategoryId)})
		// 	let tempCategory = '';
		// 	SortedPromotions.forEach((promotion) => {
		// 		// If this next array of the SortedPromotions is for a new category, create the next TempPromotionsProducts array
		// 		if(tempCategory !== promotion.productCategory) {
		// 			tempCategory = promotion.productCategory;
		// 			// Get the product for promotion
		// 			let TempProduct = ProductCompanyPromotionsProducts.find((product) => parseInt(product.productCompanyPromotionId) === parseInt(promotion.productCompanyPromotionId));
		// 			let TempPromotionProducts = [];
		// 			TempPromotionProducts.push(TempProduct)
		// 			// Create the new category object for the promotion - there will be an object for each category of products that are promotional, and that object will have an array of the products available for the category's promotion
		// 			let TempPromotionCategory = { promotionCategory: tempCategory, PromotionProducts: TempPromotionProducts};
		// 			TempPromotionsProducts.push(TempPromotionCategory);
		// 			// If this is the first time through the array setting, and the values.selectedXXXProductId = 0, set it as a default
		// 			// if(tempCategory === 'Paw Prints' && parseInt(values.selectedPawPrintProductId) === 0) {
		// 			// 	values.selectedPawPrintProductId = TempProduct.promotionalProductId;
		// 			// } else if(tempCategory === 'Urns' && parseInt(values.selectedUrnProductId) === 0) {
		// 			// 	values.selectedUrnProductId = TempProduct.promotionalProductId;
		// 			// }
		// 		} else {
		// 			// If this is a promotion product that is in an exisiting category already in the promotional products top level array, just push the product's object to the category's products
		// 			let TempProduct = ProductCompanyPromotionsProducts.find((product) => parseInt(product.productCompanyPromotionId) === parseInt(promotion.productCompanyPromotionId));
		// 			TempPromotionsProducts.find((category) => category.promotionCategory === promotion.productCategory).PromotionProducts.push(TempProduct);
		// 		}
		// 	})
		// }

		return (
			<React.Fragment>
				<OrderCremationForm
					CompanyAddresses={CompanyAddresses}
					CompanyOptions={Company}
					CremationPromotions={ProductCompanyPromotionsCremations}
					DeliveryProducts={DeliveryProducts}
					handleFormReload={this.handleFormReload}
					initialValues={this.state}
					OrderServiceStatuses={OrderServiceStatuses}
					OrderStatuses={OrderStatuses}
					Products={CremationProducts}
					ProductsPromotions={ProductCompanyPromotionsProducts}
					Species={Species}
					userId={userId}
					userTypeId={userTypeId}
				/>
			</React.Fragment>
		)
	}
}

export const OrderCremation = compose(
	withRouter,
	queryWithLoading({
		gqlString: getCompanyAddressesQuery,
		variablesFunction: (props) => ({companyId: props.Session && props.Session.User ? props.Session.User.companyId : 0}),
		name: "CompanyAddresses"
	}),
	queryWithLoading({
		gqlString: getCompanyOptionsQuery,
		variablesFunction: (props) => ({companyId: props.Session && props.Session.User ? props.Session.User.companyId : 0}),
		name: "Company"
	}),
	queryWithLoading({
		gqlString: getProductCompanyPromotionsCremationsQuery,
		variablesFunction: (props) => ({companyId: props.Session && props.Session.User ? props.Session.User.companyId : 0}),
		name: "CremationPromtions"
	}),
	queryWithLoading({
		gqlString: getProductCompanyPromotionsProductsQuery,
		name: "PromotionProducts"
	}),
	queryWithLoading({
		gqlString: getCremationOrderQuery,
		requiredPermission: { permission: "orders", permissionLevel: 3},
		options: {
			fetchPolicy: 'network-only'
		}
	}),
	withTranslate
)(OrderCremationClass)
