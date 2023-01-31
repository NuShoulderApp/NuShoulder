import _ from "lodash";
import { compose } from "react-apollo";
import Countdown from 'react-countdown-now';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';	// IMPORTANT: Add any icons you want to use to the index.js import { ... } from '@fortawesome/free-solid-svg-icons' AND library.add(...)
import Math from 'mathjs';
import moment from 'moment';
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import React from 'react';
// import TimeAgo from 'react-timeago';
import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import { withState } from "react-state-hoc";
import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { DeliveryComponent } from '../deliveries/delivery_component';
import { GeneratePrintButton, PrintButton } from '../orders/pdf_print_button_component';
import { MemorializationStatus } from '../orders/memorialization_status_component';
import { Payment } from '../payments/payment_component';
import { Phone } from '../phones/phone_component';
import { ProductThumbnail } from './product_images';
import { ProductImageThumbnail } from './product_images/product_thumbnails';

// GRAPHQL QUERY
import {
	getAddressQuery,
	getAddressTypes,
	AddressSaveMutation
} from '../addresses/address_graphql';

import {
	getCompanyAddressesQuery
} from '../companies/companies_graphql';

import {
	LogOrderActivitySaveMutation
} from '../log_order_activities/log_order_activities_graphql';

import {
	getProductAttributesQuery,
	getProductGroupsMemorializations,
	getProductsMemorializationQuery,
	getProductsMemorializationPromotionsQuery,
	getProductSpeciesQuery,
	ProductViewSaveMutation
} from './products_graphql';

import {
	getDeletedCremationProductQuery,
	getOrderProductsQuery,
	OrderCremationSaveMutation,
	OrderProductConfirmEngraving,
	OrderProductDeleteMutation,
	OrderProductProductOptionSaveMutation,
	OrderProductRemoveMutation,
	OrderProductSaveMutation,
	OrderProductsPaidMutation,
	OrderProductUndeleteMutation,
	OrderSaveMutation
} from '../orders/orders_graphql';
//import { parse } from "graphql";

///////////////////////////////////// BEGIN FORM CONTENT ///////////////////////////////////////////////////////////////////////

const EngravingFormContent = (props) => {
	const {
		divClass,
		ErrorsPersonalization,
		handleAddEngraving,
		initialLoad,
		NewDropdownGroups,
		orderProductId,
		OrderProductProductOptionSave,
		OrderProductSave,
		Product, // This is the product array from ProductsMemorialization
		ProductAttributes: { ProductAttributes },
		ProductAttributesDropdown,
		ProductAttributesText,
		productId,
		ProductOptionIds,
		ProductOptions,
		ProductOptionsFromParent,
		setState,
		ValidationStruct
	} = props;

	if(initialLoad === true) {
		// START PERSONALIZATION SETTINGS
			// IMPORTANT IMPORTANT IMPORTANT !!!!!!!!!!!!!!!!!!! THIS SAME FUNCTIONALITY IS USED IN THE PRODUCT DETAIL'S "ADD ENGRAVING" FUNCTIONALIY. MAKE DUPLICATE CHANGES. SEARCH: FJAJLADSMFALAS
			// Break Product Attributes into groups of Downdown and Text
			let TempProductAttributesDropdown = ProductAttributes.filter((attribute) => attribute.typeName === 'Dropdown');
			let TempProductAttributesText = ProductAttributes.filter((attribute) => attribute.typeName === 'Text');			
			let TempProductOptionIds = [];  // list of the product option Ids that will help use parse the dynamically created variables for the productOptionValueId-
			let TempProductOptions = {}; // This replaces the 'values' object that is used otherwise withFormik()
			let TempNewDropdownGroups = [];
			let TempValidationStruct = { greaterThanZero: [], notBlank: [] }; // This validation struct will contain the product options that have isRequired flagged in the productAttributes table.

			// Break Dropdown option types into groups based on the productOptionId
			// Notes on how the input naming and parsing works are in the handleSubmit function of withFormik below
			if(TempProductAttributesDropdown.length > 0) {
				TempProductAttributesDropdown.forEach((attribute) => {
					// Check if this productOptionId already has an index within the newDropdownGroups array
					const newDropdownGroupsIndex = TempNewDropdownGroups.findIndex((group) => group.productOptionId === attribute.productOptionId);
					if(newDropdownGroupsIndex > -1) {
						// Add this attribute to the existing array index
						TempNewDropdownGroups[newDropdownGroupsIndex].attributes.push(attribute);
						// Mark as required if this option is required, but the group is not yet required.
						if(TempNewDropdownGroups[newDropdownGroupsIndex].productOptionRequired === false && attribute.productOptionRequired === true) TempNewDropdownGroups[newDropdownGroupsIndex].productOptionRequired = true;
					}
					else {
						// Create a new array item for this productOptionId
						TempNewDropdownGroups.push({optionName: attribute.optionName, productOptionId: attribute.productOptionId, productOptionRequired: attribute.productOptionRequired, attributes: [attribute]});

						// Add productOptionId to the list
						TempProductOptionIds.push(attribute.productOptionId);

						// Add this input into the valiationStruct for greaterThanZero if the productOption is required
						if(attribute.productOptionRequired === 1 || attribute.productOptionRequired === true) {
							TempValidationStruct.greaterThanZero.push(`productOptionValueId-${attribute.productOptionId}`);
						}
					}

					// Create this new variable and place into values object so that we can validate it if needed - if we do not do this, and the user never clicks on the select input, the variable does not get placed into the values object and we cannot do validation.
					if(TempProductOptions[`productOptionValueId-${attribute.productOptionId}`] === undefined) {
						TempProductOptions[`productOptionValueId-${attribute.productOptionId}`] = 0;
					}
				})
			}
			if(TempProductAttributesText.length > 0) {
				TempProductAttributesText.forEach((attribute) => {
					// Add productOptionId to the list
					TempProductOptionIds.push(attribute.productOptionId);

					// Add this input into the valiationStruct for greaterThanZero if the productOption is required
					if(attribute.productOptionRequired === 1 || attribute.productOptionRequired === true) {
						TempValidationStruct.notBlank.push(`productOptionId-${attribute.productOptionId}`);
					}
					// Create this new variable and place into values object so that we can validate it if needed - if we do not do this, and the user never clicks on the select input, the variable does not get placed into the values object and we cannot do validation.
					if(TempProductOptions[`productOptionId-${attribute.productOptionId}`] === undefined) {
						TempProductOptions[`productOptionId-${attribute.productOptionId}`] = '';
					}
				})
			}
		// END PERSONALIZATION SETTINGS
		setState({ 
			initialLoad: false, 
			NewDropdownGroups: TempNewDropdownGroups,
			ProductAttributesDropdown: TempProductAttributesDropdown,
			ProductAttributesText: TempProductAttributesText,
			ProductOptionIds: TempProductOptionIds,
			ProductOptions: TempProductOptions,
			ValidationStruct: TempValidationStruct
		});
	}

    function handleGenericSetState(name, value='', parentObject='') {
        if(parentObject !== '') {
            setState({
                ProductOptions: {
					...ProductOptions,
                    [name]: value
                }
            })
        } else {
            setState({
                [name]: value
            })
        }
    }

	async function TempOrderProductProductOptionSave(input) {
		return await OrderProductProductOptionSave({ input: {...input} })
	}

	// Function for saving the engraving for this product
	async function handleSaveEngraving() {
		// Perform validation if there is any for the personalized inputs
		let TempErrorsPersonalization = ErrorsPersonalization;

		// Valid dropdown inputs that need to have an option selected
		if(ValidationStruct.greaterThanZero.length > 0) {
			ValidationStruct.greaterThanZero.forEach((variableNametoValidate) => {
				if(parseInt(ProductOptions[variableNametoValidate]) === 0 || ProductOptions[variableNametoValidate] === undefined) {
					TempErrorsPersonalization[variableNametoValidate] = 'Please select an option';
				} else {
					delete TempErrorsPersonalization[variableNametoValidate];
				}
			})
		}

		// Valid text inputs that need to have a string entered
		if(ValidationStruct.notBlank.length > 0) {
			ValidationStruct.notBlank.forEach((variableNametoValidate) => {
				if(ProductOptions[variableNametoValidate] === '' || ProductOptions[variableNametoValidate] === undefined) {
					TempErrorsPersonalization[variableNametoValidate] = 'Please complete this field';
				} else {
					delete TempErrorsPersonalization[variableNametoValidate];
				}
			})
		}

		if(_.isEmpty(TempErrorsPersonalization) === true) {
			// Create object to save to OrderProduct. First two lines are checking for the 3rd engraving line, which adds $10
			let tempInvoiceCostChargedPersonalization = ProductOptions['productOptionId-10'] && ProductOptions['productOptionId-10'] !== '' ? Math.add(Product[0].calculatedInvoiceCostPersonalization, 10).toString() : Product[0].calculatedInvoiceCostPersonalization;
			let tempPriceChargedPersonalization = ProductOptions['productOptionId-10'] && ProductOptions['productOptionId-10'] !== '' ? Math.add(Product[0].calculatedPriceRetailPersonalization, 10).toString() : Product[0].calculatedPriceRetailPersonalization;
			let tempInput = {
				invoiceCostChargedPersonalization: tempInvoiceCostChargedPersonalization,
				orderProductId: parseInt(orderProductId),
				personalizeProduct: true,
				priceChargedPersonalization: tempPriceChargedPersonalization,
				returnProductOptions: true
			}
			// Below is the same functionality as used for regularly adding engraving via the product details
			let productOptionText = '';
			let productOptionIdItem = 0;
			let productOptionValueId = 0;

			// Use FOR loop to go through the ProductOptions so we can use await
			let i;
			for(i = 0; i < ProductOptionIds.length; i++) {
				// Set array item for ease of use below
				productOptionIdItem = parseInt(ProductOptionIds[i]);
				productOptionText = ProductOptions[`productOptionId-${productOptionIdItem}`];
				productOptionValueId = ProductOptions[`productOptionValueId-${productOptionIdItem}`];
				if(parseInt(productOptionValueId) > 0) {
					// This is the functionality for saving dropdown options
					const ProductAttribute = ProductAttributes.find((attribute) => parseInt(attribute.productOptionId) === productOptionIdItem && attribute.productOptionValueId === productOptionValueId);
					// This function attempts to address the productOptions not getting loaded back into the Order object after saving, which for personalization needs to be there in the basket for confirm engraving
					await TempOrderProductProductOptionSave({
						orderProductId: parseInt(orderProductId),
						productOptionId: productOptionIdItem,
						productOptionValueId,
						optionName: ProductAttribute.optionName,
						textString: '',
						valueLabel: ProductAttribute.valueLabel
					})

					
				} else if(productOptionText) {
					// productOptionText will be undefined if this is not a text input
					// This is the functionality for saving text options
					const ProductAttribute = ProductAttributes.find((attribute) => parseInt(attribute.productOptionId) === parseInt(productOptionIdItem) && attribute.valueLabel === "TEXT");
					// This function attempts to address the productOptions not getting loaded back into the Order object after saving, which for personalization needs to be there in the basket for confirm engraving
					await TempOrderProductProductOptionSave({
						orderProductId: parseInt(orderProductId),
						productOptionId: productOptionIdItem,
						productOptionValueId: ProductAttribute.productOptionValueId,
						optionName: ProductAttribute.optionName,
						textString: productOptionText,
						valueLabel: ProductAttribute.valueLabel
					})
				}
			}
			
			const { data: { orderProductSave }} = await OrderProductSave({ input: tempInput });
			let TempOrderProductProductOptions = orderProductSave.OrderProductProductOptions;
			let TempProductOptionsFromParent = [...ProductOptionsFromParent]; // Spread Parent so it doesn't just update the parent too
			// Loop through the results from the save, and push them to the Parent objects
			TempOrderProductProductOptions.forEach((option) => TempProductOptionsFromParent.push(option))
			// Close the Add Engraving form
			handleAddEngraving(0, TempProductOptionsFromParent, parseInt(orderProductSave.OrderProduct.orderProductId), tempInput);	
		} else {
			// Set Perzonalization Errors in state
			setState({ ErrorsPersonalization: TempErrorsPersonalization })
		}
	}

	return (
		<div>
			{NewDropdownGroups.map((group) => {
				const inputName = `productOptionValueId-${group.productOptionId}`
				const errorsClass = ErrorsPersonalization[inputName];
				return (
					<div className={`mt-2 ${divClass}`} key={group.productOptionId}>
						<div className={`${errorsClass && 'text-danger'}`}>{group.optionName}{(group.productOptionRequired === true && '*') || ''}</div>
						<span className="btn-group p-0" role="group">
							{group.attributes.map((groupAttribute, index) => {
								// Check if ProductOptions has a value for this option/attribute yet, if so, does it match this one?
								let buttonSelected = ProductOptions.hasOwnProperty(inputName) && parseInt(ProductOptions[inputName]) === parseInt(groupAttribute.productOptionValueId) ? true : false;
								return (
									<button key={index} type="button" style={{boxShadow: 'none'}} 
										className={`btn btn-sm ${(errorsClass && 'border-danger') || 'border-secondary'} ${(buttonSelected === true && 'btn-secondary') || 'btn-light text-secondary'} ${index === 0 && 'rounded-left'} ${index === group.attributes.length-1 && 'rounded-right'}`}
										onClick={() => handleGenericSetState(`productOptionValueId-${group.productOptionId}`, groupAttribute.productOptionValueId, 'ProductOptions')}
									>{groupAttribute.valueLabel}</button>
								)
							})}
						</span>
					</div>
				)
			})}
			{ProductAttributesText.map((attribute) => {
				const inputName = `productOptionId-${attribute.productOptionId}`
				const errorsClass = ErrorsPersonalization[inputName];

				return (
					<div className={`mt-2 ${divClass} ${errorsClass && 'text-danger'} row`} key={attribute.productOptionId}>
						{/* <span className="col-auto text-secondary">{attribute.optionName}</span> */}
						<span className="col-auto">
							<Field showError={true} placeholder={attribute.optionName} 
								name={`productOptionId-${attribute.productOptionId}`} 
								className={`form-control ${errorsClass && 'is-invalid'}`}
								onChange={(event) => handleGenericSetState(`productOptionId-${attribute.productOptionId}`, event.target.value, 'ProductOptions')} />
						</span>
					</div>
				)
			})}
			<div className="mt-2">
				<button type="button" className="btn btn-sm btn-success btn-addon" onClick={() => handleSaveEngraving()}><FontAwesomeIcon icon="check"></FontAwesomeIcon><Translate id="Save" /></button>
				<button type="button" className="btn btn-sm btn-default btn-addon ml-3" onClick={() => handleAddEngraving(0)}><FontAwesomeIcon icon="times"></FontAwesomeIcon><Translate id="Cancel" /></button>
			</div>
		</div>
	)
}

const EngravingForm = compose (
	queryWithLoading({
		gqlString: getProductAttributesQuery,
		variablesFunction: (props) => ({productId: props.productId}),
		name: "ProductAttributes"
	}),
	withMutation(OrderProductProductOptionSaveMutation, "OrderProductProductOptionSave", ["getOrderProducts"]),
	withMutation(OrderProductSaveMutation, "OrderProductSave", ["getOrderProducts"]),
	withFormik(),
	withState({
		ErrorsPersonalization: {},
		initialLoad: true,
		NewDropdownGroups: [],
		ProductAttributesDropdown: [],
		ProductAttributesText: [],
		ProductOptionIds: [],
		ProductOptions: {},
		ValidationStruct: {}
	}),
	withTranslate
)(EngravingFormContent);


// This is the container for the Basket / Order Review
const BasketFormContent = (props) => {
	const {
		addEngravingOrderProductId, // when > 0, this triggers a new const container that hits the server for productOptions
		continueButtonClass,
		Counts,
		disableContinuteButton,
		editSelectedOrderProductProductOptionId,
		engravingAlertClass,
		engravingConfirmationNeeded,
		engravingConfirmed,
		engravingFavicon,
		handleProductView,
		handleRemoveItemClick,
		handleView,
		initialLoad,
		Order,
		OrderProductConfirmEngraving,
		OrderProductProductOptionSave,
		OrderProductRemove,
		OrderProducts: {
			Order: {
				ProductOptions: ReloadedProductOptions
			}
		},
		ProductOptions,
		ProductsMemorialization: { ProductsMemorialization },
		ProductsOrder,
		responseMessage,
		selectedProductOption,
		selectedProductOptionSaved,
		setState,
		state:{
			headerStatus,
			removeItemConfirming,
			view:{
				current:category
			},
			viewDefaults
		}
	} = props;
	console.log('Basket props: ', props)
	// On initial load, set the state variable for Order.ProductsOrder so that we can update the list for confirming engraving live
	if(initialLoad === true) {
		// Filter the Order.ProductsOrder array so that we can display the Cremation Product first, and the Delivery Product last.
		const CremationProduct = Order.ProductsOrder.filter((product) => product.productCategory === 'Cremations');
		const DeliveryProduct = Order.ProductsOrder.filter((product) => product.productCategory === 'Delivery');
		let TempProductsOrder = Order.ProductsOrder.filter((product) => parseInt(product.personalizeProduct) === 0 && product.productCategory !== 'Cremations' && product.productCategory !== 'Delivery');
		let OtherProductsWithPersonalization = Order.ProductsOrder.filter((product) => parseInt(product.personalizeProduct) === 1 && product.productCategory !== 'Cremations' && product.productCategory !== 'Delivery');
		// Flag for showing a warning message that they must confirm the Engraving before being able to checkout
		let  tempEngravingConfirmed = engravingConfirmed;
		let  tempEngravingConfirmationNeeded = engravingConfirmationNeeded;
		// Splice the Products with personalization to the top of the products array, and sort by if they have been confirmed or not
		if(OtherProductsWithPersonalization.length > 0) {
			// Sort first by if the personalization has been confirmed yet
			OtherProductsWithPersonalization.sort(function(a,b) { return parseInt(b.personalizationConfirmed) - parseInt(a.personalizationConfirmed)}).forEach((product) => {
				if(product.personalizationConfirmed === 0) {
					tempEngravingConfirmed = false;
					tempEngravingConfirmationNeeded = true;
				}
				TempProductsOrder.splice(0,0,product);
			})
		}
		// Splice the Cremation product to the front of the array, then use the TempProductsOrder for display
		if(CremationProduct.length > 0) {
			// It will be 0 for product only orders
			TempProductsOrder.splice(TempProductsOrder.length,0,CremationProduct[0]);
		}
		if(DeliveryProduct.length > 0) {
			TempProductsOrder.splice(TempProductsOrder.length, 0, DeliveryProduct[0]);
		}

		// Check to see if there are items in the basket which require that it be paired with another item. PP Stand w/ PP, Keepsake stand w/Keepsake, Jewelry chain w/pendant
		let tempCounts = {};
		tempCounts.hasChainCount = 0;
		tempCounts.hasPendantCount = 0;
		tempCounts.hasKeepsakeCount = 0;
		tempCounts.hasKeepsakeStandCount = 0;
		tempCounts.hasPawPrintCount = 0;
		tempCounts.hasPawPrintStandCount = 0;
		Order.ProductsOrder.forEach((product) => {
			// Mark each of the has stand or chain counters first, that way even though they have the parent or product category that would mark their corresponding item counter, it will hit their if condition first.
			if(product.productName === 'Paw Print Stand') {
				tempCounts.hasPawPrintStandCount = Math.add(tempCounts.hasPawPrintStandCount, 1);
			} else if(product.productName === 'Keepsake Stand') {
				tempCounts.hasKeepsakeStandCount = Math.add(tempCounts.hasKeepsakeStandCount, 1);
			} else if(product.productName === '20" Snake Chain (SS)' || product.productName === '20" Snake Chain (GV)') {
				tempCounts.hasChainCount = Math.add(tempCounts.hasChainCount, 1);
			} else if((product.parentCategory === 'Paw Prints' || product.productCategory === 'Paw Prints') && product.productName !== 'Fur Clipping') {
				tempCounts.hasPawPrintCount = Math.add(tempCounts.hasPawPrintCount, 1);
			} else if((product.parentCategory === 'Keepsakes' || product.productCategory === 'Keepsakes') && product.productName !== 'Tribute LCD' && product.canUseKeepsakeStand === 1) {
				tempCounts.hasKeepsakeCount = Math.add(tempCounts.hasKeepsakeCount, 1);
			} else if(product.parentCategory === 'Jewelry' || product.productCategory === 'Jewelry') {
				tempCounts.hasPendantCount = Math.add(tempCounts.hasPendantCount, 1);
			}
		})

		// Determine if there are any missing product counterparts needed
		let tempDisableContinuteButton = (tempCounts.hasPawPrintStandCount > tempCounts.hasPawPrintCount || tempCounts.hasKeepsakeStandCount > tempCounts.hasKeepsakeCount || tempCounts.hasChainCount > tempCounts.hasPendantCount) ? true : false;
		tempDisableContinuteButton = tempEngravingConfirmationNeeded === true && tempEngravingConfirmed === false ? true : tempDisableContinuteButton;
		let tempContinueButtonClass = tempDisableContinuteButton === true ? 'btn btn-addon text-secondary' : continueButtonClass;
		setState({ 
			continueButtonClass: tempContinueButtonClass, 
			Counts: tempCounts, 
			disableContinuteButton: tempDisableContinuteButton, 
			engravingConfirmationNeeded: tempEngravingConfirmationNeeded, 
			engravingConfirmed: tempEngravingConfirmed, 
			initialLoad: false, 
			ProductOptions: ReloadedProductOptions, 
			ProductsOrder: TempProductsOrder
		})
	}

	// Function for removing a product from the Order. Called via click of the "Confirm Remove" button
	async function removeOrderProduct(orderObject) {
		// Async/Await Perform the mutation (to the server) and decompose the result.
		const { data: { orderProductRemove }} = await OrderProductRemove({ input: orderObject });
		let TempProductsOrder = ProductsOrder;
		// If the product was successfully deleted from the order, then update the array of products in state by filtering out the orderProductId index
		if(orderProductRemove.Response.success === true) {
			TempProductsOrder = ProductsOrder.filter((product) => parseInt(product.orderProductId) !== parseInt(orderObject.orderProductId));
		}
		setState({ ProductsOrder: TempProductsOrder, responseMessage: orderProductRemove.Response.message })
	}

	// Function to confirm the engraving for the passed in orderProductId. Update mutation for ordersProducts table for the 'personalizationConfirmed' column, then update the ProductsOrder object.
	async function clickConfirmEngraving(orderProductId, personalizationConfirmed) {
		//const { data: { orderProductConfirmEngraving }} = 
		await OrderProductConfirmEngraving({ input: { orderProductId, personalizationConfirmed }});

		// Get the ProductsOrder index for this orderProductId so we can update its object as confirmed, and update the basket list of products
		let tempIndex = ProductsOrder.findIndex((product) => parseInt(product.orderProductId) === parseInt(orderProductId));
		let TempProductsOrder = ProductsOrder;
		TempProductsOrder[tempIndex].personalizationConfirmed = personalizationConfirmed;

		// Check to see if there are any other Products that need their personalization confirmed
		let tempStillNeedsConfirmation = TempProductsOrder.filter((product) => parseInt(product.personalizationConfirmed) === 0 && parseInt(product.personalizeProduct) === 1);
		let tempEngravingConfirmed = tempStillNeedsConfirmation.length > 0 ? false : true;
		let tempContinueButtonClass = tempEngravingConfirmed === true ? 'btn btn-addon btn-success' : 'btn btn-addon btn-default';
		let tempDisableContinuteButton = tempEngravingConfirmed === true ? false : true;
		setState({ continueButtonClass: tempContinueButtonClass, disableContinuteButton: tempDisableContinuteButton, editSelectedOrderProductProductOptionId: 0, engravingConfirmed: tempEngravingConfirmed, ProductsOrder: TempProductsOrder, responseMessage: '' });
	}

	// Function to handle inline edit of engraving details
	function clickEditEngraving(orderProductProductOptionId) {
		// Check if there was already a product option being edited, and if it has not been saved yet, go ahead and save any changes.
		if(parseInt(editSelectedOrderProductProductOptionId) > 0) {
			if(ProductOptions.find((option) => parseInt(option.orderProductProductOptionId) === parseInt(editSelectedOrderProductProductOptionId)).textString !== selectedProductOption) {
				if(!selectedProductOptionSaved) {
					// Save the productOption change - call save mutation
					handleProductOptionSave(false);
				}
			}
		}

		let tempProductOption = ProductOptions.find((option) => parseInt(option.orderProductProductOptionId) === parseInt(orderProductProductOptionId)).textString;
		setState({
			editSelectedOrderProductProductOptionId: orderProductProductOptionId,
			selectedProductOption: tempProductOption,
			selectedProductOptionSaved: false
		})
	}

	// Function to Add Engraving to a product that allows it, but does not have it. This variable triggers the load of another container that hits the server for the product options of the product
	function handleAddEngraving(orderProductId, NewProductOptions=[], newOrderProductId, NewOrderProductObject) {
		if(NewProductOptions.length > 0) {
			// Get the ProductsOrder object for the orderProductId that was just updated via the EngravingForm. Spread it, and set the personalization charges
			let TempProductsOrder = ProductsOrder;
			TempProductsOrder = TempProductsOrder.map((product) => {
				if(parseInt(product.orderProductId) === parseInt(newOrderProductId)) {
					return {...product, personalizeProduct: 1, priceChargedPersonalization: NewOrderProductObject.priceChargedPersonalization}
				} else { return product }
			})
			setState({ addEngravingOrderProductId: orderProductId, ProductOptions: NewProductOptions, ProductsOrder: TempProductsOrder})
		} else {
			setState({ 
				addEngravingOrderProductId: orderProductId 
			}, () => {
				handleRemoveItemClick(0); // To be safe, close the "Remove Item" content in case they accidentally clicked to remove to item, but meant to click to add engraving
			})
		}
	}

	// Function to save the ProductOption change - "value" passed in will be 'true' if this is called by clicking the save button, or 'false' if called by clicking a different product option's edit
	function handleProductOptionSave(value) {
		// Save the productOption change - call save mutation
		OrderProductProductOptionSave({ input: {
			orderProductProductOptionId: editSelectedOrderProductProductOptionId,
			textString: selectedProductOption
		}})

		// Get the ProductOptions index for this orderProductProductOptionId so we can update its object within the Order, and update the basket list of products
		let tempIndex = ProductOptions.findIndex((option) => parseInt(option.orderProductProductOptionId) === parseInt(editSelectedOrderProductProductOptionId));
		let TempProductOptions = ProductOptions;
		TempProductOptions[tempIndex].textString = selectedProductOption;

		setState({
			ProductOptions: TempProductOptions,
			selectedProductOptionSaved: value
		})
	}

	// Function for handling the change of the product option being edited
	function handleProductOptionChange(value) {
		setState({
			selectedProductOption: value,
			selectedProductOptionSaved: false
		})
	}

	// Function for clicking the Continue button. This handles if the button is disabled for which reason and what the response should be accordingly
	function clickContinueButton() {
		// If the button is disabled, and the engravingConfirmation alert is present, then update the class on the alert to highlight the div for better noticability. Otherwise do normal continue button functionality
		if(disableContinuteButton === true && engravingConfirmationNeeded === true && engravingConfirmed === false) {
			setState({ engravingAlertClass: 'alert alert-danger border border-danger text-center', engravingFavicon: 'exclamation', responseMessage: ''});
		} else if(disableContinuteButton === false) {
			handleView(viewDefaults[category].next)
		}
	}

	// Remove the decimal zeros if the price is $85.00, then show $85.
	function removeZeroCents(price, productId) {
		if(price !== null) {
			let tempPrice = price;
			tempPrice = tempPrice.substring(tempPrice.length-2, tempPrice.length) === '00' ? tempPrice.substring(0, tempPrice.length-3) : tempPrice;
			return tempPrice;
		}
	}

	// IF YOU UNCOMMENT THE taxRate VARIABLE, THEN ADD THIS (Account: { Settings },) TO THE PROP CONST AT TOP
	// let taxRate = Settings.find((setting) => setting.name === 'taxRate').value;
	// If taxRate is a string because it was obtained from the account setting for taxRate, then make it a float before passing to the db
	// taxRate = typeof taxRate === 'string' && taxRate !== '' && taxRate !== null ? parseFloat(taxRate) : taxRate;

	//let taxRateLabel = Settings.find((setting) => setting.name === 'taxRateLabel').value;
	// define calculation variables
	let subtotal = 0;
	let subSubtotal = 0;
	let deliveryCost = 0;
	let taxTotal = 0;

	const basketProceedButtonText = viewDefaults.Basket.next === 'Checkout' ? 'Checkout' : 'Delivery';

	let width = window.innerWidth;
	let mediumWidth = 768;

	let isCommunal = Order.ProductsOrder.findIndex((product) => product.productName === 'Communal Cremation') > -1 ? true : false;
	let hasPawPrint = Order.ProductsOrder.findIndex((product) => product.productCategory === 'Paw Prints') > -1 ? true : false;
	let isPrivate = Order.ProductsOrder.findIndex((product) => product.productName === 'Private Cremation') > -1 ? true : false;
	let hasUrn = Order.ProductsOrder.findIndex((product) => (product.productCategory === 'Urns' || product.parentCategory === 'Urns') && product.statusRemainsFilledIndicator === 1) > -1 ? true : false; // Verify that there is an Urn on the Private order.

	return (
		<div className="w-100">
			<div className="row mt-2">
				{
					Order.orderTypeId === 1 &&
					<div className="col-12 mb-2">
						<h3>
							<Translate id="Review Order" />
							<button type="button" className="btn btn-sm btn-addon btn-success mr-3" onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Previous" /></button>
							<button type="button" className="btn btn-sm btn-addon btn-success" onClick={() => handleView(viewDefaults[category].next)} disabled={disableContinuteButton}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id={basketProceedButtonText} /></button>
						</h3>
					</div>
				}
				{Order.orderTypeId !== 1 &&
					<React.Fragment>
						<div className="col-12 text-center">
							<h3 className="mb-1"><Translate id="Review Memorialization Title" /></h3>
							<img src={process.env.PUBLIC_URL + "/images/ui/in-loving-memory-of-bottom.png"} className="pb-3 pt-1" alt="" style={{maxWidth: 200 + 'px'}} />
						</div>
						{/* <div className="col-12 text-center mb-2">
							<button type="button" className="btn btn-addon btn-success mr-3" onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Previous" /></button>
							<button type="button" className={continueButtonClass} onClick={() => clickContinueButton()}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id={basketProceedButtonText} /></button>
						</div> */}
					</React.Fragment>
				}
			</div>
			{ responseMessage !== '' && 
				<div className="row justify-content-center"><div className="col-auto text-centered"><div className="alert alert-success">{responseMessage}</div></div></div> 
			}
			{ isPrivate === true && hasUrn === false && <div className="alert alert-info text-center h5">{`It looks like you do not have an Urn with ${Order.petFirstName}'s Memorialization. Private Cremation requires an Urn for ${Order.petFirstName}'s Memorialization to be completed.`}<div className="w-100"></div>
					<button type="button" className="mt-2 btn btn-default rounded" onClick={() => handleView('Urns')}>Go To Urns</button></div>}
			{ isCommunal === true && hasPawPrint === false && <div className="alert alert-info text-center h5">{`It looks like you do not have a Paw Print with ${Order.petFirstName}'s Memorialization. We will not be able to make a Paw Print Memorial after cremation has taken place. Would you like to view the Paw Print options again?`}<div className="w-100"></div>
					<button type="button" className="mt-2 btn btn-default rounded" onClick={() => handleView('PawPrints')}><FontAwesomeIcon icon="paw" className="mr-2" />  Go To Paw Prints</button></div>}
			{/* Make them confirm the engraving for personalization*/}
			{engravingConfirmed === false &&
					<div className={engravingAlertClass}>
						To ensure that we correctly engrave your beloved pet's urn, we ask that you please confirm your engraving spelling below for each urn before proceeding to the Checkout.
					</div>
			}
			{engravingConfirmed === true && engravingConfirmationNeeded === true &&
					<div className="alert alert-success text-center">
						Your engraving spelling is all confirmed, please proceed to the {basketProceedButtonText}.
					</div>
			}
			{/* Show any warning messages related to missing product counterparts */}
			{Counts.hasPawPrintStandCount > Counts.hasPawPrintCount &&
				<div className="row">
					<div className="col-12">
						<div className="alert alert-danger">
							<Translate id="Need Paw Print Warning" /> <Translate id="Currently" />: {Counts.hasPawPrintStandCount} {Counts.hasPawPrintStandCount === 1 && <Translate id="Paw Print Stand" />}{Counts.hasPawPrintStandCount > 1 && <Translate id="Paw Print Stands" />} and {Counts.hasPawPrintCount} {Counts.hasPawPrintCount === 1 && <Translate id="Paw Print" />}{Counts.hasPawPrintCount !== 1 && <Translate id="Paw Prints" />}
						</div>
					</div>
				</div>
			}
			{Counts.hasKeepsakeStandCount > Counts.hasKeepsakeCount &&
				<div className="row">
					<div className="col-12">
						<div className="alert alert-danger">
							<Translate id="Need Keepsake Warning" /> <Translate id="Currently" />: {Counts.hasKeepsakeStandCount} {Counts.hasKeepsakeStandCount === 1 && <Translate id="Keepsake Stand" />}{Counts.hasKeepsakeStandCount > 1 && <Translate id="Keepsake Stands" />} and {Counts.hasKeepsakeCount} {Counts.hasKeepsakeCount === 1 && <Translate id="Keepsake" />}{Counts.hasKeepsakeCount !== 1 && <Translate id="Keepsakes" />}
						</div>
					</div>
				</div>
			}
			{Counts.hasChainCount > Counts.hasPendantCount &&
				<div className="row">
					<div className="col-12">
						<div className="alert alert-danger">
							<Translate id="Need Pendant Warning" /> <Translate id="Currently" />: {Counts.hasChainCount} {Counts.hasChainCount === 1 && <Translate id="Pendant Chain" />}{Counts.hasChainCount > 1 && <Translate id="Pendant Chains" />} and {Counts.hasPendantCount} {Counts.hasPendantCount === 1 && <Translate id="Pendant" />}{Counts.hasPendantCount !== 1 && <Translate id="Pendants" />}
						</div>
					</div>
				</div>
			}

			{/* TABLE FOR LARGER SCREENS */}
			{width >= mediumWidth &&
				<table className="table border-bottom">
					<tbody>
						{ProductsOrder.map((product) => {
							// Need to get the product object from the full ProductsMemorialization array matching this productId since it contains the image data.
							let productImage = {};
							if(parseInt(product.productTypeId) === 2) {
								// Cremation products are now split into two separate sections, so we need to differentiate between the Cremations and Special Services tab products
								productImage = props.ProductsMemorialization.CremationProducts.find((cremationProduct) => parseInt(cremationProduct.productId) === parseInt(product.productId));
							} else {
								productImage = props.ProductsMemorialization.ProductsMemorialization.find((productMemorialization) => parseInt(productMemorialization.productId) === parseInt(product.productId));
							}

							// Set Product Name to Account Product Name if it is defined, otherwise who the product name as set by us.
							let productName = (product.accountProductName !== null && product.accountProductName !== "") ? product.accountProductName : product.productName
							// Create array of attribute objects if there are personalization attributes on this item
							let TempProductOptions = ProductOptions.filter((options) => parseInt(options.orderProductId) === parseInt(product.orderProductId));
							// Set product's priceCharged and add priceChargedPersonalization
							const priceChargedTotal = product.priceChargedPersonalization === null ? product.priceCharged : Math.add(product.priceChargedPersonalization,product.priceCharged).toFixed(2);
							// Determine output for product cost breakdown
							let tempCategory = '';
							if(product.productCategory === 'Urns') {
								tempCategory = 'Urn';
							}
							let tempPriceCharged = removeZeroCents(product.priceCharged);
							let tempPriceChargedPersonalization = product.priceChargedPersonalization !== null && product.personalizeProduct === 1 ? removeZeroCents(product.priceChargedPersonalization) : null;
							
							// If this is an At Home Memorialization, only total up the items that need to be paid for by the pet owner
							if(Order.memorialization === 'home') {
								if(parseInt(product.invoiceVet) === 0 && parseInt(product.paymentCompletedPetOwner) === 0) {
									// update cost calculation variables
									// update the subtotal of product costs, excluding delivery products
									if(product.productCategory !== 'Delivery') subtotal = Math.add(subtotal,priceChargedTotal);
									if(product.productCategory === 'Delivery') deliveryCost = Math.add(deliveryCost,priceChargedTotal);
									subSubtotal = Math.add(subtotal, deliveryCost);
									// Update the total tax that is charged on this order
									if(product.taxCharged) {
										taxTotal = Math.add(taxTotal, product.taxCharged).toFixed(2);
									}
								}
							} else {
								// update cost calculation variables
								// update the subtotal of product costs, excluding delivery products
								if(product.productCategory !== 'Delivery') subtotal = Math.add(subtotal,priceChargedTotal);
								if(product.productCategory === 'Delivery') deliveryCost = Math.add(deliveryCost,priceChargedTotal);
								subSubtotal = Math.add(subtotal, deliveryCost);
								// Update the total tax that is charged on this order
								if(product.taxCharged) {
									taxTotal = Math.add(taxTotal, product.taxCharged).toFixed(2);
								}
							}
							// For each product, if it is an engraving, do not let them click "Confirm Engraving" if they currently editing an option line
							let allowConfirmEngraving = true;

							return (
								<tr key={product.orderProductId}>
									<td>
										{ product.productCategory !== 'Delivery' && <ProductThumbnail product={productImage} size="small" speciesid={Order.speciesId} />}
										{/* { product.productCategory === 'Delivery' && <React.Fragment>
											<span className="text-info h1">
												{ product.productName === "Pickup at Crematory" && <FontAwesomeIcon icon="walking" className="mr-3" /> }
												{ product.productName === "Hospital Delivery" && <FontAwesomeIcon icon="ambulance" className="mr-3" /> }
												{ product.productName === "Courier Delivery" && <FontAwesomeIcon icon="truck-moving" className="mr-3" /> }

												{ product.productName !== "No Delivery" && <FontAwesomeIcon icon="arrow-right" className="mr-3" />}

												{ product.productName === "Pickup at Crematory" && <FontAwesomeIcon icon="warehouse" /> }
												{ product.productName === "Hospital Delivery" && <FontAwesomeIcon icon="hospital" /> }
												{ product.productName === "Courier Delivery" && <FontAwesomeIcon icon="home" /> }

												{ product.productName === "No Delivery" && <FontAwesomeIcon icon="ban" />}
											</span>
										</React.Fragment>} */}
									</td>
									<td>
										<h5>{productName}</h5>
										<div>{product.descriptionShort}</div>
										{/* Show Engraving details if there are options selected for this product */}
										{TempProductOptions.length > 0 &&
											<div>
												{/* <h6 className="">Engraving: ${removeZeroCents(product.priceChargedPersonalization, product.productId)}</h6> */}
												{TempProductOptions.map((option) => {
													const optionDetail = option.valueLabel === 'TEXT' ? option.textString : option.valueLabel;
													if(parseInt(editSelectedOrderProductProductOptionId) === parseInt(option.orderProductProductOptionId)) {
														allowConfirmEngraving = false; 
														return (
															<div key={option.orderProductProductOptionId} className="clearfix form-inline mb-1 mt-1">
																<span className="text-muted float-left">{option.optionName}:</span> 
																{/* Show the dropdown for non-text options */}
																{
																	option.valueLabel === 'TEXT' &&
																	<input type="text" name="selectedProductOption" value={selectedProductOption} onChange={(event) => handleProductOptionChange(event.target.value)} className="form-control float-left ml-2" style={{width: 150 + 'px'}}/>
																}
																{/* {
																	option.valueLabel !== 'TEXT' &&
																	<input type="text" name="selectedProductOption" value={selectedProductOption} onChange={(event) => handleProductOptionChange(event.target.value)} className="form-control float-left ml-2" style={{width: 150 + 'px'}}/>
																} */}
																<button type="button" className={`btn float-left ml-1 ${(selectedProductOptionSaved && 'btn-success') || 'btn-outline-success'}`} onClick={() => handleProductOptionSave(true)}>
																	{selectedProductOptionSaved && 'Saved'}{!selectedProductOptionSaved && 'Save'}
																</button>
															</div>
														)
													} else if(option.valueLabel === 'TEXT') {
														return (
															<div key={option.orderProductProductOptionId}>
																<span className="text-muted">{option.optionName.replace(' (+$10)', '')}:</span> {optionDetail} {parseInt(product.personalizationConfirmed) === 0 && <FontAwesomeIcon icon="pen" color="green" onClick={() => clickEditEngraving(option.orderProductProductOptionId)}/>}
															</div>
														)
													}
												})}
												{
													(parseInt(product.personalizationConfirmed) === 0 &&
													<div className="mt-1">
														<button type="button" className="btn btn-success btn-sm btn-addon" disabled={!allowConfirmEngraving && !selectedProductOptionSaved} onClick={() => clickConfirmEngraving(product.orderProductId, 1)}><FontAwesomeIcon icon={engravingFavicon} /> Confirm Engraving</button>
														{/* <button type="button" className="btn btn-default btn-sm btn-addon ml-2" onClick={() => clickEditEngraving(product.orderProductId)}><FontAwesomeIcon icon="pen" /> Edit Engraving</button> */}
													</div>) ||
													<div className="mt-1">
														<button type="button" className="btn btn-success btn-sm btn-addon" disabled><FontAwesomeIcon icon="check" /> Confirmed</button>
														<button type="button" className="btn btn-default btn-sm btn-addon ml-2" onClick={() => clickConfirmEngraving(product.orderProductId, 0)}><FontAwesomeIcon icon="undo" />Unconfirm</button>
													</div>
												}
											</div>
										}
										{/* If this product can be engraved, but has not been, show the option to do so */}
										{TempProductOptions.length === 0 && product.personalizationAllowed === 1 && parseInt(addEngravingOrderProductId) !== parseInt(product.orderProductId) &&
											<button type="button" className="btn btn-sm btn-success btn-addon" onClick={() => handleAddEngraving(parseInt(product.orderProductId))}><FontAwesomeIcon icon="plus" />Add Engraving</button>}
										{/* When addEngravingOrderProductId is this productId, then trigger the open of another container and hit the server to get the productOptions for the productId */}
										{parseInt(addEngravingOrderProductId) === parseInt(product.orderProductId) && <EngravingForm divClass="" handleAddEngraving={(orderProductId, NewProductOptions, newOrderProductId, NewOrderProductObject) => handleAddEngraving(orderProductId, NewProductOptions, newOrderProductId, NewOrderProductObject)} orderProductId={product.orderProductId} Product={ProductsMemorialization.filter((engravingProduct) => parseInt(engravingProduct.productId) === parseInt(product.productId))} productId={product.productId} ProductOptionsFromParent={ProductOptions} />}
									</td>
									<td>
										<React.Fragment>
											{(
												tempPriceChargedPersonalization !== null &&
												product.productName !== 'Adhesive Metal Plate' &&
												<React.Fragment>
													<div className="clearfix"><span className="float-left">{tempCategory}</span><span className="float-right">${tempPriceCharged}</span></div>
													<div className="clearfix"><span className="float-left">Engraving</span><span className="float-right">${tempPriceChargedPersonalization}</span></div>
													<div className="border-top border-secondary clearfix"><span className="float-left">Total</span><span className="float-right">${removeZeroCents(priceChargedTotal)}</span></div>
												</React.Fragment>
												) ||
												<div className="text-right">${removeZeroCents(priceChargedTotal)}</div>
											}
											{ product.invoiceVet === 1 && <div className="text-right">(<Translate id="Prepaid At Vet" />)</div> }
											{ product.invoiceVet === 0 && product.paymentCompletedPetOwner === 1 && <div className="text-right">(<Translate id="Already Paid" />)</div> }
										</React.Fragment>
									</td>
									<td className="text-right">
										{parseInt(product.productTypeId) === 2 && product.productCategory === 'Cremations' && headerStatus.Cremation.visible === true &&
											<button type="button" className="btn btn-sm btn-addon btn-success" onClick={() => handleView('Cremation')}><FontAwesomeIcon icon="pen" /> <Translate id="Edit Cremation Service" /></button>
										}
										{/* We should make the product in the order edittable at some point */}
										{false && parseInt(product.productTypeId) !== 2 &&
											<button type="button" className="btn btn-sm btn-addon btn-success mb-2" onClick={() => handleProductView(product.productId)}><FontAwesomeIcon icon="pen" /> <Translate id="Edit Item" /></button>
										}
										{(parseInt(product.productTypeId) !== 2 || product.productCategory !== 'Cremations') && product.productCategory !== 'Delivery' && removeItemConfirming !== product.orderProductId && product.paymentCompletedPetOwner === 0 &&
											<button type="button" className="btn btn-sm btn-addon btn-danger" onClick={() => handleRemoveItemClick(product.orderProductId)}><FontAwesomeIcon icon="trash-alt" /> <Translate id="Remove" /></button>
										}
										{removeItemConfirming === product.orderProductId &&
											<React.Fragment>
												<button type="button" className="btn btn-sm btn-addon btn-danger mb-1" onClick={() => removeOrderProduct({ orderId: Order.orderId, orderProductId: product.orderProductId, productCategory: product.productCategory, productId: product.productId })}><FontAwesomeIcon icon="trash-alt" /> <Translate id="Confirm Remove" /></button>
												<span className="d-block"><button type="button" className="btn btn-sm btn-addon btn-default" onClick={() => handleRemoveItemClick(0)}><FontAwesomeIcon icon="times" /> <Translate id="Cancel" /></button></span>
											</React.Fragment>
										}
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			}
			{/* DIVS FOR SMALL SCREENS */}
			{width < mediumWidth && <React.Fragment>
				{ProductsOrder.map((product) => {
					// Need to get the product object from the full ProductsMemorialization array matching this productId since it contains the image data.
					let productImage = {};
					if(parseInt(product.productTypeId) === 2) {
						// Cremation products are now split into two separate sections, so we need to differentiate between the Cremations and Special Services tab products
						productImage = props.ProductsMemorialization.CremationProducts.find((cremationProduct) => parseInt(cremationProduct.productId) === parseInt(product.productId));
					} else {
						productImage = props.ProductsMemorialization.ProductsMemorialization.find((productMemorialization) => parseInt(productMemorialization.productId) === parseInt(product.productId));
					}
					// Set Product Name to Account Product Name if it is defined, otherwise who the product name as set by us.
					let productName = (product.accountProductName !== null && product.accountProductName !== "") ? product.accountProductName : product.productName
					// Create array of attribute ojects if there are personalization attributes on this item
					let TempProductOptions = ProductOptions.filter((options) => parseInt(options.orderProductId) === parseInt(product.orderProductId));
					
					// Set product's priceCharged and add priceChargedPersonalization
					const priceChargedTotal = product.priceChargedPersonalization === null ? product.priceCharged : Math.add(product.priceChargedPersonalization,product.priceCharged).toFixed(2);
					// Determine output for product cost breakdown
					let tempCategory = '';
					if(product.productCategory === 'Urns') {
						tempCategory = 'Urn';
					}
					let tempPriceCharged = removeZeroCents(product.priceCharged);
					let tempPriceChargedPersonalization = product.priceChargedPersonalization !== null && product.personalizeProduct === 1 ? removeZeroCents(product.priceChargedPersonalization) : null;

					// If this is an At Home Memorialization, only total up the items that need to be paid for by the pet owner
					if(Order.memorialization === 'home') {
						if(parseInt(product.invoiceVet) === 0 && parseInt(product.paymentCompletedPetOwner) === 0) {
							// update cost calculation variables
							// update the subtotal of product costs, excluding delivery products
							if(product.productCategory !== 'Delivery') subtotal = Math.add(subtotal,priceChargedTotal);
							if(product.productCategory === 'Delivery') deliveryCost = Math.add(deliveryCost,priceChargedTotal);
							subSubtotal = Math.add(subtotal, deliveryCost);
							// Update the total tax that is charged on this order
							if(product.taxCharged) {
								taxTotal = Math.add(taxTotal, product.taxCharged).toFixed(2);
							}
						}
					} else {
						// update cost calculation variables
						// update the subtotal of product costs, excluding delivery products
						if(product.productCategory !== 'Delivery') subtotal = Math.add(subtotal,priceChargedTotal);
						if(product.productCategory === 'Delivery') deliveryCost = Math.add(deliveryCost,priceChargedTotal);
						subSubtotal = Math.add(subtotal, deliveryCost);
						// Update the total tax that is charged on this order
						if(product.taxCharged) {
							taxTotal = Math.add(taxTotal, product.taxCharged).toFixed(2);
						}
					}
					// For each product, if it is an engraving, do not let them click "Confirm Engraving" if they currently editing an option line
					let allowConfirmEngraving = TempProductOptions.length > 0 && TempProductOptions.findIndex((option) => parseInt(editSelectedOrderProductProductOptionId) === parseInt(option.orderProductProductOptionId)) ? true : false;

					return (
						<div key={product.orderProductId} className="border-bottom border-dark pb-3 mb-3">
							<div className="text-center mb-2 mt-2">
								{ product.productCategory !== 'Delivery' && <ProductThumbnail product={productImage} size="medium" speciesid={Order.speciesId} />}
								{/* { product.productCategory === 'Delivery' && <React.Fragment>
									<span className="text-info h1">
										{ product.productName === "Pickup at Crematory" && <FontAwesomeIcon icon="walking" className="mr-3" /> }
										{ product.productName === "Hospital Delivery" && <FontAwesomeIcon icon="ambulance" className="mr-3" /> }
										{ product.productName === "Courier Delivery" && <FontAwesomeIcon icon="truck-moving" className="mr-3" /> }

										{ product.productName !== "No Delivery" && <FontAwesomeIcon icon="arrow-right" className="mr-3" />}

										{ product.productName === "Pickup at Crematory" && <FontAwesomeIcon icon="warehouse" /> }
										{ product.productName === "Hospital Delivery" && <FontAwesomeIcon icon="hospital" /> }
										{ product.productName === "Courier Delivery" && <FontAwesomeIcon icon="home" /> }

										{ product.productName === "No Delivery" && <FontAwesomeIcon icon="ban" />}
									</span>
								</React.Fragment>} */}
							</div>{/* End image container */}
							<div className="">
								<div className="text-center mb-1">
									<h5 className="mb-0">{productName}</h5>
								</div>
								{productName !== product.descriptionShort && <div className="text-center mb-1">{product.descriptionShort}</div>}
								<div className="text-center mb-3 pl-5 pr-5">
									{/* {product.invoiceVet === 0 && product.paymentCompletedPetOwner === 0 &&
										<React.Fragment>
											<h6 className="mb-0">${removeZeroCents(priceCharged, product.productId)}</h6>
										</React.Fragment>
									}
									{product.invoiceVet === 0 && product.paymentCompletedPetOwner === 1 &&
										<React.Fragment>
											<h6 className="mb-0"><Translate id="Already Paid" />: (${removeZeroCents(priceCharged, product.productId)})</h6>
										</React.Fragment>
									}
									{product.invoiceVet === 1 &&
										<React.Fragment>
											<h6 className="mb-0"><Translate id="Prepaid At Vet" />: (${removeZeroCents(priceCharged, product.productId)})</h6>
										</React.Fragment>
									} */}
									<React.Fragment>
										{(
											tempPriceChargedPersonalization !== null &&
											<React.Fragment>
												<div className="clearfix"><span className="float-left">{tempCategory}</span><span className="float-right">${tempPriceCharged}</span></div>
												<div className="clearfix"><span className="float-left">Engraving</span><span className="float-right">${tempPriceChargedPersonalization}</span></div>
												<div className="border-top border-secondary clearfix"><span className="float-left">Total</span><span className="float-right">${removeZeroCents(priceChargedTotal)}</span></div>
											</React.Fragment>
											) ||
											<div className="text-center">${removeZeroCents(priceChargedTotal)}</div>
										}
										{ product.invoiceVet === 1 && <div className="text-center">(<Translate id="Prepaid At Vet" />)</div> }
										{ product.invoiceVet === 0 && product.paymentCompletedPetOwner === 1 && <div className="text-center">(<Translate id="Already Paid" />)</div> }
									</React.Fragment>
								</div>

								{TempProductOptions.length > 0 &&
									<div className="text-center mb-4">
										{/* <h6 className="mb-0"><u>Engraving Details</u>${removeZeroCents(product.priceChargedPersonalization)} </h6> */}
										{
											(parseInt(product.personalizationConfirmed) === 0 &&
											<div className="text-center mb-2">
												<button type="button" className="btn btn-success btn-sm btn-addon" disabled={!allowConfirmEngraving && !selectedProductOptionSaved} onClick={() => clickConfirmEngraving(product.orderProductId, 1)}><FontAwesomeIcon icon={engravingFavicon} /> Confirm Engraving</button>
											</div>) ||
											<div className="text-center mt-1 mb-2">
												<button type="button" className="btn btn-success btn-sm btn-addon" disabled><FontAwesomeIcon icon="check" /> Confirmed</button>
												<button type="button" className="btn btn-default btn-sm btn-addon ml-2" onClick={() => clickConfirmEngraving(product.orderProductId, 0)}><FontAwesomeIcon icon="undo" />Unconfirm</button>
											</div>
										}
										{TempProductOptions.map((option) => {
											const optionDetail = option.valueLabel === 'TEXT' ? option.textString : option.valueLabel;
											if(parseInt(editSelectedOrderProductProductOptionId) === parseInt(option.orderProductProductOptionId)) {
												return (
													<div key={option.orderProductProductOptionId} className="mb-1">
														<div className="text-muted"><u>{option.optionName}</u></div>
														<div className="form-inline justify-content-center">
															<input type="text" name="selectedProductOption" value={selectedProductOption} onChange={(event) => handleProductOptionChange(event.target.value)} className="form-control ml-2" style={{width: 150 + 'px'}}/>
															<button type="button" className={`btn ml-1 ${(selectedProductOptionSaved && 'btn-success') || 'btn-outline-success'}`} onClick={() => handleProductOptionSave(true)}>
																{selectedProductOptionSaved && 'Saved'}{!selectedProductOptionSaved && 'Save'}
															</button>
														</div>
													</div>
												)
											} else {
												return (
													<div className="mb-1" key={option.orderProductProductOptionId}>
														<div className="text-muted"><u>{option.optionName}</u></div>
														<div>{optionDetail} {parseInt(product.personalizationConfirmed) === 0 && <FontAwesomeIcon icon="pen" color="green" onClick={() => clickEditEngraving(option.orderProductProductOptionId)}/>}</div>
													</div>
												)
											}
										})}
									</div>
								}
								{/* If this product can be engraved, but has not been, show the option to do so */}
								{TempProductOptions.length === 0 && product.personalizationAllowed === 1 && parseInt(addEngravingOrderProductId) !== parseInt(product.orderProductId) &&
									<div className="text-center"><button type="button" className="btn btn-sm btn-success btn-addon mb-2" onClick={() => handleAddEngraving(parseInt(product.orderProductId))}><FontAwesomeIcon icon="plus" />Add Engraving</button></div>}
								{/* When addEngravingOrderProductId is this productId, then trigger the open of another container and hit the server to get the productOptions for the productId */}
								{parseInt(addEngravingOrderProductId) === parseInt(product.orderProductId) && <div className="text-center mb-2"><EngravingForm divClass="justify-content-center" handleAddEngraving={(orderProductId, NewProductOptions, newOrderProductId, NewOrderProductObject) => handleAddEngraving(orderProductId, NewProductOptions, newOrderProductId, NewOrderProductObject)} orderProductId={product.orderProductId} Product={ProductsMemorialization.filter((engravingProduct) => parseInt(engravingProduct.productId) === parseInt(product.productId))} productId={product.productId} ProductOptionsFromParent={ProductOptions} /></div>}
								<div className="mb-4 text-center">
									{/* {false && product.productTypeId === '2' &&
										<button type="button" className="btn btn-sm btn-addon btn-info" onClick={() => handleView('Cremation')}><FontAwesomeIcon icon="pen" /> <Translate id="Edit Cremation Service" /></button>
									}
									{false && product.productTypeId !== '2' &&
										<button type="button" className="btn btn-sm btn-addon btn-info mb-2" onClick={() => handleProductView(product.productId)}><FontAwesomeIcon icon="pen" /> <Translate id="Edit Item" /></button>
									} */}
									{(parseInt(product.productTypeId) !== 2 || product.productCategory !== 'Cremations') && product.productCategory !== 'Delivery' && removeItemConfirming !== product.orderProductId && product.paymentCompletedPetOwner === 0 && addEngravingOrderProductId === 0 &&
										<button type="button" className="btn btn-sm btn-addon btn-danger" onClick={() => handleRemoveItemClick(product.orderProductId)}><FontAwesomeIcon icon="trash-alt" /> <Translate id="Remove" /> {productName}</button>
									}
									{product.productTypeId !== '2' && removeItemConfirming === product.orderProductId &&
										<React.Fragment>
											<span className="d-block"><button type="button" className="btn btn-sm btn-addon btn-default" onClick={() => handleRemoveItemClick(0)}><FontAwesomeIcon icon="times" /> <Translate id="Cancel" /></button></span>
											<button type="button" className="btn btn-sm btn-addon btn-danger mt-2" onClick={() => removeOrderProduct({ orderId: Order.orderId, orderProductId: product.orderProductId, productCategory: product.productCategory, productId: product.productId })}><FontAwesomeIcon icon="trash-alt" /> <Translate id="Are You Sure? This cannot be undone" /></button>
										</React.Fragment>
									}
								</div>
							</div>{/* End className row */}
						</div>
					)
				})}
			</React.Fragment>}

			<div className="row justify-content-center">
				{/* {Order.memorialization === 'home' &&
					<div className="col-12 text-justify alert alert-warning">Please note that this total is only for the items which you are responsible for paying for at checkout here. Any items that are not paid for in this memorialization process may not be fulfilled.</div>
				} */}
				<div className="col-sm-auto">
					<div className="card">
						<div className="card-header text-center border-dark"><Translate id="Review Memorialization Total" /></div>
						<div className="card-body">
							<div className="row">
								<div className="col-6">
									<div className="float-right">
										<div><Translate id="Subtotal" />:</div>
										<div><Translate id="Delivery" />:</div>
										<div><Translate id="Tax" />:</div>
										<h5><Translate id="Total" />:</h5>
									</div>
								</div>
								<div className="col-6">
									<div className="float-right text-right">
										<div>{subtotal.toFixed(2)}</div>
										<div>{deliveryCost.toFixed(2)}</div>
										<div>{taxTotal}</div>
										<h5 className="border-top border-dark">${Math.add(subSubtotal, taxTotal).toFixed(2)}</h5>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="col-12 text-center mt-3 mb-5">
					<button type="button" className="btn btn-addon btn-success mr-3" onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Previous" /></button>
					<button type="button" className={continueButtonClass} onClick={() => clickContinueButton()}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id={basketProceedButtonText} /></button>
				</div>

				{/*<div className="col-12 mt-3">
					<button type="button" className="btn btn-sm btn-addon btn-success float-right" onClick={() => handleView(viewDefaults[category].next)} disabled={disableContinuteButton}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id={basketProceedButtonText} /></button>
					<button type="button" className="btn btn-sm btn-addon btn-success float-right mr-3" onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Previous" /></button>
				</div>*/}
			</div>
		</div>
	)
}

// Basket Review
const BasketForm = compose (
	queryWithLoading({
		gqlString: getOrderProductsQuery,
		variablesFunction: (props) => ({orderId: props.Order.orderId, petReferenceNumber: props.Order.petReferenceNumber ? props.Order.petReferenceNumber : ''}),
		name: "OrderProducts",
	 	fetchPolicy: 'network-only', // we don't want to get the response from the cache
	}),
	queryWithLoading({
		gqlString: getProductsMemorializationQuery,
		variablesFunction: (props) => ({petReferenceNumber: props.petReferenceNumber, productTypeId: props.productTypeId}),
		name: "ProductsMemorialization"
	}),
	queryWithLoading({
		gqlString: getProductsMemorializationPromotionsQuery,
		variablesFunction: (props) => ({petReferenceNumber: props.petReferenceNumber, productTypeId: props.productTypeId, promotionsOnly: true}),
		name: "ProductsMemorializationPromotions"
	}),
	withMutation(OrderProductConfirmEngraving, "OrderProductConfirmEngraving"),
	withMutation(OrderProductProductOptionSaveMutation, "OrderProductProductOptionSave"),
	withMutation(OrderProductRemoveMutation, "OrderProductRemove", ["getOrderProducts","getProductsMemorializationPromotions"]),
	withFormik(),
	withState({
		addEngravingOrderProductId: 0,
		continueButtonClass: 'btn btn-addon btn-success',
		Counts: {},
		disableContinuteButton: false,
		editSelectedOrderProductProductOptionId: 0,
		engravingAlertClass: 'alert alert-danger text-dark text-center',
		engravingConfirmationNeeded: false,
		engravingConfirmed: true,
		engravingFavicon: 'exclamation-circle',
		initialLoad: true,
		ProductOptions: [],
		ProductsOrder: [],
		responseMessage: '',
		selectedProductOption: '',
		selectedProductOptionSaved: false
	}),
	withTranslate
)(BasketFormContent);

// Checkout Form Content
const CheckoutConfirmationFormContent = (props) => {
	const {
		Account,
		accountDeliveryMethodName,
		AddressSave,
		addressTypes: {
			AddressTypes,
			Countries
		},
		buttonAreaClicked,
		DeliveryAddress: {
			Address
		},
		errors,
		handleView,
		initialLoad,
		Order,
		OrderCremationSave,
		OrderProductsPaid,
		OrderSave,
		ownerInfoComplete,
		ownerInfoMessage,
		setOwnerAddressToDeliveryAddress,
		setState,
		showCheckoutConfirmation,
		specialInstructions,
		specialInstructionsSaved,
		state:{
			view:{
				current:category
			},
			viewDefaults
		},
		submitForm,
		touched,
		values
	} = props;

	// On initialLoad, if setOwnerAddressToDeliveryAddress is true, then we want to do just that.
	if(initialLoad === true) {
		if(setOwnerAddressToDeliveryAddress === true && Address !== null) {
			values.address1 = Address.address1;
			values.address2 = Address.address2;
			values.city = Address.city;
			values.postalCode = Address.postalCode;
			values.stateId = Address.stateId;
		}

		// Set temp to whatever the current value is
		let tempOwnerInfoComplete = ownerInfoComplete
		// Do a check if all of the info is completed, and if it is, set that to true so that the checkout can continue.
		if(ownerInfoComplete === false && (values.address1 !== '' && values.city !== '' && values.postalCode !== '' && values.stateId !== '' && values.ownerPhoneNumber !== '' && values.ownerPhoneNumber.length === 10)) {
			tempOwnerInfoComplete = true;
		}

		// Output function for receiving a deliveryMethodProductId and outputting the account/productName for that productId. The Order.deliveryMethodName is the software (accountId=1) level productName, we want to crematory account name.
		let TempDeliveryProduct = {};
		TempDeliveryProduct = Order.ProductsOrder.find((product) => product.productCategory === 'Delivery');
		let tempDeliveryName = TempDeliveryProduct && parseInt(TempDeliveryProduct.productId) > 0 ? TempDeliveryProduct.accountProductName : accountDeliveryMethodName; // accountDeliveryMethodName is ''; accountProductName is if the Crematory has overwritten our default productName.
		tempDeliveryName = (tempDeliveryName === '' || tempDeliveryName === null) && TempDeliveryProduct && parseInt(TempDeliveryProduct.productId) > 0 ? TempDeliveryProduct.productName : tempDeliveryName; // If there wasn't an accountProductName, then just set it to the productName.

		let tempSpecialInstructions = Order.specialInstructions !== null ? Order.specialInstructions : '';
		// reset the initialLoad state variable so this doesnt occur again, also the setState with rerender and the values we just set will take effect.
		setState({accountDeliveryMethodName: tempDeliveryName, initialLoad: false, ownerInfoComplete: tempOwnerInfoComplete, specialInstructions: tempSpecialInstructions});
	}

	// Do a live check for if the user changes an info in the Owner Info section that fails validation, we need to hide the Payment form because if they try to submit payment with a failed validation, the payment will process but the checkout will not complete so the items will not get marked as paid.
	// Do a check if all of the info is completed, and if it is, set that to true so that the checkout can continue.
	if(ownerInfoComplete === true && (values.address1 === '' || values.city === '' || values.postalCode === '' || values.stateId === '' || values.ownerPhoneNumber === '' || values.ownerPhoneNumber.length !== 10)) {
		setState({ownerInfoComplete: false});
	}


	values.memorialization = Order.memorialization;

	// define calculation variables
	let subtotal = 0;
	let subSubtotal = 0;
	let deliveryCost = 0;
	let tax = 0;

	Order.ProductsOrder.forEach((product) => {
		// If this is an At Home Memorialization, only total up the items that need to be paid for by the pet owner
		if(Order.memorialization === 'home') {
			if(parseInt(product.invoiceVet) === 0 && parseInt(product.paymentCompletedPetOwner) === 0) {
				// update cost calculation variables
				// update the subtotal of product costs, excluding delivery products
				const priceCharged = product.priceChargedPersonalization === null ? product.priceCharged : Math.add(product.priceChargedPersonalization,product.priceCharged).toFixed(2);
				// Update the total tax that is charged on this order
				tax = Math.add(tax, product.taxCharged).toFixed(2);

				if(product.productCategory !== 'Delivery') subtotal = Math.add(subtotal,priceCharged);
				if(product.productCategory === 'Delivery') deliveryCost = Math.add(deliveryCost,priceCharged);
				subSubtotal = Math.add(subtotal, deliveryCost);
			}
		} else {
			// update cost calculation variables
			// update the subtotal of product costs, excluding delivery products
			const priceCharged = product.priceChargedPersonalization === null ? product.priceCharged : Math.add(product.priceChargedPersonalization,product.priceCharged).toFixed(2);
			// Update the total tax that is charged on this order
			tax = Math.add(tax, product.taxCharged).toFixed(2);

			if(product.productCategory !== 'Delivery') subtotal = Math.add(subtotal,priceCharged);
			if(product.productCategory === 'Delivery') deliveryCost = Math.add(deliveryCost,priceCharged);
			subSubtotal = Math.add(subtotal, deliveryCost);
		}
	});

	// Formik's submitForm functionality - moved outside of Formik to prevent submissions when pressing enter and the webpage submits itself with the handleSubmit. Formik sucks.
	async function handleSubmitForm() {
		// For At Home memorialization, make sure to collect the owner's address information
		values.ownerAddressId = values.ownerAddressId > 0 ? values.ownerAddressId : null;

		// Remove the address info for the Owner so it doesn't blow out the OrderCremationSave
		const tempInput = _.omit(values, ["address1", "address2", "addressTypeId", "city", "countryId", "creditCardChargeId", "postalCode", "stateId"]);

		// If this is a Vet Supply order, set the orderStatusId = 'Preparing Order'
		const tempOrderStatusId = (values.orderTypeId === 1 || values.orderTypeId === 3) ? 2 : parseInt(values.orderStatusId);
		// Async/Await Perform the mutation (to the server) and decompose the result.
		const { data: { orderCremationSave }} = await OrderCremationSave({ input: {...tempInput, generateNewCremationTag: true, memorializationCheckedOut: 1, orderStatusId: tempOrderStatusId, tabMemorializationOpen: 0} });

		// if this is a home memorialization then we need to mark the ordersProducts that are invoiceVet 0 as paid by the pet owner
		if(values.memorialization === 'home' && values.payAtPickup !== 1) {
			const tempCreditCardChargeId = values.creditCardChargeId ? values.creditCardChargeId : 0;
			await OrderProductsPaid({ input: { creditCardChargeId: tempCreditCardChargeId, orderId: Order.orderId }});
		} 

		// Go to the standard Checkout Completed page
		handleView('CheckoutCompleted', orderCremationSave.jobId);
	}

	// Response function for payment processing to know if the payment was successful or not.
	async function getPaymentResponse(Response) {
		// If the payment processing was succesful, then complete the checkout process, otherwise do nothing until they resubmit their cc and get a successful response
		if(Response.success === true) {
			// Set the creditCardChargeId in the values object so it can be used in the formik save.
			values.creditCardChargeId = parseInt(Response.creditCardChargeId);
			// This will perform the same action as the 'Confirm Checkout' button for Vet's
			handleSubmitForm();
		}
	}

	// Function to handle when the 'Pay At Pickup' buttopn is clicked
	function handlePayAtPickup() {
		// set the input for payAtPickup, which will be the flag we watch for on the orderSave mutation. This flag signals to get all of the ordersProducts that are invoiceVet = 0, and then updates them to invoiceVet=1 and payAtPickup=1
		values.payAtPickup = 1;
		// This will perform the same action as the 'Confirm Checkout' button for Vet's
		handleSubmitForm();
	}

	// Function for savinfg the special instructions
	async function handleSaveSpecialInstructions() {
		// Save the new addressId and the phone number
		await OrderSave({ input: {orderId: Order.orderId, specialInstructions}});
		
		setState({specialInstructionsSaved: true});
	}

	// Function for updating on change special instructions state variable
	async function handleSpecialInstructionsOnChange(value) {
		setState({specialInstructions: value, specialInstructionsSaved: false});
	}

	// Function for saving just the owner info
	async function handleSaveOwnerInfo() {
		// Validate that the required fields are completed.
		if(values.address1 === '' || values.city === '' || values.stateId === '' || values.postalCode === '' || values.ownerPhoneNumber === '' || values.ownerPhoneNumber.length !== 10) {
			// Just submit the form and the formik validation will show the errors
			submitForm();
		} else {
			// Get addressType for Home
			values.addressTypeId = AddressTypes.find((type) => type.addressType === 'Home') ? parseInt(AddressTypes.find((type) => type.addressType === 'Home').addressTypeId) : 0;

			// Get the countryId for whatever stateId was picked
			values.countryId = Countries.find((country) => country.States.findIndex((state) => parseInt(state.stateId) === parseInt(values.stateId)) > -1) ? parseInt(Countries.find((country) => country.States.findIndex((state) => parseInt(state.stateId) === parseInt(values.stateId)) > -1).countryId) : 0;

			// Add addressId to the input object temporarily for ease of saving Address if ownerAddressId already exists
			values.addressId = values.ownerAddressId > 0 ? values.ownerAddressId : 0;
			const { data: { AddressSave: { addressId }}} = await AddressSave({ input: _.pick(values, ["address1", "address2", "addressId", "addressTypeId", "city", "countryId", "postalCode", "stateId"]) })

			// Delete the addressId that we just added in for the AddressSave mutation
			delete values.addressId;

			// Update ownerAddressId
			values.ownerAddressId = parseInt(addressId);

			// Save the new addressId and the phone number
			await OrderSave({ input: {orderId: Order.orderId, ownerAddressId: parseInt(addressId), ownerPhoneNumber: values.ownerPhoneNumber}})

			// Update ownerInfoComplete so that the payment form will show.
			setState({ownerInfoComplete: true, ownerInfoMessage: 'Owner Info Saved'})
		}
	}


	// <div className="card mt-3">
	// 	<div className="card-header"><h5 className="m-0"><Translate id="Delivery Info" /></h5></div>
	// 	<div className="card-body">
	// 		<div className="text-primary display-4">
	// 			{ Order.deliveryMethodName === "Pickup at Crematory" && <FontAwesomeIcon icon="walking" className="mr-3" /> }
	// 			{ Order.deliveryMethodName === "Hospital Delivery" && <FontAwesomeIcon icon="ambulance" className="mr-3" /> }
	// 			{ Order.deliveryMethodName === "Courier Delivery" && <FontAwesomeIcon icon="truck-moving" className="mr-3" /> }

	// 			<FontAwesomeIcon icon="arrow-right" className="mr-3" />

	// 			{ Order.deliveryMethodName === "Pickup at Crematory" && <FontAwesomeIcon icon="warehouse" /> }
	// 			{ Order.deliveryMethodName === "Hospital Delivery" && <FontAwesomeIcon icon="hospital" /> }
	// 			{ Order.deliveryMethodName === "Courier Delivery" && <FontAwesomeIcon icon="home" /> }
	// 		</div>
	// 		<div>{accountDeliveryMethodName}</div>
	// 		{Order.deliveryAddressId > 0 &&
	// 			<React.Fragment>
	// 				{ Order.deliveryMethodName === "Courier Delivery" && <div>{Address.ownerName}</div>}
	// 				<div>{Address.address2 === '' ? Address.address1 : `${Address.address1} ${Address.address2}`}<br /> {Address.city}, {Address.state} {Address.postalCode}</div>
	// 				<div>{(Address.deliveryInstructions !== '' && Address.deliveryInstructions !== null) && `Delivery Instructions: ${Address.deliveryInstructions}`}</div>
	// 			</React.Fragment>
	// 		}
	// 	</div>
	// </div>

	// For Clinic orders (Vet or Crematory), verify that Private Cremations have an Urn on the order, and that any engravings have been confirmed.
	let allowCheckout = true;
	let hasUrn = Order.ProductsOrder.findIndex((product) => (product.productCategory === 'Urns' || product.parentCategory === 'Urns') && product.statusRemainsFilledIndicator === 1) > -1 ? true : false; // Verify that there is an Urn on the Private order.;
	let noUrnNeedingEngravingConfirmed = true;
	let isCommunal = Order.ProductsOrder.findIndex((product) => product.productName === 'Communal Cremation') > -1 ? true : false;
	let hasPawPrint = Order.ProductsOrder.findIndex((product) => product.productCategory === 'Paw Prints') > -1 ? true : false;
	let isPrivate = Order.ProductsOrder.findIndex((product) => product.productName === 'Private Cremation') > -1 ? true : false;
	if(isPrivate === true) {
		allowCheckout = hasUrn; // Do not eliminate this duplication
		if(hasUrn === true) {
			noUrnNeedingEngravingConfirmed = Order.ProductsOrder.filter((product) => product.personalizeProduct === 1 && product.personalizationConfirmed === 0).length > 0 ? false : true;
			allowCheckout = allowCheckout === true ? noUrnNeedingEngravingConfirmed : allowCheckout; // If allowCheckout is already FALSE, just leave it. Else set it to whatever the noUrnNeedingEngravingConfirmed is
		}
	}

	return (
		<Form className="w-100 pt-3">
			<div className="row">
				<div className="col-12 text-center">
					<h3 className="mb-1"><Translate id="Checkout Confirmation" /></h3>
					<img src={process.env.PUBLIC_URL + "/images/ui/in-loving-memory-of-bottom.png"} className="pb-3 pt-1" alt="" style={{maxWidth: 200 + 'px'}} />
				</div>
				{/* {Order.memorialization !== 'home' && (showCheckoutConfirmation === false || (showCheckoutConfirmation === true && buttonAreaClicked === 'bottom')) &&
					<div className="col-12 text-center mb-3">
						<h3>
							<button type="button" className="btn btn-addon btn-success mr-3" onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Go Back" /></button>
							{(Order.memorialization === 'clinic' || Math.add(subSubtotal, tax).toFixed(2) === '0.00' || Order.payByCreditCardOffered === 0) && <button type="button" className="btn btn-addon btn-success" disabled={showCheckoutConfirmation === true} onClick={() => setState({buttonAreaClicked: 'top', showCheckoutConfirmation: true})}><FontAwesomeIcon icon="check" /> <Translate id="Complete Checkout" /></button>}
						</h3>
					</div>
				}
				{showCheckoutConfirmation === true && buttonAreaClicked === 'top' &&
					<div className="col-12">
						<div className="alert alert-warning">
							<h3 className="m-0 text-center">
								<button type="button" className="btn btn-addon btn-success mr-3" onClick={() => handleSubmitForm()}><FontAwesomeIcon icon="check" /> <Translate id="Confirm Checkout" /></button>
								<button type="button" className="btn btn-addon btn-default" onClick={() => setState({showCheckoutConfirmation: false})}><FontAwesomeIcon icon="times" /> <Translate id="Cancel" /></button>
							</h3>
							<p className="mb-0 mt-2">Are you sure that you are finished adding items? Once Checkout is completed, we will begin the memorialization process and new items will not be able to be added.</p>
							{
								Object.keys(errors).length > 0 &&
								<div className="alert alert-danger">
									There are errors in the Owner Info section, please fix those before checking out.
								</div>
							}
						</div>
					</div>
				} */}
			</div>
			<div className="row">
				<div className={`${(Order.memorialization === 'home' && 'col-lg-6')} col-md-12 mb-3`}>
					<div className="card border-secondary">
						<div className="card-header border-secondary text-center"><h5 className="m-0">{((parseInt(Order.orderTypeId) === 2 || Order.memorialization === 'home') && <Translate id="Memorialization Total" data={{petFirstName:Order.petFirstName}} />) || <Translate id="Your Total" />}</h5></div>
						<div className="card-body">
							<div className="row border-bottom">
								<div className="col-6"><Translate id="Subtotal" /></div>
								<div className="col-6 text-right">${subtotal.toFixed(2)}</div>
							</div>
							<div className="row border-bottom">
								<div className="col-6"><Translate id="Delivery" /></div>
								<div className="col-6 text-right">${deliveryCost.toFixed(2)}</div>
							</div>
							<div className="row border-bottom">
								<div className="col-6"><Translate id="Tax" /></div>
								<div className="col-6 text-right">${tax}</div>
							</div>
							<div className="h5 row pt-1 border-bottom">
								<div className="col-6"><Translate id="Total" /></div>
								<div className="col-6 text-right">${Math.add(subSubtotal, tax).toFixed(2)}</div>
							</div>
							<div className="row mt-5 text-center">
								<div className="col-12">
									<u><Translate id="Pet Returned To Owner" data={{petFirstName:Order.petFirstName}} />:</u>
								</div>
								<div className="col-12">
									<strong>{accountDeliveryMethodName}</strong>
									{/* {Order.deliveryAddressId > 0 &&
										<div>
											{ Order.deliveryMethodName === "Courier Delivery" && <div>{Address.ownerName}</div>}
											<div>{Address.address2 === '' ? Address.address1 : `${Address.address1} ${Address.address2}`}<br /> {Address.city}, {Address.state} {Address.postalCode}</div>
											<div>{(Address.deliveryInstructions !== '' && Address.deliveryInstructions !== null) && `Delivery Instructions: ${Address.deliveryInstructions}`}</div>
										</div>
									} */}
								</div>
							</div>
							<div className="row mt-5 text-center">
								<div className="col-12 mb-1">
									<u><Translate id="Special Instructions Checkout" data={{petFirstName:Order.petFirstName}} />:</u>
								</div>
								<div className="col-12">
									<Field component="textarea" value={specialInstructions} name="specialInstructions" id="specialInstructions" onChange={(event) => handleSpecialInstructionsOnChange(event.target.value)} style={{minHeight: 144 + 'px'}} className={`form-control`} />
								</div>
							</div>
							<div className="row justify-content-center">
								<div className="col-auto">
									{specialInstructionsSaved === false && <button type="button" className="btn btn-success mt-3" onClick={() => handleSaveSpecialInstructions()}><Translate id="Save Special Instructions" /></button>}
									{specialInstructionsSaved === true && <button type="button" className="btn btn-addon btn-success mt-3" disabled={true}><FontAwesomeIcon icon="check" /><Translate id="Saved" /></button>}
								</div>
							</div>
						</div>
					</div>
				</div>
				{Order.memorialization === 'home' &&
					<div className="col-lg-6 col-md-12 mb-3">
						<div className="card border-secondary">
							<div className="card-header border-secondary text-center"><h5 className="m-0"><Translate id="Owner Checkout Info" /></h5></div>
							<div className="card-body">
								<div className="form-row">
									<div className="col-6">
										<Translate id="First Name" />
										<Field name="ownerFirstName" showError={true} className={`form-control ${errors.ownerFirstName && touched.ownerFirstName && 'is-invalid'}`} />
									</div>
									<div className="col-6">
										<Translate id="Last Name" />
										<Field name="ownerLastName" showError={true} className={`form-control ${errors.ownerLastName && touched.ownerLastName && 'is-invalid'}`} />
									</div>
								</div>
								<div className="form-row mt-2">
									<div className="col-lg-6 col-md-12">
										<Translate id="Email" />
										<Field name="ownerEmail" showError={true} className="form-control" />
									</div>
									<div className="col-lg-6 col-md-12">
										<Translate id="Phone Number"/> *
										<Field
											component={Phone}
											name="ownerPhoneNumber"
											className={`form-control ${errors.ownerPhoneNumber && touched.ownerPhoneNumber && 'is-invalid'}`}
											showError={true}
											type="text"
										/>
									</div>
								</div>
								<div className="form-row mt-2">
									<div className="col-12">
										<Translate id="Billing Address Line 1" /> *
										<Field name="address1" showError={true} className={`form-control ${errors.address1 && touched.address1 && 'is-invalid'}`} />
									</div>
								</div>
								<div className="form-row mt-2">
									<div className="col-12">
										<Translate id="Billing Address Line 2" />
										<Field name="address2" showError={true} className={`form-control ${errors.address2 && touched.address2 && 'is-invalid'}`} />
									</div>
								</div>
								<div className="form-row mt-2">
									<div className="col-12">
										<Translate id="Billing City"/> *
										<Field name="city" showError={true} className={`form-control ${errors.city && touched.city && 'is-invalid'}`} />
									</div>
								</div>
								<div className="form-row mt-2">
									<div className="col-md-auto">
										<Translate id="Billing State"/> *
										<Field component="select" showError={true} name="stateId" className={`form-control ${errors.stateId && touched.stateId && 'is-invalid'}`}>
											<option value="">{props.translate("Select State")}</option>
											{Countries.map((country) => (
												<optgroup key={country.countryId} label={props.translate(country.country)}>
													{country.States.map((state) => (<option value={state.stateId} key={state.stateId}>{props.translate(state.state)}</option>))}
												</optgroup>
											))}
										</Field>
									</div>
									<div className="col-md-auto">
										<Translate id="Billing Postal Code"/> *
										<Field name="postalCode" showError={true} className={`form-control form-control-num ${errors.postalCode && touched.postalCode && 'is-invalid'}`} />
									</div>
								</div>
								<div className="mt-2 row justify-content-center">
									<div className="col-auto"><button type="button" className="btn btn-success mt-3" onClick={() => handleSaveOwnerInfo()}>{ownerInfoComplete === false && <Translate id="Save & Continue to Payment" />}{ownerInfoComplete === true && <Translate id="Save" />}</button></div>
									{ownerInfoMessage !== '' && <div className="col-auto"><div className="mt-2 alert alert-success">{ownerInfoMessage}</div></div>}
								</div>
							</div>
						</div>
					</div>
				}
			</div>
			{Order.memorialization === 'home' && isCommunal === true && 
				<React.Fragment>
					{hasPawPrint === false && <div className="alert alert-info text-center h4">{`It looks like you do not have a Paw Print with ${Order.petFirstName}'s Memorialization. We will not be able to make a Paw Print Memorial after cremation has taken place. Would you like to view the Paw Print options again?`}<div className="w-100"></div>
					<button type="button" className="mt-2 btn btn-default rounded" onClick={() => handleView('PawPrints')}><FontAwesomeIcon icon="paw" className="mr-2" />  Go To Paw Prints</button></div>}
				</React.Fragment>
			}

			{Order.memorialization === 'home' && Math.add(subSubtotal, tax).toFixed(2) !== '0.00' && ownerInfoComplete === true &&
				<div className="card border-secondary mt-3">
					<div className="card-header border-secondary"><h5 className="m-0"><Translate id="Payment Info" /></h5></div>
					<div className="card-body">
						{(isPrivate === true && hasUrn === false && <div className="alert alert-info text-center h5">{`It looks like you do not have an Urn with ${Order.petFirstName}'s Memorialization. Private Cremation requires an Urn for ${Order.petFirstName}'s Memorialization to be completed. Please select an Urn before completing the Memorialization checkout process.`}<div className="w-100"></div>
							<button type="button" className="mt-2 btn btn-default rounded" onClick={() => handleView('Urns')}>Go To Urns</button></div>)
						||
						(allowCheckout === false && 
						<div className="alert alert-info text-center h5">
							{noUrnNeedingEngravingConfirmed === false && <span>There is an Engraving that needs confirmation before Memorialization checkout can be completed. <button type="button" className="ml-4 btn btn-default btn-sm small rounded" onClick={() => handleView('Basket')}>Go To Basket</button></span>}
						</div>)
						||
						(<div className="row">
							{Order.payByCreditCardOffered === 1 &&
								<div className="col-md">
									<h6><Translate id="Pay Online" /></h6>
									<p>Secure and safe payment processing is completed by Stripe. We never save your information.<br />Stripe accepts Visa, Mastercard, American Express, Discover, and Debit Cards.</p>
									<Payment
										Account={Account}
										amount={Math.add(subSubtotal, tax).toFixed(2)}
										description={`Order ${Order.orderId}`}
										getPaymentResponse={getPaymentResponse}
										orderId={Order.orderId}
										paymentButtonText="Pay & Complete Checkout"
									/>
								</div>
							}
							{Order.payByCreditCardOffered === 1 && Order.payAtPickupOffered === 1 &&
								<div className="col-md-auto"><div className="h1 pt-5">OR</div></div>
							}
							{Order.payAtPickupOffered === 1 &&
								<div className="col-md">
									<h6><Translate id="Skip Payment Now - Pay At Pickup" /></h6>
									<button type="button" className="btn btn-addon btn-success float-left mr-3" onClick={() => handlePayAtPickup()}><FontAwesomeIcon icon="dollar-sign" /><Translate id="Complete Checkout" /></button>
								</div>
							}
						</div>)
						}
					</div>
				</div>
			}
			{Order.memorialization === 'clinic' &&
				<React.Fragment>
					<div className="card border-secondary mt-3">
						<div className="card-header h5 border-secondary text-center"><Translate id="Payment Information" /></div>
						<div className="card-body text-center">
							<div className="alert alert-info mb-0">{parseInt(Order.companyTypeId) === 3 && <Translate id="Payment will be collected on your monthly invoice" />}{parseInt(Order.companyTypeId) === 2 && <Translate id="Payment MUST be collected in the Order Details" />}</div>
						</div>
					</div>
					{/* Do not let Checkout occur if the Private does not have an Urn, or if there are engravings that have not been confirmed */}
					{allowCheckout === false && 
						<div className="row m-0 justify-content-center"><div className="m-0 col-auto"><div className="mt-3 mb-0 text-center alert alert-danger">
							{isPrivate === true && hasUrn === false && <span>Private Cremations MUST have an Urn <button type="button" className="ml-4 btn btn-default btn-sm small rounded" onClick={() => handleView('Urns')}>Go To Urns</button></span>}
							{noUrnNeedingEngravingConfirmed === false && <span>There is an Urn Engraving that needs confirmation <button type="button" className="ml-4 btn btn-default btn-sm small rounded" onClick={() => handleView('Basket')}>Go To Basket</button></span>}
						</div></div></div>
					}
				</React.Fragment>
			}
			<div className="row mb-4 mt-3">
				{(showCheckoutConfirmation === false || (showCheckoutConfirmation === true && buttonAreaClicked === 'top')) &&
					<div className="col-12 h3 text-center">
						<button type="button" className="btn btn-addon btn-success mr-3" onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Go Back" /></button>
						{(Order.memorialization === 'home' && (Math.add(subSubtotal, tax).toFixed(2) === '0.00' || Order.payByCreditCardOffered === 0)) && <button type="button" className="btn btn-addon btn-success" disabled={showCheckoutConfirmation === true} onClick={() => setState({buttonAreaClicked: 'bottom', showCheckoutConfirmation: true})}><FontAwesomeIcon icon="check" /> <Translate id="Complete Checkout" /></button>}
						{Order.memorialization === 'clinic' && <button type="button" disabled={!allowCheckout} className="btn btn-addon btn-success" onClick={() => handleSubmitForm()}><FontAwesomeIcon icon="check" /> <Translate id="Complete Checkout" /></button>}
					</div>
				}
				{showCheckoutConfirmation === true && buttonAreaClicked === 'bottom' &&
					<div className="col-12">
						<div className="alert alert-warning text-center">
							<h3 className="m-0 text-center">
								<button type="button" className="btn btn-addon btn-success mr-3" onClick={() => handleSubmitForm()}><FontAwesomeIcon icon="check" /> <Translate id="Confirm Checkout" /></button>
								<button type="button" className="btn btn-addon btn-default" onClick={() => setState({showCheckoutConfirmation: false})}><FontAwesomeIcon icon="times" /> <Translate id="Cancel" /></button>
							</h3>
							<p className="mb-0 mt-2">Are you sure that you are finished adding items? Once Checkout is completed, we will begin the memorialization process and new items will not be able to be added.</p>
								{
									Object.keys(errors).length > 0 &&
									<div className="alert alert-danger">
										There are errors in the Owner Info section, please fix those before checking out.
									</div>
								}
						</div>
					</div>
				}
			</div>
		</Form>
	)
}

// Checkout form
const CheckoutConfirmationForm = compose (
	queryWithLoading({
		gqlString: getAddressQuery,
		variablesFunction: (props) => ({ addressId: props.Order.deliveryAddressId > 0 ? props.Order.deliveryAddressId : 0 }),
		name: "DeliveryAddress"
	}),
	queryWithLoading({ gqlString: getAddressTypes, name: "addressTypes"}),
	withMutation(AddressSaveMutation, "AddressSave"),
	withMutation(OrderCremationSaveMutation, "OrderCremationSave", ["getOrderProducts"]),
	withMutation(OrderProductsPaidMutation, "OrderProductsPaid"),
	withMutation(OrderSaveMutation, "OrderSave"),
	withFormik({
		handleSubmit: async ( input, { props: { AddressSave, addressTypes: { AddressTypes, Countries }, handleView, Order:{ memorialization, orderId, orderStatusId, orderTypeId }, OrderCremationSave, OrderProductsPaid, setResponse}} ) => {
			console.log('Checkout SubmitForm hit - ERROR BAD BAD!!')
			// // For At Home memorialization, make sure to collect the owner's address information
			// input.ownerAddressId = input.ownerAddressId > 0 ? input.ownerAddressId : null;

			// // Remove the address info for the Owner so it doesn't blow out the OrderCremationSave
			// const tempInput = _.omit(input, ["address1", "address2", "addressTypeId", "city", "countryId", "creditCardChargeId", "postalCode", "stateId"]);

			// // If this is a Vet Supply order, set the orderStatusId = 'Preparing Order'
			// const tempOrderStatusId = (orderTypeId === 1 || orderTypeId === 3) ? 2 : parseInt(orderStatusId);
			// // Async/Await Perform the mutation (to the server) and decompose the result.
			// const { data: { orderCremationSave }} = await OrderCremationSave({ input: {...tempInput, generateNewCremationTag: true, memorializationCheckedOut: 1, orderStatusId: tempOrderStatusId, tabMemorializationOpen: 0} });

			// // if this is a home memorialization then we need to mark the ordersProducts that are invoiceVet 0 as paid by the pet owner
			// if(memorialization === 'home' && input.payAtPickup !== 1) {
			// 	const tempCreditCardChargeId = input.creditCardChargeId ? input.creditCardChargeId : 0;
			// 	await OrderProductsPaid({ input: { creditCardChargeId: tempCreditCardChargeId, orderId }});
			// }

			// handleView('CheckoutCompleted', orderCremationSave.jobId);
		},
		validate: (values) => {
			let errors = {};

			if(values.memorialization === 'home') {
				if(values.address1 === '') { errors.address1 = 'Address 1 is required'; } else { delete errors.address1; };
				if(values.city === '') { errors.city = 'City is required'; } else { delete errors.city; };
				if(values.ownerFirstName === '') { errors.ownerFirstName = 'First Name is required'; } else { delete errors.ownerFirstName; };
				if(values.ownerLastName === '') { errors.ownerLastName = 'Last Name is required'; } else { delete errors.ownerLastName; };
				if(values.ownerPhoneNumber.length === 0) {
					errors.ownerPhoneNumber = 'Phone Number is required';
				} else if(values.ownerPhoneNumber.length !== 10) {
					errors.ownerPhoneNumber = 'Phone Number must be 10 digits';
				} else {
					delete errors.ownerPhoneNumber;
				};
				if(values.postalCode === '') { errors.postalCode = 'Postal Code is required'; } else { delete errors.postalCode; };
				if(values.stateId === '') { errors.stateId = 'State is required'; } else { delete errors.stateId; };
			}

			return errors
		}
	}),
	withState({
		accountDeliveryMethodName: '',
		buttonAreaClicked: '',
		initialLoad: true,
		ownerInfoComplete: false,
		ownerInfoMessage: '',
		showCheckoutConfirmation: false,
		specialInstructions: '',
		specialInstructionsSaved: false
	}),
	withTranslate
)(CheckoutConfirmationFormContent);

// Checkout Completed Form Content
const CheckoutCompletedFormContent = (props) => {
	const {
		jobId,
		LoggedIn,
		Order,
		User
	} = props;

	let style = {};
	style.backgroundImage = `url(/images/ui/loyalpaws_background6.png)`;
	style.backgroundSize = 'cover';
	style.backgroundPosition = 'center center';
	style.backgroundRepeat = 'no-repeat';

	let maxImageWidth = window.innerWidth - 40;

	// Cremation Order
	if(parseInt(Order.orderTypeId) === 2) {
		if(Order.memorialization === 'clinic') {
			style.height = '1000px';
			style.paddingTop = '200px';
			return (
				<div className="w-100">
					<div className="row pr-3 pl-3">
						<div className="col-12 mt-4 mb-4">
							<div className="row justify-content-center">
								<div className="col-lg-3 col-md-2 col-sm-1" />
								<div className="col-lg-6 col-md-8 col-sm-10">
									<div className="text-center pb-2">
										<p><img src={process.env.PUBLIC_URL + "/images/logos/lp_transparent.png"} className="pt-5 w-75" alt="Loyal Paws" /></p>
									</div>
									<div className="card bg-transparent">
										<div className="card-header">
											<h5 className="text-center text-secondary m-0">Order Successfully Completed</h5>
										</div>
										<div className="card-body text-justify">
											<div className="alert alert-success h6 mb-4">
												<FontAwesomeIcon icon="check-circle" color="green" className="mr-2" /> Thank you for your order. Your order number is {Order.orderId}, and Reference Number is {Order.petReferenceNumber}.
											</div>
											{LoggedIn === true &&
												<React.Fragment>
													{(parseInt(User.userTypeId) !== 5) &&
														<React.Fragment>
															<div className="">
																<Translate id="Memorialization Completed Crematory" />
															</div>
															<div className="">
																<Translate id="Memorialization Completed Crematory 1" />
															</div>
															<div className="">
																<Translate id="Memorialization Completed Crematory 2" />
															</div>
															<div className="">
																<Translate id="Memorialization Completed Crematory 3" />
															</div>
															<div className="text-center">
																<a href={`/orders/orderId/${Order.orderId}`} className="btn text-white rounded" style={{backgroundColor: '#ec8333'}}><Translate id="Go To Order Details" /></a>
															</div>
														</React.Fragment>
													}
													{parseInt(User.userTypeId) === 5 &&
														<React.Fragment>
															<div className="">
																<Translate id="Memorialization Completed Vet" />
															</div>
															{jobId > 0 &&
																<div className="text-center">
																	{/* Disable button until polling for jobId returns a completed status, then refetch the order info to get the fileId for the tag */}
																	{/*<DownloadTag jobId={Response.jobId} />*/}
																	<PrintButton jobId={jobId} orderId={Order.orderId} printableId="3" printableName="Order Tag" />
																</div>
															}
															{
																jobId === 0 &&
																	<div className="text-center">
																		{/* Disable button until polling for jobId returns a completed status, then refetch the order info to get the fileId for the tag */}
																		{/*<DownloadTag jobId={Response.jobId} />*/}
																		<GeneratePrintButton jobId={0} orderId={Order.orderId} printableName="Order Tag" />
																	</div>
															}
														</React.Fragment>
													}
												</React.Fragment>
											}				
										</div>
									</div>
								</div>
								<div className="col-lg-3 col-md-2 col-sm-1" />
							</div>
						</div>
					</div>
				</div>

			)
		} else if(Order.memorialization === 'home') {
			return (
				<div className="w-100">
					<div className="row pr-3 pl-3">
						<div className="col-12 mt-4 mb-4">
							<div className="row justify-content-center">
								<div className="col-lg-3 col-md-2 col-sm-1" />
								<div className="col-lg-6 col-md-8 col-sm-10">
									<div className="text-center pb-2">
										<p><img src={process.env.PUBLIC_URL + "/images/logos/lp_transparent.png"} className="pt-5 w-75" alt="Loyal Paws" /></p>
									</div>
									<div className="card bg-transparent">
										<div className="card-header">
											<h5 className="text-center text-secondary m-0">{Order.petFirstName}'s Memorialization Order Completed</h5>
										</div>
										<div className="card-body text-justify">
											<div className="alert alert-success h6 mb-4">
												<FontAwesomeIcon icon="check-circle" color="green" className="mr-2" /> Your order was placed successfully. Please keep your reference number {Order.petReferenceNumber}.
											</div>
											{/* {
												Order.ownerEmail === '' &&
												<div className="">Would you like an order confirmation email?</div>
											} */}
											<p>With your Memorialization choices made, Loyal Paws will now complete each service and memorial product, according to your exact wishes.</p>
											<p>On behalf of all of us at {props.Account.accountName}{props.Account.accountName !== Order.companyName && <span> and {Order.companyName}</span>}, please accept our deepest and most heartfelt condolences during this difficult time. 
											Please take comfort in knowing that {Order.petFirstName} will be treated with the same level of care and respect we would show one of our own. We will notify you as soon as the Memorialization process is finished.</p>
											<p>You are able to see the status of {Order.petFirstName}'s Memorialization by clicking the button below.</p>
											<div className="text-center mt-4 mb-3">
												{/* <a href={`/memorialization/status/${Order.petReferenceNumber}`} className="btn btn-addon text-white" style={{backgroundColor: '#ec8333'}}><FontAwesomeIcon icon="paw" className="" /> <Translate id="Memorialization Status" /></a> */}
												<a href={`/memorialization/status/${Order.petReferenceNumber}`} className="btn btn-success btn-addon text-white" ><FontAwesomeIcon icon="paw" className="" /> <Translate id="Memorialization Status" /></a>
											</div>
										</div>
									</div>
								</div>
								<div className="col-lg-3 col-md-2 col-sm-1" />
							</div>
							{/* <div className="row justify-content-center mt-4">
								<div className="col-lg-3 col-md-2 col-sm-1" />
								<div className="col-lg-6 col-md-8 col-sm-10">
									<div className="card bg-transparent">
										<div className="card-header">
											<h5 className="text-center text-secondary m-0">Pet Loss Support and Grief Counseling</h5>
										</div>
										<div className="card-body text-justify">
											<p>Losing a beloved pet can be one of the most difficult experiences that we have. Each pet is special to us, touching our hearts in their own unique way.</p>
											<p>If you or someone you love is having a difficult time, consider visiting our Pet Loss Support blog on our website for resources and articles that others have found helpful.</p>
											<div className="text-center mt-3 mb-3">
												<a href="https://www.loyalpaws.com/pet-loss-support-blog/" className="btn btn-addon text-white" style={{backgroundColor: '#ec8333'}}><FontAwesomeIcon icon="paw" className="" /> <Translate id="Pet Loss Support" /></a>
											</div>
										</div>
									</div>
								</div>
								<div className="col-lg-3 col-md-2 col-sm-1" />
							</div> */}
						</div>
					</div>
				</div>
			)
		}
	} else {
		return (
			<Form className="w-100">
				<h3>Order Successfully Completed</h3>
			</Form>
		)
	}
}

// Container for the Cremation Services step of memorialization. This is only available for Private Cremations
const CremationServicesFormContent = (props) => {
	const {
		DeletedCremationProduct: { DeletedCremationProduct },
		handleProductsContinueButtonClick,
		LoggedIn,
		Order,
		Products,
		state:{
			productsContinueButton: {
				show:showCremationChangeWarning
			}
		},
		submitForm,
		User,
		values
	} = props;

	// Determine which products are available for the Cremation
	let tempCremationProducts = Products.filter((product) => product.productCategory === 'Cremations' && product.productName !== 'Communal and Paw Print');

	// Filter out either the private or individual option if the company or order setting matches an option below - These options are setting in the company details, or in the Hospital Options section of the order details
	if(Order.cremationTypesOffered === 'private_only') {
		tempCremationProducts = tempCremationProducts.filter((product) => product.productName !== 'Individual Cremation');
	} else if(Order.cremationTypesOffered === 'individual_only') {
		tempCremationProducts = tempCremationProducts.filter((product) => product.productName !== 'Private Cremation');
	}

	// Change the continueButtonClass to be btn-info once a Cremation Service has been selected
	const continueButtonClass = values.cremationProductId > 0 ? 'btn-success' : 'btn-default';

	// Handle Cancel button click from the warning message about downgrading service
	function handleCancelDowngrade() {
		// set the cremationProductId back to what it was, and hide the warning message. We are purposely not reseting the 'Optional Services' options because they likely still want whatever changes they made to those inputs
		handleProductsContinueButtonClick(false, null, null, {...values, cremationProductId: values.oldCremationProductId })
	}

	// Async function for handling when the Continue button is clicked. This mimics the functionality of the Continue button on the Products pages when added a product (Urn/Paw Print) is needed for the cremation service selected.
	async function handleCremationContinueButtonClick() {
		// Determine if the Cremation Service is being downgraded from an Individual cremation to a Communal and throw a warning message that any Urns, Keepsakes, or Jewelry on their order will be removed if they do this.
		const OldProduct = Products.find((product) => product.productId === values.oldCremationProductId);
		const NewProduct = Products.find((product) => product.productId === values.cremationProductId);
		if(NewProduct.productName === 'Communal Cremation' && OldProduct.productName !== 'Communal Cremation') {
			// Use the existing functionality from the product's page continue button, since it already does exactly what we want. We can use it as a smaller version, in our case here, we do not
			handleProductsContinueButtonClick(true, null, null, values)
		} else {
			submitForm()
		}
	}

	// Do not show the Cremation Product's price to Vets
	const showCremationProductPrice = LoggedIn && User && parseInt(User.userTypeId) === 5 ? false : true;

	return (
		<Form className="w-100">
			<div className="row">
				<div className="col-12">
					<h3><Translate id="Confirm / Upgrade Service for" /> {Order.petFirstName}
						<button type="button" className={`btn btn-sm float-right ${continueButtonClass} btn-addon`} disabled={values.productId === 0} onClick={() => handleCremationContinueButtonClick()}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id="Continue" /></button>
					</h3>
				</div>
				{/* When they change from an Individual Cremation to a Communal, show a confirmation warning */}
				{showCremationChangeWarning === true &&
					<div className="col-12 alert alert-warning">
						<Translate id="Cremation Change Warning" />
						<button type="submit" className={`btn btn-sm float-right btn-danger btn-addon ml-2`} disabled={values.productId === 0}><Translate id="Downgrade" /></button>
						<button type="button" className={`btn btn-sm float-right btn-default btn-addon`} onClick={() => handleCancelDowngrade()}><Translate id="Cancel" /></button>
					</div>
				}
			</div>
			<div className="card-deck mt-3">
				{tempCremationProducts.map((product) => {
					// Check if there is a deleted Cremation Product and display that product accordingly
					let displayPrice = 0;
					if(DeletedCremationProduct !== null) {
						displayPrice = (parseInt(DeletedCremationProduct.productId) === parseInt(product.productId) && (DeletedCremationProduct.invoiceVet === 1 || DeletedCremationProduct.paymentCompletedPetOwner === 1)) ? 'PREPAID' : `$${product.calculatedPriceRetail}`;

						// displayPrice = parseInt(values.oldCremationProductId) > 0 && parseInt(values.oldCremationProductId) !== parseInt(product.productId) && Math.subtract(values.priceChargedOldCremationProduct, product.calculatedPriceRetail) > 0 ? `-$${Math.subtract(product.calculatedPriceRetail, values.priceChargedOldCremationProduct)}` : displayPrice;
						// displayPrice = parseInt(values.oldCremationProductId) > 0 && parseInt(values.oldCremationProductId) !== parseInt(product.productId) && Math.subtract(values.priceChargedOldCremationProduct, product.calculatedPriceRetail) < 0 ? `+$${Math.subtract(product.calculatedPriceRetail, values.priceChargedOldCremationProduct)}` : displayPrice;

					} else {
						displayPrice = parseInt(values.oldCremationProductId) === parseInt(product.productId) && (values.invoiceVet === 1 || values.paymentCompletedPetOwner === 1) ? 'PREPAID' : `$${product.calculatedPriceRetail}`;

						// displayPrice = parseInt(values.oldCremationProductId) > 0 && parseInt(values.oldCremationProductId) !== parseInt(product.productId) && Math.subtract(values.priceChargedOldCremationProduct, product.calculatedPriceRetail) > 0 ? `-$${Math.subtract(product.calculatedPriceRetail, values.priceChargedOldCremationProduct)}` : displayPrice;
						// displayPrice = parseInt(values.oldCremationProductId) > 0 && parseInt(values.oldCremationProductId) !== parseInt(product.productId) && Math.subtract(values.priceChargedOldCremationProduct, product.calculatedPriceRetail) < 0 ? `+$${Math.subtract(product.calculatedPriceRetail, values.priceChargedOldCremationProduct)}` : displayPrice;
					}

					// restrict the displayPrice if showCremationProductPrice is false
					displayPrice = showCremationProductPrice ? `${displayPrice}` : '';
					let buttonClass = values.cremationProductId === product.productId ? 'border p-3 border-info' : 'border p-3';

					return (
							<div className="card border-0 mb-4 col-lg-4 p-0" key={product.productId}>
								<div className="card-header">
									{product.accountProductName !== null && product.accountProductName !== "" && <h5 className="m-0">{props.translate(product.accountProductName)}</h5>}
									{!(product.accountProductName !== null && product.accountProductName !== "") && <h5 className="m-0">{props.translate(product.productName)}</h5>}
								</div>
								<div className="card-body p-0">
									<div style={{maxHeight: 200 + 'px', overflow: 'hidden'}}>
										<ProductThumbnail product={product} size="large" speciesid={Order.speciesId} style={{width: 100 + '%', maxWidth: 100 + '%', marginTop: -25 + '%'}} />
									</div>
									{product.accountDescriptionShort !== null && product.accountDescriptionShort !== "" && <h5>{product.accountDescriptionShort}</h5>}
									{!(product.accountDescriptionShort !== null && product.accountDescriptionShort !== "") && product.descriptionShort !== null && <h5>{product.descriptionShort}</h5>}
									{product.accountDescriptionLong !== null && product.accountDescriptionLong !== "" && <div>{product.accountDescriptionLong.replace(/\[PET\]/g,Order.petFirstName)}</div>}
									{!(product.accountDescriptionLong !== null && product.accountDescriptionLong !== "" ) && product.descriptionLong !== null && <div>{product.descriptionLong.replace(/\[PET\]/g,Order.petFirstName)}</div>}
								</div>
								<div className="card-footer bg-white border-0 pb-5">
									<h3 className="text-center">{displayPrice}</h3>
									<div className="mt-3 text-center"><span className={buttonClass}>
										<div className="pretty p-default p-pulse p-round">
											<Field name="cremationProductId" component="input" type="radio" value={product.productId} checked={values.cremationProductId === product.productId} className="" />
											<div className="state p-primary">
												<label>
													{values.cremationProductId === product.productId && "SELECTED"}
													{values.cremationProductId !== product.productId && "SELECT"}
												</label>
											</div>
										</div>
									</span></div>
								</div>
							</div>
					)
				})}
			</div>
			<div className="row">
				<div className="col-12">
					<button type="button" className={`btn btn-sm float-right ${continueButtonClass} btn-addon`} disabled={values.productId === 0} onClick={() => handleCremationContinueButtonClick()}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id="Continue" /></button>
				</div>
				{/* When they change from an Individual Cremation to a Communal, show a confirmation warning */}
				{showCremationChangeWarning === true &&
					<div className="col-12 mt-2 alert alert-warning">
						<Translate id="Cremation Change Warning" />
						<button type="submit" className={`btn btn-sm float-right btn-danger btn-addon ml-2`} disabled={values.productId === 0}><Translate id="Downgrade" /></button>
						<button type="button" className={`btn btn-sm float-right btn-default btn-addon`} onClick={() => handleCancelDowngrade()}><Translate id="Cancel" /></button>
					</div>
				}
			</div>
		</Form>
	)
}

// Delivery Form Content
const DeliveryFormContent = (props) => {
	const {
		Account,
		CompanyAddresses: {CompanyAddresses},
		errors,
		handleView,
		OrderProductRemove,
		OrderProductSave,
		OrderSave,
		state: {
			view:{
				current:category
			},
			viewDefaults
		},
		Order,
		values
	} = props;
	
	// Set the Memorialization type in the values struct for use in the formik validation
	values.memorialization = Order.memorialization;

	// Set this for use in the validate function
	const Delivery = props.ProductsMemorialization.ProductsMemorialization.filter((product) => product.productCategory === 'Delivery');

	// Change the continueButtonClass to be btn-info once a Delivery Method has been selected
	const continueButtonClass = values.productId === 0 ? 'btn-default disabled' : 'btn-success';

	// On the initial load of this form, the validate function will not have run yet, so if there has not been a delivery product selected, show a warning message
	//if(values.productId === 0) errors.message = 'Please select a Delivery method before continuing';

	// This function is passed to the Delivery component, and it receives back an object with the values and names that are saved/updated in that component
	function handleDeliveryValuesUpdate(DeliveryObject) {
		if(DeliveryObject.name === 'deliveryMethodProductId') {
			DeliveryObject.name = 'productId';
			// Get the Product object for the selected delivery method
			const DeliveryProduct = Delivery.find((delivery) => delivery.productId === DeliveryObject.value);

			//const DeliveryProduct = props.ProductsMemorialization.ProductsMemorialization.filter((product) => product.productCategory === 'Delivery');

			// Then set the input for deliveryMethodName so we can use it in validation of the delivery form information
			values.deliveryMethodName = DeliveryProduct.productName;

			// If the selected deliveryMethodName that we just switched to is the SAME as the one in the Orders object, meaning that that is the currently saved method in the Orders db, then set the deliveryAddressId to the one that is saved in the Orders object.
			// The reason to do this is that if someone has already saved their address information for the Courier Delivery, we do not want to make them have to enter it again just because they clicked on to another delivery method option.
			values.deliveryAddressId = values.deliveryMethodName === Order.deliveryMethodName ? values.deliveryAddressId = Order.deliveryAddressId : 0;

			// If the delivery method chosen is 'Hospital Delivery' and there is only a single company address, preselect that as the deliveryAddressId;
			if(values.deliveryMethodName === 'Hospital Delivery' && CompanyAddresses.length === 1) {
				values.deliveryAddressId = CompanyAddresses[0].addressId;
			}

		}
		values[DeliveryObject.name] = DeliveryObject.value;
	}

	// Async function for handling when the Proceed to checkout button is clicked. This mimics the functionality of the Continue button on the Products pages when added a product (Urn/Paw Print) is needed for the cremation service selected.
	async function handleProceedToCheckoutClick() {
		///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////
		// ANY CHANGES MADE HERE ALSO NEED TO BE MADE IN order_details_component.js IN THE OrderDetailFormContent FOR submitForm FUNCTION NAME
		///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////
		if(parseInt(values.productId) === 0) {
			errors.message = 'Please select delivery location before continuing';
		}
		else if(Order.memorialization !== 'home' && (values.deliveryMethodName === 'Hospital Delivery' || ((values.deliveryMethodName === null || values.deliveryMethodName === undefined) && values.deliveryProductMethodName === 'Hospital Delivery')) && (parseInt(values.deliveryAddressId) === 0 || values.deliveryAddressId === '')) {
			errors.message = 'Please select delivery location before continuing';
		}
		else if(Order.memorialization !== 'home' && (values.deliveryMethodName === 'Courier Delivery' || ((values.deliveryMethodName === null || values.deliveryMethodName === undefined) && values.deliveryProductMethodName === 'Courier Delivery')) && (parseInt(values.deliveryAddressId) === 0 || values.deliveryAddressId === '')) {
			errors.message = 'Please save a Delivery address before continuing'
		}
		else {
			// Get the Product object for the selected delivery method
			const DeliveryProduct =  props.ProductsMemorialization.ProductsMemorialization.find((product) => product.productId === values.productId);
			// Get the productName for this delivery product
			const deliveryMethodName = DeliveryProduct.productName;
			// Set the values input for variables that are not editable in this form, just need to get them to the resolver when the mutation
			const invoiceCostCharged = DeliveryProduct.calculatedInvoiceCost;
			const invoiceCostChargedPersonalization = DeliveryProduct.calculatedInvoiceCostPersonalization;
			const priceCharged = DeliveryProduct.calculatedPriceRetail;
			const priceChargedPersonalization = DeliveryProduct.calculatedPriceRetailPersonalization;
			const productName = DeliveryProduct.productName;
			let taxRate = DeliveryProduct.taxRate !== null ? DeliveryProduct.taxRate : Account.Settings.find((setting) => setting.name === 'taxRate').value;
			// If taxRate is a string because it was obtained from the account setting for taxRate, then make it a float before passing to the db
			taxRate = typeof taxRate === 'string' && taxRate !== '' && taxRate !== null ? parseFloat(taxRate) : taxRate;

			// Clean up any old data that was saved into the databases previous which is now outdated because the delivery method has changed.
			// IMPORTant: This same functionality is in the New Order Cremation save (order_cremation_component.js, in the handleSubmit of const OrderCremationForm), so if you add things here, change them there also.
			if(deliveryMethodName !== 'Courier Delivery' && deliveryMethodName !== 'Hospital Delivery') {
				// Current options are Hand or No Delivery, so there is not going to be a deliveryAddressId, so set it to 0
				// The deliveryMethodProductId and deliveryMethodName have already been updated above in the OrderProductSave
				values.deliveryAddressId = 0;
				// LATER - we will want to delete the address if it is a 'Home' type because we have no use for a customer's address in the database if we are not delivering to their home.
			}

			await OrderSave({ input: { orderId: values.orderId, deliveryAddressId: values.deliveryAddressId, deliveryMethodName, deliveryMethodProductId: values.productId }})

			// Determine if there was already a delivery product on this order, and remove it accordingly
			if(parseInt(values.oldDeliveryProductId) === 0) {
				// There was not a previous delivery selected, so just save the productId
				// Async/Await Perform the mutation (to the server) and decompose the result.

				await OrderProductSave({ input: { invoiceCostCharged, invoiceCostChargedPersonalization, orderId: values.orderId, priceCharged, priceChargedPersonalization, productId: values.productId, productName, taxRate } });
			} else if(values.oldDeliveryProductId > 0 && values.oldDeliveryProductId !== values.productId) {
				// need to delete the old delivery productId because there is a new one and there can only be one batman
				// get the orderProductId
				const OldDeliveryProduct = Order.ProductsOrder.find((product) => product.productId === values.oldDeliveryProductId);
				await OrderProductRemove({ input: { orderId: values.orderId, orderProductId: OldDeliveryProduct.orderProductId } });

				// Async/Await Perform the mutation (to the server) and decompose the result.
				await OrderProductSave({ input: { invoiceCostCharged, invoiceCostChargedPersonalization, orderId: values.orderId, priceCharged, priceChargedPersonalization, productId: values.productId, productName, taxRate } });
			} else if(values.oldDeliveryProductId > 0) {
				// do not need to save because the delivery was not changed. Nothing needs to happen in this condition, just putting it here for reference of what the other option is.
			}

			// move to the next step, which is the checkout
			handleView('Checkout');
		}
		///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////
		// ANY CHANGES MADE HERE ALSO NEED TO BE MADE IN order_details_component.js IN THE OrderDetailFormContent FOR submitForm FUNCTION NAME
		///// IMPORTANT ///////////////// IMPORTANT ////////////// IMPORTANT ////////////////// IMPORTANT ///////////////////// IMPORTANT ////////////////
	}

	// Determine if there are any products on this order that will need to be delivered/returned - meaning anything that is not a cremation, special service, or exisiting delivery product.
	const ProductsRequiringDelivery = Order.ProductsOrder.filter((product) => product.productCategory !== "Cremations" && product.productCategory !== "Delivery" && product.productCategory !== "Optional Services");
	const showNoDelivery = ProductsRequiringDelivery.length > 0 ? false : true;
	// Check if the showNoDelivery is false and the delivery productId is the 'No Delivery', then we need to clear out that productId. This can happen if 'No delivery' was selected and then an item was added needs to be delivered
	if(showNoDelivery === false && Order.ProductsOrder.findIndex((product) => product.productName === 'No Delivery') > -1) {
		// Remove the 'no Delivery' product from this order
		OrderProductRemove({ input: { orderId: values.orderId, orderProductId: Order.ProductsOrder.find((product) => product.productName === 'No Delivery').orderProductId } });
	}

	return (
		<div className="w-100">
			<div className="row mt-2">
				<div className="col-12 text-center">
					<h4 className="mb-1"><Translate id="Delivery - Pick one" data={{petFirstName:Order.petFirstName}} /></h4>
					<img src={process.env.PUBLIC_URL + "/images/ui/in-loving-memory-of-bottom.png"} className="pb-3 pt-2" alt="" style={{maxWidth: 200 + 'px'}} />
				</div>

				{/* <div className="col-12 text-center">
					<button type="button" className="btn btn-success btn-addon mr-3" onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Previous" /></button>
					<button type="button" className={`btn btn-addon ${continueButtonClass}`} onClick={() => handleProceedToCheckoutClick()}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id="Checkout" /></button>
				</div> */}

				{/* When the Proceed To Checkout button is clicked button it is disabled */}
				{errors.message && errors.message !== '' &&
					<div className="col-12 alert alert-warning">
						<Translate id={errors.message} />
					</div>
				}

				<div className="col-12 p-0 mt-3">
					<DeliveryComponent
						CompanyAddresses={CompanyAddresses}
						deliveryAddressId={values.deliveryAddressId}
						DeliveryProducts={Delivery}
						handleDeliveryValuesUpdate={handleDeliveryValuesUpdate}
						hospitalOptions={{courierDeliveryOffered: Order.courierDeliveryOffered, crematoryPickupOffered: Order.crematoryPickupOffered, hospitalDeliveryOffered: Order.hospitalDeliveryOffered}}
						initialValues={{
							deliveryAddressId: values.deliveryAddressId,
							deliveryMethodProductId: values.productId
						}}
						memorialization={Order.memorialization}
						orderTypeId={Order.orderTypeId}
						ownerName={`${Order.ownerFirstName} ${Order.ownerLastName}`}
						showNoDelivery={showNoDelivery}
						petReferenceNumber={props.petReferenceNumber}
						productTypeId='3'
						warningMessage={errors}
					/>
				</div>
			</div>
			<div className="row mt-3 mb-5">
				<div className="col-12 text-center">
					<button type="button" className="btn btn-success btn-addon mr-3" onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Previous" /></button>
					<button type="submit" className={`btn btn-addon ${continueButtonClass}`} onClick={() => handleProceedToCheckoutClick()}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id="Checkout" /></button>
				</div>
			</div>
			{ /*
				basketButtonIcon === 'check' && 
				<div className="text-center alert alert-success mt-3 mb-0"><Translate id="Successfully Added to Basket" /></div>
			*/}
			{/* When the Proceed To Checkout button is clicked button it is disabled */}
			{errors.message && errors.message !== '' &&
				<div className="col-12 alert alert-warning">
					<Translate id={errors.message} />
				</div>
			}
		</div>
	)
}

// Delivery form - this is only available for the Private Cremations
// NOTE: For the getCompanyAddressesQuery, the returnAllAddresses is used for Crematory staff because the Hospital Delivery option will then have all of their Vet's Addresses available to choose from.
const DeliveryForm = compose (
	queryWithLoading({
		gqlString: getProductsMemorializationQuery,
		variablesFunction: (props) => ({ petReferenceNumber: props.petReferenceNumber, productTypeId: 3 }),
		name: "ProductsMemorialization"
	}),
	queryWithLoading({
		gqlString: getCompanyAddressesQuery,
		variablesFunction: (props) => ({companyId: parseInt(props.Order.companyId) > 0 ? parseInt(props.Order.companyId) : 0, returnAllAddresses: (parseInt(props.userTypeId) === 2 || parseInt(props.userTypeId) === 3) ? true : false}),
		name: "CompanyAddresses"
	}),
	withMutation(OrderProductRemoveMutation, "OrderProductRemove", ["getOrderProducts"]),
	withMutation(OrderProductSaveMutation, "OrderProductSave", ["getOrderProducts"], true),
	withMutation(OrderSaveMutation, "OrderSave", ["getOrderProducts"]),
	withFormik({
		handleSubmit: async ( input, { props: { handleView, Order, OrderProductRemove, OrderProductSave, setResponse, }} ) => {
			// IMPORTANT!! - the submit functionality now lives in the form content as a function. This was done for ease of handling the display of a warning message when the Proceed to Checkout button is clicked when there is not a delivery method selected yet.
			// Also because the courier delivery option displays the address form, and we cannot have a form within a form. So this delivery "form" cannot have a form tag.
		},
		validate: (values ) => {
			let errors = {};

			if(values.memorialization === 'home') {
				if(values.productId === 0) {
					errors.message = 'Please select a Delivery method before continuing';
				} 
			} 
			else {
				if(values.deliveryMethodName === 'Hospital Delivery' && (parseInt(values.deliveryAddressId) === 0 || values.deliveryAddressId === '')) {
					errors.message = 'Please select delivery location before continuing';
				}
				else if(values.deliveryMethodName === 'Courier Delivery' && (parseInt(values.deliveryAddressId) === 0 || values.deliveryAddressId === '')) {
					errors.message = 'Please save a Delivery address before continuing'
				}
				else if(values.productId === 0) {
					errors.message = 'Please select a Delivery method before continuing';
				}
			}
			return errors
		}
	}),
	withTranslate
)(DeliveryFormContent);

// This is the detail view of a single image that can be added to the basket.
const ProductDetailFormContent = (props) => {
	const {
		backButtonText,
		basketButtonIcon,
		basketButtonText,
		ColorVariations,
		ErrorsPersonalization,
		handleProductView,
		imageSize,
		initialLoad,
		makeBasketButtonActive,
		NewDropdownGroups,
		onlyColorVariations,
		onlySizeVariations,
		Order,
		OrderProductSave,
		OrderProductProductOptionSave,
		personalizeProduct,
		priceDisplay,
		Product,
		Product: { personalizationAllowed, personalizationDefaultedToYes, personalizationRequired },
		productAdded,
		ProductAttributes: { ProductAttributes },
		ProductAttributesText,
		ProductImage,
		ProductOptionIds,
		ProductsGroup,
		ProductsMemorialization,
		SelectedImage,
		selectedInvoiceCostCharged,
		selectedInvoiceCostChargedPersonalization,
		selectedPriceCharged,
		selectedPriceChargedPersonalization,
		selectedProductId,
		selectedColorVariationValueId,
		selectedSizeVariationValueId,
		setState,
		SizeVariations,
		taxRate,
		ValidationStruct,
		values,
		Variations,
		VariationValues
	} = props;

	// On initial load, update the personalizeProduct in state, and if there are variations for this product, set the default selection
	if(initialLoad) {
		let tempPersonalizationDefaultedToYes = personalizationDefaultedToYes === 1 || personalizationRequired === 1 ? true : false;

		let tempSelectedColorVariationValueId = selectedColorVariationValueId;
		let tempSelectedProductId = values.productId;
		let tempSelectedSizeVariationValueId = selectedSizeVariationValueId;

		// Create a temp Product object for use to send to the Image container. We will update Product.images to contain all of the Group's Product's images if there is a group
		let TempProductImage = Product;
		// Only set the default selected Color and Size variations if there are variations available - meaning that there is a product group
		let TempColorVariations = [];
		let TempSizeVariations = [];
		if(ProductsGroup.length > 0) {
			TempProductImage.images = ProductsGroup[0].ProductGroupImages;

			const { Variations, VariationValues } = ProductsGroup[0].ProductVariations;
			// Determine size first, then select the first color of that size available as the default
			TempColorVariations = VariationValues.filter((variation) => variation.productVariationType === 'Colors');
			TempSizeVariations = VariationValues.filter((variation) => variation.productVariationType === 'Sizes');
			if(TempSizeVariations.length > 0) {
				// reorder Sizes by descending price
				TempSizeVariations = TempSizeVariations.sort(function(a,b) { return parseInt(b.price) - parseInt(a.price)});
				tempSelectedSizeVariationValueId = parseInt(TempSizeVariations[0].productVariationValueId);
				// Find Variation index of the most expensive size variation, use this to temp set the selectedProductId
				let tempFindIndex = Variations.findIndex((value) => parseInt(value.productVariationValueId) === tempSelectedSizeVariationValueId && value.productVariationType === 'Sizes');
				// Set the tempSelectedProductId here - this will get overwritten below unless there are only Sizes in the group
				tempSelectedProductId = parseInt(Variations[tempFindIndex].productId);
			}

			// If there is a size, then select the first color of that size which has a matching product
			if(tempSelectedSizeVariationValueId > 0) {
				// Filter the Variations down based on SizeId
				let tempVariations = Variations.filter((variation) => parseInt(variation.productVariationValueId) === parseInt(tempSelectedSizeVariationValueId));
				// Loop the Variations matching this tempSelectedSize, and find the first associated color for a matching product
				tempVariations.forEach((size) => {
					// Check if there is a matching color selected yet
					if(tempSelectedColorVariationValueId === 0) {
						let tempFindIndex = Variations.findIndex((variation) => parseInt(variation.productId) === parseInt(Product.productId) && variation.productVariationType === 'Colors');
						tempSelectedColorVariationValueId = tempFindIndex > -1 ? parseInt(Variations[tempFindIndex].productVariationValueId) : 0;
						// Overwrite the productId that was set based only on the Size - now set it based on the selected Size and Color.

						tempSelectedProductId = tempFindIndex > -1 ? parseInt(Variations[tempFindIndex].productId) : tempSelectedProductId;
					}
				})
			}
			else {
				let tempColorIndex = VariationValues.findIndex((value) => value.productVariationType === 'Colors')
				tempSelectedColorVariationValueId = tempColorIndex > -1 ? parseInt(VariationValues[tempColorIndex].productVariationValueId) : tempSelectedColorVariationValueId;
				tempSelectedProductId = tempColorIndex > -1 ? parseInt(Variations[tempColorIndex].productId) : tempSelectedProductId;
			}
		}

		// START PERSONALIZATION SETTINGS
			// IMPORTANT IMPORTANT IMPORTANT !!!!!!!!!!!!!!!!!!! THIS SAME FUNCTIONALITY IS USED IN THE BASKET'S "ADD ENGRAVING" BUTTON FUNCTION. MAKE DUPLICATE CHANGES. SEARCH: FJAJLADSMFALAS
			// Break Product Attributes into groups of Downdown and Text
			let TempProductAttributesDropdown = ProductAttributes.filter((attribute) => attribute.typeName === 'Dropdown');
			let TempProductAttributesText = ProductAttributes.filter((attribute) => attribute.typeName === 'Text');

			let TempProductOptionIds = [];  // list of the product option Ids that will help use parse the dynamically created variables for the productOptionValueId-
			let TempNewDropdownGroups = [];
			let TempValidationStruct = { greaterThanZero: [], notBlank: [] }; // This validation struct will contain the product options that have isRequired flagged in the productAttributes table.

			// Break Dropdown option types into groups based on the productOptionId
			// Notes on how the input naming and parsing works are in the handleSubmit function of withFormik below
			if(TempProductAttributesDropdown.length > 0) {
				TempProductAttributesDropdown.forEach((attribute) => {
					// Check if this productOptionId already has an index within the newDropdownGroups array
					const newDropdownGroupsIndex = TempNewDropdownGroups.findIndex((group) => group.productOptionId === attribute.productOptionId);
					if(newDropdownGroupsIndex > -1) {
						// Add this attribute to the existing array index
						TempNewDropdownGroups[newDropdownGroupsIndex].attributes.push(attribute);
					}
					else {
						// Create a new array item for this productOptionId
						TempNewDropdownGroups.push({optionName: attribute.optionName, productOptionId: attribute.productOptionId, attributes: [attribute]});

						// Add productOptionId to the list
						TempProductOptionIds.push(attribute.productOptionId);

						// Add this input into the valiationStruct for greaterThanZero if the productOption is required
						if(attribute.productOptionRequired === 1 || attribute.productOptionRequired === true) {
							TempValidationStruct.greaterThanZero.push(`productOptionValueId-${attribute.productOptionId}`);
						}
					}

					// Create this new variable and place into values object so that we can validate it if needed - if we do not do this, and the user never clicks on the select input, the variable does not get placed into the values object and we cannot do validation.
					if(values[`productOptionValueId-${attribute.productOptionId}`] === undefined) {
						values[`productOptionValueId-${attribute.productOptionId}`] = 0;
					}
				})
			}
			if(TempProductAttributesText.length > 0) {
				TempProductAttributesText.forEach((attribute) => {
					// Add productOptionId to the list
					TempProductOptionIds.push(attribute.productOptionId);

					// Add this input into the valiationStruct for greaterThanZero if the productOption is required
					if(attribute.productOptionRequired === 1 || attribute.productOptionRequired === true) {
						TempValidationStruct.notBlank.push(`productOptionId-${attribute.productOptionId}`);
					}
					// Create this new variable and place into values object so that we can validate it if needed - if we do not do this, and the user never clicks on the select input, the variable does not get placed into the values object and we cannot do validation.
					if(values[`productOptionId-${attribute.productOptionId}`] === undefined) {
						values[`productOptionId-${attribute.productOptionId}`] = '';
					}
				})
			}
		// END PERSONALIZATION SETTINGS

		// START INVOICE AND PRICES SETTING FOR PRODUCT
			// The 'let' outside of the conditional is setting the default product or single product data, then if this is a productGroup, set the prices for the selected productId
			let tempSelectedInvoiceCostCharged = Product.promotionalInvoiceCost === null ? Product.calculatedInvoiceCost : Product.promotionalInvoiceCost;
			// let tempSelectedInvoiceCostChargedPersonalization = Product.promotionalInvoiceCostPersonalization === null ? Product.calculatedInvoiceCostPersonalization : Product.promotionalInvoiceCostPersonalization;
			// The price changes will be the promotional price charged if it is defined otherwise the calculated retail price.
			let tempSelectedPriceCharged = Product.promotionalPriceRetail === null ?  Product.calculatedPriceRetail : Product.promotionalPriceRetail;
			// The personalization price charged will be the promotional personalization price if it is defined, otherwise the calculated price.
			let tempSelectedPriceChargedPersonalization = Product.promotionalPriceRetailPersonalization === undefined || Product.promotionalPriceRetailPersonalization === null ? Product.calculatedPriceRetailPersonalization: Product.promotionalPriceRetailPersonalization;
			let tempSelectedInvoiceCostChargedPersonalization = tempSelectedPriceChargedPersonalization;

			if(ProductsGroup.length > 0) {
				let TempSelectedProduct = ProductsGroup[0].ProductGroupProducts.find((product) => parseInt(product.productId) === parseInt(tempSelectedProductId));
				tempSelectedInvoiceCostCharged = TempSelectedProduct.promotionalInvoiceCost === null ? TempSelectedProduct.calculatedInvoiceCost : TempSelectedProduct.promotionalInvoiceCost;
				// tempSelectedInvoiceCostChargedPersonalization = TempSelectedProduct.promotionalInvoiceCostPersonalization === null ? TempSelectedProduct.calculatedInvoiceCostPersonalization : TempSelectedProduct.promotionalInvoiceCostPersonalization;
				tempSelectedPriceCharged = TempSelectedProduct.promotionalPriceRetail === null ?  TempSelectedProduct.calculatedPriceRetail : TempSelectedProduct.promotionalPriceRetail;
				tempSelectedPriceChargedPersonalization = TempSelectedProduct.promotionalPriceRetailPersonalization === undefined || TempSelectedProduct.promotionalPriceRetailPersonalization === null ? TempSelectedProduct.calculatedPriceRetailPersonalization: TempSelectedProduct.promotionalPriceRetailPersonalization;
				tempSelectedInvoiceCostChargedPersonalization = tempSelectedPriceChargedPersonalization;
			}
			// Clean zeroes off end of price if .00
			let tempDisplayPrice = tempSelectedPriceCharged.substring(tempSelectedPriceCharged.length-2, tempSelectedPriceCharged.length) === '00' ? parseInt(tempSelectedPriceCharged.substring(0, tempSelectedPriceCharged.length-3)) : tempSelectedPriceCharged;
		// END INVOICE AND PRICES SETTING FOR PRODUCT

		// START IMAGES SETTING FOR PRODUCT
			// IMAGES FIX - somehow if you click to the same product twice in a session, the images duplicate. This will loop through and remove any duplicates.
			let tempImages = TempProductImage.images.filter((image, index) => TempProductImage.images.indexOf(image) === index);
			TempProductImage.images = tempImages;

			// Set product Image size based on the window size
			let mediumWidth = 768;
			let tempImageSize = window.innerWidth >= mediumWidth ? "large" : "medium";
		// END IMAGES SETTING FOR PRODUCT

		// If this product is part of a ProductGroup, break out the ProductVariation struct into its pieces for ease of use in the form display.
		let TempVariationValues = ProductsGroup.length > 0 ? ProductsGroup[0].ProductVariations.VariationValues.sort(function(a,b) { return parseInt(b.price) - parseInt(a.price)}).sort(function(a,b) { return parseInt(b.productVariationTypeId) - parseInt(a.productVariationTypeId)}) : [];
		let TempVariations = ProductsGroup.length > 0 ? ProductsGroup[0].ProductVariations.Variations : [];
		let tempOnlyColorVariations = TempVariationValues.length > 0 && TempVariationValues.findIndex((variation) => variation.productVariationType === "Sizes") === -1 ? true : false;
		let tempOnlySizeVariations = TempVariationValues.length > 0 && TempVariationValues.findIndex((variation) => variation.productVariationType === "Colors") === -1 ? true : false;
		
		setState({ 
			ColorVariations: TempColorVariations,
			ErrorsPersonalization: {},
			imageSize: tempImageSize,
			initialLoad: false, 
			NewDropdownGroups: TempNewDropdownGroups,
			onlyColorVariations: tempOnlyColorVariations,
			onlySizeVariations: tempOnlySizeVariations,
			personalizeProduct: tempPersonalizationDefaultedToYes,
			priceDisplay: tempDisplayPrice,
			ProductAttributesDropdown: TempProductAttributesDropdown,
			ProductAttributesText: TempProductAttributesText,
			ProductImage: TempProductImage,
			ProductOptionIds: TempProductOptionIds,
			selectedColorVariationValueId: tempSelectedColorVariationValueId,
			SelectedImage: TempProductImage.defaultImage,
			selectedInvoiceCostCharged: tempSelectedInvoiceCostCharged,
			selectedInvoiceCostChargedPersonalization: tempSelectedInvoiceCostChargedPersonalization,
			selectedPriceCharged: tempSelectedPriceCharged,
			selectedPriceChargedPersonalization: tempSelectedPriceChargedPersonalization,
			selectedProductId: tempSelectedProductId,
			selectedSizeVariationValueId: tempSelectedSizeVariationValueId,
			SizeVariations: TempSizeVariations,
			ValidationStruct: TempValidationStruct,
			Variations: TempVariations,
			VariationValues: TempVariationValues
		});

				// CODE BELOW IS FOR SHOWING SPECIES SPECIFIC IMAGES - USE FOR FUTURE VERSIONS.
				// If there is a speciesid passed in, then check if the default image (in the TempProductImage object) is specific for that species.
				// If it is not, then check if any of the other images are for that species, and make the first matching one the SelectedImage instead.
				// if(speciesId > 0) {
				// 	if(TempProductImage.defaultImage && TempProductImage.defaultImage.Species && TempProductImage.defaultImage.Species.length > 0) {
				// 		const matchingSpeciesIndex = TempProductImage.defaultImage.Species.findIndex((species) => parseInt(species.speciesId) === parseInt(speciesId));
				// 		if(matchingSpeciesIndex === -1) {
				// 			// Since the species does not match the default image, check if there are any other images for this product that are species to this species.
				// 			//Otherwise, choose an image that does not have a species specified over one that has a non-matching species specified

				// 			// Same functionality here as in the below else (OPTION 1)
				// 			const anyMatchingSpeciesIndex = TempProductImage.images.filter((productImage) => productImage.Species.length > 0 && productImage.productImageId !== TempProductImage.defaultImage.productImageId);
				// 			if(anyMatchingSpeciesIndex.length > 0) {
				// 				// Just need to find the first image that matches the speciesId to use as a default
				// 				let foundMatchingSpeciesImage = false;
				// 				anyMatchingSpeciesIndex.forEach((productImage) => {
				// 					const newDefaultIndex = productImage.Species.findIndex((species) => parseInt(species.speciesId) === parseInt(speciesId));
				// 					if(newDefaultIndex > -1) {
				// 						foundMatchingSpeciesImage = true;
				// 						tempImage = productImage;
				// 					}
				// 				});

				// 				// If no match is found, just set the default to the first image that does not have any Species array.
				// 				if(foundMatchingSpeciesImage === false) {
				// 					// Same functionality here as in the below else (OPTION 2)
				// 					const noSpeciesArrayImages = TempProductImage.images.filter((productImage) => productImage.Species.length === 0);
				// 					if(noSpeciesArrayImages.length > 0) {
				// 						tempImage = noSpeciesArrayImages[0];
				// 					}
				// 				}
				// 			} else {
				// 				// Same functionality here as in the above if (OPTION 2)
				// 				const noSpeciesArrayImages = TempProductImage.images.filter((productImage) => productImage.Species.length === 0);
				// 				if(noSpeciesArrayImages.length > 0) {
				// 					tempImage = noSpeciesArrayImages[0];
				// 				}
				// 			}
				// 		}
				// 	} else {
				// 		// Same functionality here as in the above if (OPTION 1)
				// 		const anyMatchingSpeciesIndex = TempProductImage.images.filter((productImage) => productImage.Species.length > 0);
				// 		if(anyMatchingSpeciesIndex.length > 0) {
				// 			// Just need to find the first image that matches the speciesId to use as a default
				// 			anyMatchingSpeciesIndex.forEach((productImage) => {
				// 				const newDefaultIndex = productImage.Species.findIndex((species) => parseInt(species.speciesId) === parseInt(speciesId));
				// 				if(newDefaultIndex > -1) {
				// 					tempImage = productImage;
				// 				}
				// 			})
				// 		} 
				// 		else if(useDefaultImage === true) {
				// 			tempImage = TempProductImage.defaultImage;
				// 		}
				// 	}
				// } 
				// else if(useDefaultImage === true) {
				// 	tempImage = TempProductImage.defaultImage;
				// }
	}


	// This temp var is used in the Product Variations map as a set key
	// let tempType;

	// TempOrderProductProductOptionSave
	async function TempOrderProductProductOptionSave(input) {
		return await OrderProductProductOptionSave({ input: {...input} })
	}

	// Save product functionality when ' Add to Basket' is clicked
	async function clickAddToBasket() {
		// Set the input save variables
		// If taxRate is a string because it was obtained from the account setting for taxRate, then make it a float before passing to the db
		let tempInput = {
			invoiceCostCharged: selectedInvoiceCostCharged,
			invoiceCostChargedPersonalization: selectedInvoiceCostChargedPersonalization,
			orderId: parseInt(Order.orderId),
			personalizeProduct,
			priceCharged: selectedPriceCharged,
			priceChargedPersonalization: selectedPriceChargedPersonalization,
			parentCategory: Product.parentCategory,
			pricingAlreadyCalculated: true,
			productCategory: Product.productCategory,
			productId: parseInt(selectedProductId),
			productName: values.productName,
			taxRate
		}

		// If this was a Group of products, update the productName because we are not updating that each time the variations are selected.
		if(ProductsGroup.length > 0) {
			tempInput = {
			...tempInput,
				productName: ProductsMemorialization.find((product) => parseInt(product.productId) === parseInt(selectedProductId)).productName,
			}
		}

		// Perform validation if there is any for the personalized inputs
		let TempErrorsPersonalization = ErrorsPersonalization;

		if(personalizeProduct === true) {
			// Valid dropdown inputs that need to have an option selected
			if(ValidationStruct.greaterThanZero.length > 0) {
				ValidationStruct.greaterThanZero.forEach((variableNametoValidate) => {
					if(parseInt(values[variableNametoValidate]) === 0 || values[variableNametoValidate] === undefined) {
						TempErrorsPersonalization[variableNametoValidate] = 'Please select an option';
					} else {
						delete TempErrorsPersonalization[variableNametoValidate];
					}
				})
			}

			// Valid text inputs that need to have a string entered
			if(ValidationStruct.notBlank.length > 0) {
				ValidationStruct.notBlank.forEach((variableNametoValidate) => {
					if(values[variableNametoValidate] === '' || values[variableNametoValidate] === undefined) {
						TempErrorsPersonalization[variableNametoValidate] = 'Please complete this field';
					} else {
						delete TempErrorsPersonalization[variableNametoValidate];
					}
				})
			}

			// Add 10 dolalrs to the personalization cost if the 3rd line of text is used
			if(values['productOptionId-10'] && values['productOptionId-10'] !== '') {
				tempInput.invoiceCostChargedPersonalization = Math.add(tempInput.invoiceCostChargedPersonalization, 10).toString();
				tempInput.priceChargedPersonalization = Math.add(tempInput.priceChargedPersonalization, 10).toString();
			}
		}

		if(_.isEmpty(TempErrorsPersonalization) === true) {
			// NEW NEW NEW NEW NEW NEW NEW  Sept 2020!!!!!!!
			// PRODUCT QUANTITY SELECTED - save a product to this order that many times!!!
			let i;
			for(i = 0; i < parseInt(values.productQuantity); i++) {
				const { data: { orderProductSave }} = await OrderProductSave({ input: tempInput });

				// If there are any IDs in the input.productOptionIds, then we need to loop through that list to get all of the input values for those productOptionId
				// 1a) For DROPDOWNS, the name of those inputs is productOptionValueId-X, where X is the integer ID value of the productOption (the productOptionId) whose value is being selected in the dropdown.
				// 1b) The value of each select option is the literal integer ID value of the productOptionValue (the productOptionValueId).
				// 2a) For TEXT inputs, the name of those inputs is productOptionId-X, where X is the integer ID value of the productOption (the productOptionId).
				// 2b) Since it is a text input, the value of that input is simply a string, and the productOptionValueId is 1 (TEXT)
				// Each of these productOptionId values discussed above get added into the productOptionIds array, and we can tell if it is a text or dropdown based on if there is an input.productOptionId-X or input.productOptionValueId-X where X is the value in the productOptionIds array.

				if( personalizeProduct === true && ProductOptionIds.length > 0) { // Also check for personalizeProduct = true here because if we toggle off the personaliation, the inputs stay.
					let productOptionText = '';
					let productOptionIdItem = 0;
					let productOptionValueId = 0;
					ProductOptionIds.forEach((option) => {
						productOptionIdItem = parseInt(option);
						productOptionText = values[`productOptionId-${productOptionIdItem}`];
						productOptionValueId = values[`productOptionValueId-${productOptionIdItem}`];
						if(productOptionValueId > 0) {
							// This is the functionality for saving dropdown options
							const ProductAttribute = ProductAttributes.find((attribute) => parseInt(attribute.productOptionId) === productOptionIdItem && attribute.productOptionValueId === productOptionValueId);
							// This function attempts to address the productOptions not getting loaded back into the Order object after saving, which for personalization needs to be there in the basket for confirm engraving
							TempOrderProductProductOptionSave({
								orderProductId: orderProductSave.OrderProduct.orderProductId,
								productOptionId: productOptionIdItem,
								productOptionValueId,
								optionName: ProductAttribute.optionName,
								textString: '',
								valueLabel: ProductAttribute.valueLabel
							})

							
						} else if(productOptionText) {
							// productOptionText will be undefined if this is not a text input
							// This is the functionality for saving text options
							const ProductAttribute = ProductAttributes.find((attribute) => parseInt(attribute.productOptionId) === parseInt(productOptionIdItem) && attribute.valueLabel === "TEXT");
							// This function attempts to address the productOptions not getting loaded back into the Order object after saving, which for personalization needs to be there in the basket for confirm engraving
							TempOrderProductProductOptionSave({
								orderProductId: orderProductSave.OrderProduct.orderProductId,
								productOptionId: productOptionIdItem,
								productOptionValueId: ProductAttribute.productOptionValueId,
								optionName: ProductAttribute.optionName,
								textString: productOptionText,
								valueLabel: ProductAttribute.valueLabel
							})
						}
					})
				}
			}

			// For only memorialization In Clinic - when an Urn is added, make the Review Basket link active. This variable activates a callback in the handleProductView setState
			// let tempMakeBasketButtonActive = memorialization === 'clinic' && (Product.parentCategory === 'Urns' || Product.productCategory === 'Urns') ? true : false;
			//makeBasketButtonActive: tempMakeBasketButtonActive

			// Update the navigation buttons after the product is added
			// Because we are using the values input for the personalization we have to check that the 3rd line was used, and if so, update the 'priceDisplay', to include that extra $10.
				// This priceDisplay will then be updated with any change of state next if they want to add another of this same product
			//let tempPriceDisplay = personalizeProduct === true && values['productOptionId-10'] && values['productOptionId-10'] !== '' ? Math.add(priceDisplay, 10) : priceDisplay;
			//priceDisplay: tempPriceDisplay

			setState({
				backButtonText: 'Return to Products',
				basketButtonIcon: 'check',
				basketButtonText: 'Added to Basket',
				productAdded: true
			})
			//setResponse(tempOrderProductResponse);
			// Close the product details view, go back to the Products view they were on before clicking into the details
			//handleProductView(0, tempOrderProductResponse, makeBasketButtonActive);
		} else {
			// Set Perzonalization Errors in state
			setState({ ErrorsPersonalization: TempErrorsPersonalization })
		}
	}


	// Function for onClick button for variation types
	function selectVariationType(variation) {
		if(productAdded === false) {
			const {
				productVariationType,
				productVariationValueId
			} = variation.value;

			let tempSelectedProductId = selectedProductId;
			let tempSelectedColorVariationValueId = selectedColorVariationValueId;
			let tempSelectedSizeVariationValueId = selectedSizeVariationValueId;

			if(variation.value.productVariationType === 'Sizes') {
				// Find the new productId that matches this color and size, if there are color and size variations. Otherwise just update to the clicked on Size.
				if(onlySizeVariations) {
					// Set the values object's selectedProductId for use in the input struct of the handleSubmit when the Product is added to the basket.
					let tempVariations = Variations.find((value) => parseInt(value.productVariationValueId) === parseInt(productVariationValueId));
					tempSelectedProductId = parseInt(tempVariations.productId);
					tempSelectedSizeVariationValueId = parseInt(productVariationValueId)
				} else {
					// Filter the Variations down based on SizeId
					let tempVariations = Variations.filter((v) => v.productVariationType === 'Sizes' && parseInt(v.productVariationValueId) === parseInt(productVariationValueId));
					// Loop the Variations matching this tempSelectedSize, and find the first associated color for a matching product
					tempVariations.forEach((size) => {
						// Check if the selectedProductId has been updated
						if(tempSelectedProductId === selectedProductId) {
							let tempFindIndex = Variations.findIndex((variation) => parseInt(variation.productId) === parseInt(size.productId) && variation.productVariationType === 'Colors' && parseInt(variation.productVariationValueId) === parseInt(selectedColorVariationValueId));
							// Update selectedProductId
							tempSelectedProductId = tempFindIndex > -1 ? parseInt(Variations[tempFindIndex].productId) : parseInt(tempSelectedProductId);
						}
					})
					tempSelectedSizeVariationValueId = parseInt(productVariationValueId);
				}
			} else if(productVariationType === 'Colors') {
				// Find the new productId that matches this color and size, if there are color and size variations. Otherwise just update to the clicked on Color.
				if(onlyColorVariations) {
					// Set the values object's selectedProductId for use in the input struct of the handleSubmit when the Product is added to the basket.
					let tempVariations = Variations.find((value) => parseInt(value.productVariationValueId) === parseInt(productVariationValueId));
					tempSelectedProductId = parseInt(tempVariations.productId);
					tempSelectedColorVariationValueId = parseInt(productVariationValueId);
				} else {
					// Filter the Variations down based on ColorId
					let tempVariations = Variations.filter((v) => v.productVariationType === 'Colors' && parseInt(v.productVariationValueId) === parseInt(productVariationValueId));
					// Loop the Variations matching this tempSelectedColor, and find the first associated size for a matching product
					tempVariations.forEach((color) => {
						// Check if the selectedProductId has been updated
						if(tempSelectedProductId === selectedProductId) {
							let tempFindIndex = Variations.findIndex((variation) => parseInt(variation.productId) === parseInt(color.productId) && variation.productVariationType === 'Sizes' && parseInt(variation.productVariationValueId) === parseInt(selectedSizeVariationValueId));
							// Update selectedProductId
							tempSelectedProductId = tempFindIndex > -1 ? parseInt(Variations[tempFindIndex].productId) : tempSelectedProductId;
						}
					})
					tempSelectedColorVariationValueId = parseInt(productVariationValueId);
				}
			}

			// Update invoicing and pricing for newly selected product
			let TempSelectedProduct = ProductsGroup[0].ProductGroupProducts.find((product) => parseInt(product.productId) === parseInt(tempSelectedProductId));

			let tempSelectedInvoiceCostCharged = TempSelectedProduct.promotionalInvoiceCost === null ? TempSelectedProduct.calculatedInvoiceCost : TempSelectedProduct.promotionalInvoiceCost;
			//let tempSelectedInvoiceCostChargedPersonalization = TempSelectedProduct.promotionalInvoiceCostPersonalization === null ? TempSelectedProduct.calculatedInvoiceCostPersonalization : TempSelectedProduct.promotionalInvoiceCostPersonalization;
			let tempSelectedPriceCharged = TempSelectedProduct.promotionalPriceRetail === null ?  TempSelectedProduct.calculatedPriceRetail : TempSelectedProduct.promotionalPriceRetail;
			let tempSelectedPriceChargedPersonalization = TempSelectedProduct.promotionalPriceRetailPersonalization === undefined || TempSelectedProduct.promotionalPriceRetailPersonalization === null ? TempSelectedProduct.calculatedPriceRetailPersonalization: TempSelectedProduct.promotionalPriceRetailPersonalization;
			// Until the price calculations get updated, we need to just set the invoice charged to be the same as retail.
			let tempSelectedInvoiceCostChargedPersonalization = tempSelectedPriceChargedPersonalization;
			
			// Update the priceDisplay based on the new selection
			let cleanSelectedPrice = tempSelectedPriceCharged.substring(tempSelectedPriceCharged.length-2, tempSelectedPriceCharged.length) === '00' ? parseInt(tempSelectedPriceCharged.substring(0, tempSelectedPriceCharged.length-3)) : tempSelectedPriceCharged;
			let tempPriceDisplay = personalizeProduct === false ? cleanSelectedPrice : Math.add(tempSelectedPriceCharged, tempSelectedPriceChargedPersonalization);

			// Update the SelectedImage in state with the first of the matching productId's images. IF there is an image for that specific variation combination
			let tempImageIndex = ProductImage.images.findIndex((image) => parseInt(image.productId) === parseInt(tempSelectedProductId));
			let TempSelectedImage = tempImageIndex > -1 ? ProductImage.images[tempImageIndex] : SelectedImage;

			setState({ 
				backButtonText: 'No Thanks',
				basketButtonIcon: 'cart-plus',
				basketButtonText: 'Add to Basket',
				priceDisplay: tempPriceDisplay,
				selectedColorVariationValueId: tempSelectedColorVariationValueId,
				SelectedImage: TempSelectedImage,
				selectedInvoiceCostCharged: tempSelectedInvoiceCostCharged,
				selectedInvoiceCostChargedPersonalization: tempSelectedInvoiceCostChargedPersonalization,
				selectedPriceCharged: tempSelectedPriceCharged,
				selectedPriceChargedPersonalization: tempSelectedPriceChargedPersonalization,
				selectedProductId: tempSelectedProductId,
				selectedSizeVariationValueId: tempSelectedSizeVariationValueId
			});
		}
	} // End of Function for onClick button for variation types

	// Function for when the Perosnalization toggle is clicked
	function clickPersonalization() {
		if(productAdded === false) {
			let cleanSelectedPrice = selectedPriceCharged.substring(selectedPriceCharged.length-2, selectedPriceCharged.length) === '00' ? parseInt(selectedPriceCharged.substring(0, selectedPriceCharged.length-3)) : selectedPriceCharged;
			let tempPriceDisplay = personalizeProduct === true ? cleanSelectedPrice : Math.add(selectedPriceCharged, selectedPriceChargedPersonalization);

			// Remove personalization input errors and values
			let TempErrorsPersonalization = personalizeProduct === true ? {} : ErrorsPersonalization;

			setState({
				ErrorsPersonalization: TempErrorsPersonalization,
				personalizeProduct: !personalizeProduct,
				priceDisplay: tempPriceDisplay
			})
		}
	}

	// Function to add in the a possible discount.
	function displayPrice(){
		const {
			promotionalPriceRetail
		} = Product;

		// Remove the decimal zeros if the price is $85.00, then show $85.
		let tempPrice = Product.calculatedPriceRetail;
		tempPrice = tempPrice.substring(tempPrice.length-2, tempPrice.length) === '00' ? tempPrice.substring(0, tempPrice.length-3) : tempPrice;

		if(ProductsGroup.length > 0 && ProductsGroup[0].ProductGroupProducts.length > 1) { //All products will have a single array for the ProductsGroup, even the single products are in a Group 'None'. But Their ProductGroupProducts will be 1.
			tempPrice = priceDisplay;
			//tempPrice = tempPrice.substring(tempPrice.length-2, tempPrice.length) === '00' ? parseInt(tempPrice.substring(0, tempPrice.length-3)) : tempPrice;
			if(personalizeProduct) {
				// Add $10 for the Thiurd line of engraving if there is one
				if(values['productOptionId-10'] && values['productOptionId-10'] !== '') {
					tempPrice = Math.add(tempPrice, 10)
				}
			}
			return `$${tempPrice}`;
		}
		else if ( promotionalPriceRetail ) {
			let tempPromotionalPrice = Product.promotionalPriceRetail;
			tempPromotionalPrice = tempPromotionalPrice.substring(tempPromotionalPrice.length-2, tempPromotionalPrice.length) === '00' ? tempPromotionalPrice.substring(0, tempPromotionalPrice.length-3) : tempPromotionalPrice;
			if(tempPrice !== tempPromotionalPrice) {
				return (
					<React.Fragment>
						<del className="mr-1">${tempPrice}</del>
						${tempPromotionalPrice}
					</React.Fragment>
				);
			} else {
				return `$${tempPromotionalPrice}`;
			}
		} else {
			return `$${tempPrice}`;
		}
	}

	function displayPersonalizationPrice(Product) {
		if( Product.promotionalPriceRetailPersonalization !== null && Product.promotionalPriceRetailPersonalization !== Product.calculatedPriceRetailPersonalization) {
			return (
				<React.Fragment>
					Engrave this item for <del>${Product.calculatedPriceRetailPersonalization}</del> ${Product.promotionalPriceRetailPersonalization}{personalizationRequired === 0 && '?'}
				</React.Fragment>
			);
		} else {
			if(Product.calculatedPriceRetailPersonalization === 0 || Product.calculatedPriceRetailPersonalization === '0.00') {
				return (
					<React.Fragment>
						Engraving for this item is included
					</React.Fragment>
				);
			} else {
				let price = Product.calculatedPriceRetailPersonalization;
				price = price.substring(price.length-2, price.length) === '00' ? price.substring(0, price.length-3) : price;
				return (
					<React.Fragment>
						Engrave this item for ${price}{personalizationRequired === 0 && '?'}
					</React.Fragment>
				);
			}
		}
	}

	function handleImageDisplay(productImageId) {
		setState({
			SelectedImage: ProductImage.images.find((image) => parseInt(image.productImageId) === parseInt(productImageId))
		})
	}

	let width = window.innerWidth;
	let phoneWidth = 575;
	let tabletWidth = 768;
	// let pageSizeComputer = false;
	let pageSizePhone = false;
	let pageSizeTablet = false;
	let pageSizeTiny = false;
	if(width < 280) pageSizeTiny = true;
	else if(width < phoneWidth) pageSizePhone = true;
	else if(width <= tabletWidth) pageSizeTablet = true;
	// else if(width > tabletWidth) pageSizeComputer = true;

	return (
		<React.Fragment>
			<Form className="w-100 p-2 mb-5">
				<div className="row">
					{
						_.isEmpty(ProductImage) === false && 
						<div className="col-lg-6 col-md-12 col-sm-12 text-center">
							<ProductImageThumbnail productImage={SelectedImage} size={imageSize} style={{maxHeight: 100+'%', maxWidth: 100+'%',}} />
							{/*onClick={onClick.bind(null, productImage)} */}
							{ProductImage.images.length > 1 &&
								<div className="row justify-content-center">
									{ProductImage.images.map((productImage, index) => {
										if(productImage.uniqueImage === 1) {
											return (
												<div key={productImage.productImageId || index} className="col-3 pl-0 pr-0" onClick={() => handleImageDisplay(productImage.productImageId)} >
													<ProductImageThumbnail productImage={productImage} size="tiny" />
												</div>
											);
										} else {
											return false;
										}
									})}
								</div>
							}
						</div>
					}
					<div className="col-lg-6 col-md-12 col-sm-12">
						<div className="row mt-3">
							<h4 className="col-12 mb-2">
								{
									ProductsGroup.length > 0 &&
									<React.Fragment>
										{ProductsGroup[0].productGroup} {basketButtonIcon!=='check' && `- ${displayPrice()}`}
									</React.Fragment>
								}
								{
									ProductsGroup.length === 0 &&
									<React.Fragment>
										{Product.productName} - {displayPrice()}
									</React.Fragment>
								}
							</h4>
						</div>
						<div className="text-justify mb-2">{Product.descriptionLong}</div>
						{/* Product selector for products within the same Product Group as this product	*/}
						{/* Logic in the container div below's clasName is that there will be a mr-3 on the weight display div, so if there are Sizes only, we don't need a mb-3 class on this top container div below */}
						{
							ProductsGroup.length > 0 &&
							<React.Fragment>
								{
									ColorVariations.length > 0 &&
									<React.Fragment>
										<div className={`${false && (pageSizeTiny || pageSizePhone) && 'text-center'} h5`}><Translate id="Available Colors" /></div>
										<div className={`row pl-1 pr-1 mb-3 ml-1 ${false && (pageSizeTiny || pageSizePhone) && 'justify-content-center'}`}>
											{ColorVariations.map((value, index) => {
												let buttonClass = parseInt(value.productVariationValueId) === parseInt(selectedColorVariationValueId) ? 'btn-success' : 'btn-default';
												return (
													<div key={`color-${index}`} className={`${(pageSizeTiny) && 'col-auto'} ${(pageSizePhone || pageSizeTablet) && 'col-auto'} mb-2 p-0 pr-2`}>
														<button type="button" onClick={() => selectVariationType({value})} disabled={productAdded} className={`btn btn-sm ${buttonClass} mr-2 pt-2 pb-2 w-100 ${productAdded && 'disabled'}`}>
															<div className="h5 mb-1">{value.productVariationValue}</div>
															{/* {onlyColorVariations === true && <div className="h6">${value.price}</div>} */}
														</button>
													</div>
												)
											})}
										</div>
									</React.Fragment>
								}
								{
									SizeVariations.length > 0 &&
									<React.Fragment>
										<div className={`${false && (pageSizeTiny || pageSizePhone) && 'text-center'} h5`}><Translate id="Available Sizes" /></div>
										<div className={`row pl-1 pr-1 ml-1 ${false && (pageSizeTiny || pageSizePhone) && 'justify-content-center'}`}>
											{SizeVariations.map((value, index) => {
												let buttonClass = parseInt(value.productVariationValueId) === parseInt(selectedSizeVariationValueId) ? 'btn-success' : 'btn-default';
												return(
													<div key={`size-${index}`} className={`${(pageSizeTiny) && 'col-auto'} ${false && (pageSizePhone || pageSizeTablet) && 'col-auto'} mb-2 p-0 pr-2`}>
														<button type="button" onClick={() => selectVariationType({value})} disabled={productAdded} className={`btn btn-sm ${buttonClass} mr-2 pt-2 w-100 ${productAdded && 'disabled'}`}>
															<div className="h5 mb-1">{value.productVariationValue}</div>
															<div className="h6">${value.price}</div>
														</button>
													</div>
												)
											})}
										</div>
										<div className={`mb-3 ${false && (pageSizeTiny || pageSizePhone) && 'text-center'}`}>
											(<Translate id="Pets weighing up to" /> {ProductsGroup[0].ProductGroupProducts.find((product) => parseInt(product.productId) === parseInt(selectedProductId)).petWeightMax} {(props.Account.getSettingValue('measurementSystem') === 'English' && 'lb') || 'kg'})
										</div>
									</React.Fragment>
								}
								{/* <div className={`${(onlyColorVariations || (!onlyColorVariations && VariationValues.findIndex((value) => value.productVariationType === 'Colors') > -1)) && 'mb-3'}`}>
									{VariationValues.map((value, index) => {
										// Set the button's className based on if it is the selected Size/Color in state.								
										let buttonClass = 'btn btn-sm btn-default mr-2';

										if(value.productVariationType === 'Sizes') {
											buttonClass = parseInt(value.productVariationValueId) === parseInt(selectedSizeVariationValueId) ? 'btn btn-sm btn-success mr-2': buttonClass;
										} else if(value.productVariationType === 'Colors') {
											buttonClass = parseInt(value.productVariationValueId) === parseInt(selectedColorVariationValueId) ? 'btn btn-sm btn-success mr-2' : buttonClass;
										}

										// Get the number of size options
										let sizeVariationsCount = VariationValues.filter((v) => v.productVariationType === 'Sizes').length;

										if(tempType === value.productVariationType) {
											return(
												<React.Fragment key={`${value.productVariationTypeId}-${value.productVariationValueId}`}>
													<div type="button" onClick={() => selectVariationType({value})} disabled={productAdded} className={`${buttonClass} ${productAdded && 'disabled'}`}>
														<span>{value.productVariationValue}</span><br />
														{
															( value.productVariationType === 'Sizes' || onlyColorVariations )
															&& <div>{`$${value.price}`}</div>
														}
													</div>
													{
														tempType === 'Sizes' &&
														sizeVariationsCount > 0 &&
														sizeVariationsCount === index+1 &&
														parseInt(selectedProductId) > 0 &&
														<div className="mb-3">
															(<Translate id="Pets weighing up to" /> {ProductsGroup[0].ProductGroupProducts.find((product) => parseInt(product.productId) === parseInt(selectedProductId)).petWeightMax} {(props.Account.getSettingValue('measurementSystem') === 'English' && 'lb') || 'kg'})
														</div>
													}
												</React.Fragment>
											)
										} else {
											// Set the tempType so that next time through the .map the top IF will hit
											tempType = value.productVariationType;
											return(
												<React.Fragment key={`${value.productVariationTypeId}-${value.productVariationValueId}`}>
													<div>Available {value.productVariationType}</div>
													<div type="button" onClick={() => selectVariationType({value})} disabled={productAdded} className={`${buttonClass} ${productAdded && 'disabled'}`}>
														<span>{value.productVariationValue}</span>
														{
															( value.productVariationType === 'Sizes' || onlyColorVariations )
															&& <div>{`$${value.price}`}</div>
														}
													</div>
												</React.Fragment>
											)
										}
									})}
								</div> */}
							</React.Fragment>
						}
						<div className={`h5 ${false && (pageSizeTiny || pageSizePhone) && 'text-center'}`}>
							Quantity{productAdded === true && <span>: {values.productQuantity}</span>}
							{
								productAdded === false &&
								<div className={`ml-2 ${false && (pageSizeTiny || pageSizePhone) && 'row justify-content-center'}`}>
								<Field component="select" name="productQuantity" className="form-control" style={{width: 60 + 'px'}}>
									<option value="1" key="1">1</option>
									<option value="2" key="2">2</option>
									<option value="3" key="3">3</option>
									<option value="4" key="4">4</option>
									<option value="5" key="5">5</option>
								</Field>
								</div>
							}
						</div>

						{personalizationAllowed === 1 && (NewDropdownGroups.length > 0 || ProductAttributesText.length > 0) &&
							<div>
								{
									personalizationRequired === 0 &&
									<div className="mt-3 alert bg-light border pb-0">
										<div className="float-left mt-1 mr-3">
											{displayPersonalizationPrice(Product)}
										</div>
										<label className="switch mt-1">
											<input type="checkbox" className={`${productAdded && 'disabled'}`} checked={personalizeProduct} disabled={personalizationRequired === 1} onChange={() => clickPersonalization()} />
											<span className="slider round"></span>
											<span className="absolute-no">NO</span>
										</label>
									</div>
								}
								{
									personalizationRequired === 1 &&
									<div className="mt-2">
										<h5>{displayPersonalizationPrice(Product)}</h5>
									</div>
								}
								{
									personalizeProduct === true && 
									parseInt(values.productQuantity) > 1 &&
									<div className="alert alert-warning">If you would like your {values.productQuantity} products to each be personalized differently, please choose the quantity you would like to have this specfic personalization. Then add this product again with the next quantity for your new personalization.</div>
								}
								{/* Notes on how the input naming and parsing works are in the handleSubmit function of withFormik below */}
								{
									personalizeProduct === true && 
									NewDropdownGroups.map((group) => {
										const inputName = `productOptionValueId-${group.productOptionId}`
										const errorsClass = ErrorsPersonalization[`${inputName}`];
										//const touchedClass = touched[`${inputName}`]

										return (
											<div className="mt-2" key={group.productOptionId}>
												<div>{group.optionName}</div>
												<Field component="select" showError={true} name={`productOptionValueId-${group.productOptionId}`} disabled={productAdded} className={`form-control ${productAdded && 'disabled'} ${errorsClass && 'is-invalid'}`}>
													<option value="0" key="0">{props.translate("Please Select")}</option>
													{group.attributes.map((groupAttribute) => {
														return <option value={groupAttribute.productOptionValueId} key={groupAttribute.productOptionValueId}>{groupAttribute.valueLabel}</option>
													})}
												</Field>
											</div>
										)
									})
								}
								{personalizeProduct === true && ProductAttributesText.map((attribute) => {
									const inputName = `productOptionId-${attribute.productOptionId}`
									const errorsClass = ErrorsPersonalization[`${inputName}`];
									//const touchedClass = touched[`${inputName}`]
									return (
										<div className={`mt-2 ${productAdded && 'disabled'} ${errorsClass && 'text-danger'}`} key={attribute.productOptionId}>
											<span className="text-secondary">{attribute.optionName}</span>
											<Field showError={true} name={`productOptionId-${attribute.productOptionId}`} className={`form-control ${errorsClass && 'is-invalid'}`} />
										</div>
									)
								})}
							</div>
						}
						<div className="row">
							<div className="col-12 mt-3 text-center">
								<button type="button" className="btn btn-success btn-addon" onClick={() => clickAddToBasket()} disabled={basketButtonIcon==='check'}><FontAwesomeIcon icon={basketButtonIcon} /> <Translate id={basketButtonText} /></button>
								<button type="button" className="btn btn-default btn-addon ml-2" onClick={() => handleProductView(0, null, makeBasketButtonActive)}><FontAwesomeIcon icon="reply" /> <Translate id={backButtonText} /></button>
							</div>
						</div>
						{ 
							basketButtonIcon === 'check' && 
							<div className="text-center alert alert-success mt-3 mb-0"><Translate id="Successfully Added to Basket" /></div>
						}
					</div>
				</div>

			</Form>
		</React.Fragment>
	);
}

// Product details form for adding products to basket
const ProductDetailForm = compose (
	queryWithLoading({
		gqlString: getProductsMemorializationPromotionsQuery,
		variablesFunction: (props) => ({petReferenceNumber: props.petReferenceNumber, productTypeId: props.productTypeId, promotionsOnly: true}),
		name: "ProductsMemorializationPromotions"
	}),
	queryWithLoading({
		gqlString: getProductAttributesQuery,
		variablesFunction: (props) => ({productId: props.productId}),
		name: "ProductAttributes"
	}),
	withMutation(OrderProductProductOptionSaveMutation, "OrderProductProductOptionSave", ["getOrderProducts"]),
	withMutation(OrderProductSaveMutation, "OrderProductSave", ["getOrderProducts","getProductsMemorializationPromotions"]),
	withFormik(
		// {
		// handleSubmit: async ( input, form ) => {
		// 	const { props: { handleProductView, setResponse, Order: { memorialization },OrderProductSave, OrderProductProductOptionSave, Product, ProductAttributes: {ProductAttributes}, ProductsMemorialization }} = form;
		// 	// NOTE: The reason that we are doing the 'getOrderProducts' refetch in both mutations is that sometimes the OrderProductProductOptionSave will not be called if there is not personalization on this product
		// 	// Need to define the input variables here because there are dynamically created variables for the productOptionValueId-XX
		// 	const { invoiceCostCharged, invoiceCostChargedPersonalization, orderId, orderProductId, personalizeProduct, priceCharged, priceChargedPersonalization, productId, productName, selectedProductId } = input;

		// 	// If this was a Group of products, check if 'selectedProductId' is defined, if so, replace the productId
		// 	let tempProductId = parseInt(selectedProductId) > 0 ? parseInt(selectedProductId) : parseInt(productId);
		// 	let tempProductName = parseInt(selectedProductId) > 0 ? ProductsMemorialization.find((product) => parseInt(product.productId) === tempProductId).productName : productName;

		// 	// If taxRate is a string because it was obtained from the account setting for taxRate, then make it a float before passing to the db
		// 	const taxRate = typeof input.taxRate === 'string' && input.taxRate !== '' && input.taxRate !== null ? parseFloat(input.taxRate) : input.taxRate;

		// 	// NEW NEW NEW NEW NEW NEW NEW !!!!!!!
		// 	// PRODUCT QUANTITY SELECTED - save a product to this order that many times!!!
		// 	let i;
		// 	let tempOrderProductResponse = {};
		// 	for(i = 0; i < parseInt(input.productQuantity); i++) {
		// 		const { data: { orderProductSave }} = await OrderProductSave({ input: { invoiceCostCharged, invoiceCostChargedPersonalization, orderId, orderProductId, parentCategory: Product.parentCategory, personalizeProduct, priceCharged, priceChargedPersonalization, productCategory: Product.productCategory, productId: tempProductId, productName: tempProductName, taxRate } });
		// 		const { productOptionIds } = input;

		// 		// Set the response object for use outside of this for loop
		// 		tempOrderProductResponse = orderProductSave.Response;
		// 		// If there are any IDs in the input.productOptionIds, then we need to loop through that list to get all of the input values for those productOptionId
		// 		// 1a) For DROPDOWNS, the name of those inputs is productOptionValueId-X, where X is the integer ID value of the productOption (the productOptionId) whose value is being selected in the dropdown.
		// 		// 1b) The value of each select option is the literal integer ID value of the productOptionValue (the productOptionValueId).
		// 		// 2a) For TEXT inputs, the name of those inputs is productOptionId-X, where X is the integer ID value of the productOption (the productOptionId).
		// 		// 2b) Since it is a text input, the value of that input is simply a string, and the productOptionValueId is 1 (TEXT)
		// 		// Each of these productOptionId values discussed above get added into the productOptionIds array, and we can tell if it is a text or dropdown based on if there is an input.productOptionId-X or input.productOptionValueId-X where X is the value in the productOptionIds array.

		// 		if(productOptionIds.length > 0) {
		// 			let productOptionText = '';
		// 			let productOptionIdItem = 0;
		// 			let productOptionValueId = 0;
		// 			productOptionIds.forEach((option) => {
		// 				productOptionIdItem = option;

		// 				productOptionText = input[`productOptionId-${option}`];
		// 				productOptionValueId = input[`productOptionValueId-${option}`];
		// 				if(productOptionValueId > 0) {
		// 					// This is the functionality for saving dropdown options
		// 					const ProductAttribute = ProductAttributes.find((attribute) => attribute.productOptionId === productOptionIdItem && attribute.productOptionValueId === productOptionValueId);

		// 					OrderProductProductOptionSave({ input: {
		// 						orderProductId: orderProductSave.OrderProduct.orderProductId,
		// 						productOptionId: productOptionIdItem,
		// 						productOptionValueId,
		// 						optionName: ProductAttribute.optionName,
		// 						textString: '',
		// 						valueLabel: ProductAttribute.valueLabel
		// 					}})
		// 				} else if(productOptionText) {
		// 					// productOptionText will be undefined if this is not a text input
		// 					// This is the functionality for saving text options
		// 					const ProductAttribute = ProductAttributes.find((attribute) => parseInt(attribute.productOptionId) === parseInt(productOptionIdItem) && attribute.valueLabel === "TEXT");

		// 					OrderProductProductOptionSave({ input: {
		// 						orderProductId: orderProductSave.OrderProduct.orderProductId,
		// 						productOptionId: productOptionIdItem,
		// 						productOptionValueId: ProductAttribute.productOptionValueId,
		// 						optionName: ProductAttribute.optionName,
		// 						textString: productOptionText,
		// 						valueLabel: ProductAttribute.valueLabel
		// 					}})
		// 				}
		// 			})
		// 		}
		// 	}

		// 	// For only memorialization In Clinic - when an Urn is added, make the Review Basket link active. This variable activates a callback in the handleProductView setState
		// 	let makeBasketButtonActive = memorialization === 'clinic' && (Product.parentCategory === 'Urns' || Product.productCategory === 'Urns') ? true : false;
		// 	//setResponse(tempOrderProductResponse);
		// 	// Close the product details view, go back to the Products view they were on before clicking into the details
		// 	handleProductView(0, tempOrderProductResponse, makeBasketButtonActive);
		// },
		// validate: (values) => {
		// 	const { personalizeProduct, validationStruct } = values;
		// 	let errors = {};

		// 	// Perform validation is there is any for the personalized inputs
		// 	if(personalizeProduct === true) {
		// 		// Valid dropdown inputs that need to have an option selected
		// 		if(validationStruct.greaterThanZero.length > 0) {
		// 			validationStruct.greaterThanZero.forEach((variableNametoValidate) => {
		// 				if(parseInt(values[variableNametoValidate]) === 0) {
		// 					errors[variableNametoValidate] = 'Please select an option';
		// 				}
		// 			})
		// 		}

		// 		// Valid text inputs that need to have a string entered
		// 		if(validationStruct.notBlank.length > 0) {
		// 			validationStruct.notBlank.forEach((variableNametoValidate) => {
		// 				if(values[variableNametoValidate] === '') {
		// 					errors[variableNametoValidate] = 'Please complete this field';
		// 				}
		// 			})
		// 		}
		// 	}

		// 	return errors
		// }
		// }
	),
	withState({
		backButtonText: 'No Thanks',
		basketButtonIcon: 'cart-plus',
		basketButtonText: 'Add to Basket',
		ColorVariations: [],
		ErrorsPersonalization: {},
		imageSize: "medium",
		initialLoad: true,
		makeBasketButtonActive: false,
		NewDropdownGroups: [],
		onlyColorVariations: false,
		onlySizeVariations: false,
		personalizeProduct: false,
		priceDisplay: '',
		productAdded: false,
		ProductAttributesDropdown: [],
		ProductAttributesText: [],
		ProductImage: {},
		ProductOptionId: [],
		SelectedImage: {},
		selectedInvoiceCostCharged: '',
		selectedInvoiceCostChargedPersonalization: '',
		selectedPriceCharged: '',
		selectedPriceChargedPersonalization: '',
		selectedProductId: 0,
		selectedColorVariationValueId: 0,
		selectedSizeVariationValueId: 0,
		SizeVariations: [],
		ValidationStruct: {},
		Variations: [],
		VariationValues: []
	}),
	withTranslate
)(ProductDetailFormContent);

const ProductMemorializationFormContent = (props) => {
	const {
		dirty,
		handleProductsContinueButtonClick,
		handleProductView,
		handleView,
		Order,
		Products,
		ProductsGrouped,
		Response,
		state:{
			communalCremation,
			productsContinueButton: {
				show:showContinueButtonWarning,
				warningText
			},
			Response:ResponseMessage,
			view,
			view:{
				current:category
			},
			viewDefaults
		}
	} = props;
	console.log({props})
	const productsInBasket = Order.ProductsOrder.map(({ productId }) => productId);

	let contentCentered = false;
	let continueButtonClass = 'btn-success';
	let continueButtonDisabled = false;
	let continueButtonText = 'Continue';
	let continueButtonWarningText = '';
	let previousButtonClass = view.previous === '' ? '' : 'btn-success';
	let titleInfo = category; // Default the title of the product page to be the category name

	// Enable / Disabled Previous and Continue buttons depending on which category we are on
	if(category === 'Urns') {
		continueButtonClass = 'btn-default disabled';
		continueButtonDisabled = true;
		continueButtonWarningText = 'Please add an Urn before continuing'
		titleInfo = `Select an Urn for ${Order.petFirstName}`;

		// See if there are any Urns yet on this order / They must be capable of holding ashes.
		let urnIndex = Order.ProductsOrder.findIndex((product) => (product.productCategory === 'Urns' || product.parentCategory === 'Urns') && product.statusRemainsFilledIndicator === 1);

		// If there are Urn(s) already on the order OR if this is a Product Only order, then allow continuing to the next page
		if(urnIndex > -1 || Order.orderTypeId === 3) {
			continueButtonClass = 'btn-success';
			continueButtonDisabled = false;
			continueButtonWarningText = '';
		}
	} else if(category === 'PawPrints') {
		// communalCremation indicates that the Paw Prints section needs to have a product selected (since it is Communal + Paw Print) before being able to continue
		contentCentered = true;
		continueButtonClass = 'btn-default disabled';
		continueButtonDisabled = true;
		//continueButtonText = 'No Thanks';
		continueButtonWarningText = communalCremation === true ? 'Please add a Paw Print before continuing' : 'No PP Wanted Warning';

		titleInfo = 'Paw Prints';

		// See if there are any PawPrints yet on this order.
		let pawPrintIndex = Order.ProductsOrder.findIndex((product) => product.productCategory === 'Paw Prints' || product.parentCategory === 'Paw Prints');

		if(pawPrintIndex > -1) {
			continueButtonClass = 'btn-success';
			continueButtonDisabled = false;
			//continueButtonText = 'Continue';
			continueButtonWarningText = '';
		}
	} else if(category === 'Keepsakes') {
		// See if there are any Keepsakes yet on this order.
		let keepsakesIndex = Order.ProductsOrder.findIndex((product) => product.productCategory === 'Keepsakes' || product.parentCategory === 'Keepsakes');
		//continueButtonText = keepsakesIndex > - 1 ? 'Continue' : 'No Thanks';
	} else if(category === 'Jewelry') {
		// See if there is any Jewelry yet on this order.
		let jewelryIndex = Order.ProductsOrder.findIndex((product) => product.productCategory === 'Jewelry' || product.parentCategory === 'Jewelry');
		//continueButtonText = jewelryIndex > - 1 ? 'Continue' : 'No Thanks';
	} else if(category === 'VetSupplies') {
		titleInfo = 'Vet Supplies';
	}

	// If there is not a 'Next' view, then mimic the appearance of disabling the continue button
	if(view.next === '') {
		continueButtonClass = 'btn-default disabled';
		continueButtonDisabled = true;
	}
	// Function for handling what information will be shown in the More Information area for each of the categories
	// const moreInformationContext = (category) => {
	// 	if(category === 'Jewelry') {
	// 		return <Translate id="Jewelry More Information Text" />
	// 	} else if(category === 'Keepsakes') {
	// 		return (
	// 			<React.Fragment>
	// 				<div>
	// 					<Translate id="Keepsakes More Information Text Top" />
	// 				</div>
	// 				<div>
	// 					1. <Translate id="Keepsakes More Information Bullet 1" />
	// 				</div>
	// 				<div>
	// 					2. <Translate id="Keepsakes More Information Bullet 2" />
	// 				</div>
	// 				<div>
	// 					3. <Translate id="Keepsakes More Information Bullet 3" />
	// 				</div>
	// 				<div>
	// 					<Translate id="Keepsakes More Information Text Bottom" />
	// 				</div>
	// 			</React.Fragment>
	// 		)
	// 	} else if(category === 'PawPrints') {
	// 		return (
	// 			<React.Fragment>
	// 				<div><Translate id="Paw Prints More Information Text" /></div>
	// 				<div><Translate id="Paw Prints More Information Text 2" /></div>
	// 			</React.Fragment>
	// 		)
	// 	} else if(category === 'Urns') {
	// 		return <Translate id="Urns More Information Text" />
	// 	}
	// }

	// Filter the products list
	let FilteredProducts = Products;
	let BestSellingProducts = FilteredProducts.filter((product) => parseInt(product.productId) === 60 || parseInt(product.productId) === 58 || parseInt(product.productId) === 55);
	// if(showOnlyProductsForPetWeight === true && category === 'Urns') {
	// 	FilteredProducts = FilteredProducts.filter((product) => {
	// 		let fitsPet = true;
	// 		if(product.petWeightMin !== null && parseInt(product.petWeightMin) > parseInt(Order.weight)) {
	// 			fitsPet = false;
	// 		}
	// 		if(product.petWeightMax !== null && parseInt(product.petWeightMax) < parseInt(Order.weight)) {
	// 			fitsPet = false;
	// 		}
	// 		// Check if this productId is in the ProductSpecies array. If it is, then only show the product IF there is a speciesId in the array for this product matching the speciesId on the Order.
	// 		if(ProductSpecies.find((species) => parseInt(species.productId) === parseInt(product.productId))) {
	// 			if(ProductSpecies.findIndex((species) => parseInt(species.productId) === parseInt(product.productId) && parseInt(species.speciesId) === parseInt(Order.speciesId)) === -1) {
	// 				fitsPet = false;
	// 			}
	// 		}
	// 		return fitsPet;
	// 	})
	// }

	// If there are productGroups for this category, determined by ProductsGrouped array not being empty, then just set a flag to display the products in groups instead of individually
	const showProductGroups = ProductsGrouped.length > 0 ? true : false;


	// Only show the bottom navigation buttons if there are more than 4 products / groups
	let showBottomNavButtons = (showProductGroups && ProductsGrouped.length > 3) || (!showProductGroups && FilteredProducts.length > 3) ? true : true;

	let width = window.innerWidth;
	let phoneWidth = 575;

	return (
		<React.Fragment>
			<div className="w-100 mb-5">
				{/*  Display a resulting status message.  */}
				{ Response && dirty === false && <div className="row"><div className="col-12 alert alert-success">{props.translate(Response.message)}</div></div> }
				{ ResponseMessage && dirty === false && <div className="row"><div className="col-12 alert alert-success">{props.translate(ResponseMessage.message)}</div></div> }
				<div className="row">
					{/* <div className="col-12 text-center">
						<h3 className="mb-1">
							{titleInfo}
						</h3>
						<img src={process.env.PUBLIC_URL + "/images/ui/in-loving-memory-of-bottom.png"} className="pb-3 pt-1" alt="" style={{maxWidth: 200 + 'px'}}/>
					</div> */}
					{/* Display our most popular urns - only for At Home Memorialization */}
					{
						category === 'Urns' &&
						Order.memorialization === 'home' &&
						<div className="col-12 mt-4">
							<div className="row mb-4">
								<div className="col-sm-1" />
								<div className="col-sm-10">
									<div className="card border-secondary">
										<div className="card-header text-center bg-success text-white border-secondary">
											<h5 className="mb-0"><Translate id="Our Most Popular Urns" /></h5>
										</div>
										<div className="card-body text-center">
											<div className="row">
												{BestSellingProducts.map((product) => {
													return (
														<div className="col-md-4 mb-3 p-0" key={product.productId}>
															<div onClick={() => handleProductView(product.productId)} className="m-1 mb-0 card border-0">
																<ProductThumbnail product={product} size="medium" speciesid={Order.speciesId} className="card-img-top" />
																<div className="card-body p-0">
																	<h4 className="card-title mb-1">
																		{product.accountProductName !== null && product.accountProductName !== "" && <span>{product.accountProductName.replace(' - Large', '')}</span>}
																		{!(product.accountProductName !== null && product.accountProductName !== "") && <span>{product.productName.replace(' - Large', '')}</span>}
																	</h4>
																	<h6 className="card-text mb-0">
																		<ProductPrice product={product} promotions={Order.ProductCompanyPromotion} productsInBasket={productsInBasket} />
																	</h6>
																	<h5 className="card-text mb-0"><span className="badge badge-pill badge-secondary">More Colors Available</span></h5>
																	<h5 className="card-text mb-0">{(product.personalizationAllowed === 1 && <span className="badge badge-pill badge-secondary">Engravable</span>)}</h5>
																	{/* <p className="card-text mb-0">
																		{(product.personalizationAllowed === 1 && '(Engravable)')}
																	</p> */}
																</div>
															</div>
														</div>
													)
												})}
											</div>
										</div>
									</div>
								</div>
								<div className="col-sm-1" />
							</div>
						</div>
					}

					{/* <div className="col-12 text-center mb-2">
						<span className="d-block d-md-inline float-md-right text-center">
							<button type="button" className={`btn btn-addon mr-3 ${previousButtonClass}`} disabled={view.previous === ''} onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Previous" /></button>
							<button className={`btn btn-addon ${continueButtonClass}`} onClick={() => handleProductsContinueButtonClick(continueButtonDisabled, continueButtonWarningText, viewDefaults[category].next)}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id={continueButtonText} /></button>
						</span>
					</div> */}
					{/* Select input for showing products only for the pet based on weight, or show all urns 
					{
						category === 'Urns' &&
						<div className="col-auto">
							<Field component="select" value={showOnlyProductsForPetWeight} name="showOnlyProductsForPetWeight" onChange={() => handleShowOnlyProductsForPetWeight()} className="form-control">
								<option value={true}>{props.translate("Urns That Fit My Pet")}</option>
								<option value={false}>{props.translate("Show All Urns")}</option>
							</Field>
						</div>
					}
					*/}
					{/* When the Continue button is clicked button it is disabled */}
					{/* For Paw Prints, there is a confirmation button in the warning that overrides the continue button restrictions */}
					{/* {(showContinueButtonWarning === true && category === 'PawPrints' && communalCremation === false &&
							<div className="col-12">
								<div className="alert alert-info">
									<Translate id={warningText} data={{petFirstName:Order.petFirstName}} />
									<div className="text-center mt-2">
										<button type="button" className="btn btn-addon btn-info ml-2" onClick={() => handleProductsContinueButtonClick(false, null, viewDefaults[category].next)}><FontAwesomeIcon icon="exclamation" /><Translate id="I do not want a Paw Print" /></button>
									</div>
								</div>
							</div>
						) || (
							showContinueButtonWarning === true && 
							<div className="col-12">
								<div className="row justify-content-center">
									<div className="col-auto text-centered">
										<div className="alert alert-warning">
											<Translate id={warningText} />
										</div>
									</div>
								</div>
							</div>
						)
					} */}
					{/* When the 'Whats This?' button is clicked, this container with more information about the category will show} 
					{showMoreInformation === true &&
						<React.Fragment>
							<div className="col-12">
								{moreInformationContext(category)}
							</div>
							<div className="col-12">
								<button type="button" className="btn btn-sm btn-default btn-addon" onClick={() => handleShowMoreInformation()}><FontAwesomeIcon icon="times" /> <Translate id="Close" /></button>
							</div>
						</React.Fragment>
					}*/}
				</div>
				{/* <ShowPromotions promotions={Order.ProductCompanyPromotion} /> */}
				<div>
					<div className={`card-deck mt-3 text-center ${(contentCentered || true)&& 'justify-content-center'}`}>
						{ 
							showProductGroups === false &&
							FilteredProducts.map((product, index) => {
								return (
									<div className={`col-sm-6 col-md-4 col-lg-3 mb-3 p-0 ${phoneWidth > width && 'pb-4 border-bottom'} ${contentCentered && FilteredProducts.length-1 > index && 'mr-5'}`} key={product.productId}>
										<div onClick={() => handleProductView(product.productId)} className="mb-0 card border-0">
											<ProductThumbnail product={product} size="medium" speciesid={Order.speciesId} className="card-img-top" />
											<div className="card-body p-0">
												<h4 className="card-title mb-1">
													{product.accountProductName !== null && product.accountProductName !== "" && <span>{product.accountProductName}</span>}
													{!(product.accountProductName !== null && product.accountProductName !== "") && <span>{product.productName}</span>}
												</h4>
												<h6 className="card-text mb-0">
													<ProductPrice product={product} promotions={Order.ProductCompanyPromotion} productsInBasket={productsInBasket} />
												</h6>
											</div>
										</div>
									</div>
								)
							})
						}
						{
							showProductGroups === true && 
							ProductsGrouped.map((group) => {
								if(parseInt(group.productGroupId) > 0) {
									return (
										<div className={`col-sm-6 col-md-4 col-lg-3 mb-3 p-0 ${phoneWidth > width && 'pb-4 border-bottom'}`} key={group.ProductGroupProducts[0].productId}>
											<div onClick={() => handleProductView(group.ProductGroupProducts[0].productId)} className="mb-0 card border-0">
												<ProductThumbnail product={group.ProductGroupProducts[0]} size="medium" speciesid={Order.speciesId} className="card-img-top" />
												<div className="card-body p-0">
													<h4 className="card-title mb-1">{group.productGroup}</h4>
													<h6 className="card-text mb-0">{(group.priceMax === group.priceMin && `$${group.priceMax}`) || `$${group.priceMin} - $${group.priceMax}`}</h6>
													<h5 className="card-text mb-0"><span className="badge badge-pill badge-secondary">More Colors Available</span></h5>
													<h5 className="card-text mb-0">{(group.personalizationAllowed === 1 && <span className="badge badge-pill badge-secondary">Engravable</span>)}</h5>
												</div>
											</div>
										</div>
									)
								} else {
									// For the "No Group" products, just display these are we normally display products
									return group.ProductGroupProducts.map((product) => {
										return (
											<div className={`col-sm-6 col-md-4 col-lg-3  mb-3 p-0 ${phoneWidth > width && 'pb-4 border-bottom'}`} key={product.productId}>
												<div onClick={() => handleProductView(product.productId)} className="mb-0 card border-0">
													<ProductThumbnail product={product} size="medium" speciesid={Order.speciesId} className="card-img-top" />
													<div className="card-body p-0">
														<h4 className="card-title mb-1">
															{product.accountProductName !== null && product.accountProductName !== "" && <span>{product.accountProductName}</span>}
															{!(product.accountProductName !== null && product.accountProductName !== "") && <span>{product.productName}</span>}
														</h4>
														<h6 className="card-text mb-0"><ProductPrice product={product} promotions={Order.ProductCompanyPromotion} productsInBasket={productsInBasket} /></h6>
														<h5 className="card-text mb-0">{(product.personalizationAllowed === 1 && <span className="badge badge-pill badge-secondary">Engravable</span>)}</h5>
													</div>
												</div>
											</div>
										)
									})
								}
							})
						}
					</div>
				</div>
				{/* Only show bottom nav buttons if there are more than 3 Products / Groups to show */}
				{
					showBottomNavButtons &&
					<div className="row">
						{/* For Paw Prints, there is a confirmation button in the warning that overrides the continue button restrictions */}
						{(showContinueButtonWarning === true && category === 'PawPrints' && communalCremation === false &&
								<div className="col-12 mt-2">
									<div className="row justify-content-center">
										<div className="col-auto text-justify">
											<div className="alert alert-info">
												<Translate id={warningText} data={{petFirstName:Order.petFirstName}} />
												<div className="text-center mt-2">
													<button type="button" className="btn btn-addon btn-info ml-2" onClick={() => handleProductsContinueButtonClick(false, null, viewDefaults[category].next)}><FontAwesomeIcon icon="exclamation" /><Translate id="I do not want a Paw Print" /></button>
												</div>
											</div>
										</div>
									</div>
								</div>
							) || (
								showContinueButtonWarning === true && 
								<div className="col-12 mt-2">
									<div className="row justify-content-center">
										<div className="col-auto text-justify">
											<div className="alert alert-warning">
												<Translate id={warningText} />
											</div>
										</div>
									</div>
								</div>
							)
						}
						{/* When the Continue button is clicked button it is disabled */}
						<div className="col-12 text-center mb-3">
							<button type="button" className={`btn btn-addon mr-3 ${previousButtonClass}`} disabled={view.previous === ''} onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Previous" /></button>
							<button className={`btn btn-addon ${continueButtonClass}`} onClick={() => handleProductsContinueButtonClick(continueButtonDisabled, continueButtonWarningText, viewDefaults[category].next)}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id={continueButtonText} /></button>
						</div>
					</div>
				}
			</div>
		</React.Fragment>
	);
};

const ProductPrice = ({product, promotions, productsInBasket}) => {
	function removeZeroCents(price,) {
		// Remove the decimal zeros if the price is $85.00, then show $85.
		let tempPrice = price;
		tempPrice = tempPrice.substring(tempPrice.length-2, tempPrice.length) === '00' ? tempPrice.substring(0, tempPrice.length-3) : tempPrice;
		return tempPrice;
	}

	if ( product.promotionalPriceRetail ) {
		const {
			calculatedPriceRetail,
			promotionalPriceRetail
		} = product;

		let tempPromotionalPrice = promotionalPriceRetail;
		tempPromotionalPrice = removeZeroCents(tempPromotionalPrice);
		let tempCalculatedPriceRetail = calculatedPriceRetail;
		tempCalculatedPriceRetail = removeZeroCents(tempCalculatedPriceRetail);
		if(tempPromotionalPrice !== tempCalculatedPriceRetail) {
			return (
				<React.Fragment>
					<span style={{textDecoration: "line-through"}}>${tempCalculatedPriceRetail}</span>
					{productsInBasket.includes(product.productId) && <FontAwesomeIcon className="ml-2" icon="check"/>}<br/>
					${removeZeroCents(tempPromotionalPrice)}
				</React.Fragment>
			);
		} else {
			return (
				<React.Fragment>
					${removeZeroCents(tempCalculatedPriceRetail)}
					{productsInBasket.includes(product.productId) && <FontAwesomeIcon className="ml-2" icon="check"/>}
				</React.Fragment>
			)
		}
	} 
	else {
		return (
			<React.Fragment>
				${removeZeroCents(product.calculatedPriceRetail)}
				{productsInBasket.includes(product.productId) && <FontAwesomeIcon className="ml-2" icon="check"/>}
			</React.Fragment>
		)
	}
};

// const ShowPromotions = (props) => (
// 	<React.Fragment>
// 		{ props.promotions.map((promotion) => (
// 			<div key={promotion.productCompanyPromotionId}>
// 				You will recieve {promotion.units === 2 ? `$${promotion.amountDiscount}` : `${promotion.amountDiscount}%` } off of {promotion.maxQuantity} eligible {promotion.ProductCategory.productCategory}
// 			</div>)
// 		) }
// 	</React.Fragment>
// );

// Container for the Cremation Services step of memorialization. This is only available for Private Cremations
const SpecialServicesFormContent = (props) => {
	const {
		handleView,
		Order: {
			expeditedCremationAllowed,
			visitationAllowed
		},
		Products,
		state:{
			view:{
				current:category
			},
			viewDefaults
		},
		values
	} = props;

	function onExpeditedCremationClick(value) {
		// the value that comes through is the value at the time of click, meaning that the opposite value will be the new value.
		const newValue = value === true ? false : true;

		// If expedited cremation is selected, then the visitation and viewing option must be de-selected and 'No viistation/viewing' will be selected.
		if(newValue === true) {
			values.viewingProductId = 0;
		}
	};

	function onNoViewingClick() {
		values.viewingProductId = 0;
	};

	function onVisitationClick() {
		// When visitation and viewing is clicked, then we need to uncheck the expedited cremation checkbox.
		values.expeditedCremation = false;
	};

	// Determine which products are available for the Cremation and Viewing categories, put those products into the products.Cremation for state.
	// IMPORTANT: The productCategories for Viewing and Other Cremation Services have been consolidated into a single Optional Services category. At the time of this change, only Expedited Cremation and Visitation & Viewing exist in those categories. When more products are added to those categories, this section's functionality will need to be reworked.
	const tempOtherCremationServicesProducts = Products.filter((product) => product.productName === 'Expedited Cremation');
	const tempViewingProducts = Products.filter((product) => product.productName === 'Visitation & Viewing');

	let continueButtonText = (values.expeditedCremation === 0 || values.expeditedCremation === false) && parseInt(values.viewingProductId) === 0 ? 'No Thanks' : 'Continue';

	return (
		<Form className="w-100">
			<div className="row">
				<div className="col-12">
					<h3><Translate id="Special Services" />
						<button type="submit" className={`btn btn-sm float-right btn-success btn-addon`}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id={continueButtonText} /></button>
						<button type="button" className="btn btn-sm btn-success btn-addon float-right mr-3" onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Previous" /></button>
					</h3>
				</div>
				{expeditedCremationAllowed === 1 && visitationAllowed === 1 && <div className="alert alert-warning ml-2"><Translate id="Expedited and Visitation Disclaimer" /></div>}
			</div>
			<div className="card-deck">
				{tempOtherCremationServicesProducts.length > 0 &&
					tempOtherCremationServicesProducts.map((product) => {
						// Need to create the Field name variable based on the Product Name, which is potentially a string with spaces. This is fine to hard code these few options because they are the system wide options, which should not change often and cannot be edited by individual accounts
						let productName = product.productName;
						if(productName === 'Expedited Cremation') {
							productName = 'expeditedCremation';
						}
						if(expeditedCremationAllowed === 0) return null;
						const displayPrice = values[productName] === true && values.expeditedCremationInvoiceVet === 1 ? 'PREPAID' : `$${product.calculatedPriceRetail}`;
						let buttonClass = values[productName] === true ? 'border p-3 border-info' : 'border p-3';
						return (
							<div className="card border-0 mb-4 col-lg-4 p-0" key={product.productId}>
								<div className="card-header">
									{product.accountProductName !== null && product.accountProductName !== "" && <h5 className="m-0">{props.translate(product.accountProductName)}</h5>}
									{!(product.accountProductName !== null && product.accountProductName !== "") && <h5 className="m-0">{props.translate(product.productName)}</h5>}
								</div>
								<div className="card-body p-0">
									<div style={{maxHeight: 200 + 'px', overflow: 'hidden'}}>
										<ProductThumbnail product={product} size="large" style={{width: 100 + '%', maxWidth: 100 + '%', marginTop: -25 + '%'}} />
									</div>
									{product.accountDescriptionShort !== null && product.accountDescriptionShort !== "" && <h5>{product.accountDescriptionShort}</h5>}
									{!(product.accountDescriptionShort !== null && product.accountDescriptionShort !== "") && product.descriptionShort !== null && <h5>{product.descriptionShort}</h5>}
									{product.accountDescriptionLong !== null && product.accountDescriptionLong !== "" && <div>{product.accountDescriptionLong}</div>}
									{!(product.accountDescriptionLong !== null && product.accountDescriptionLong !== "" ) && product.descriptionLong !== null && <div>{product.descriptionLong}</div>}
								</div>
								<div className="card-footer bg-white border-0 pb-5">
									<h3 className="text-center">{displayPrice}</h3>
									<div className="mt-3 text-center"><span className={buttonClass}>
										<div className="pretty p-default p-pulse p-round">
											<Field name={productName} component="input" type="checkbox" checked={values[productName] === true} className="" onClick={() => onExpeditedCremationClick(values[productName])} />
											<div className="state p-primary">
												<label>
													{values[productName] === true && "SELECTED"}
													{values[productName] === false && "SELECT"}
												</label>
											</div>
										</div>
									</span></div>
								</div>
							</div>
						)
					})
				}
				{tempViewingProducts.map((product) => {
					const displayViewingPrice = values.viewingProductId === product.productId && values.viewingInvoiceVet === 1 ? 'PREPAID' : `$${product.calculatedPriceRetail}`;
					if(visitationAllowed === 0) return null;
					let buttonClass = parseInt(values.viewingProductId) > 0 ? 'border p-3 border-info' : 'border p-3';

					return (
						<div className="card border-0 mb-4 col-lg-4 p-0" key={product.productId}>
							<div className="card-header">
								{product.accountProductName !== null && product.accountProductName !== "" && <h5 className="m-0">{props.translate(product.accountProductName)}</h5>}
								{!(product.accountProductName !== null && product.accountProductName !== "") && <h5 className="m-0">{props.translate(product.productName)}</h5>}
							</div>
							<div className="card-body p-0">
								<div style={{maxHeight: 200 + 'px', overflow: 'hidden'}}>
									<ProductThumbnail product={product} size="large" style={{width: 100 + '%', maxWidth: 100 + '%', marginTop: -25 + '%'}} />
								</div>
								{product.accountDescriptionShort !== null && product.accountDescriptionShort !== "" && <h5>{product.accountDescriptionShort}</h5>}
								{!(product.accountDescriptionShort !== null && product.accountDescriptionShort !== "") && product.descriptionShort !== null && <h5>{product.descriptionShort}</h5>}
								{product.accountDescriptionLong !== null && product.accountDescriptionLong !== "" && <div>{product.accountDescriptionLong}</div>}
								{!(product.accountDescriptionLong !== null && product.accountDescriptionLong !== "" ) && product.descriptionLong !== null && <div>{product.descriptionLong}</div>}
							</div>
							<div className="card-footer bg-white border-0 pb-5">
								<h3 className="text-center">{displayViewingPrice}</h3>
								<div className="mt-3 text-center"><span className={buttonClass}>
									<div className="pretty p-default p-pulse p-round">
										<Field name="viewingProductId" component="input" type="radio" value={product.productId} checked={values.viewingProductId === product.productId} className="" onClick={() => onVisitationClick()} />
										<div className="state p-primary">
											<label>
												{parseInt(values.viewingProductId) > 0 && "SELECTED"}
												{parseInt(values.viewingProductId) === 0 && "SELECT"}
											</label>
										</div>
									</div>
								</span></div>
							</div>
						</div>
					)
				})}
				{visitationAllowed === 1 &&
					<div className="card border-0 mb-4 col-lg-4 p-0">
						<div className="card-header">
							<Translate id="No Visitation / Viewing" />
						</div>
						<div className="card-body p-0 text-center">
							<p className="display-1 text-muted text-center mt-5"><FontAwesomeIcon icon="ban" /></p>
						</div>
						<div className="card-footer bg-white border-0 pb-5">
							<h3 className="text-center">&mdash;</h3>
							<div className="mt-3 text-center"><span className={parseInt(values.viewingProductId) === 0 ? 'border p-3 border-info' : 'border p-3'}>
								<div className="pretty p-default p-pulse p-round">
									<Field name="viewingProductId" component="input" type="radio" value="0" checked={parseInt(values.viewingProductId) === 0} className="" onClick={() => onNoViewingClick()}/>
									<div className="state p-primary">
										<label>
											{parseInt(values.viewingProductId) === 0 && "SELECTED"}
											{parseInt(values.viewingProductId) > 0 && "SELECT"}
										</label>
									</div>
								</div>
							</span></div>
						</div>
					</div>
				}
				{/*<div className="card border-0 d-none d-md-flex"></div>*/}
				{/*<div className="card border-0 d-none d-lg-flex"></div>*/}
			</div>
			<div className="row">
				<div className="col-12">
					<button type="submit" className={`btn btn-sm float-right btn-success btn-addon`}><FontAwesomeIcon icon="angle-right" className="pull-right" /> <Translate id={continueButtonText} /></button>
					<button type="button" className="btn btn-sm btn-success btn-addon float-right mr-3" onClick={() => handleView(viewDefaults[category].previous)}><FontAwesomeIcon icon="angle-left" /> <Translate id="Previous" /></button>
				</div>
			</div>
		</Form>
	)
}

// Welcome form - doesnt do anything except move to the next form. Only visible for At Home memorializations
const WelcomeForm = (props) => {
	const {
		Account,
		handleView,
		Order,
		state
	} = props;

	// create the output for the countdown timer for the Memorialization window
	const renderer = ({ days, hours, minutes, seconds, completed }) => {
		if(days > 0) {
			return <span>{days} day{days > 1 && 's'} {hours} hour{hours > 1 && 's'} {minutes} minute{minutes > 1 && 's'}</span>
		} else {
			return <span>{hours} hour{hours > 1 && 's'} {minutes} minute{minutes > 1 && 's'}</span>
		}
	}
	let maxImageWidth = window.innerWidth - 40;

	// Determine the species of the pet and show a different background image accordingly.
	let style = {};
	style.backgroundImage = `url(/images/ui/loyalpaws_background5.png)`;
	style.backgroundSize = 'cover';
	style.backgroundPosition = 'center center';
	style.backgroundRepeat = 'no-repeat';
	style.paddingBottom = '50px';
	if(parseInt(Order.speciesId) === 1) { // dog
	
	} 
	else if(parseInt(Order.speciesId) === 2) { // cat

	}

	// <div className="col-12">
	// 	<button type="button" className="btn btn-sm btn-addon btn-success mt-3" disabled={showMoreInformation === true} onClick={() => handleShowMoreInformation()}><FontAwesomeIcon icon="info-circle" /> <Translate id="Learn More" /></button>
	// </div> 

	// <div className="col-12">
	// 	<button type="button" className="btn btn-sm btn-default btn-addon" onClick={() => handleShowMoreInformation()}><FontAwesomeIcon icon="times" /> <Translate id="Close" /></button>
	// </div>

	return (
		<div className="w-100" style={style} >
			<div className="row text-justify pl-3 pr-3">
				<div className="col-12 p-0">
					<div className="text-center pb-5" >
						<p><img src={process.env.PUBLIC_URL + "/images/ui/in-loving-memory-of.png"} className="pt-5" alt="In Loving Memory of" style={{maxWidth: maxImageWidth + 'px'}} /></p>
						<p className="display-4 text-secondary">{Order.petFirstName}</p>
					</div>
				</div>
				<div className="col-12 mt-4 mb-4">
					<div className="row justify-content-center">
						<div className="col-lg-3 col-md-2 col-sm-1" />
						<div className="col-lg-6 col-md-8 col-sm-10">
							<div className="card bg-transparent">
								<div className="card-header">
									<h5 className="text-center text-secondary m-0">{Order.petFirstName}'s Memorial</h5>
								</div>
								<div className="card-body">
									<p>On behalf of all of us at {props.Account.accountName}{props.Account.accountName !== Order.companyName && <span> and {Order.companyName}</span>}, please accept our deepest and most heartfelt condolences during this difficult time. 
									Please take comfort in knowing that {Order.petFirstName} will be treated with the same level of care and respect we would show one of our own.</p>
								</div>
							</div>
						</div>
						<div className="col-lg-3 col-md-2 col-sm-1" />
					</div>
				</div>
				<div className="col-12 text-center mb-4">
					<img src={process.env.PUBLIC_URL + "/images/ui/in-loving-memory-of-bottom.png"} className="pb-1" alt="" />
				</div>
				{Order.dateMemorializationEnds && Order.memorialization === 'home' &&
					<div className="col-12 text-justify">
						{parseInt(Account.Settings.find((setting) => setting.name === 'autoCloseMemorialization').value) === 1 && <h5>This memorialization is open for <Countdown date={moment(Order.dateMemorializationEnds).format('YYYY-MM-DD HH:mm:ss')} renderer={renderer} /></h5>}
						{/*parseInt(Account.Settings.find((setting) => setting.name === 'autoCloseMemorialization').value) === 0 && <h5>This memorialization was created <TimeAgo date={moment(Order.dateCreated).format('YYYY-MM-DD HH:mm:ss')} /></h5>*/}
					</div>
				}
				<div className="col-12 mb-4">
					<div className="row justify-content-center">
						<div className="col-lg-3 col-md-2 col-sm-1" />
						<div className="col-lg-6 col-md-8 col-sm-10">
							<div className="card bg-transparent">
								<div className="card-header">
									<h5 className="text-center text-secondary m-0">We're Here For You</h5>
								</div>
								<div className="card-body">
									<p>{props.Account.accountName}{(props.Account.accountName !== Order.companyName && <span> and {Order.companyName} are</span>) || <span> is</span>} committed to helping you every step of the way along the memorialization process.
										If at any time you require assistance, please do not hesitate to contact us. If we are not immediately available on the phone, please leave a message or send us an email. We will respond to you as quickly as possible.</p>
									<p className="text-center">Phone: <a href={`tel:${props.Account.getSettingValue('walkInOrderReceiptPhoneNumber')}`}>{props.Account.getSettingValue("walkInOrderReceiptPhoneNumber")}</a> <br/>
										Email: <a href={`mailto:${props.Account.getSettingValue('walkInOrderReceiptEmail')}`}>{props.Account.getSettingValue("walkInOrderReceiptEmail")}</a></p>
								</div>
							</div>
						</div>
						<div className="col-lg-3 col-md-2 col-sm-1" />
					</div>
				</div>
				<div className="col-12 text-center mb-4">
					<img src={process.env.PUBLIC_URL + "/images/ui/in-loving-memory-of-bottom.png"} className="pb-1" alt="" />
				</div>
				<div className="col-12 mb-4">
					<div className="row justify-content-center">
						<div className="col-lg-3 col-md-2 col-sm-1" />
						<div className="col-lg-6 col-md-8 col-sm-10">
							<div className="card bg-transparent">
								<div className="card-header">
									<h5 className="text-center text-secondary m-0">What To Do Next</h5>
								</div>
								<div className="card-body">
									{/* using our step by step memorialization process. */}
									<p>We would like to offer you the opportunity to select any additional services or memorial products for preserving the memory of your beloved {Order.petFirstName}.
										With our easy-to-use, online memorialization process, you can take your time in the comfort of your own home to make choices step-by-step.
										Everything that you lovingly choose for {Order.petFirstName} will be automatically saved to their pet memorial record. 
										Each service and memorial product will be respectfully arranged with care, and according to your exact wishes.</p>
									{/* Our online memorialization system is a unique step by step process that is specific to {Order.petFirstName}.  */}
									{/* <p>The memorialization period is available for 48 hours following the passing of your pet. If you require additional time, please contact us as soon as possible so we can make arrangements for an extension.</p> */}
									{/* <p>If we require more information from you we will contact you using the information you provide us at the end of the memorialization section.</p> */}
									<div className="text-center mt-3 mb-3">
										<p>Please click below to get started.</p>
										<button type="button" className="btn btn-addon text-white"  onClick={() => handleView(state.viewDefaults.Welcome.next)} style={{backgroundColor: '#ec8333'}}><FontAwesomeIcon icon="paw" className="" /> <Translate id="Begin Memorialization" /></button>
									</div>
								</div>
							</div>
						</div>
						<div className="col-lg-3 col-md-2 col-sm-1" />
					</div>
				</div>
			</div>
		</div>
	)
}

// Cremation Service
const CremationServicesForm = compose (
	queryWithLoading({
		gqlString: getDeletedCremationProductQuery,
		variablesFunction: (props) => ({orderId: props.Order.orderId}),
		name: "DeletedCremationProduct"
	}),
	withMutation(LogOrderActivitySaveMutation, "LogOrderActivitySave"),
	withMutation(OrderProductDeleteMutation, "OrderProductDelete", ["getDeletedCremationProduct"]),
	withMutation(OrderProductRemoveMutation, "OrderProductRemove"),
	withMutation(OrderProductRemoveMutation, "OrderProductRemoveNonCommunalProducts", ["getOrderProducts"]),
	withMutation(OrderProductSaveMutation, "OrderProductSave", ["getOrderProducts"]),
	withMutation(OrderProductUndeleteMutation, "OrderProductUndelete", ["getDeletedCremationProduct","getOrderProducts"]),
	withFormik({
		handleSubmit: async ( input, { props: { Account, DeletedCremationProduct: {DeletedCremationProduct}, handleChangeHeaders, handleProductsContinueButtonClick, handleView, LoggedIn, LogOrderActivitySave, Order, OrderProductDelete, OrderProductRemove, OrderProductRemoveNonCommunalProducts, OrderProductSave, OrderProductUndelete, Products, setResponse, state, User }} ) => {
			// Set default for the next tab view, this is used if the cremation product does not change.
			let nextView = state.viewDefaults.Cremation.next;

			// Get the Product object for the selected cremation method
			const CremationProduct = Products.find((product) => product.productId === input.cremationProductId);

			// Set the values input for variables that are not editable in this form, just need to get them to the resolver when the mutation
			const invoiceCostCharged = CremationProduct.calculatedInvoiceCost;
			const invoiceCostChargedPersonalization = CremationProduct.calculatedInvoiceCostPersonalization;
			// price needs to be 'let' because it can change below based on if there was a previous cremation product
			let priceCharged = CremationProduct.calculatedPriceRetail;
			let priceChargedPersonalization = CremationProduct.calculatedPriceRetailPersonalization !== null ? CremationProduct.calculatedPriceRetailPersonalization : 0;
			const productName = CremationProduct.productName;

			let taxRate = CremationProduct.taxRate !== null ? CremationProduct.taxRate : Account.Settings.find((setting) => setting.name === 'taxRate').value;
			// If taxRate is a string because it was obtained from the account setting for taxRate, then make it a float before passing to the db
			taxRate = typeof taxRate === 'string' && taxRate !== '' && taxRate !== null ? parseFloat(taxRate) : taxRate;

			// Determine if there was already a cremation and/or viewing product on this order, and mark it deleted with reason accordingly
			// handle cremation checking
			if(parseInt(input.oldCremationProductId) === 0 && input.cremationProductId > 0) {
				// There was not a previous cremation service selected (this should never happen), so just save the productId
				// Async/Await Perform the mutation (to the server) and decompose the result.
				await OrderProductSave({ input: { invoiceCostCharged, invoiceCostChargedPersonalization, orderId: input.orderId, priceCharged, priceChargedPersonalization, productId: input.cremationProductId, productName, taxRate } });
			} else if(input.oldCremationProductId > 0 && input.oldCremationProductId !== input.cremationProductId) {
				// Need to mark the old cremation productId as deleted because there is a new one and there can only be one active one batman. Do not ACTUALLY delete the ordersProducts record for the old cremation, mark deleted=1
				// Get the orderProductId
				const OldCremationProduct = Order.ProductsOrder.find((product) => product.productId === input.oldCremationProductId);

				let NewCremationProduct = {};
				// If the old Cremation Product was already paid for at the Vet's office or if the petowner has already paid for the cremation (likely if this was started at the Crematory), then we need to mark it as deleted so that we can count the priceCharged towards the new Cremation Product. Otherwise, if the user is just switching unpaid cremation services, then remove the Cremation Product entirely.
				if(DeletedCremationProduct === null && (parseInt(OldCremationProduct.invoiceVet) === 1 || parseInt(OldCremationProduct.paymentCompletedPetOwner) === 1)) {
					// Determine the deletedReason based on being logged in - logged out indicates that the pet owner is memorializing at home.
					let deletedReason = LoggedIn === true ? 'Cremation product changed' : 'Cremation product changed by pet owner';

					await OrderProductDelete({ input: { deletedReason, orderProductId: OldCremationProduct.orderProductId } });
				} else {
					// If this product is invoiceVet=0, then it has not been paid for by the vet/petowner, so we can just remove it entirely from the order
					await OrderProductRemove({ input: { orderId: input.orderId, orderProductId: OldCremationProduct.orderProductId } });
				}

				let newCremationProductName = '';
				// For saving the new cremation product. Check if the DeletedCremationProduct is the same productId as the one being saved, if it is we just want to 'undelete' that ordersProducts record. Otherwise, save a new ordersProducts record.
				if(DeletedCremationProduct !== null && parseInt(input.cremationProductId) === parseInt(DeletedCremationProduct.productId)) {
					await OrderProductUndelete({ input: { orderProductId: DeletedCremationProduct.orderProductId } })
					newCremationProductName = DeletedCremationProduct.productName;
				} else {
					NewCremationProduct = await OrderProductSave({ input: { invoiceCostCharged, invoiceCostChargedPersonalization, orderId: input.orderId, priceCharged, priceChargedPersonalization, productId: input.cremationProductId, productName, taxRate } });
					newCremationProductName = NewCremationProduct.data.orderProductSave.OrderProduct.productName;
				}

				// Update the Log Order Activities table that the Cremation Service has changed
				let tempActivity = `Cremation Service changed from '${OldCremationProduct.productName}' to '${newCremationProductName}'`;
				let tempActivityType = LoggedIn === true ? 'Cremation Service changed by user' : 'Cremation Service changed by pet owner';
				let loggedInUserId = LoggedIn === true ? User.userId : 0;

				await LogOrderActivitySave({input: { accountId: parseInt(Account.accountId), activity: tempActivity, activityType: tempActivityType, dbField: null, dbTable: null, loggedInUserId: parseInt(loggedInUserId), orderId: parseInt(input.orderId), showVet: 1, userInitials: input.userInitials, valueNew: newCremationProductName, valueOld: OldCremationProduct.productName }})

				// Handle cases where the Cremation Service switches to or from 'Communal Cremation'. We are only concerned with changes that make it necessary
				if(OldCremationProduct.productName === 'Communal Cremation') {
					handleChangeHeaders('Individual');
					nextView = state.showSpecialServices ? 'SpecialServices' : 'Urns';
				} else if(newCremationProductName === 'Communal Cremation') {
					handleChangeHeaders('Communal');
					nextView = 'PawPrints';
					// Need to remove any products from this order that are Urns, Keepsakes, or Jewelry - since those are not available for Communal Cremation.
					// Get the array of products to delete
					let ProductsToDeleteFromOrder = Order.ProductsOrder.filter((product) => product.productCategory === 'Urns' || product.parentCategory === 'Urns' || product.productCategory === 'Keepsakes' || product.parentCategory === 'Keepsakes' || product.productCategory === 'Jewelry' || product.parentCategory === 'Jewelry' || product.productCategory === 'Optional Services' || product.parentCategory === 'Optional Services')
					// Send these products to be removed from the order
					ProductsToDeleteFromOrder.forEach((product) => {
						// This call does literally the same mutation as OrderProductRemove, except that there is the refetch for getOrderProducts for this one.
						OrderProductRemoveNonCommunalProducts({ input: { orderId: input.orderId, orderProductId: product.orderProductId } });
					})
				}
			} else if(input.oldCremationProductId > 0) {
				// do not need to save because the cremation service was not changed. Nothing needs to happen in this condition, just putting it here for reference of what the other case option is.
			}

			// Go to the next view
			handleView(nextView);
		}
	}),
	withTranslate
)(CremationServicesFormContent);

//	withMutation(ProductCategorySaveMutation, "ProductCategorySave", ["getProductCategories"]),
const ProductMemorializationForm = compose (
	withFormik({
		handleSubmit: async ( input, { props: { handleEdit, ProductCategorySave, setResponse, }} ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			const { data: { productCategorySave }} = await ProductCategorySave({ input });

			handleEdit(productCategorySave.ProductCategory);

			setResponse(productCategorySave.Response);
		},
		validationSchema: () => Yup.object().shape({
			productCategory: Yup.string().required("Enter a Product Category"),
			productTypeId: Yup.number().required("Select a Product Type")
	   })
	}),
	withTranslate
)(ProductMemorializationFormContent);

// Special Services
const SpecialServicesForm = compose (
	withMutation(OrderProductRemoveMutation, "OrderProductRemove", ["getOrderProducts"]),
	withMutation(OrderProductSaveMutation, "OrderProductSave", ["getOrderProducts"]),
	withFormik({
		handleSubmit: async ( input, { props: { Account, handleChangeHeaders, handleProductsContinueButtonClick, handleView, Order, OrderProductRemove, OrderProductSave, Products, setResponse, state }} ) => {
			let nextView = state.view.next;

			// Check if expeditedCremation was selected and it previously was not
			if(input.expeditedCremation === true && input.oldExpeditedCremation === false) {
				// Get the Product object for the expedited cremation
				const ExpeditedCremationProduct = Products.find((product) => product.productName === 'Expedited Cremation');

				// Set the values input for variables that are not editable in this form, just need to get them to the resolver when the mutation
				const invoiceCostChargedExpedited = ExpeditedCremationProduct.calculatedInvoiceCost;
				const invoiceCostChargedPersonalizationExpedited = ExpeditedCremationProduct.calculatedInvoiceCostPersonalization;
				const priceChargedExpedited = ExpeditedCremationProduct.calculatedPriceRetail;
				const priceChargedPersonalizationExpedited = ExpeditedCremationProduct.calculatedPriceRetailPersonalization;
				const productNameExpedited = ExpeditedCremationProduct.productName;
				let taxRateExpedited = ExpeditedCremationProduct.taxRate !== null ? ExpeditedCremationProduct.taxRate : Account.Settings.find((setting) => setting.name === 'taxRate').value;

				// If taxRate is a string because it was obtained from the account setting for taxRate, then make it a float before passing to the db
				taxRateExpedited = typeof taxRateExpedited === 'string' && taxRateExpedited !== '' && taxRateExpedited !== null ? parseFloat(taxRateExpedited) : taxRateExpedited;

				// Need to save the new product
				const expeditedCremationProductId = ExpeditedCremationProduct.productId;
				OrderProductSave({ input: {
					invoiceCostCharged: invoiceCostChargedExpedited,
					invoiceCostChargedPersonalization: invoiceCostChargedPersonalizationExpedited,
					orderId: input.orderId,
					priceCharged: priceChargedExpedited,
					priceChargedPersonalization: priceChargedPersonalizationExpedited,
					productId: expeditedCremationProductId,
					productName: productNameExpedited,
					taxRate: taxRateExpedited
				 } });
			} else if(input.expeditedCremation === false && input.oldExpeditedCremation === true) {
				// Need to remove the old product from the ordersProducts table for this order
				const OldExpeditedCremationOrderProductId = Order.ProductsOrder.find((product) => product.productName === 'Expedited Cremation').orderProductId;
				OrderProductRemove({ input: { orderId: input.orderId, orderProductId: OldExpeditedCremationOrderProductId } });
			} else {
				// If both new and old expeditedCremation are both true or both false, then we don't need to do anything
			}

			//handle viewing / visitation checking
			if(input.oldViewingProductId === 0 && input.viewingProductId > 0) {
				// Get the Product object for the viewing product
				const ViewingProduct = Products.find((product) => product.productId === input.viewingProductId);

				// Set the values input for variables that are not editable in this form, just need to get them to the resolver when the mutation
				const invoiceCostChargedViewing = ViewingProduct.calculatedInvoiceCost;
				const invoiceCostChargedPersonalizationViewing = ViewingProduct.calculatedInvoiceCostPersonalization;
				const priceChargedViewing = ViewingProduct.calculatedPriceRetail;
				const priceChargedPersonalizationViewing = ViewingProduct.calculatedPriceRetailPersonalization;
				const productNameViewing = ViewingProduct.productName;
				let taxRateViewing = ViewingProduct.taxRate !== null ? ViewingProduct.taxRate : Account.Settings.find((setting) => setting.name === 'taxRate').value;

				// If taxRate is a string because it was obtained from the account setting for taxRate, then make it a float before passing to the db
				taxRateViewing = typeof taxRateViewing === 'string' && taxRateViewing !== '' && taxRateViewing !== null ? parseFloat(taxRateViewing) : taxRateViewing;

				// There was not a previous viewing/visitation service selected, so just save the productId
				// Async/Await Perform the mutation (to the server) and decompose the result.
				OrderProductSave({ input: {
					invoiceCostCharged: invoiceCostChargedViewing,
					invoiceCostChargedPersonalization: invoiceCostChargedPersonalizationViewing,
					orderId: input.orderId,
					priceCharged: priceChargedViewing,
					priceChargedPersonalization: priceChargedPersonalizationViewing,
					productId: input.viewingProductId,
					productName: productNameViewing,
					taxRate: taxRateViewing
				 } });
			} else if(input.oldViewingProductId > 0 && input.oldViewingProductId !== input.viewingProductId) {
				// need to delete the old viewing productId because there is a new one and there can only be one batman
				// get the orderProductId
				const OldViewingProduct = Order.ProductsOrder.find((product) => product.productId === input.oldViewingProductId);
				await OrderProductRemove({ input: { orderId: input.orderId, orderProductId: OldViewingProduct.orderProductId } });

				// need to check that there is a new viewProductId, because there is a radio buttons for No Viewing, with value 0, so we do not need to save that.
				if(input.viewingProductId > 0) {
					// Get the Product object for the viewing product
					const ViewingProduct = Products.find((product) => product.productId === input.viewingProductId);

					// Set the values input for variables that are not editable in this form, just need to get them to the resolver when the mutation
					const invoiceCostChargedViewing = ViewingProduct.calculatedInvoiceCost;
					const invoiceCostChargedPersonalizationViewing = ViewingProduct.calculatedInvoiceCostPersonalization;
					const priceChargedViewing = ViewingProduct.calculatedPriceRetail;
					const priceChargedPersonalizationViewing = ViewingProduct.calculatedPriceRetailPersonalization;
					const productNameViewing = ViewingProduct.productName;
					let taxRateViewing = ViewingProduct.taxRate !== null ? ViewingProduct.taxRate : Account.Settings.find((setting) => setting.name === 'taxRate').value;

					// If taxRate is a string because it was obtained from the account setting for taxRate, then make it a float before passing to the db
					taxRateViewing = typeof taxRateViewing === 'string' && taxRateViewing !== '' && taxRateViewing !== null ? parseFloat(taxRateViewing) : taxRateViewing;

					// Async/Await Perform the mutation (to the server) and decompose the result.
					OrderProductSave({ input: {
						invoiceCostCharged: invoiceCostChargedViewing,
						invoiceCostChargedPersonalization: invoiceCostChargedPersonalizationViewing,
						orderId: input.orderId,
						priceCharged: priceChargedViewing,
						priceChargedPersonalization: priceChargedPersonalizationViewing,
						productId: input.viewingProductId,
						productName: productNameViewing,
						taxRate: taxRateViewing
					 } });
				}
			} else if(input.oldViewingProductId > 0) {
				// do not need to save because the viewing service was not changed. Nothing needs to happen in this condition, just putting it here for reference of what the other option is.
			}

			// Go to the next view
			handleView(nextView);
		}
	}),
	withTranslate
)(SpecialServicesFormContent);


//////////////////////////////////////// END FORMIK //////////////////////////////////////////////////////////////////////////////////

const HandleFormsDisplay = (props) => {
	const {
		Account,
		handleChangeHeaders,
		handleProductsContinueButtonClick,
		handleProductView,
		handleRemoveItemClick,
		handleShowMoreInformation,
		handleUrnAddedInClinic,
		handleView,
		LoggedIn,
		Order,
		Product,
		ProductOptionValues,
		Products,
		ProductsGrouped,
		ProductsMemorialization,
		ProductSpecies,
		state,
		User
	} = props;

	if(state.productId > 0) {
		let taxRate = Product.taxRate !== null ? Product.taxRate : Account.Settings.find((setting) => setting.name === 'taxRate').value;
		// If taxRate is a string because it was obtained from the account setting for taxRate, then make it a float before passing to the db
		taxRate = typeof taxRate === 'string' && taxRate !== '' && taxRate !== null ? parseFloat(taxRate) : taxRate;

		// If this product is in a ProductGrup, then send that array to the product details page for easier click through.
		let ProductsGroup = [];
		if(parseInt(Product.productGroupId) > 0) {
			ProductsGroup = ProductsGrouped.filter((group) => parseInt(group.productGroupId) === parseInt(Product.productGroupId));
		}

		// NOTE BELOW: All of these commented out values are now calculated within the initialLoad functionality of this component.
		// let tempInvoiceCostCharged = Product.promotionalInvoiceCost === null ? Product.calculatedInvoiceCost : Product.promotionalInvoiceCost;
		// let tempInvoiceCostChargedPersonalization = Product.promotionalInvoiceCostPersonalization === null ? Product.calculatedInvoiceCostPersonalization : Product.promotionalInvoiceCostPersonalization;
		// let tempPriceCharged = Product.promotionalPriceRetail === null ?  Product.calculatedPriceRetail : Product.promotionalPriceRetail;
		// let tempPriceChargedPersonalization = Product.promotionalPriceRetailPersonalization === undefined ? Product.calculatedPriceRetailPersonalization: Product.promotionalPriceRetailPersonalization;
		// invoiceCostCharged={tempInvoiceCostCharged}
		// invoiceCostChargedPersonalization={tempInvoiceCostChargedPersonalization}
		// priceCharged={tempPriceCharged}
		// priceChargedPersonalization={tempPriceChargedPersonalization}

		return <ProductDetailForm
			Account={Account}
			companyId={Order.companyId}
			handleProductView={handleProductView}
			handleUrnAddedInClinic={handleUrnAddedInClinic}
			initialValues={{
				productId: state.productId,
				productName: Product.productName,
				productQuantity: 1,
			}}
			Product={Product}
			productId={state.productId}
			ProductOptionValues={ProductOptionValues}
			ProductsGroup={ProductsGroup}
			ProductsMemorialization={ProductsMemorialization}
			petReferenceNumber={props.petReferenceNumber}
			productTypeId={props.productTypeId}
			state={state}
			taxRate={taxRate}
			Order={Order}
		/>
	}
	else if(state.view.current === 'Basket') {
		return <BasketForm
			Account={Account}
			handleProductView={handleProductView}
			handleRemoveItemClick={handleRemoveItemClick}
			handleView={handleView}
			Order={Order}
			ProductsMemorialization={ProductsMemorialization}
			petReferenceNumber={props.petReferenceNumber}
			productTypeId={props.productTypeId}
			state={state}
		/>
	}
	else if(state.view.current === 'Checkout') {
		// If the delivery service on the Order is "courier delivery", AND there is not an ownerAddressId on this Order yet, then prepopulate the billing address fields with the same information as the courier address.
		let setOwnerAddressToDeliveryAddress = false;

		let address1 = '';
		let address2 = '';
		let city = '';
		let postalCode = '';
		let stateId = '';

		if(Order.memorialization === 'home' && Order.ProductsOrder.find((product) => product.productName === "Courier Delivery") && Order.ownerAddressId === null) {
			setOwnerAddressToDeliveryAddress = true;
		} else if(Order.ownerAddressId > 0 && Order.OwnerAddress) {
			address1 = Order.OwnerAddress.address1;
			address2 = Order.OwnerAddress.address2;
			city = Order.OwnerAddress.city;
			postalCode = Order.OwnerAddress.postalCode;
			stateId = Order.OwnerAddress.stateId;
		}

		return <CheckoutConfirmationForm
			Account={Account}
			handleProductView={handleProductView}
			handleView={handleView}
			initialValues={{
				address1: address1,
				address2: address2,
				city: city,
				orderId: Order.orderId,
				orderStatusId: Order.orderStatusId,
				ownerAddressId: Order.ownerAddressId,
				ownerEmail: Order.ownerEmail,
				ownerFirstName: Order.ownerFirstName,
				ownerLastName: Order.ownerLastName,
				ownerPhoneNumber: Order.ownerPhoneNumber,
				postalCode: postalCode,
				stateId: stateId
			}}
			Order={Order}
			setOwnerAddressToDeliveryAddress={setOwnerAddressToDeliveryAddress}
			state={state}
		/>
	}
	else if(state.view.current === 'CheckoutCompleted') {
		// this Checkout Completed form does not have any Formik needed, so display the content here directly.
		return <React.Fragment>
			<CheckoutCompletedFormContent
				Account={Account}
				jobId={state.jobId}
				LoggedIn={LoggedIn}
				Order={Order}
				User={User}
				state={state}
			/>
		</React.Fragment>
	}
	else if(state.view.current === 'Cremation') {
		// If this condition hits, it means that the 'Continue' button has been clicked and the Cremation Service was going to be downgraded from Individual to Communal.
		// Since this warning message triggers a state change, the form reloads and we would lose all of the values in the form. So we update the initialValues so this does not happen.
		let initialValues = {
			cremationProductId: 0,
			invoiceVet: 0,
			oldCremationProductId: 0,
			orderId: Order.orderId,
			paymentCompletedPetOwner: 0
		}
		if(state.productsContinueButton.values.orderId) {
			initialValues = state.productsContinueButton.values;
		} else {
			let CremationProduct = Order.ProductsOrder.find((product) => product.productTypeId === '2' && product.productCategory === 'Cremations');
			if(CremationProduct) {
				initialValues.cremationProductId = CremationProduct.productId;
				initialValues.invoiceVet = CremationProduct.invoiceVet;
				initialValues.oldCremationProductId = CremationProduct.productId;
				initialValues.paymentCompletedPetOwner = CremationProduct.paymentCompletedPetOwner;
			}
			// Currently 'Expedited Cremation' is the only 'Other Cremation Service', but as we add more, we may need to rethink how we set these since all of them would be checkboxes. Also, 'Expedited Cremation' is system wide, and account specific products in this category may be treated differently
			if(Order.ProductsOrder.findIndex((product) => product.productName === 'Expedited Cremation') > -1) {
				initialValues.expeditedCremation = true;
				initialValues.oldExpeditedCremation = true;
			}
			// Check to see first if there was a viewing product selected
			let ViewingProduct = Order.ProductsOrder.find((product) => product.productTypeId === '2' && product.productName === 'Visitation & Viewing');
			if(ViewingProduct) {
				initialValues.viewingProductId = ViewingProduct.productId;
				initialValues.oldViewingProductId = ViewingProduct.productId;
			}

		}

		// Need to pass in the product for Visitation and Viewing
		return <CremationServicesForm
			Account={Account}
			handleChangeHeaders={handleChangeHeaders}
			handleProductsContinueButtonClick={handleProductsContinueButtonClick}
			handleView={handleView}
			initialValues={initialValues}
			LoggedIn={LoggedIn}
			Products={Products}
			Order={Order}
			state={state}
			User={User}
		/>
	}
	else if(state.view.current === 'Delivery') {
		// Determine if there is already a Delivery product on this order
		let DeliveryProduct = Order.ProductsOrder.find((product) => product.productTypeId === '3' && product.productCategory === 'Delivery');
		let productId = DeliveryProduct ? DeliveryProduct.productId : 0;
		let deliveryProductMethodName = DeliveryProduct ? DeliveryProduct.productName : '';
		// set the value of the original delivery product Id so that we can compare it to the productId that is selected when the 'Proceed to Checkout' button is clicked.
		// this will determine if we need to save the delivery product Id, and if we need to remove the old delivery productId since there can only be one batman

		const userTypeId = User ? User.userTypeId : 0;
		return <DeliveryForm
			Account={Account}
			handleProductsContinueButtonClick={handleProductsContinueButtonClick}
			handleProductView={handleProductView}
			handleView={handleView}
			initialValues={{
				deliveryAddressId: Order.deliveryAddressId > 0 ? Order.deliveryAddressId : 0,
				deliveryProductMethodName: deliveryProductMethodName,
				oldDeliveryProductId: productId,
				orderId: Order.orderId,
				productId: productId
			}}
			petReferenceNumber={props.petReferenceNumber}
			productTypeId={props.productTypeId}
			Order={Order}
			state={state}
			userTypeId={userTypeId}
		/>
	}
	else if(state.view.current === 'SpecialServices') {
		let initialValues = {
			expeditedCremation: false,
			expeditedCremationInvoiceVet: 0,
			oldExpeditedCremation: false,
			oldViewingProductId: 0,
			orderId: Order.orderId,
			viewingInvoiceVet: 0,
			viewingProductId: 0
		}
		if(state.productsContinueButton.values.orderId) {
			initialValues = state.productsContinueButton.values;
		} else {
			// Currently 'Expedited Cremation' is the only 'Other Cremation Service', but as we add more, we may need to rethink how we set these since all of them would be checkboxes. Also, 'Expedited Cremation' is system wide, and account specific products in this category may be treated differently
			let ExpeditedCremationProduct = Order.ProductsOrder.find((product) => product.productName === 'Expedited Cremation');

			if(ExpeditedCremationProduct) {
				initialValues.expeditedCremation = true;
				initialValues.expeditedCremationInvoiceVet = ExpeditedCremationProduct.invoiceVet;
				initialValues.oldExpeditedCremation = true;
			}
			// Check to see first if there was a viewing product selected
			let ViewingProduct = Order.ProductsOrder.find((product) => product.productName === 'Visitation & Viewing');
			if(ViewingProduct) {
				initialValues.viewingProductId = ViewingProduct.productId;
				initialValues.viewingInvoiceVet = ViewingProduct.invoiceVet;
				initialValues.oldViewingProductId = ViewingProduct.productId;
			}
		}

		// Need to pass in the product for Visitation and Viewing
		return <SpecialServicesForm
			Account={Account}
			handleChangeHeaders={handleChangeHeaders}
			handleProductsContinueButtonClick={handleProductsContinueButtonClick}
			handleView={handleView}
			initialValues={initialValues}
			Products={Products}
			Order={Order}
			state={state}
		/>
	}
	else if(state.view.current === 'Welcome') {
		return <WelcomeForm
			Account={Account}
			handleShowMoreInformation={handleShowMoreInformation}
			handleView={handleView}
			initialValues={{ showMoreInformation: false }}
			Order={Order}
			showMoreInformation={state.showMoreInformation}
			state={state}
		/>
	}
	else if(state.productId === 0) {
		return <ProductMemorializationForm
			Account={Account}
			handleProductsContinueButtonClick={handleProductsContinueButtonClick}
			handleProductView={handleProductView}
			handleShowMoreInformation={handleShowMoreInformation}
			handleView={handleView}
			Order={Order}
			Products={Products}
			ProductsGrouped={ProductsGrouped}
			ProductSpecies={ProductSpecies}
			state={state}
		/>
	}
}

class ProductsMemorializationClass extends React.Component {
	constructor(props) {
    	super(props)

		const { Order } = props.OrderProducts;
		const { ProductsOrder } = Order;

		const keepsakesProducts = props.ProductsMemorialization.ProductsMemorialization.filter(({ productCategory, parentCategory }) => productCategory === 'Keepsakes' || parentCategory === 'Keepsakes' );
		const showKeepsakes = keepsakesProducts.length > 0 ? true : false;
		const jewelryProducts = props.ProductsMemorialization.ProductsMemorialization.filter(({ productCategory, parentCategory }) => productCategory === 'Jewelry' || parentCategory === 'Jewelry' );
		const showJewelry = jewelryProducts.length > 0 ? true : false;
		const showSpecialServices = parseInt(Order.expeditedCremationAllowed) === 0 && parseInt(Order.visitationAllowed) === 0 ? false : true;

		// Determine the initial header status based on who is viewing this page, as well as if the cremation service was for individual/private or for a communal + pawprint
		// This will be updated below if the user is not logged in, meaning it is an At Home Memorial

		let initialHeaderStatus = {};

		initialHeaderStatus = {
			Basket: { buttonClass: 'btn-secondary opacity-65', disabled: false, visible: true },
			Checkout: { buttonClass: 'btn-default', disabled: true, visible: true },
			Cremation: { buttonClass: 'btn-secondary', disabled: false, visible: false },
			Delivery: { buttonClass: 'btn-default', disabled: true, visible: true },
			Jewelry: { buttonClass: 'btn-default', disabled: true, visible: showJewelry === true },
			Keepsakes: { buttonClass: 'btn-default', disabled: true, visible: showKeepsakes === true },
			PawPrints: { buttonClass: 'btn-default', disabled: true, visible: true },
			SpecialServices: { buttonClass: 'btn-default', disabled: true, visible: showSpecialServices },
			Urns: { buttonClass: 'btn-default', disabled: true, visible: true },
			VetSupplies: { buttonClass: 'btn-secondary', disabled: true, visible: false },
			Welcome: { buttonClass: 'btn-secondary', disabled: true, visible: false }
		};
	
		// Determine which page should be the initial view - this will be updated below if the user is not logged in, meaning it is an At Home Memorial
		let initialView = { current: 'Urns', next: 'Paw Prints', previous: '' };

		// Determine the view objects for each section based on who is viewing this page, as well as if the cremation service was for individual/private or for a communal + pawprint
		let viewDefaults = {
		   	Basket: { current: 'Basket', next: 'Delivery', previous: 'Jewelry' },
		   	Checkout: { current: 'Checkout', next: '', previous: 'Delivery' },
		   	CheckoutCompleted: { current: 'Checkout', next: '', previous: '' },
		   	Cremation: { current: 'Cremation', next: 'SpecialServices', previous: '' },
		   	Delivery: { current: 'Delivery', next: 'Checkout', previous: 'Basket' },
		   	Jewelry: { current: 'Jewelry', next: 'Basket', previous: 'Keepsakes' },
		   	Keepsakes: { current: 'Keepsakes', next: 'Jewelry', previous: 'PawPrints' },
		   	PawPrints: { current: 'PawPrints', next: 'Keepsakes', previous: 'Urns' },
		   	SpecialServices: { current: 'SpecialServices', next: 'Urns', previous: 'Cremation' },
		   	Urns: { current: 'Urns', next: 'PawPrints', previous: 'SpecialServices' }
		};

		// Determine if the Cremation order is for Communal or Individual/Private
		let communalCremation = false;
		const CremationProduct = ProductsOrder.find((product) => product.productTypeId === '2' && product.productCategory === 'Cremations') || {};

		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		// IMPORTANT: Above we have set the initial state objects for the scenario of an Individual/Private Cremation with Memorialization done In Clinic.
		// Below we will adjust those variables based on a Communal cremation, and if the Memorialization is done At Home
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		// Limit the headerStatus and viewDefaults for the Communal Cremation
		if(Order.orderTypeId === 2) {
			if(CremationProduct.productName === 'Communal Cremation') {
				communalCremation = true;
				initialView = { current: 'PawPrints', next: 'Basket', previous: '' };

				initialHeaderStatus ={
					Basket: { buttonClass: 'btn-secondary opacity-65', disabled: false, visible: true },
					Checkout: { buttonClass: 'btn-default', disabled: true, visible: true },
					Cremation: { buttonClass: 'btn-secondary', disabled: false, visible: false },
					Delivery: { buttonClass: 'btn-default', disabled: true, visible: true },
					Jewelry: { buttonClass: 'btn-default', disabled: true, visible: false },
					Keepsakes: { buttonClass: 'btn-default', disabled: true, visible: false },
					PawPrints: { buttonClass: 'btn-secondary', disabled: false, visible: true },
					Urns: { buttonClass: 'btn-default', disabled: true, visible: false },
					SpecialServices: { buttonClass: 'btn-default', disabled: true, visible: false },
					VetSupplies: { buttonClass: 'btn-secondary', disabled: true, visible: false },
					Welcome: { buttonClass: 'btn-secondary', disabled: true, visible: false }
				};

				viewDefaults = {
					Basket: { current: 'Basket', next: 'Delivery', previous: 'PawPrints' },
					Checkout: { current: 'Checkout', next: '', previous: 'Delivery' },
					CheckoutCompleted: { current: 'Checkout', next: '', previous: '' },
					Cremation: { current: 'Cremation', next: 'PawPrints', previous: '' },
					Delivery: { current: 'Delivery', next: 'Checkout', previous: 'Basket' },
					PawPrints: { current: 'PawPrints', next: 'Basket', previous: '' },
				};

				//Update these variables appropriately based on what a user should see when they are doing the At Home Memorialization
				if(props.OrderProducts.Order.memorialization === 'home') {
					let urnIndex = Order.ProductsOrder.findIndex((product) => (product.productCategory === 'Urns' || product.parentCategory === 'Urns') && product.statusRemainsFilledIndicator === 1);
					let deliveryIndex = Order.ProductsOrder.findIndex((product) => product.productCategory === 'Delivery' || product.parentCategory === 'Delivery');
					if(deliveryIndex > -1) initialHeaderStatus.Delivery = { buttonClass: 'btn-secondary opacity-65', disabled: false, visible: true }; // If there is already a delivery product on the order, enable the delivery tab
					// If the Vet's company does not have the flag for homeMemorializationsEditCremation = 1, then do not show the Cremation Services section
					if(parseInt(props.OrderProducts.Order.homeMemorializationsEditCremation) === 0) {
						// Only show the welcome page for in the order is At Home Memorialization
						initialView = { current: 'Welcome', next: 'PawPrints', previous: '' };

						initialHeaderStatus.Cremation.visible = false;

						initialHeaderStatus.Basket = { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: true }
						initialHeaderStatus.Checkout = { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: true }
						initialHeaderStatus.Delivery = { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: true }
						initialHeaderStatus.PawPrints = { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: true }
						initialHeaderStatus.Welcome = { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: true }

						viewDefaults.Welcome = { current: 'Welcome', next: 'PawPrints', previous: '' };
						viewDefaults.PawPrints.previous = 'Welcome'

						// Update if the order/company option for allowing paw prints on communal cremations is set to no
						// if(Order.communalPawPrintAllowed === 'no' || Order.communalPawPrintAllowed === 'clinic_only') {
						// 	initialView.next = 'Basket';
						// 	initialHeaderStatus.PawPrints.visible = false;
						// 	viewDefaults.Basket.previous = 'Welcome';
						// 	viewDefaults.Welcome.next = 'Basket';
						// }

					} else {
						// Only show the welcome page for in the order is At Home Memorialization
						initialView = { current: 'Welcome', next: 'Cremation', previous: '' };

						initialHeaderStatus.Welcome = { buttonClass: 'btn-secondary', disabled: false, visible: true };
						// Update the initialHeaderStatus value for Cremation, since it will not be the first category viewed now
						initialHeaderStatus.Cremation = { buttonClass: 'btn-default', disabled: true, visible: true };

						viewDefaults.Welcome = { current: 'Welcome', next: 'Cremation', previous: '' };
						// Update the viewDefault value for PawPrints, since it will not be the first category viewed now
						viewDefaults.Cremation.previous = 'Welcome'

						// Update if the order/company option for allowing paw prints on communal cremations is set to no
						if(Order.communalPawPrintAllowed === 'no' || Order.communalPawPrintAllowed === 'clinic_only') {
							initialHeaderStatus.PawPrints.visible = false;
							viewDefaults.Basket.previous = 'Cremation';
							viewDefaults.Cremation.next = 'Basket';
						}
					}
				} else {
					// Update if the order/company option for allowing paw prints on communal cremations is set to no
					if(Order.communalPawPrintAllowed === 'no') {
						initialHeaderStatus.PawPrints.visible = false;
						initialView.next = 'Basket';
						viewDefaults.Basket.previous = '';
						viewDefaults.Cremation.next = 'Basket';
					}
				}
			}
			else if(props.OrderProducts.Order.memorialization === 'home') {
				// This condition handles all cremation services besides Communal for At Home Memorialization
				// If the Vet's company does not have the flag for homeMemorializationsEditCremation = 1, then do not show the Cremation Services section
				if(parseInt(props.OrderProducts.Order.homeMemorializationsEditCremation) === 0) {
					//Update these variables appropriately based on what a user should see when they are doing the At Home Memorialization
					// let deliveryIndex = Order.ProductsOrder.findIndex((product) => product.productCategory === 'Delivery' || product.parentCategory === 'Delivery');
					// if(deliveryIndex > -1) initialHeaderStatus.Delivery = { buttonClass: 'btn-secondary opacity-65', disabled: false, visible: true }; // If there is already a delivery product on the order, enable the delivery tab

					// Only show the welcome page for At Home Memorialization
					initialView = { current: 'Welcome', next: 'Urns', previous: '' };

					initialHeaderStatus.Basket = { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: true }
					initialHeaderStatus.Checkout = { buttonClass: 'btn-default border border-secondary opacity-65', disabled: true, visible: true }
					initialHeaderStatus.Delivery = { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: true }
					initialHeaderStatus.Jewelry = { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: showJewelry === true }
					initialHeaderStatus.Keepsakes = { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: showKeepsakes === true }
					initialHeaderStatus.PawPrints = { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: true }
					initialHeaderStatus.Urns = { buttonClass: 'btn-secondary', disabled: false, visible: true }
					initialHeaderStatus.Welcome = { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: true }

					let urnIndex = Order.ProductsOrder.findIndex((product) => (product.productCategory === 'Urns' || product.parentCategory === 'Urns') && product.statusRemainsFilledIndicator === 1);
					if(urnIndex > -1) initialHeaderStatus.Checkout= { buttonClass: 'btn-secondary border border-white opacity-65', disabled: false, visible: true }; // This is Private cremation, so IF there is an Urn on the order already, we can enable the Checkout.

					delete viewDefaults.Cremation;
					delete viewDefaults.SpecialServices;
					//viewDefaults.SpecialServices = { current: 'SpecialServices', next: 'Urns', previous: 'Welcome' };
					viewDefaults.Welcome = { current: 'Welcome', next: 'Urns', previous: '' };
					// Update the viewDefault value for Urns, since it will not be the first category viewed now
					viewDefaults.Urns.previous = 'Welcome'
				} 
				else {
					//Update these variables appropriately based on what a user should see when they are doing the At Home Memorialization
					// Only show the welcome page for At Home Memorialization
					initialView = { current: 'Welcome', next: 'Cremation', previous: '' };

					initialHeaderStatus.Welcome = { buttonClass: 'btn-secondary', disabled: false, visible: true };
					// Update the initialHeaderStatus value for Cremation, since it will not be the first category viewed now
					initialHeaderStatus.Cremation = { buttonClass: 'btn-default', disabled: true, visible: true } ;

					viewDefaults.Welcome = { current: 'Welcome', next: 'Cremation', previous: '' };
					// Update the viewDefault value for Cremation, since it will not be the first category viewed now
					viewDefaults.Cremation.previous = 'Welcome'
				}
			}
			else if(props.OrderProducts.Order.memorialization === 'clinic') {
				// This condition handles all cremation services besides Communal for the Vet Clinics and Crematory Staff
				// For Private Cremation, do not show the Cremation Services section
				initialView = { current: 'Urns', next: 'Paw Prints', previous: '' };
				initialHeaderStatus.Welcome = { buttonClass: 'btn-secondary', disabled: false, visible: false };
				initialHeaderStatus.Urns = { buttonClass: 'btn-secondary', disabled: false, visible: true };
				// Update the initialHeaderStatus value for Cremation, since it will not be viewed now
				initialHeaderStatus.Cremation.visible = false;
				viewDefaults.Urns.previous = '';
				delete viewDefaults.Cremation;
				delete viewDefaults.SpecialServices;
			}
				
			// For Clinics, just allow them to automatically click through any of the Nav.
			if(props.OrderProducts.Order.memorialization === 'clinic') {
				Object.entries(initialHeaderStatus).forEach(([key, value]) => {
					if(value.visible === true) {
						if(value.buttonClass !== 'btn-secondary') {
							value.buttonClass = 'btn-secondary opacity-65 border border-white';
							value.disabled = false;
						}
						
					}
				});
			}
		}
		else if(Order.orderTypeId === 1) {
			// This is a Vet Supply Order
			initialView = { current: 'VetSupplies', next: 'Basket', previous: '' };

			initialHeaderStatus ={
				Basket: { buttonClass: 'btn-secondary', disabled: true, visible: true },
				Checkout: { buttonClass: 'btn-secondary', disabled: true, visible: true },
				Cremation: { buttonClass: 'btn-secondary', disabled: false, visible: false },
				Delivery: { buttonClass: 'btn-secondary', disabled: true, visible: true },
				Jewelry: { buttonClass: 'btn-secondary', disabled: true, visible: false },
				Keepsakes: { buttonClass: 'btn-secondary', disabled: true, visible: false },
				PawPrints: { buttonClass: 'btn-secondary', disabled: true, visible: false },
				SpecialServices: { buttonClass: 'btn-secondary', disabled: true, visible: false },
				Urns: { buttonClass: 'btn-secondary', disabled: true, visible: false },
				VetSupplies: { buttonClass: 'btn-secondary', disabled: false, visible: true },
				Welcome: { buttonClass: 'btn-secondary', disabled: true, visible: false }
			};

			viewDefaults = {
				Basket: { current: 'Basket', next: 'Delivery', previous: 'VetSupplies' },
				Checkout: { current: 'Checkout', next: '', previous: 'Delivery' },
				Delivery: { current: 'Delivery', next: 'Checkout', previous: 'Basket' },
				VetSupplies: { current: 'VetSupplies', next: 'Basket', previous: '' }
			};
		}
		else if(Order.orderTypeId === 3) {
			// This is a Product Only Order
			initialView = { current: 'Urns', next: 'PawPrints', previous: '' };

			initialHeaderStatus.Cremation.disabled = true;
			initialHeaderStatus.Cremation.visible = false;
			initialHeaderStatus.SpecialServices.visible = false;
			initialHeaderStatus.Urns.buttonClass = 'btn-secondary';
			initialHeaderStatus.Urns.disabled = false;

			viewDefaults.Urns.previous = '';
		}
		// If the tabMemorializationOpen flag is 1, that means that in the Order Details, the crematory is overriding the memorialation process being open and the selected sections only should be open.
		// We basically have to completely rebuild the intialHeaderStatus and viewDefaults since they are dpendent on which tabs are set = 1
		if(Order.tabMemorializationOpen === 1) {
			// create the tempArray which the activated tabs will be placed into so that we can determine the order of all the sections.
			let tempSectionsArray = [];
			if(Order.tabCremationServicesOpen === 1) { tempSectionsArray.push('Cremation') }
			if(Order.tabSpecialServicesOpen === 1) { tempSectionsArray.push('SpecialServices') }
			if(Order.tabUrnsOpen === 1) { tempSectionsArray.push('Urns') }
			if(Order.tabPawPrintsOpen === 1) { tempSectionsArray.push('PawPrints') }
			if(Order.tabKeepsakesOpen === 1) { tempSectionsArray.push('Keepsakes') }
			if(Order.tabJewelryOpen === 1) { tempSectionsArray.push('Jewelry') }
			tempSectionsArray.push('Basket');
			if(Order.tabDeliveryOpen === 1) { tempSectionsArray.push('Delivery') }
			tempSectionsArray.push('Checkout');

			// Generate the initialHeaderStatus and viewDefaults, reset the visible key to false on all sections
			initialHeaderStatus.Basket.visible = false;
			initialHeaderStatus.Checkout.visible = false;
			initialHeaderStatus.Cremation.visible = false;
			initialHeaderStatus.Delivery.visible = false;
			initialHeaderStatus.Jewelry.visible = false;
			initialHeaderStatus.Keepsakes.visible = false;
			initialHeaderStatus.PawPrints.visible = false;
			initialHeaderStatus.SpecialServices.visible = false;
			initialHeaderStatus.Urns.visible = false;
			initialHeaderStatus.VetSupplies.visible = false;
			initialHeaderStatus.Welcome.visible = false;
			viewDefaults = {};
			// Set the first tab as active.
			initialHeaderStatus[tempSectionsArray[0]] = {buttonClass: 'btn-secondary', disabled: false, visible: true};
			initialView = { current: tempSectionsArray[0], next: tempSectionsArray[1], previous: '' };
			viewDefaults[tempSectionsArray[0]] = {current: tempSectionsArray[0], next: tempSectionsArray[1], previous: ''};
			// Set the remaining tabs after 0
			let i=1;
			for(i = 1; i < tempSectionsArray.length; i++) {
				initialHeaderStatus[tempSectionsArray[i]] = {buttonClass: 'btn-default', disabled: true, visible: true};
				if(i+1 !== tempSectionsArray.length) {
					viewDefaults[tempSectionsArray[i]] = {current: tempSectionsArray[i], next: tempSectionsArray[i+1], previous: tempSectionsArray[i-1]};
				} else {
					viewDefaults[tempSectionsArray[i]] = {current: tempSectionsArray[i], next: '', previous: tempSectionsArray[i-1]};
				}
			}
		}
		// If there are not any Jewelry or Keepsakes products, hide those sections
		if(viewDefaults.Jewelry && showJewelry === false) {
			let nextSection = viewDefaults.Jewelry.next;
			let previousSection = viewDefaults.Jewelry.previous;
			viewDefaults[previousSection].next = viewDefaults[nextSection].current;
			viewDefaults[nextSection].previous = viewDefaults[previousSection].current;
			delete viewDefaults.Jewelry;
		}
		if(viewDefaults.Keepsakes && showKeepsakes === false) {
			let nextSection = viewDefaults.Keepsakes.next;
			let previousSection = viewDefaults.Keepsakes.previous;
			viewDefaults[previousSection].next = viewDefaults[nextSection].current;
			viewDefaults[nextSection].previous = viewDefaults[previousSection].current;
			delete viewDefaults.Keepsakes;
		}
		// If the special services section has both the expeditedCremationAllowed = 0 and visitationAllowed = 0, then hide that section
		if(viewDefaults.SpecialServices && showSpecialServices === false) {
			let nextSection = viewDefaults.SpecialServices.next;
			let previousSection = viewDefaults.SpecialServices.previous;
			viewDefaults[previousSection].next = viewDefaults[nextSection].current;
			viewDefaults[nextSection].previous = viewDefaults[previousSection].current;
			delete viewDefaults.SpecialServices;
		}
		// initialView = { current: 'Urns', next: 'PawPrints', previous: '' };
		// initialHeaderStatus.Cremation.visible = false;
		this.state= {
			basket: [], // Items to be purchased
			communalCremation: communalCremation, // this is used in the Products section for determining if Urns or PawPrints will be the first section, and therefore needing one of those products to be added before being able to continue to the next section.
			cremationServiceSelected: '',
			headerStatus: initialHeaderStatus,
			jobId: 0, // this will be 0 until the checkout is completed, in the reponse to the orderCremationSave result on the checkout we get back the jobId for the latest cremation tag, then use that in the final checkout completion page to generate the print pdf tag automatically. (slight work around for passing the jobId through)
			navigationMessage: '',
			navigationMessageClass: '',
			productsContinueButton: {
				show: false,
				values: {},
				warningText: ''
			},
			productId: 0, // This is the productId for viewing the detail of a product. When > 0, show the product details view
			removeItemConfirming: 0,
			Response: null,
			showJewelry: showJewelry,
			showKeepsakes: showKeepsakes,
			showMoreInformation: false, // this is used in the Welcome page, which only shows up for In Home Memorialization
			showSpecialServices: showSpecialServices,
			validationStruct: {
				errors: {},
				values: {}
			},
			view: initialView,
			viewDefaults: viewDefaults
		}
	}

	// Changes the headers (sections) that are displayed when we change the cremation service from an communal to one of the individual options
	handleChangeHeaders = (cremationType) => {
		if(cremationType === 'Communal') {
			let viewDefaults = {
				Basket: { current: 'Basket', next: 'Delivery', previous: 'PawPrints' },
				Checkout: { current: 'Checkout', next: '', previous: 'Delivery' },
				CheckoutCompleted: { current: 'Checkout', next: '', previous: '' },
				Cremation: { current: 'Cremation', next: 'PawPrints', previous: '' },
				Delivery: { current: 'Delivery', next: 'Checkout', previous: 'Basket' },
				PawPrints: { current: 'PawPrints', next: 'Basket', previous: 'Cremation' }
			};
			// If this is a Home Memorialization, add the welcome viewDefault.
			if(this.props.OrderProducts.Order.memorialization === 'home') {
				viewDefaults.Welcome = { current: 'Welcome', next: 'Cremation', previous: '' };
				viewDefaults.Cremation.previous = 'Welcome';
			}

			this.setState({
				communalCremation: true,
				headerStatus: {
					...this.state.headerStatus,
					Basket: {
						...this.state.headerStatus.Basket,
						buttonClass: 'btn-default', disabled: true, visible: true
					},
					Jewelry: {
						...this.state.headerStatus.Jewelry,
						buttonClass: 'btn-default', disabled: true, visible: false
					},
					Keepsakes: {
						...this.state.headerStatus.Keepsakes,
						buttonClass: 'btn-default', disabled: true, visible: false
					},
					SpecialServices: {
						...this.state.headerStatus.SpecialServices,
						buttonClass: 'btn-default', disabled: true, visible: false
					},
					Urns: {
						...this.state.headerStatus.Urns,
						buttonClass: 'btn-default', disabled: true, visible: false
					}
				},
				viewDefaults
			},
			() => {
				// When switching (downgrading) to Communal, if there is already a PawPrint product in the basket, then we can show the Review Basket button as Active
				if(this.props.OrderProducts.Order.ProductsOrder.find((product) => product.productCategory === 'Paw Prints' || product.parentCategory === 'Paw Prints')) {
					this.setState({
						headerStatus: {
							...this.state.headerStatus,
							Basket: {
								...this.state.headerStatus.Basket,
								buttonClass: 'btn-success', disabled: false, visible: true
							}
						}
					})
				}
			});
		} else {
			let viewDefaults = {
				Basket: { current: 'Basket', next: 'Delivery', previous: 'SpecialServices' },
				Checkout: { current: 'Checkout', next: '', previous: 'Delivery' },
				CheckoutCompleted: { current: 'Checkout', next: '', previous: '' },
				Cremation: { current: 'Cremation', next: 'SpecialServices', previous: '' },
				Delivery: { current: 'Delivery', next: 'Checkout', previous: 'Basket' },
				Jewelry: { current: 'Jewelry', next: 'Basket', previous: 'Keepsakes' },
				Keepsakes: { current: 'Keepsakes', next: 'Jewelry', previous: 'PawPrints' },
				PawPrints: { current: 'PawPrints', next: 'Keepsakes', previous: 'Urns' },
				SpecialServices: { current: 'SpecialServices', next: 'Urns', previous: 'Cremation' },
				Urns: { current: 'Urns', next: 'PawPrints', previous: 'SpecialServices' }
			};
			// If there are not any Jewelry or Keepsakes products, hide those sections
			if(this.state.showJewelry === false) {
				let nextSection = viewDefaults.Jewelry.next;
				let previousSection = viewDefaults.Jewelry.previous;
				viewDefaults[previousSection].next = viewDefaults[nextSection].current;
				viewDefaults[nextSection].previous = viewDefaults[previousSection].current;
				delete viewDefaults.Jewelry;
			}
			if(this.state.showKeepsakes === false) {
				let nextSection = viewDefaults.Keepsakes.next;
				let previousSection = viewDefaults.Keepsakes.previous;
				viewDefaults[previousSection].next = viewDefaults[nextSection].current;
				viewDefaults[nextSection].previous = viewDefaults[previousSection].current;
				delete viewDefaults.Keepsakes;
			}
			// If special services (expeditedCremationAllowed and visitationAllowed) = 0, then do not show that section
			if(this.state.showSpecialServices === false) {
				let nextSection = viewDefaults.SpecialServices.next;
				let previousSection = viewDefaults.SpecialServices.previous;
				viewDefaults[previousSection].next = viewDefaults[nextSection].current;
				viewDefaults[nextSection].previous = viewDefaults[previousSection].current;
				delete viewDefaults.SpecialServices;
			}

			// If this is a Home Memorialization, add the welcome viewDefault.
			if(this.props.OrderProducts.Order.memorialization === 'home') {
				viewDefaults.Welcome = { current: 'Welcome', next: 'Cremation', previous: '' };
				viewDefaults.Cremation.previous = 'Welcome';
			}

			this.setState({
				communalCremation: false,
				headerStatus: {
					...this.state.headerStatus,
					Basket: {
						...this.state.headerStatus.Basket,
						buttonClass: 'btn-default', disabled: true, visible: true
					},
					Jewelry: {
						...this.state.headerStatus.Jewelry,
						buttonClass: 'btn-default', disabled: true, visible: this.state.showJewelry
					},
					Keepsakes: {
						...this.state.headerStatus.Keepsakes,
						buttonClass: 'btn-default', disabled: true, visible: this.state.showKeepsakes
					},
					PawPrints: {
						...this.state.headerStatus.PawPrints,
						buttonClass: 'btn-default', disabled: true, visible: true
					},
					SpecialServices: {
						...this.state.headerStatus.SpecialServices,
						buttonClass: 'btn-info', disabled: false, visible: this.state.showSpecialServices
					},
					Urns: {
						...this.state.headerStatus.Urns,
						buttonClass: 'btn-default', disabled: true, visible: true
					}
				},
				viewDefaults
			});
		}
	};

	// On the Products page, handle when the Continue button is clicked.
	handleProductsContinueButtonClick = (continueButtonDisabled, warningText, next, values) => {
		if(next === null || continueButtonDisabled === true) {
			// Do nothing, and display the warning message explaining why
			this.setState({
				productsContinueButton: {
					show: continueButtonDisabled,
					values,
					warningText: warningText
				}
			});
		} else {
			this.handleView(next);
		}
	};

	handleProductView = (productId, Response, makeBasketButtonActive=false) => {
		// Reset the Continue Button warning message if there was one - just always update this.
		this.setState({
			navigationMessage: '',
			navigationMessageClass: '',
			productsContinueButton: {
				show: false,
				values: {},
				warningText: ''
			},
			productId,
			Response,
			showMoreInformation: false
		}, () => {
			window.scrollTo(0, 0); // scroll to the top of the new page

			// Log the view into the productsViews table
			if(parseInt(productId) > 0) {
				this.props.ProductViewSave({ input: {
					orderId: this.props.OrderProducts.Order.orderId, 
					productId
				}});
			}

			if(makeBasketButtonActive === true) {
				// This function is specific for only memorialization In Clinic - when an Urn is added, make the Review Basket link active. The logic check for making this true is in the ProductDetails handleSubmit where handleProductView is called
				this.setState({
					headerStatus: {
						...this.state.headerStatus,
						Basket: { ...this.state.headerStatus.Basket, buttonClass: 'btn-secondary', disabled: false, visible: true }
					}
				});
			}
		})
	};

	handleRemoveItemClick = (orderProductId) => {
		this.setState({removeItemConfirming: orderProductId})
	};

	handleShowMoreInformation = () => {
		const showMoreInformation = this.state.showMoreInformation === false ? true : false;
		this.setState({showMoreInformation});
	};

	handleView = (view, jobId, disabled) => {
		if(view === 'CheckoutCompleted') {
			//disabled all of the headers - don't worry about restricting them to only the Communal + Paw Print options because we are not messing with the 'visible' key
			this.setState({
				headerStatus: {
					...this.state.headerStatus,
					Basket: { ...this.state.headerStatus.Basket, buttonClass: 'btn-default', disabled: true, visible: false },
					Checkout: { ...this.state.headerStatus.Checkout, buttonClass: 'btn-default', disabled: true, visible: false },
					Cremation: { ...this.state.headerStatus.Cremation, buttonClass: 'btn-default', disabled: true, visible: false },
					Delivery: { ...this.state.headerStatus.Delivery, buttonClass: 'btn-default', disabled: true, visible: false },
					Jewelry: { ...this.state.headerStatus.Jewelry, buttonClass: 'btn-default', disabled: true, visible: false },
					Keepsakes: { ...this.state.headerStatus.Keepsakes, buttonClass: 'btn-default', disabled: true, visible: false },
					PawPrints: { ...this.state.headerStatus.PawPrints, buttonClass: 'btn-default', disabled: true, visible: false },
					Urns: { ...this.state.headerStatus.Urns, buttonClass: 'btn-default', disabled: true, visible: false },
					VetSupplies: { ...this.state.headerStatus.VetSupplies, buttonClass: 'btn-default', disabled: true, visible: false },
					SpecialServices: { ...this.state.headerStatus.SpecialServices, buttonClass: 'btn-default', disabled: true, visible: false },
					Welcome: { ...this.state.headerStatus.Welcome, buttonClass: 'btn-default', disabled: true, visible: false }
				},
				jobId: jobId,
				navigationMessage: '',
				navigationMessageClass: '',
				productsContinueButton: {
					show: false,
					values: {},
					warningText: ''
				},
				Response: null,
				view: {
					current: view,
					next: '',
					previous: ''
				}
			}, () => {
				window.scrollTo(0, 0); // scroll to the top of the new page
			});
		} else {
			const { viewDefaults } = this.state;
			let newHeaderStatus = { buttonClass: 'btn-secondary', disbled: false, visible: true };;
			let newView = { current: view, next: viewDefaults[view].next, previous: viewDefaults[view].previous };
			// Get the current view, so that we can mark that view's headerStatus as activated and opacity-65
			let currentView = this.state.view.current;

			if(view === 'Checkout' && disabled === true) {
				this.setState({
					navigationMessage: 'Please add an Urn before completing your Memorialization',
					navigationMessageClass: 'alert alert-info'
				})
			} else {
				this.setState({
					headerStatus: {
						...this.state.headerStatus,
						[view]: newHeaderStatus,
						[currentView]: {
							...this.state.headerStatus[currentView],
							buttonClass: 'btn-secondary border border-white opacity-65'
						}
					},
					navigationMessage: '',
					navigationMessageClass: '',
					productsContinueButton: {
						show: false,
						values: {},
						warningText: ''
					},
					productId: 0,
					Response: null,
					showMoreInformation: false,
					view: newView
				}, () => {
					window.scrollTo(0, 0); // scroll to the top of the new page
				});
			}
		}
	}

	render () {
		const {
			Account,
			OrderProducts: { Order },
			ProductGroupsMemorializations: { ProductGroupsMemorializations },
			ProductsMemorialization: { ProductOptionValues, ProductsMemorialization, ProductGroups},
			ProductSpecies: { ProductSpecies },
			Session: { LoggedIn, User }
		} = this.props;
		const { headerStatus } = this.state;

		// This is the item count displayed on the Basket icon
		//const itemBasketCountString = Order.ProductsOrder.length > 1 ? `(${Order.ProductsOrder.length} ${this.props.translate('Items')})` : `(${Order.ProductsOrder.length} ${this.props.translate('Item')})`;
		const itemBasketCountString = Order.ProductsOrder.length > 0 ? `(${Order.ProductsOrder.length})` : '';
		
		// Filter down the array of products to display on each step here based on the 'view'
		let Products = [];
		let ProductsGrouped = [];
		if( this.state.view.current === "Cremation" ) {
			const { CremationProducts } = this.props.ProductsMemorialization;

			// Filter the cremationServices offered. Only show the 'Communal Cremation' if it was the option originally selected when the cremation order was created. Same for individual and private
			let CremationProductsFiltered = CremationProducts;
			if(this.state.communalCremation === false && Order.originallyCommunalCremation === 0) {
				CremationProductsFiltered = CremationProductsFiltered.filter((product) => product.productName !== 'Communal Cremation');
			}
			// Keep these as separate IF statements
			if(Order.originallyPrivateCremation === 1) {
				CremationProductsFiltered = CremationProductsFiltered.filter((product) => product.productName === 'Private Cremation');
			} else if(Order.originallyIndividualCremation === 1) {
				CremationProductsFiltered = CremationProductsFiltered.filter((product) => product.productName === 'Individual Cremation' || product.productName === 'Private Cremation');
			}

			// Filter further into Cremation products with the category "Cremations"
			Products = CremationProductsFiltered.filter((product) => product.productCategory === 'Cremations');

		} else if (this.state.view.current === "SpecialServices") {
			const { ProductsMemorialization } = this.props.ProductsMemorialization;
			// Determine the Special Service options before any of the cremation service filtering occurs below
			Products = ProductsMemorialization.filter((product) => {
				return parseInt(product.productCategoryId) === 27;
			});
		} 
		else {
			// Check if the view is for a product that has a multi-word category, and update according to be able to search for those products. The category variable is used as output on Product page.
			let productCategoryView = this.state.view.current === "PawPrints" ? "Paw Prints" : this.state.view.current;
			productCategoryView = this.state.view.current === "VetSupplies" ? "Veterinary Supplies" : productCategoryView;

			// Filter to show any products or products whose parent matches the category
			Products = ProductsMemorialization.filter(({ productCategory, parentCategory }) => productCategory === productCategoryView || parentCategory === productCategoryView );

			// Regroup the products if there are any Groups. This is used mostly for Urns so that only one product is shown of similar products. The changing product variation will be done through the product details page.
			if(Products.find((product) => parseInt(product.productGroupId) !== 0)) {
				// There are groups for the Product Category, so we sort by group and only show one product per group for display on the 'all products' page view
				let tempGroups = [];
				Products.forEach((product) => {
					// If this product's group has already been created, added to the group
					if(tempGroups.findIndex((group) => parseInt(group.productGroupId) === parseInt(product.productGroupId)) !== -1) {
						let tempGroup = tempGroups.find((group) => parseInt(group.productGroupId) === parseInt(product.productGroupId));
						// Push product to the group's array of products
						tempGroup.ProductGroupProducts.push(product);

						// Check to see if this product allows for personalization, and it hasnt been set in the previous loop.
						tempGroup.personalizationAllowed = product.personalizationAllowed === 1 ? 1 : tempGroup.personalizationAllowed;

						// Remove the decimal zeros if the price is $85.00, then show $85.
						let tempPrice = product.calculatedPriceRetail;
						tempPrice = tempPrice.substring(tempPrice.length-2, tempPrice.length) === '00' ? tempPrice.substring(0, tempPrice.length-3) : tempPrice;

						// Update the Group's priceMax/Min if this product is outside of the current range.
						tempGroup.priceMax = parseInt(tempPrice) > parseInt(tempGroup.priceMax) ? parseInt(tempPrice) : parseInt(tempGroup.priceMax);
						tempGroup.priceMin = parseInt(tempPrice) < parseInt(tempGroup.priceMin) ? parseInt(tempPrice) : parseInt(tempGroup.priceMin);

						// Update ProductGroupImages
						// Loop through the Group and create a new TempProductImage object to pass to the Image container in order to display the Group's images
						product.images.forEach((image) => {
							// if this productImageId is not in the array yet, then add it
							let tempIndex = tempGroup.ProductGroupImages.findIndex((i) => parseInt(i.productImageId) === parseInt(image.productImage));
							if(tempIndex === -1) {
								tempGroup.ProductGroupImages.push(image)
							}
						})
					}
					// Else create a new group object and add to the tempGroups
					else {
						// Get the Product Group Name
						let tempProductGroupName = parseInt(product.productGroupId) === 0 ? 'No Group' : ProductGroups.find((group) => parseInt(group.productGroupId) === parseInt(product.productGroupId)).productGroup;
						
						// Remove the decimal zeros if the price is $85.00, then show $85.
						let tempPrice = product.calculatedPriceRetail;
						tempPrice = tempPrice.substring(tempPrice.length-2, tempPrice.length) === '00' ? tempPrice.substring(0, tempPrice.length-3) : tempPrice;
						
						let TempProductGroupImages = [];
						// Loop through the Group and create a new TempProductImage object to pass to the Image container in order to display the Group's images
						product.images.forEach((image) => {
							// if this productImageId is not in the array yet, then add it
							let tempIndex = TempProductGroupImages.findIndex((i) => parseInt(i.productImageId) === parseInt(image.productImage));
							if(tempIndex === -1) {
								TempProductGroupImages.push(image)
							}
						})

						// Create new object for the group, and add the first Product
						let newGroup = {
							personalizationAllowed: product.personalizationAllowed,
							priceMax: tempPrice,
							priceMin: tempPrice,
							productGroup: tempProductGroupName,
							productGroupId: parseInt(product.productGroupId),
							ProductGroupProducts: [product],
							ProductGroupImages: TempProductGroupImages
						}
						tempGroups.push(newGroup);
					}
				});

				// For each Group, add the variation types and values that are available.
				tempGroups.forEach((group) => {
					// Get the memorialization products that are in this group
					let tempProductGroups = ProductGroupsMemorializations.filter((product) => parseInt(product.productGroupId) === parseInt(group.productGroupId));
					
					// If there are matching groups in the variations array (there always should be), then add these to the group's object as a new 'ProductVariations' object that will container the variations array, and available types / variations.
					let tempVariations = [];
					let tempVariationTypes = [];
					let tempVariationValues = [];

					if(tempProductGroups.length > 0) {
						tempVariations = tempProductGroups;
						tempVariations.forEach((variation) => {
							// If this tempVariationTypes array is empty, or the variation's type is not already in the tempVariationTypes array, push a new types object to the tempVariationTypes array.
							if(
								tempVariationTypes.length === 0 || 
								(tempVariationTypes.length > 0 && tempVariationTypes.findIndex((type) => parseInt(type.productVariationTypeId) === parseInt(variation.productVariationTypeId)) === -1)
								) {
								// Then push new object
								tempVariationTypes.push({ productVariationType: variation.productVariationType, productVariationTypeId: variation.productVariationTypeId });
							}

							// Do same for the variation values
							if(
								tempVariationValues.length === 0 || 
								(tempVariationValues.length > 0 && tempVariationValues.findIndex((value) => parseInt(value.productVariationValueId) === parseInt(variation.productVariationValueId)) === -1)
								) {
								let tempPrice = '';
								// Add prices to the VariationValues object for both "Sizes" and "Colors". We only show price for "Sizes" if there are size variations, but if there are only "Colors" we need the prices in the color too. (Ex: MDF urns)
								
								let tempPriceIndex = Products.findIndex((product) => parseInt(product.productId) === parseInt(variation.productId));
								if(tempPriceIndex > -1) {
									tempPrice = Products[tempPriceIndex].calculatedPriceRetail;
									// Remove the decimal zeros if the price is $85.00, then show $85.
									tempPrice = tempPrice.substring(tempPrice.length-2, tempPrice.length) === '00' ? tempPrice.substring(0, tempPrice.length-3) : tempPrice;
								} else {
									// console.log('BADDD!!!! : ', variation)
									// console.log('BADDD!!!! : ', Products)
								}
								// Then push new object
								tempVariationValues.push({ price: tempPrice, productVariationType: variation.productVariationType, productVariationTypeId: variation.productVariationTypeId, productVariationValue: variation.productVariationValue, productVariationValueId: variation.productVariationValueId });
							}
						})
					}

					// Add the temp variation arrays as a struct to this group 
					group.ProductVariations = {
						Variations: tempVariations,
						VariationTypes: tempVariationTypes,
						VariationValues: tempVariationValues
					}
				});

				// Set the ProductsGrouped array to the filtered and grouped products
				ProductsGrouped = tempGroups;
			}
		}

		const Product = this.state.productId > 0 ? Products.find((product) => product.productId === this.state.productId) : [];

		let style = {};
		style.backgroundImage = `url(/images/ui/loyalpaws_background1.jpg)`;
		style.backgroundSize = 'cover';
		style.backgroundPosition = 'center center';
		style.backgroundRepeat = 'no-repeat';

		// If the memorialization process is already completed, do not let them make changes
		if(Order.memorialization === 'none') {
			return (
				<div className="row">
					<div className="col-12">
						<div className="alert alert-warning">
							<Translate id="Memorialization Not Selected" />
						</div>
					</div>
				</div>
			)
		}
		else if(parseInt(Order.orderStatusId) === 6) {
			return (
				<div className="row">
					<div className="col-12">
						<div className="alert alert-warning">
							<Translate id="This Order has been deleted. Please contact Loyal Paws for the replacement Order details." />
						</div>
					</div>
				</div>
			)
		}
		// Per Jon's request, added on 8/7/2019, Vets can edit Memorialization on their cremation orders as long as the status is still 'Awaiting Pickup at Hospital'.
		// In the else if below, we cover that scenario by executing on any Non-Vet user, and any Vet when the status is not that. Otherwise, the elses continue and will show the memorialization for Vets when the Order Status is 1
		else if(LoggedIn === true && User !== null && 
						parseInt(Order.memorializationCheckedOut) === 1 && Order.tabMemorializationOpen === 0  && 
						(parseInt(User.userTypeId) !== 5 || (parseInt(User.userTypeId) === 5 && parseInt(Order.orderStatusId) !== 1))) {
			return (
				<div className="w-100 p-1">
					<div className="p-3">
						{
							LoggedIn === false && 
							<React.Fragment>
								{this.state.view.current !== 'CheckoutCompleted' && <div className="alert alert-warning">testtest</div>}
								{this.state.view.current === 'CheckoutCompleted' && 
									<CheckoutCompletedFormContent
										Account={Account}
										Order={Order}
										state={this.state} />
								}
							</React.Fragment>
						}
						{LoggedIn === true &&
							<div className="row justify-content-center">
								<div className="col-lg-3 col-md-2 col-sm-1" />
								<div className="col-lg-6 col-md-8 col-sm-10">
									<div className="row mr-0 ml-0 text-justify justify-content-center">
										<div className="col-12 p-0">
											<div className="text-center pb-2">
												<p><img src={process.env.PUBLIC_URL + "/images/logos/lp_transparent.png"} className="pt-5 w-75" alt="Loyal Paws" /></p>
											</div>
										</div>
									</div>
									{(parseInt(User.userTypeId) === 2 || parseInt(User.userTypeId) === 3) &&
										<div className="card">
											<div className="card-header">
												<h5 className="text-center text-secondary m-0">Memorialization Order Completed</h5>
											</div>
											<div className="card-body">
												<div className="alert alert-success">
													<FontAwesomeIcon icon="check-circle" color="green" className="mr-2" /><Translate id="Memorialization for this Order has been completed" />.
												</div>
																									
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
													<a href={`/orders/orderId/${Order.orderId}`} className="btn btn-success text-white rounded"><Translate id="Go To Order Details" /></a>
												</div>
											</div>
										</div>
									}
									{parseInt(User.userTypeId) === 5 &&
										<div className="card">
											<div className="card-header">
												<h5 className="text-center text-secondary m-0">Memorialization Order Completed</h5>
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
												{this.state.jobId > 0 &&
													<div className="text-center">
														{/* Disable button until polling for jobId returns a completed status, then refetch the order info to get the fileId for the tag */}
														{/*<DownloadTag jobId={Response.jobId} />*/}
														<PrintButton jobId={this.state.jobId} orderId={Order.orderId} printableId="3" printableName="Order Tag" />
													</div>
												}
												{this.state.jobId === 0 &&
													<div className="text-center">
														{/* Disable button until polling for jobId returns a completed status, then refetch the order info to get the fileId for the tag */}
														{/*<DownloadTag jobId={Response.jobId} />*/}
														<GeneratePrintButton jobId={0} orderId={Order.orderId} printableName="Order Tag" />
													</div>
												}
												<div className="h5 mt-4">
													<Translate id="Please print out the Order Tag PDF and prepare for crematory pickup. Please give the pet owner their copy of the Order Tag." />
												</div>
											</div>
										</div>
									}
								</div>
								<div className="col-lg-3 col-md-2 col-sm-1" />
							</div>
						}
					</div>
				</div>
			)
		} else if(Order.memorialization === 'clinic' && LoggedIn === false) {
			return (
				<React.Fragment>
					{/* <div className="row">
						<div className="col-12">
							<div className="alert alert-warning">
								This hits 1
							</div>
						</div>
						<div className="col-12">
							<div className="alert alert-warning">
								<Translate id="Memorialization for this order cannot be completed at home." />
							</div>
						</div>
					</div> */}
					<MemorializationStatus orderId={Order.orderId} message="Memorialization for this order cannot be completed at home."/>
				</React.Fragment>
			)
		} else if(Order.memorialization === 'home' && LoggedIn === true && parseInt(Order.orderStatusId) !== 1) {
			style.height = '1200px';
			style.paddingTop = '350px';
			style.marginTop = '-350px';
			return (
				<div className="w-100" style={style}>
					<div className="row mt-5 justify-content-center">
		        <div className="alert alert-warning border-warning"><Translate id="Memorialization for this order must be completed at home." /></div>
					</div>
				</div>
			)
		} 
		else if(Order.memorialization === 'home' && LoggedIn === false  && parseInt(Order.memorializationCheckedOut) === 1) {
			return (
				<CheckoutCompletedFormContent
					Account={Account}
					Order={Order}
					state={this.state} />
			)
		}
		// Based on the Account setting for auto close memorialization, determine if we should do a warning message is the memorialization window has closed. Regardless of the dateMemorializationEnds, as long as the memorializationCheckedOut = 0 and account setting autoCloseMemorialization=0, allow the pet owner to continue adding products
		else if(parseInt(Account.Settings.find((setting) => setting.name === 'autoCloseMemorialization').value) === 1 && moment().diff(moment(Order.dateMemorializationEnds)) > 0 && Order.tabMemorializationOpen === 0) {
			return (
				<React.Fragment>
					<div className="row">
						<div className="col-12">
							<div className="alert alert-warning">
								<Translate id="Memorialization Order Window Closed" />
							</div>
						</div>
					</div>
					<MemorializationStatus orderId={Order.orderId} />
				</React.Fragment>
			)
		}
		else {
			let showHeaderNav = this.state.productId === 0 && this.state.view.current !== 'Welcome' && this.state.view.current !== 'CheckoutCompleted' && this.state.view.current !== 'Checkout' ? true : false;
			let width = window.innerWidth;
			let smPhoneWidth = 375;
			let phoneWidth = 576;
			let tabletWidth = 768;
			console.log({width})
			let NavLiClass = width > tabletWidth ? 'nav-item' : '';
			NavLiClass = width < phoneWidth && width > smPhoneWidth ? 'w-50' : NavLiClass;
			NavLiClass = width >= phoneWidth && width <= tabletWidth ? 'w-25' : NavLiClass;
			NavLiClass = smPhoneWidth >= width ? 'w-100' : NavLiClass;

			return (
				<React.Fragment>
					<div className="w-100 bg-default">
						<div className={`${Order.memorialization === 'home' && 'border-0'} ${showHeaderNav && 'pr-2 pl-2'}`}>
							{/* Hide the Navigation buttons when viewing a product or group details */}
							{	
								showHeaderNav &&
								<ul className="nav nav-pills nav-justified">
									{headerStatus.Welcome.visible && <li className={NavLiClass}><button className={`nav-link w-100 rounded btn ${headerStatus.Welcome.buttonClass}`} disabled={this.state.headerStatus.Welcome.disabled} onClick={() => this.handleView('Welcome')}><Translate id="Welcome" /></button></li>}
									{headerStatus.Cremation.visible && <li className={NavLiClass}><button className={`nav-link w-100  rounded btn ${headerStatus.Cremation.buttonClass}`} disabled={this.state.headerStatus.Cremation.disabled} onClick={() => this.handleView('Cremation')}><Translate id="Cremation Service" /></button></li>}
									{headerStatus.SpecialServices.visible && <li className={NavLiClass}><button className={`nav-link w-100 rounded btn ${headerStatus.SpecialServices.buttonClass}`} disabled={this.state.headerStatus.SpecialServices.disabled} onClick={() => this.handleView('SpecialServices')}><Translate id="Special Services" /></button></li>}
									{headerStatus.VetSupplies.visible && <li className={NavLiClass}><button className={`nav-link w-100 rounded btn ${headerStatus.VetSupplies.buttonClass}`} disabled={this.state.headerStatus.VetSupplies.disabled} onClick={() => this.handleView('VetSupplies')}><Translate id="Vet Supplies" /></button></li>}
									{headerStatus.Urns.visible && <li className={NavLiClass}><button className={`nav-link w-100 rounded btn ${headerStatus.Urns.buttonClass}`} disabled={this.state.headerStatus.Urns.disabled} onClick={() => this.handleView('Urns')}><Translate id="Urns" /></button></li>}
									{headerStatus.PawPrints.visible && <li className={NavLiClass}><button className={`nav-link w-100 rounded btn ${headerStatus.PawPrints.buttonClass}`} disabled={this.state.headerStatus.PawPrints.disabled} onClick={() => this.handleView('PawPrints')}><Translate id="Paw Prints" /></button></li>}
									{headerStatus.Keepsakes.visible && <li className={NavLiClass}><button className={`nav-link w-100 rounded btn ${headerStatus.Keepsakes.buttonClass}`} disabled={this.state.headerStatus.Keepsakes.disabled} onClick={() => this.handleView('Keepsakes')}><Translate id="Keepsakes" /></button></li>}
									{headerStatus.Jewelry.visible && <li className={NavLiClass}><button className={`nav-link w-100 rounded btn ${headerStatus.Jewelry.buttonClass}`} disabled={this.state.headerStatus.Jewelry.disabled} onClick={() => this.handleView('Jewelry')}><Translate id="Jewelry" /></button></li>}
									{headerStatus.Basket.visible && <li className={NavLiClass}><button className={`nav-link w-100 rounded btn ${headerStatus.Basket.buttonClass}`} disabled={this.state.headerStatus.Basket.disabled} onClick={() => this.handleView('Basket')}><Translate id="Basket" /> {itemBasketCountString}</button></li>}
									{headerStatus.Delivery.visible && <li className={NavLiClass}><button className={`nav-link w-100 rounded btn ${headerStatus.Delivery.buttonClass}`} disabled={this.state.headerStatus.Delivery.disabled} onClick={() => this.handleView('Delivery')}><Translate id="Delivery" /></button></li>}
									{headerStatus.Checkout.visible && <li className={NavLiClass}><button className={`nav-link w-100 rounded btn ${headerStatus.Checkout.buttonClass}`} onClick={() => this.handleView('Checkout', 0, this.state.headerStatus.Checkout.disabled)}><Translate id="Checkout" /></button></li>}								
								</ul>
							}
							{this.state.navigationMessage !== '' && <div className={`mt-2 text-center ${this.state.navigationMessageClass}`}>{this.state.navigationMessage}</div>}
							<div className={`w-100 ${!showHeaderNav && this.state.view.current !== 'CheckoutCompleted' && this.state.view.current !== 'Welcome' && 'pl-2 pr-2'}`}>
								<HandleFormsDisplay
									Account={Account}
									category={this.state.view.current}
									handleAddToBasket={this.handleAddToBasket}
									handleChangeHeaders={this.handleChangeHeaders}
									handleProductsContinueButtonClick={this.handleProductsContinueButtonClick}
									handleProductView={this.handleProductView}
									handleRemoveItemClick={this.handleRemoveItemClick}
									handleShowMoreInformation={this.handleShowMoreInformation}
									handleUrnAddedInClinic={this.handleUrnAddedInClinic}
									handleView={this.handleView}
									LoggedIn={LoggedIn}
									Order={Order}
									Product={Product}
									ProductOptionValues={ProductOptionValues}
									Products={Products}
									ProductsGrouped={ProductsGrouped}
									ProductsMemorialization={ProductsMemorialization}
									ProductSpecies={ProductSpecies}
									ResponseMessage={this.state.Response}
									petReferenceNumber={this.props.match.params.petReferenceNumber ? this.props.match.params.petReferenceNumber : ''}
									productTypeId={this.props.match.params.productTypeId ? this.props.match.params.productTypeId : 3}
									state={this.state}
									User={User}
								/>
							</div>
						</div>
					</div>
				</React.Fragment>
			)
		}
	}
}

export const ProductsMemorialization = compose(
	withRouter,
	queryWithLoading({
		gqlString: getProductsMemorializationQuery,
		variablesFunction: (props) => ({petReferenceNumber: props.match.params.petReferenceNumber ? props.match.params.petReferenceNumber : '', productTypeId: props.match.params.productTypeId ? props.match.params.productTypeId : 3}),
		name: "ProductsMemorialization"
	}),
	queryWithLoading({
		gqlString: getProductGroupsMemorializations,
		name: "ProductGroupsMemorializations"
	}),
	queryWithLoading({
		gqlString: getProductSpeciesQuery,
		name: "ProductSpecies"
	}),
	queryWithLoading({
		gqlString: getOrderProductsQuery,
		variablesFunction: (props) => ({orderId: '', petReferenceNumber: props.match.params.petReferenceNumber ? props.match.params.petReferenceNumber : '', productTypeId: props.match.params.productTypeId ? props.match.params.productTypeId : 2}),
		name: "OrderProducts"
	}),
	withMutation(ProductViewSaveMutation, "ProductViewSave"),
	withTranslate
)(ProductsMemorializationClass)
