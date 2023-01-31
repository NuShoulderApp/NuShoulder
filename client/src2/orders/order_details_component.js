import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import Math from 'mathjs';
import { NavLink } from "react-router-dom";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
import React from 'react';
import ReactStopwatch from 'react-stopwatch';
import { Translate, withTranslate } from '../translations/IWDTranslation';
import { withFormik, Field } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import { withSession } from '../utilities/session';
import { withState } from "react-state-hoc";
import * as Yup from "yup";

import { DeliveryComponent } from '../deliveries/delivery_component';
import { DetailColumn} from '../layouts/application';
import { FileDownloadLink } from "../files/FileDownloadLink";
import { GeneratePrintButton } from './pdf_print_button_component';
import { InvoiceDetails } from '../invoices/invoice_details_component';
import { Payment } from '../payments/payment_component'
import { ProductCategories as CompanyProductComponent } from "../companies/company_product_component";
import { ProductThumbnailLoader } from '../products/product_images';

// GRAPHQL QUERY
import {
	AddressSaveMutation,
	getAddressTypes
} from '../addresses/address_graphql';

import {
	getCompanyQuery,
	getCompanyAddressesQuery
} from '../companies/companies_graphql';

import {
	getCremationOrderDetailsQuery
} from '../cremations/cremations_graphql';

import {
	SingleUploadMutation
} from '../files/files_graphql';

import {
	InvoiceItemSaveMutation
} from '../invoices/invoices_graphql';

import {
	GenerateJobMutation
} from '../jobs/jobs_graphql';

import {
	LogOrderActivitySaveMutation
} from '../log_order_activities/log_order_activities_graphql';

import {
	getDeliveryLogOrderDetailsQuery
} from '../delivery_log/delivery_log_graphql';


import {
	getOrderQuery,
	OrderCommentSaveMutation,
	OrderCremationSaveMutation,
	OrderDeleteMutation,
	OrderHoldSaveMutation,
	OrderProductDeleteMutation,
	OrderProductRefundMutation,
	OrderProductRemoveMutation,
	OrderProductSaveMutation,
	OrderProductsPaidMutation,
	OrderSaveMutation,
	OrderStatusUpdateMutation,
	PetCheckerMutation,
	ProductOrderDuplicateCremationOrderMutation
} from './orders_graphql';

import {
	getOrderFilesQuery,
	OrderFileSaveMutation
} from '../orders_files/orders_files_graphql';

import {
	getProductSpeciesQuery
} from '../pets/species_graphql';

// import {
// 	getPrintableLogsQuery
// } from '../printables/printables_graphql';
//
import {
	getProductCategoriesQuery
} from '../products/products_graphql';

const PrintableQuestionPromptContent = (props) => {
	const {
		handleSetPrintSelectedQuestionPrompt,
		incorrectMessage,
		Order,
		OrderStatuses,
		printableId,
		printSelectedQuestionPrompt,
		randomNumber,
		setState,
		Species,
		updatePrintableIdsAnswered,
		values
	} = props;

	let promptQuestion = '';
	let promptAnswer = '';
	let promptAnswerInt = false; // need this var for the Deleted Products prompt to be able to know to do the parseInt compare
	let promptAnswerType = '';
	let selectOptions = [];

	if(randomNumber === 0) {
		promptQuestion = 'How many deleted products are on this Order?';
		promptAnswer = Order.ProductsOrder.filter((product) => product.dateDeleted !== null).length;
		promptAnswerType = 'text';
		promptAnswerInt = true;
	} else if(randomNumber === 1) {
		promptQuestion = 'What is the Pet Weight?';
		promptAnswer = Order.weight;
		promptAnswerType = 'text';
	} else if(randomNumber === 2) {
		promptQuestion = 'What Species is the Pet?';
		promptAnswer = Species.find((species) => parseInt(species.speciesId) === parseInt(Order.speciesId)).species;
		promptAnswerType = 'select';
		selectOptions = Species.map((species) => ({name: species.species, value: species.speciesId}));
	} else if(randomNumber === 3) {
		promptQuestion = 'What is the current Order Status?';
		promptAnswer = Order.orderStatus;
		promptAnswerType = 'select';
		selectOptions = OrderStatuses.map((status) => ({name: status.orderStatus, value: status.orderStatusId}));
	}

	async function handleCompareAnswer(answerToCompare) {
		if((promptAnswerInt === false && answerToCompare === promptAnswer) || (promptAnswerInt === true && parseInt(answerToCompare) === parseInt(promptAnswer))) {
			// If the printableIdQuestionPrompt > 0 then update that that has been answered. If printSelectedQuestionPrompt is 1, set it to 2 which indicates that the Print Selected button's question prompt has been answered.
			if(printSelectedQuestionPrompt === 1) {
				handleSetPrintSelectedQuestionPrompt(2)
			} else {
				updatePrintableIdsAnswered(printableId);
			}
		} else {
			setState({incorrectMessage: 'Incorrect - Please check the order details for the answer.'})
		}
	}

	return (
		<tr>
			<td colSpan="4">
				{promptAnswerType === 'text' &&
					<div className="row">
						<div className="col-auto">
							{promptQuestion}
							<Field name="answer" className="form-control" />
						</div>
						<div className="col-auto">
							<button type="button" onClick={() => handleCompareAnswer(values.answer)} className="btn btn-success mt-4"><Translate id="Answer" /></button>
						</div>
						{incorrectMessage !== '' && <div className="col-auto alert alert-danger mt-3">{incorrectMessage}</div>}
					</div>
				}
				{promptAnswerType === 'select' &&
					<div className="row">
						<div className="col-auto">
							{promptQuestion}
							<Field name="answer" component="select" className="form-control">
								<option value="0">Select an answer</option>
								{selectOptions.map((selectOption) => {
									return <option value={selectOption.name} key={selectOption.value}>{selectOption.name}</option>
								})}
							</Field>
						</div>
						<div className="col-auto">
							<button type="button" onClick={() => handleCompareAnswer(values.answer)} className="btn btn-success mt-4"><Translate id="Answer" /></button>
						</div>
						{incorrectMessage !== '' && <div className="col-auto alert alert-danger mt-3">{incorrectMessage}</div>}
					</div>
				}
			</td>
		</tr>
	)
}

const PrintableQuestionPromptContainer = compose(
	withFormik(),
	withMutation(GenerateJobMutation, "GenerateJob"),
	withState({incorrectMessage: ''})
)(PrintableQuestionPromptContent)

const ProductsMemorialzationContent = (props) => {
	const { Company, ProductCategories, ProductSpecies } = props;

	// Filter out the categories that we do not want to show, we only want to show Memorialization related products
	const FilteredProductCategories = ProductCategories.ProductCategories.filter((category) =>
		category.productCategory !== 'Cremations' &&
		category.productCategory !== 'Cremations - Prepaid' &&
		category.productCategory !== 'Cremations - Prepaid - Private' &&
		category.productCategory !== 'Delivery' &&
		category.productCategory !== 'Optional Services' &&
		category.productCategory !== 'Personalization' &&
		category.productCategory !== 'Veterinary Supplies'
	);

	return (
		<React.Fragment>
			<CompanyProductComponent
				Company={Company}
				calledFromOrderDetails={true}
				ProductCategories={{ProductCategories: FilteredProductCategories}}
				ProductSpecies={ProductSpecies.ProductSpecies}
				speciesId={props.speciesId}
			/>
		</React.Fragment>
	)
}

const ProductsMemorialzationContainer = compose(
	// Add in the Product Categories.
	queryWithLoading({gqlString: getProductCategoriesQuery, name: "ProductCategories"}),
	queryWithLoading({
		gqlString: getCompanyQuery,
		variablesFunction: (props) => ({companyId: props.companyId}),
		requiredPermission: { permission: "companies", permissionLevel: 4},
		name: "Company",
		notFoundCheck: ({Company}) => Company.Company === null
	}),
	queryWithLoading({gqlString: getProductSpeciesQuery, name: "ProductSpecies"})
)(ProductsMemorialzationContent)

const RelatedFilesContent = (props) => {
	const {
		documentDisplayName,
		file,
		fileInputKey,
		OrderFiles:{OrderFiles},
		OrderFileSave,
		orderId,
		setState,
		SingleUpload,
		uploadingFile
	} = props;

	function handleUploadFile() {
		setState({uploadingFile: true})
		uploadFile();
	}
	// This function handles the selection of the file being uploaded in the Related Documents
	async function uploadFile() {
		// Save the file to S3 and our files db ( variable file is in state)
		const { data: { singleUpload }} = await SingleUpload({ file });

		// Take the returned fileId and save into the ordersFiles table.
		const result = await OrderFileSave({ input: { documentDisplayName, fileId: singleUpload.fileId, orderId }})

		// Clear out the document name and file uploader
		if(result.data.orderFileSave.fileId > 0) {
			// Changing the fileInputKey will cause the file input to have a new key and therefore rerender
			setState({documentDisplayName: '', file: {}, fileInputKey: Math.random().toString(36), uploadingFile: false});
		}
	}

	return (
		<React.Fragment>
			<h5><Translate id="Related Files" /></h5>
			<div><Translate id="Document Name" />*</div>
			<Field name="documentDisplayName" value={documentDisplayName} onChange={(event) => setState({documentDisplayName: event.target.value})} />
			{/* the key on this file input is used to reset the field after the file is successfully saved */}
			<input type="file" name="file" key={fileInputKey} className="mt-2" onChange={({ target: { validity, files: [file] } }) => validity.valid && setState({file})} />
			<button type="button" className="btn btn-success btn-addon mt-2 mb-2" disabled={uploadingFile || documentDisplayName === '' || file === {}} onClick={() => handleUploadFile()}>
				{uploadingFile === false && <Translate id="Upload File" />}
				{uploadingFile === true && <Translate id="Uploading File..." />}
			</button>
			{OrderFiles.length > 0 &&
				OrderFiles.map((file) => {
					return (
						<div key={file.fileId}>
							<FileDownloadLink
								className="btn btn-info btn-sm btn-addon mr-2 mt-1"
								File={file.File}
								label={`${file.documentDisplayName} | ${file.firstName} ${file.lastName} | ${moment(file.dateCreated).format('h:mmA MM-DD-YY')}`}
							/>
						</div>
					)
				})
			}
			{OrderFiles.length === 0 &&
				<p><Translate id="No Files" /></p>
			}
		</React.Fragment>
	)
}

const RelatedFilesContainer = compose(
	queryWithLoading({
		gqlString: getOrderFilesQuery,
		variablesFunction: (props) => ({orderId: props.orderId}),
		name: "OrderFiles"
	}),
	withMutation(OrderFileSaveMutation, "OrderFileSave", ["getOrderFiles"]),
	withMutation(SingleUploadMutation, "SingleUpload"),
	withState({documentDisplayName: '', file: {}, fileInputKey: Math.random().toString(36), uploadingFile: false})
)(RelatedFilesContent)

const OrderHoldFormContent = (props) => {
	const {
		handleSetState,
		holdDisclaimerTranslateId,
		holdTitle,
		orderHold,
		OrderHold,
		OrderHoldSave,
		orderId,
		setState
	} = props;

	// Function for handling the Submit of the Hold and Remove Hold form / functionality
	async function submitHold(holdTitle, orderHold) {
		// If the form is not valid, we submit it right away to show where it is invalid.
		if(orderHold !== '') {
			const orderHoldId = OrderHold.length > 0 ? parseInt(OrderHold[0].orderHoldId) : 0;
			// Async/Await Perform the mutation (to the server) and decompose the result.
			await OrderHoldSave({ input: {orderHold, orderHoldId, orderId} });

			// close the form - this updates the state of the parent component
			handleSetState({showPlaceHoldForm: false, showRemoveHoldForm: false});
		}
	}

	return (
		<div className="card mb-3 border-warning">
			<div className="card-header bg-warning">
				<h5 className="m-0"><FontAwesomeIcon icon="hand-paper" /> <Translate id={holdTitle} /></h5>
			</div>
			<div className="card-body">
				<Translate id={holdDisclaimerTranslateId} />
				<Field name="orderHold" component="textarea" showError={true} value={orderHold} onChange={(event) => setState({orderHold: event.target.value})} className={`form-control`} />
			</div>
			<div className="card-footer">
				<button type="button" onClick={() => submitHold(holdTitle, orderHold)} className="btn btn-warning btn-sm btn-addon"><FontAwesomeIcon icon="hand-paper" /> <Translate id={holdTitle} /></button>
				<button type="button" onClick={() => handleSetState({showPlaceHoldForm: false, showRemoveHoldForm: false})} className="btn btn-default btn-sm btn-addon ml-3"><FontAwesomeIcon icon="times" /> <Translate id="Cancel" /></button>
			</div>
		</div>

	)

}

const OrderHoldFormContainer = compose(
	withMutation(OrderHoldSaveMutation, "OrderHoldSave", ["getOrder"]),
	withState({ orderHold: ''})
)(OrderHoldFormContent)

// Simple output for the owner address. Need to use functionality here to be able to loop through the countries so that we can get the state from the owner address.
const OwnerAddressOutput = (props) => {
	const {
		Countries,
		OwnerAddress
	} = props;

	let ownerState = '';
	if(parseInt(OwnerAddress.stateId) > 0) {
		Countries.forEach((country) => {
			country.States.forEach((state) => {
				if(parseInt(state.stateId) === parseInt(OwnerAddress.stateId)) {
					ownerState = state.state
				}
			})
		})
	}

	return (
		<div className="text-dark">
			{`${OwnerAddress.address1}, ${(OwnerAddress.address2 !== '' && OwnerAddress.address2+', ') || ''}${OwnerAddress.city}, ${(parseInt(OwnerAddress.stateId) > 0 && ownerState+', ') || ''}${OwnerAddress.postalCode}`}
		</div>
	)
}

// Container for the Messages/Comments section during the phone call
const CustomerCallContent = (props) => {
	const {
		handleCustomerCall,
		orderComment,
		setState
	} = props;

	function handleChange(value) {
		setState({orderComment: value})
	}
	return (
		<div className="w-100 mb-2">
			<div className="text-center"><Translate id="Notes From Call" /></div>
			<Field name="orderComment" value={orderComment} component="textarea" style={{minHeight: 75+'px'}} onChange={(event) => handleChange(event.target.value)} className={`form-control`} />
			<button type="button" className={`btn btn-sm btn-danger mt-2 float-right`} onClick={() => handleCustomerCall('end', orderComment)}><FontAwesomeIcon icon="phone" className="mr-1" /> End Call</button>
		</div>
	)
}

const CustomerCallContainer = compose(
	withMutation(OrderHoldSaveMutation, "OrderHoldSave", ["getOrder"]),
	withState({ orderComment: ''})
)(CustomerCallContent)


const OrderDetailFormContent = (props) => {
	const {
		Account,
		accountId,
		addAdjustmentFormShow,
		AddressSave,
		addressTypes: { Countries },
		adjustmentAddTax,
		bypassPaymentRequirementReason,
		bypassPaymentRequirementShowForm,
		Cremation,
		customerCallNotes,
		customerCallOrderCommentId,
		customerCallOrderCommentStatus,
		customerCallStatus,
		deletingReasonError,
		deletingReasonOrderProduct,
		DeliveryCompanyAddresses,
		DeliveryLogs,
		dirty,
		DuplicateOrder,
		enableEditingOrderDetails,
		enableEditingOrderInformation,
		enableWalkInItemLine,
		errors,
		handleStateChange,
		initialLoad,
		initialValues,
		invoiceCostSubtotal,
		invoiceCostTotal,
		InvoiceItemSave,
		invoiceItemDescription,
		invoiceItemDescriptionPrivate,
		invoiceItemType,
		isSubmitting,
		LogOrderActivitySave,
		NavClasses,
		navigationSection, // this can be passed through the URL for quick nav to a specific section
		Order: { allowHomeMemorialization, requireInitialsEditOrderDetails, specialInstructions },
		Order,
		OrderCommentSave,
		orderCommentInternal,
		orderCommentMadeBy,
		orderCommentType,
		OrderCremationSave,
		OrderDelete,
		orderDetailsMessage,
		orderDetailsMessageAlertStatus,
		orderInformationMessage,
		orderInformationMessageAlertStatus,
		OrderProductDelete,
		orderProductIdDeleteOpen,
		orderProductIdRefundOpen,
		OrderProductRefund,
		OrderProductRemove,
		OrderProductSave,
		OrderProductsPaid,
		OrderSave,
		orderScanMessage,
		OrderStatuses,
		OrderStatusUpdate,
		orderStatusUpdatedAwaitingDelivery,
		ownerPhoneNumber,
		paymentAlternativeShow,
		paymentFormShow,
		PetReferenceNumberCheck,
		petReferenceNumberOrderScan,
		PickupCompanyAddresses,
		printableIdQuestionPrompt,
		printableIdsAnswered,
		PrintableIdsChecked,
		Printables,
		printSelectedClicked,
		printSelectedQuestionPrompt,
		Products,
		refundAttemptError,
		refundingReasonError,
		refundingReasonOrderProduct,
		setResponse,
		setState,
		showMakeCustomerCall,
		showPlaceHoldForm,
		showProductsMemorialization,
		showRemoveHoldForm,
		Species,
		state,
		Response,
		taxDue,
		taxRate,
		totalCharity,
		touched,
		userTypeId,
		User,
		values,
		vetPaymentAlternativeShow,
		vetPaymentFormShow,
		walkInItemName,
		walkInItemPrice,
		walkInItemTax,
		walkInItemTaxShown
	} = props;
	console.log({props})
	if(initialLoad === true) {
		if(navigationSection !== '' && NavClasses.hasOwnProperty(`${navigationSection[0].toUpperCase()}${navigationSection.slice(1)}`)) {
			let tempNavigationSection = `${navigationSection[0].toUpperCase()}${navigationSection.slice(1)}`;
			handleNavClasses(tempNavigationSection); // Update the starting nav class, and this function also sets initialLoad = false
		} else if(userTypeId !== 5) {
			handleNavClasses('Memorialization');
		} else {
			setState({ initialLoad: false })
		}
	}

	// Determine the string to display for the 'Service Type'
	let serviceType = '';
	let serviceTypeClass = '';

	// If there is a Cremation product on this order, get that product object for easier use below.
	const CremationProduct = Order.ProductsOrder.find((product) => (product.productTypeId === '2' && product.dateDeleted === null));

	let orderProductStickerName = "Order Product Stickers";
	
	// Check if this is a Cremation productType
	if(CremationProduct) {
		// serviceType is the product name that we display, it is not editable in the order details page here.
		serviceType = CremationProduct.productName;
	} else if(Order.orderTypeId === 1) {
		// Vet Supply Order
		serviceType = parseInt(Order.orderStatusId) === 1 ? 'Order still open, please complete checkout to place order' : 'Order closed, please place another supply order for more supplies';
		serviceTypeClass = parseInt(Order.orderStatusId) === 1 ? 'alert-danger' : 'alert-success';
	} else if(Order.orderTypeId === 3) {
		// Product Only Order
		serviceType = parseInt(Order.orderStatusId) === 1 ? 'Order still open, please complete checkout to place order' : 'Order closed, please place another product only order for more products';
		serviceTypeClass = parseInt(Order.orderStatusId) === 1 ? 'alert-danger' : 'alert-success';
	}

	// Function for submitting the actual Order form.
	async function submitForm(section) {
		// If the form is not valid, we submit it right away to show where it is invalid.
		if(props.isValid === false) {
			props.submitForm();
		} else {
			if(values.userInitialsOrderDetails !== '' || requireInitialsEditOrderDetails === 0) {
				if(values.deliveryMethodName === 'Hospital Delivery' && (parseInt(values.deliveryAddressId) === 0 || values.deliveryAddressId === '')) {
					// Show error message next to initials
					setState({orderDetailsMessage: 'Please select delivery location before continuing', orderDetailsMessageAlertStatus: 'danger'});
				}
				else if(values.deliveryMethodName === 'Courier Delivery' && (parseInt(values.deliveryAddressId) === 0 || values.deliveryAddressId === '')) {
					// Show error message next to initials
					setState({orderDetailsMessage: 'Please save a Delivery address before continuing', orderDetailsMessageAlertStatus: 'danger'});
				}
				else {
					// Get the Product object for the selected delivery method
					const DeliveryProduct =  Products.find((product) => product.productId === values.deliveryMethodProductId);
					const deliveryMethodName = DeliveryProduct && DeliveryProduct.productName ? DeliveryProduct.productName : null;
					const productName = deliveryMethodName;

					// Clean up any old data that was saved into the databases previous which is now outdated because the delivery method has changed.
					// IMPORTant: This same functionality is in the New Order Cremation save (order_cremation_component.js, in the handleSubmit of const OrderCremationForm), so if you add things here, change them there also.
					if(deliveryMethodName !== 'Courier Delivery' && deliveryMethodName !== 'Hospital Delivery') {
						// Current options are Hand or No Delivery, so there is not going to be a deliveryAddressId, so set it to 0
						// The deliveryMethodProductId and deliveryMethodName have already been updated above in the OrderProductSave
						values.deliveryAddressId = 0;
						// LATER - we will want to delete the address if it is a 'Home' type because we have no use for a customer's address in the database if we are not delivering to their home.
					}
					//await OrderSave({ input: { orderId: values.orderId, deliveryAddressId: values.deliveryAddressId, deliveryMethodName, deliveryMethodProductId: values.deliveryMethodProductId }})

					// Determine if there was already a delivery product on this order, and remove it accordingly
					if(parseInt(values.oldDeliveryProductId) === 0 && values.deliveryMethodProductId > 0) {
						// There was not a previous delivery selected, so just save the productId
						// Async/Await Perform the mutation (to the server) and decompose the result.

						await OrderProductSave({ input: { orderId: values.orderId, productId: values.deliveryMethodProductId, productName } });
					} else if(values.oldDeliveryProductId > 0 && parseInt(values.oldDeliveryProductId) !== parseInt(values.deliveryMethodProductId)) {
						// need to delete the old delivery productId because there is a new one and there can only be one batman
						// get the orderProductId
						const OldDeliveryProduct = Order.ProductsOrder.find((product) => parseInt(product.productId) === values.oldDeliveryProductId);

						await OrderProductRemove({ input: { orderId: values.orderId, orderProductId: OldDeliveryProduct.orderProductId, orderProductIsDelivery: true } });

						// Async/Await Perform the mutation (to the server) and decompose the result.
						await OrderProductSave({ input: {  orderId: values.orderId, productId: values.deliveryMethodProductId, productName } });
					} else if(values.oldDeliveryProductId > 0) {
						// do not need to save because the delivery was not changed. Nothing needs to happen in this condition, just putting it here for reference of what the other option is.
					}

					let { companyDepartmentId, deliveryAddressId, deliveryMethodProductId, memorialization, memorializationCheckedOut, orderComment, orderId, ownerEmail, ownerFirstName, ownerLastName, ownerPhoneNumber, petBreed, petColor, petFirstName, pickupAddressId, sex, speciesId, tabCremationServicesOpen, tabDeliveryOpen, tabJewelryOpen, tabKeepsakesOpen, tabMemorializationOpen, tabPawPrintsOpen, tabUrnsOpen, userInitialsOrderDetails, weight, weightUnits } = values;
					tabCremationServicesOpen = tabCremationServicesOpen ? 1 : 0;
					tabDeliveryOpen = tabDeliveryOpen ? 1 : 0;
					tabJewelryOpen = tabJewelryOpen ? 1 : 0;
					tabKeepsakesOpen = tabKeepsakesOpen ? 1 : 0;
					tabMemorializationOpen = parseInt(tabMemorializationOpen) ? 1 : 0;
					tabPawPrintsOpen = tabPawPrintsOpen ? 1 : 0;
					tabUrnsOpen = tabUrnsOpen ? 1 : 0;
					if (companyDepartmentId === '') {
						companyDepartmentId = null;
					}

					// Override the orderCommentInternal default value for Vets, since they cannot see the input to change it anyway.
					//const orderCommentInternal = (userTypeId !== 2 && userTypeId !== 3) ? 0 : parseInt(values.orderCommentInternal);

					// If vet user and allowVetChangeMemorialization = true (which can only happen for Vets on Communal Cremations), or crematory user, update the memorializationCheckedOut if certain conditions below are met.
					if(((parseInt(Order.orderTypeId) === 5 && values.allowVetChangeMemorialization === true) || parseInt(Order.orderTypeId) === 2 || parseInt(Order.orderTypeId) === 3) && values.memorializationStartedAs !== values.memorialization) {
						if(values.memorialization === 'none') {
							// Always close memorialization when it is changed to none
							memorializationCheckedOut = 1;
						} else if(values.memorializationCompletedStartedAs === true && values.memorialization !== 'none') {
							// If the memorialization was closed, and then changed to either At Home or In Clinic, then we reopen the memorialization
							memorializationCheckedOut = 0;
						}
					}

					// If this was the Pet / Owner section that was just saved, check if there is any Owner Address information that should be saved
					if(section === 'Pet/Owner') {
						if(values.ownerAddress1 !== '' && values.ownerCity !== '' && values.ownerPostalCode !== '') {
							// Update the AddressId's information for the pet owner
							const addressSave  = await AddressSave({ input: {addressId: values.ownerAddressId, address1: values.ownerAddress1, address2: values.ownerAddress2, addressTypeId: 3, city: values.ownerCity, postalCode: values.ownerPostalCode, stateId: values.ownerStateId }});
							if(parseInt(addressSave.data.AddressSave.addressId) > 0) values.ownerAddressId = parseInt(addressSave.data.AddressSave.addressId)
						}
					}

					// Async/Await Perform the mutation (to the server) and decompose the result.
					const { data: { orderCremationSave }} = await OrderCremationSave({ input: { companyDepartmentId, deliveryAddressId, deliveryMethodName, deliveryMethodProductId, memorialization, memorializationCheckedOut, orderCommentInternal, orderId, ownerAddressId: values.ownerAddressId, ownerEmail, ownerFirstName, ownerLastName, ownerPhoneNumber, petBreed, petColor, petFirstName, pickupAddressId, sex, speciesId, tabCremationServicesOpen, tabDeliveryOpen, tabJewelryOpen, tabKeepsakesOpen, tabMemorializationOpen, tabPawPrintsOpen, tabUrnsOpen, userInitials: userInitialsOrderDetails, weight, weightUnits }});

					if(orderCremationSave.Response.success === true) {
						values.userInitialsOrderDetails = '';
						setState({enableEditingOrderDetails: false, orderDetailsMessage: 'Order details successfully saved', orderDetailsMessageAlertStatus: 'success'});
					}
				}
			} else {
				// Show error message next to initials
				setState({orderDetailsMessage: 'Enter Initials to save', orderDetailsMessageAlertStatus: 'danger'});
			}
		}
	}

	// Function for handling the delete functionality of this order - via the Delete Order form
	async function submitDeleteOrder() {
		if(values.orderDeleteReason !== '') {
			// Get the orderStatusId of 'Deleted'
			const OrderStatus = OrderStatuses.find((status) => status.orderStatus === 'Deleted');

			// Async/Await Perform the mutation (to the server) and decompose the result.
			const { data: { orderDelete }} = await OrderDelete({ input: {orderDeleteReason: values.orderDeleteReason, orderId: values.orderId, orderStatusId: OrderStatus.orderStatusId} });

			// Set state variable for hiding the entire order form after delete if this is a vet
			if(userTypeId !== 1 && userTypeId !== 2 && userTypeId !== 3) {
				handleStateChange('hideOrderForm', true);
			}
			setResponse(orderDelete.Response);
		}
	}

	// Function to handle the "Make Alternative Payment" button, which indicates that the pet owner make a cash, check, or e-transfer payment directly to the crematory at pickup.
	function handleAlternativePayment(paymentCompletedAlternativeMethod, vetOrderPaid=false) {
		OrderProductsPaid({ input: { alternativePaymentMade: true, orderId: Order.orderId, paymentCompletedAlternativeMethod, vetOrderPaid } });
	}

	// Response function for payment processing to know if the payment was successful or not.
	async function getPaymentResponse(Response) {
		// If the payment processing was succesful, then update the ordersProducts records that needed payment to be marked as paymentCompletedPetOwner = 1, otherwise do nothing until they resubmit their cc and get a successful response
		if(Response.success === true) {
			let tempVetOrderPaid = Response.vetOrderPaid ? Response.vetOrderPaid : false;
			OrderProductsPaid({ input: { creditCardChargeId: Response.creditCardChargeId, orderId: Order.orderId, vetOrderPaid: tempVetOrderPaid } });
		}
	}

	// Function to update the taxDue and invoiceSubtotal inputs, and invoiceCostTotal output for the Add an Adjustment
	async function handleAddAdjustmentOnChange(name, value) {
		let tempInvoiceCostTotal = invoiceCostTotal;
		let tempTaxDue = taxDue;

		if(value === '-' || value === '-.' || value === '.') {
			// do nothing, this would be the first key stroke of entering a negative number, and we do not want to execute the math functionality below until a number is added to this.
		} else {
			if(name === 'invoiceCostSubtotal') {
				// Get the new total for subTotal + charity (This is not currently in use)
				let tempTotal = Math.subtract(value,totalCharity).toFixed(2);
				// Set taxDue for display in the select option, regardless of if tax is being paid.
				tempTaxDue = Math.multiply(tempTotal, taxRate).toFixed(2);
				// Add tax to subtotal
				if(parseInt(adjustmentAddTax) === 1) {
					// If this product is taxable, add the taxDue
					tempInvoiceCostTotal = Math.add(tempTaxDue, tempTotal).toFixed(2);
				} else {
					tempInvoiceCostTotal = tempTotal;
				}
			} 
			else if(name === 'adjustmentAddTax') {
				if(parseInt(value) === 1) {
					tempInvoiceCostTotal = Math.add(invoiceCostSubtotal,taxDue).toFixed(2);
				} else {
					// Add 0 to subtotal so we can use the math function and toFixed
					tempInvoiceCostTotal = Math.add(invoiceCostSubtotal,0).toFixed(2)
				}
			}
		}

		// Update state variables, which rerenders the form with these variables for onChange updates
		setState({
			[name]: value,
			invoiceCostTotal: tempInvoiceCostTotal,
			taxDue: tempTaxDue
		})
	}

	// Function for saving the invoice item adjustment when there is not an invoice created yet for this order. We create an invoice item with invoiceId = 0, and we when we do finally create the invoice later we do a check for any invoiceItems for this orderId that have invoiceId=0 and then update the invoiceId
	async function handleInvoiceItemAdjustmentSave() {
		// Check if the dropdown for charging tax on this adjustment is 0 (meaning no tax charged), and set the taxDue variable being set within the input object according.
		// Within the functionality of Adjustments, we do not bother messing with a variable that represents the amount of tax being charged based on the 1/0 flag because we always want to be able to display the amount of tax that WOULD BE charged if so selected.
		let tempTaxDue = parseInt(adjustmentAddTax) === 0 ? '0.00' : taxDue;

		const input = {
			accountId: accountId,
			companyId: Order.companyId,
			invoiceCostSubtotal: invoiceCostSubtotal,
			invoiceCostTotal: invoiceCostTotal,
			invoiceId: 0,
			invoiceItemId: 0,
			invoiceItemDescription: invoiceItemDescription,
			invoiceItemDescriptionPrivate: invoiceItemDescriptionPrivate,
			invoiceItemType: invoiceItemType,
			orderId: Order.orderId,
			taxDue: tempTaxDue
		};

		const { data: { invoiceItemSave }} =  await InvoiceItemSave({ input });

		// Close the inline form is save worked
		if(invoiceItemSave.Response.success === true) {
			handleInvoiceAdjustmentCancel();
		}
	}

	// Close and clear the adjustment form variables
	function handleInvoiceAdjustmentCancel() {
		setState({
			addAdjustmentFormShow: false,
			adjustmentAddTax: 1, // Reset the tax charging dropdown to be charging tax so that the math works correctly if they add a second adjustment immediately
			invoiceCostTotal: 0,
			invoiceCostSubtotal: 0,
			invoiceItemDescription: '',
			invoiceItemDescriptionPrivate: '',
			invoiceItemType: 'Adjustment',
			taxDue: 0
		})
	}

	// Function for saving the Hospital Options information on the Order
	async function handleHospitalOptionsSave() {
		if(parseInt(values.crematoryPickupOffered) === 0 && parseInt(values.courierDeliveryOffered) === 0 && parseInt(values.hospitalDeliveryOffered) === 0) {
			errors.crematoryPickupOffered = true;
			errors.courierDeliveryOffered = true;
			errors.hospitalDeliveryOffered = true;
			// Show error message next to initials
			setState({orderInformationMessage: "Must select 'Yes' for at least one of the Hospital Options for pickup/delivery", orderInformationMessageAlertStatus: 'danger'});
		} else if(parseInt(values.payAtPickupOffered) === 0 && parseInt(values.payByCreditCardOffered) === 0) {
			errors.payAtPickupOffered = true;
			errors.payByCreditCardOffered = true;
			// Show error message next to initials
			setState({orderInformationMessage: "Must select 'Yes' for at least one of the Hospital Options for Pay By CC or at Pickup", orderInformationMessageAlertStatus: 'danger'});
		} else if(values.userInitialsOrderInformation !== '' || requireInitialsEditOrderDetails === 0) {
			const { communalPawPrintAllowed, courierDeliveryOffered, crematoryPickupOffered, cremationTypesOffered, expeditedCremationAllowed, familyFriendPet, hardwareFound, homeMemorializationsEditCremation, hospitalDeliveryOffered, orderId, orderStatusId, payAtPickupOffered, payByCreditCardOffered, paymentAlternativeOffered, paymentTerms, servicePet, staffEmployeePet, trackingDisk, userInitialsOrderInformation, visitationAllowed } = values;

			// Note: The reason that the familyFriendPet and other checkboxes have check for true or 1 is that when the box is actually clicked on the page, the value gets set to 'true', then we save it into the db as 1. Then is the page is loaded and the db value is 1, the value of the input will be 1 unless it is touched.
			const { data: { orderSave }} = await OrderSave({ input : {
				communalPawPrintAllowed,
				courierDeliveryOffered: parseInt(courierDeliveryOffered),
				crematoryPickupOffered: parseInt(crematoryPickupOffered),
				cremationTypesOffered,
				expeditedCremationAllowed: parseInt(expeditedCremationAllowed),
				familyFriendPet: familyFriendPet === true || familyFriendPet === 1 ? 1 : 0,
				hardwareFound,
				homeMemorializationsEditCremation: parseInt(homeMemorializationsEditCremation),
				hospitalDeliveryOffered: parseInt(hospitalDeliveryOffered),
				orderId: parseInt(orderId),
				orderStatusId: parseInt(orderStatusId),
				payAtPickupOffered: parseInt(payAtPickupOffered),
				payByCreditCardOffered: parseInt(payByCreditCardOffered),
				paymentAlternativeOffered: parseInt(paymentAlternativeOffered),
				paymentTerms,
				servicePet: servicePet === true || servicePet === 1 ? 1 : 0,
				staffEmployeePet: staffEmployeePet === true || staffEmployeePet === 1 ? 1 : 0,
				trackingDisk,
				userInitials: userInitialsOrderInformation,
				visitationAllowed: parseInt(visitationAllowed)
			}});

			if(orderSave.Response.success === true) {
				values.userInitialsOrderInformation = '';
				setState({enableEditingOrderInformation: false, orderInformationMessage: 'Order information successfully saved', orderInformationMessageAlertStatus: 'success'});
			}
		} else {
			// Show error message next to initials
			setState({orderInformationMessage: 'Enter Initials to save', orderInformationMessageAlertStatus: 'danger'});
		}
	}

	// function to allow Crematory user to mark a product as invoiceVet if appropriate conditions are met
	async function handleInvoiceVet(orderProductId) {
		await OrderProductSave({input: {invoiceVet: true, orderProductId}});
	}

	// Function for updating the orderStatus
	async function handleStatusUpdate(status) {
		let tempOrderStatusId = 0;
		if(status === 'Awaiting Delivery') tempOrderStatusId = 9;

		const { data: { orderStatusUpdate }} = await OrderStatusUpdate({ input: {orderStatusId: tempOrderStatusId, petReferenceNumber: Order.petReferenceNumber} });

		if(orderStatusUpdate.Response.success === true) {
			// This variable will change the 'Completed' button that was just clicked, and only for this single event. After the next page load the button will be completely hidden
			setState({orderStatusUpdatedAwaitingDelivery: true})
		}
	}

	// Function for updating the orderProducts statues
	async function handleOrderProductStatusUpdate(name, value, orderProductId, productName) {
		// Only allow the status change if the user is a crematory staff/admin. Vet staff are also able to view these buttons, so we do not want to allow the update to occur for them.
		if(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) {
			let oppositeValue = parseInt(value) === 1 ? 0 : 1;
			await OrderProductSave({ input: {[name]: oppositeValue, orderProductId}});
			//One-off solution for Ink Paw Prints not needing to be baked, automatically mark them as statusCompleted once they are also taken.
			if(productName === "Ink Paw Print" && name === "statusPawPrintTaken") {
				await OrderProductSave({ input: {statusPawPrintCompleted: oppositeValue, orderProductId}});
			}
		}
	}

	// Function for deleting an order product from the memorialization section
	async function handleProductDeleteConfirmation(amount, creditCardChargeId, orderId, orderProductId, paymentCompletedPetOwner, paymentCompletedAlternative) {
		if(deletingReasonOrderProduct !== '') {
			// If this product has been paid by the pet owner, then we also need to refund the money to their credit card
			if(paymentCompletedPetOwner === 1) {
				let { data: { orderProductRefund: { Response }}} = await OrderProductRefund({ input: {amount, creditCardChargeId, markOrderDeleted:true, orderId, orderProductId, paymentCompletedAlternative, refundingReasonOrderProduct: deletingReasonOrderProduct}})
				// Async/Await Perform the mutation (to the server) and decompose the result.
				if(Response.success === true) {
					// Close the delete reason form
					setState({deletingReasonError: false, deletingReasonOrderProduct: '', orderProductIdDeleteOpen: ''})
				} else {
					setState({refundAttemptError: 'Refund Attempt Error Message'});
				}
			} else {
				// Async/Await Perform the mutation (to the server) and decompose the result.
				let { data: { orderProductDelete: { Response }}} = await OrderProductDelete({ input: {deletedReason: deletingReasonOrderProduct, orderProductId} });
				if(Response.success === true) {
					// Close the delete reason form
					setState({deletingReasonError: false, deletingReasonOrderProduct: '', orderProductIdDeleteOpen: ''})
				}
			}
		} else {
			// Update the state variable that is used for making the deletedReason input show an error
			setState({deletingReasonError: true})
		}
	}

	async function handleProductRefundConfirmation(amount, creditCardChargeId, orderId, orderProductId, paymentCompletedAlternative) {
		if(refundingReasonOrderProduct !== '') {
			let { data: { orderProductRefund: { Response }}} = await OrderProductRefund({ input: {amount, creditCardChargeId, paymentCompletedAlternative, orderId, orderProductId, refundingReasonOrderProduct}});

			if(Response.success === true) {
				// Close the refund reason form
				setState({orderProductIdRefundOpen: '', refundingReasonError: false, refundingReasonOrderProduct: ''});
			} else {
				setState({refundAttemptError: 'Refund Attempt Error Message'});
			}
		} else {
			setState({refundingReasonError: true});
		}
	}

	// This function is passed to the Delivery component, and it receives back an object with the values and names that are saved/updated in that component
	function handleDeliveryValuesUpdate(DeliveryObject) {
		if(DeliveryObject.name === 'deliveryMethodProductId') {
			DeliveryObject.name = 'productId';
			// Get the Product object for the selected delivery method
			const DeliveryProduct = Products.find((product) => product.productId === DeliveryObject.value);

			// Then set the input for deliveryMethodName so we can use it in validation of the delivery form information
			values.deliveryMethodName = parseInt(DeliveryObject.value) !== 0 ? DeliveryProduct.productName : '';

			// If the selected deliveryMethodName that we just switched to is the SAME as the one in the Orders object, meaning that that is the currently saved method in the Orders db, then set the deliveryAddressId to the one that is saved in the Orders object.
			// The reason to do this is that if someone has already saved their address information for the Courier Delivery, we do not want to make them have to enter it again just because they clicked on to another delivery method option.
			values.deliveryAddressId = values.deliveryMethodName === Order.deliveryMethodName ? values.deliveryAddressId = Order.deliveryAddressId : 0;

		}
		values[DeliveryObject.name] = DeliveryObject.value;
		// Setting state variable to itself as a way to get the form to refresh itself with the new value for the addressId
		setState({enableEditingOrderDetails: enableEditingOrderDetails})
	}

	// Handle single Printable checkbox being clicked
	function handlePrintableSelect(printableId) {
		// If the 'Print Selected' button has been clicked prior to this checkbox being checked, which is the action that calls this function, then the PrintableIdsChecked array will still contain printableIds that need to get cleared.
		// We can tell this by the printSelectedClicked variable being true. If it is true, we will want to set it to false in the setState at the bottom of the function. Also reset the PrintableIdsChecked to an empty array, and only include the printableId passed in.
		//let tempPrintSelectedClicked = printSelectedClicked === true ? false : false; // Whenever this function is called, this variable will always be false, but just leave this here for clarification in the future.

		let removeId = false;

		if(PrintableIdsChecked.length > 0) {
			removeId = printSelectedClicked === false && PrintableIdsChecked.find((item) => parseInt(item) === parseInt(printableId)) > 0 ? true : false;
		}
		// If true, then clear out the array.
		let tempPrintableIds = printSelectedClicked === true ? [] : PrintableIdsChecked;
		if(removeId === false) {
			tempPrintableIds.push(printableId);
		} else {
			tempPrintableIds = PrintableIdsChecked.filter((item) => parseInt(item) !== parseInt(printableId));
		}

		// Determine if any of the printableIds that are currently checked are flagged for requiring the question prompt. If so, any value for the printableIdQuestionPrompt besides - within state will show the prompt question.
		// The variable printSelectedQuestionPrompt has values 0: Do not show the question prompt for checkboxes for 'Print Selected', 1: Show question prompt and disable button until answered, 2: Question prompt has been answered.
		let tempPrintSelectedQuestionPrompt = printSelectedQuestionPrompt;
		// If printSelectedClicked is true, then this is the first time a checkbox is checked after having printed all previously checked boxes, so we need to re-prompt them with questions.
		if(printSelectedQuestionPrompt !== 2 || printSelectedClicked === true) {
			tempPrintSelectedQuestionPrompt = Printables.findIndex((tempPrintable) => tempPrintable.statusQuestionPrompt === 1 && tempPrintableIds.findIndex((tempPrintableId) => parseInt(tempPrintableId) === parseInt(tempPrintable.printableId)) > -1) > -1 ? 1 : 0;
		}
		// printableIdQuestionPrompt is used for when the Print button for a single printable is clicked is a challenge question is required. If that is currently open, and then a checkbox is clicked for a printable, clear out that single printable question prompt. So just always clear it here.
		setState({PrintableIdsChecked: tempPrintableIds, printableIdQuestionPrompt: 0, printSelectedClicked: false, printSelectedQuestionPrompt: tempPrintSelectedQuestionPrompt});
	}

	// Function to save the Walk In Item and add it to the Order Products
	async function handleWalkInItemSave() {
		// The save button will be disabled if either of these are blank
		if(walkInItemName !== '' && walkInItemPrice !== '') {
			// Pass productId = 0 here and on the server side we will grab the productId for the Walk In Item
			let { data: { orderProductSave: { Response }}} = await OrderProductSave({ input: { orderId: Order.orderId, priceCharged: walkInItemPrice, productId: 0, productName: walkInItemName, taxCharged: walkInItemTax, walkInItem: true } });

			if(Response.success === true) {
				// Close the Walk In Item line and reset the related state variables
				setState({enableWalkInItemLine: false, walkInItemName: 'Walk In Item',  walkInItemPrice: '', walkInItemTax: '', walkInItemTaxShown: ''});
			}
		}
	}

	async function handleCommentSave() {
		let tempOrderCommentInternal = userTypeId === 5 ? 0 : orderCommentInternal; // If this is a Vet, make the comment viewable to the Vet, otherwise do whatever the form says
		await OrderCommentSave({input: {orderComment: values.orderComment, orderCommentId: 0, orderCommentInternal: tempOrderCommentInternal, orderCommentMadeBy, orderCommentStatus: 'unread', orderCommentType, orderId: Order.orderId}});
	}

	// Fucntionality for the Comment section's phone call made to the customer for the Followups
	async function handleCustomerCall(action, comment) {
		if(action === 'start') {
			// Save orderComment to the DB for accurate dateCreated value
			const ResponseOrderComment = await OrderCommentSave({input: { orderComment: '', orderCommentId: 0, orderCommentInternal: 1, orderCommentMadeBy: 'Crematory', orderCommentStatus: 'unread', orderCommentType: 'Follow-up Call', orderId: Order.orderId}});
			
			setState({
				customerCallNotes: values.orderComment,
				customerCallOrderCommentId: parseInt(ResponseOrderComment.data.orderCommentSave.OrderComment.orderCommentId),
				customerCallOrderCommentStatus: 'unread',
				customerCallStatus: 'Active'
			})
		} else if(action === 'end') {
			// Update the orderComment
			const ResponseOrderComment = await OrderCommentSave({input: { orderComment: comment, orderCommentId: customerCallOrderCommentId, orderCommentStatus: 'unread', orderCommentType: 'Follow-up Call' }});
			setState({
				customerCallNotes: comment,
				customerCallStatus: 'Summary'
			})
		} else if(action === 'summaryCompleted') {
			const ResponseOrderComment = await OrderCommentSave({input: { orderComment: customerCallNotes, orderCommentId: customerCallOrderCommentId, orderCommentStatus: customerCallOrderCommentStatus, orderCommentType: 'Follow-up Call' }});
			setState({
				customerCallOrderCommentId: 0,
				customerCallOrderCommentStatus: 'unread',
				customerCallNotes: '',
				customerCallStatus: 'Ready',
				showMakeCustomerCall: false
			})
		}
	}

	// Function for generic setState
	function handleGenericSetState(name, value='') {
		let newValue = value;
		if(name === 'orderCommentInternal') {
			newValue = orderCommentInternal === 1 ? 0 : 1;
		}

		setState({
			[name]: newValue
		})
	}

	// Function to update the Walk In Item tax input based on the Walk In Item price entered by the users
	function handleWalkInItemTax(value) {
		// Value passed to this function is the onChange value of the Walk In Item price

		// Set the temp tax displayed in dropdown to whatever the current state variable is set to.
		let tempWalkInItemTaxShown = walkInItemTaxShown;
		let tempWalkInItemTax = walkInItemTax;

		if(value === '-' || value === '-.' || value === '.') {
			// do nothing, this would be the first key stroke of entering a negative number, and we do not want to execute the math functionality below until a number is added to this.
		}
		else {
			// Determine the tax to be show in the dropdown for selecting tax
			tempWalkInItemTaxShown = Math.multiply(value, taxRate).toFixed(2);
			// If the walkInItemTax selected from the dropdown is NOT 0, then update the value for the walkInItemTax to match the calculated value above.
			tempWalkInItemTax = walkInItemTax === "0" ? walkInItemTax : tempWalkInItemTaxShown;
		}

		// Update state variables, which rerenders the form with these variables for onChange updates
		setState({
			walkInItemPrice: value,
			walkInItemTax: tempWalkInItemTax,
			walkInItemTaxShown: tempWalkInItemTaxShown
		})
	}

	function updatePrintableIdsAnswered(printableId) {
		printableIdsAnswered.push(printableId)
		setState({printableIdsAnswered: printableIdsAnswered})
	}

	// Generate a random number to determine which question prompt will be used:
	const randomNumber = Math.floor(Math.random() * Math.floor(4));

	// Set variables for the Hold form - since the form is only ever shown when showPlaceHoldForm or showRemoveHoldForm is true, set these variables based on which one is true.
	const holdTitle = showPlaceHoldForm === true ? 'Place Hold' : 'Remove Hold';
	const holdDisclaimerTranslateId = showPlaceHoldForm === true ? 'Place Hold Disclaimer' : 'Remove Hold Disclaimer';

	// Set variable to disable all inputs in the Order Details form if there is a hold
	const orderHoldDisableInputs = values.OrderHold.length > 0 ? true : false;

	// Variables for totaling the price subtotals and taxes for the memorialization products;
	let tempMemorializationCost = 0;
	let tempMemorializationTax = 0;
	let tempMemorializationCostDelivery = 0;
	let tempMemorializationTaxDelivery = 0;
	// This is the amount that the Pet Owner still has to pay if they added items to their basket but never completed the checkout process.
	let tempPetOwnerPaymentCost = 0;
	let tempPetOwnerPaymentTax = 0;
	let tempPetOwnerPaymentCostDelivery = 0;
	let tempPetOwnerPaymentTaxDelivery = 0;

	// get pay at pickup total due
	let payAtPickupDue = Order.ProductsOrder.filter((product) => {
		return product.payAtPickup === 1;
	})
	if(payAtPickupDue.length > 0) {
		payAtPickupDue = payAtPickupDue.map((product) => {
			return product.payAtPickupDue = parseFloat(product.priceCharged) + parseFloat(product.taxCharged);
		}).reduce((sum, payAtPickupDueProduct) => {
			return sum + parseFloat(payAtPickupDueProduct);
		});
	} else {
		payAtPickupDue = 0;
	}
	// Determine if the pet owner still owes payment for any products
	let showPaymentPetOwner = false;
	//if(parseInt(Order.memorializationCheckedOut) === 1 || moment(Order.dateMemorializationEnds).format() < moment().format()) {
		Order.ProductsOrder.forEach((product) => {
			// Added an extra check here to make sure that this will only include products that have not been deleted or refunded.
			// NOTE: Since this logic was built, we have added the ability for Crematory users to add products to orders that Vets create, which means that hose products will have invoiceVet=0 and the expectation that the pet owner would pay for the product.
			// NOTE: We added an "Invoice Hospital" button to any product that is on a Vet created order and is invoiceVet=0 to allow crematory users to add products and have the vet pay for them. Apparently Vet's want crematories to be able to do this.
			if(product.invoiceVet !== 1 && product.paymentCompletedPetOwner !== 1 && product.paymentCompletedAlternative !== 1 && product.payAtPickup !== 1 && product.dateDeleted === null && product.dateRefunded === null) {
				showPaymentPetOwner = true;
			}
		})
	//}

	// Variables for totaling the price subtotals and taxes for the Vet charges
	let tempVetChargesCost = 0;
	let tempVetChargesTax = 0;

	let showDeleteButton = true;
	if(parseInt(Order.orderStatusId) !== 1) {
		showDeleteButton = false;
	} else if(Order.memorialization === 'home' && parseInt(Order.memorializationCheckedOut) === 1) {
		showDeleteButton = false;
	}
	if(parseInt(User.companyId) === 4 && userTypeId < 3) {
		showDeleteButton = true;
	}
	// Is Memorialization Time Open, Time Closed, Manually Completed, Reopened by Crematory?
	let memorializationOpen = true;			// memorialization is still available
	let memorializationCompleted = true;	// memorialization manually completed in clinic or at home
	let memorializationReopened = true;
	// if Reopened by Staff - OPEN
	if(Order.tabMemorializationOpen === 1) {
		memorializationOpen = true;
		memorializationCompleted = false;
		memorializationReopened = true;
	}
	// else if Manually Completed - COMPLETED at ____
	else if (Order.memorializationCheckedOut === 1) {
		memorializationOpen = false;
		memorializationCompleted = true;
		memorializationReopened = false;
	}
	// else if Time Closed - CLOSED
	else if (moment().diff(moment(Order.dateMemorializationEnds)) > 0) {
		memorializationOpen = false;
		memorializationCompleted = false;
		memorializationReopened = false;
	}
	// else if Time Open - OPEN
	else if (moment().diff(moment(Order.dateMemorializationEnds)) <= 0) {
		memorializationOpen = true;
		memorializationCompleted = false;
		memorializationReopened = false;
	}

	// Condition for the Vet to be able to change the Memorialization if the order is for Communal, AND the status is still Awaiting pickup from hospital.
	// Allow vet to change the Memorialization to At Home or In Clinic, which will reopen the memorialization process (memorializationCheckedOut=0)
	values.allowVetChangeMemorialization = false;
	values.memorializationCompletedStartedAs = memorializationCompleted;
	values.memorializationStartedAs = Order.memorialization;

	// Only concerned with Vets on communal cremations in these conditions
	if(userTypeId === 5 && Order.ProductsOrder.find((product) => product.productName === 'Communal Cremation' && product.dateDeleted === null && product.dateRefunded === null)) {
		if(Order.memorializationCheckedOut === 1) {
			if(Order.orderStatus === 'Awaiting pickup from hospital') {
				values.allowVetChangeMemorialization = true;
			} else {
				values.allowVetChangeMemorialization = false;
			}
		} else {
			// If memorialization is still open, the Vet can always change the memorialization freely between Home / Clinic. Changing it to 'none' will close the memorialization (memorializationCheckedOut=1)
			values.allowVetChangeMemorialization = true;
		}
	}

	//Re-order the products on this order so that the delivery option is last in the list.
	// Filter the Order.ProductsOrder array so that we can display the Cremation Product first, and the Delivery Product last.
	const tempCremationProduct = Order.ProductsOrder.filter((product) => product.productCategory === 'Cremations');
	const tempDeliveryProduct = Order.ProductsOrder.filter((product) => product.productCategory === 'Delivery');
	let ReorderedProducts = Order.ProductsOrder.filter((product) => product.productCategory !== 'Cremations' && product.productCategory !== 'Delivery');
	// Splice the Cremation product to the front of the array, then use the ReorderedProducts for display
	if(tempCremationProduct.length === 2) {
		ReorderedProducts.splice(0,0,tempCremationProduct[0]);
		ReorderedProducts.splice(0,0,tempCremationProduct[1]);
	} else if(tempCremationProduct.length === 1) {
		ReorderedProducts.splice(0,0,tempCremationProduct[0]);
	}
	if(tempDeliveryProduct.length > 0) {
		ReorderedProducts.splice(ReorderedProducts.length, 0, tempDeliveryProduct[0]);
	}

	// Function to Bypass the payment requirement in order to be able to Cremate and Fulfill products. Save a comment on this order with the reasoning
	async function handleBypassPaymentRequirement() {
		await OrderCommentSave({input: {orderComment: `BYPASS PAYMENT REQUIREMENT REASON: ${bypassPaymentRequirementReason}`, orderCommentId: 0, orderCommentInternal: 1, orderCommentMadeBy: 'Crematory', orderCommentStatus: 'completed', orderCommentType: 'Comment', orderId: Order.orderId}});	
		// Save bypassPaymentRequirement to orders table
		await OrderSave({ input : {
			bypassPaymentRequirement: 1,
			orderId: parseInt(Order.orderId)
		}});
	}

	// Function to create a Product Only order that will match this Order's details, and tie to this Order via parentOrderId
	async function handleCreateProductOnlyOrder() {
		await DuplicateOrder({input: {orderId: Order.orderId}})
	}

	// Function for the Pet Reference Number 'Order Scan' at the top of the page.
	async function handlePetReferenceNumberOnChange(petReferenceNumber) {
		setState({ orderScanMessage: '', petReferenceNumberOrderScan: petReferenceNumber })

		// Auto submit if the length is 7
		if(petReferenceNumber.length === 7) {
			handleSubmitPetReferenceNumber(petReferenceNumber);
		}
	}

	function handlePhoneChange(value) {
		values.ownerPhoneNumber = value;
		setState({ownerPhoneNumber: value})
	}

	// Function for handling the actual submit of the pet reference number
	async function handleSubmitPetReferenceNumber(number) {
		const { data: { petReferenceNumberCheck }} = await PetReferenceNumberCheck({ input: { petReferenceNumber: number } });

		if(petReferenceNumberCheck.Response.success === false) {
			// re-initialize the form - the reference number entered is wrong
			// handlePetReferenceNumberSubmit(input.petReferenceNumber);
			// setResponse(petReferenceNumberCheck.Response);
			setState({orderScanMessage: petReferenceNumberCheck.Response.message})
		} else {
			// Redirect to the order details for this orderId
			props.history.push(`/orders/orderId/${petReferenceNumberCheck.Order.orderId}`)
		}
	}

	// Navigation functionality
	function handleNavClasses(navClass) {
		// set the previous active class to have the in-active classes
		let previousActiveClass = NavClasses.activeClass;
		setState({
			initialLoad: false,
			NavClasses: {
				...NavClasses,
				activeClass: navClass,
				[previousActiveClass]: 'btn-success opacity-65 border border-white',
				[navClass]: 'btn-success'
			}
		})
	}

	let companyDepartment = Order.CompanyDepartments.find((Department) => Department.companyDepartmentId === Order.companyDepartmentId);
	if(state.hideOrderForm === false && (userTypeId === 1 || userTypeId === 2 || userTypeId === 3 || initialValues.orderStatus !== 'Deleted') ) {
		let style = {};
		// style.backgroundImage = `url(/images/ui/loyalpaws_background1.jpg)`;
		// style.backgroundSize = 'cover';
		// style.backgroundPosition = 'center center';
		// style.backgroundRepeat = 'no-repeat';
		style.height = '100%';

		// Display log for the pickup and delivery at the clinics. Show driver and clinic employee signature
		let PickupPetLog = DeliveryLogs.find((deliveryLog) => deliveryLog.deliveryType === 'pickup');
		let DeliverPetLog = DeliveryLogs.find((deliveryLog) => deliveryLog.deliveryType === 'delivery');

		// Get a Count for Unread Comments
		let unreadComments = 0;
		if(initialValues.OrderComments.length > 0) {
			unreadComments = initialValues.OrderComments.filter((comment) => comment.orderCommentStatus === 'unread').length;
		}

		// Products Completed & Packaged - check that all OrderProducts that are not cremation, delivery, or burial are marked completed. 
		let allProductsCompletedAndPackaged = true;
		let memorializationProductsOnOrder = false;
		Order.ProductsOrder.forEach((product) => {
			if(product.statusIsBurial === 0 && product.statusIsCremation === 0 && product.statusIsDelivery === 0) {
				memorializationProductsOnOrder = true;
				if(product.statusCompletedAndPackaged === 0) allProductsCompletedAndPackaged = false;
			} 
		})

		return (
			<React.Fragment>
				<div className="w-100 bg-light p-1" style={style}>
					{/* START TOP HEADER DETAILS SECTION */}


					{/* Order Scan checker */}
					{/* <div className="card border-secondary p-1 pl-3 mb-3">
						<div className="row">
							<div className={`col-md-auto h5 mt-1`}>
								<FontAwesomeIcon icon="search" /> Find An Order
							</div>
							<div className={`col-md-auto p-0`}>
								<Field name="petReferenceNumberOrderScan" value={petReferenceNumberOrderScan} onChange={(event) => handlePetReferenceNumberOnChange(event.target.value)} className="form-control" placeholder="Pet Reference Number" />
							</div>
							{orderScanMessage !== '' &&
								<div className="col-md-12">
									<div className="alert alert-danger p-2 w-auto mr-2 mb-0">{orderScanMessage}</div>
								</div>
							}
							<div className="col-md">
								<button type="button" onClick={() => handleSubmitPetReferenceNumber(petReferenceNumber)} className="btn btn-info btn-addon mt-4" disabled={petReferenceNumber.length !== 7}>
									<FontAwesomeIcon icon="search" /> <Translate id="Check Status" />
								</button>
							</div>
						</div>
					</div> */}

					{/*  Display a resulting status message. Checking for message also because we are creating different response messages for different sections on this page  */}
					{ Response && Response.message && dirty === false && Response.message !== "Order Successfully Deleted. Click here to go back to" && <div className="alert alert-success">{props.translate(Response.message)}</div> }

					{/* SHOW A WARNING IF THIS ORDER IS DELETED */}
					{Order.orderStatus === 'Deleted' && <div className="alert bg-danger h3 text-white mt-3"><FontAwesomeIcon icon="trash-alt" /> THIS ORDER HAS BEEN DELETED.</div>}

					{showProductsMemorialization === true &&
						<ProductsMemorialzationContainer
							companyId={Order.companyId}
							speciesId={Order.speciesId}
						/>
					}

					{/* alert for there being a Hold on this order - only allow removing the hold if current user is a crematory stff member or the hold was created by the vet hospital */}
					{values.OrderHold.length > 0 &&
						<div className="card mb-3 border-warning bg-warning">
							<div className="card-header">
								{((userTypeId === 1 || userTypeId === 2 || userTypeId === 3) || (userTypeId === 5 && parseInt(values.OrderHold[0].companyTypeId) === 3) ) &&
									<button type="button" onClick={() => setState({ showRemoveHoldForm: true })} disabled={showRemoveHoldForm} className="btn btn-danger btn-sm btn-addon float-right"><FontAwesomeIcon icon="times" /> <Translate id="Remove Hold" /></button>
								}
								<h4 className="m-0"><FontAwesomeIcon icon="hand-paper" />
									{parseInt(values.OrderHold[0].companyTypeId) === 2 && <Translate id=" Crematory Hold" />}
									{parseInt(values.OrderHold[0].companyTypeId) === 3 && <Translate id=" Hospital Hold" />}
								</h4>
							</div>
							<div className="card-body">
								<p className="m-0">{values.OrderHold[0].orderHoldReason}</p>
							</div>
							{values.OrderHold[0].dateCreated && <div className="card-footer">{moment(values.OrderHold[0].dateCreated).format('MMM D, YYYY h:mm A')} - {values.OrderHold[0].firstName} {values.OrderHold[0].lastName}</div>}
						</div>
					}

					{/* Hold / Remove Hold form */}
					{(showPlaceHoldForm === true || showRemoveHoldForm === true) &&
						<OrderHoldFormContainer
							holdDisclaimerTranslateId={holdDisclaimerTranslateId}
							holdTitle={holdTitle}
							handleSetState={(showPlaceHoldForm, showRemoveHoldForm) => setState(showPlaceHoldForm, showRemoveHoldForm)}
							OrderHold={values.OrderHold}
							orderId={Order.orderId}
						/>
					}

					{/* Delete Order form */}
					{state.showDeleteOrderForm === true &&
						<div className="card mb-3 border-danger">
							<div className="card-header bg-danger">
								<h5 className="m-0"><FontAwesomeIcon icon="trash-alt" /> <Translate id="Delete Order" /></h5>
							</div>
							<div className="card-body">
								<Translate id="Order Delete Disclaimer" />
								<Field name="orderDeleteReason" component="textarea" showError={true} className={`form-control ${errors.orderDeleteReason && touched.orderDeleteReason && 'is-invalid'}`} />
							</div>
							<div className="card-footer">
								<button type="button" onClick={submitDeleteOrder} className="btn btn-danger btn-sm btn-addon"><FontAwesomeIcon icon="trash-alt" /> <Translate id="Delete" /></button>
								<button type="button" onClick={() => handleStateChange('showDeleteOrderForm', false)} className="btn btn-default btn-sm ml-3 btn-addon "><FontAwesomeIcon icon="times" /> <Translate id="Cancel" /></button>
							</div>
						</div>
					}

					{ 
						Order.orderTypeId === 2 && 
						Order.memorialization !== 'none' && 
						<React.Fragment>
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
						</React.Fragment>
					}

					{ 
						Order.orderTypeId === 2 && 
						Order.memorialization === 'none' && 
						<div className="card-header text-white bg-success">
							<h5 className="m-0 text-light">
								<span className="h4 float-md-right m-0"><FontAwesomeIcon icon="tasks" /> {Order.orderStatus}</span>
								<FontAwesomeIcon icon="clock" /> <Translate id=" No Memorialization" />
							</h5>
						</div>
					}

					{ Order.orderTypeId !== 2 &&
						<div className="card-header text-white bg-info">
							<h5 className="m-0">
								<FontAwesomeIcon icon="tasks" /> {Order.orderStatus}
							</h5>
						</div>
					}

					{/* top level alert for the pets name and reference number, or Vet Supply info */}
					<div className="card-header bg-light text-secondary clearfix">
						{showDeleteButton &&
							<button type="button" onClick={() => handleStateChange('showDeleteOrderForm', true)} disabled={state.showDeleteOrderForm} className="btn btn-danger btn-sm btn-addon float-right ml-2"><FontAwesomeIcon icon="trash-alt" /> <Translate id="Delete" /></button>
						}
						{/* only show the Hold button if there is not a hold on the order AND either they are Creamtory Staff OR the Cremation is still pending */}
						{values.OrderHold.length === 0 && (userTypeId === 1 || userTypeId === 2 || userTypeId === 3 || Cremation === null) &&
							<button type="button" onClick={() => setState({showPlaceHoldForm: true})} disabled={showPlaceHoldForm} className="btn btn-warning btn-sm btn-addon float-right"><FontAwesomeIcon icon="hand-paper" /> <Translate id="Place Hold" /></button>
						}
						{(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) &&
							<React.Fragment>
								{showProductsMemorialization === false && <h3 className="float-md-right m-0 mt-n-1 mr-3"><button type="button" className="btn btn-info btn-sm btn-addon" onClick={() => setState({showProductsMemorialization: true})}><FontAwesomeIcon icon="hospital" /> {Order.companyName}</button></h3>}
								{showProductsMemorialization === true && <h3 className="float-md-right m-0 mt-n-1 mr-3"><button type="button" className="btn btn-default btn-sm btn-addon" onClick={() => setState({showProductsMemorialization: false})}><FontAwesomeIcon icon="times" /> <Translate id="Close Products" /></button></h3>}
							</React.Fragment>
						}
						{Order.orderTypeId === 1 && <h3 className="m-0">{values.companyName} Supply Order - {values.petReferenceNumber}</h3>}
						{Order.orderTypeId === 2 && <h3 className="m-0">{`${values.petFirstName} ${values.petLastName} - ${values.petReferenceNumber}`} - <Translate id={serviceType} /></h3>}
						{Order.orderTypeId === 3 && <h3 className="m-0">{values.companyName} Product Only Order - {values.petReferenceNumber}</h3>}
					</div>

					{/* END TOP HEADER DETAILS SECTION */}

					{/* NAVIGATION FOR ORDER DETAILS SECTIONS */}
					<ul className="mt-1 mb-1 nav nav-pills nav-justified">
						{(userTypeId !== 5) &&
							<React.Fragment>		
								<li className="nav-item">
									<button className={`nav-link w-100  rounded-0 btn btn-sm ${NavClasses.Memorialization}`} onClick={() => handleNavClasses('Memorialization')}><Translate id="Memorialization" /></button>
								</li>
								<li className="nav-item">
									<button className={`nav-link w-100 rounded-0 btn btn-sm ${NavClasses.PetOwner}`} onClick={() => handleNavClasses('PetOwner')}><Translate id="Pet / Owner" /></button>
								</li>
								<li className="nav-item">
									<button className={`nav-link w-100 rounded-0 btn btn-sm ${NavClasses.Printing}`} onClick={() => handleNavClasses('Printing')}><Translate id="Printing" /></button>
								</li>
								<li className="nav-item">
									<button className={`nav-link w-100 rounded-0 btn btn-sm ${NavClasses.Comments}`} onClick={() => handleNavClasses('Comments')}>
										<Translate id="Messages" /> {unreadComments > 0 && <span className="badge badge-danger">{unreadComments}</span>}
									</button>
								</li>
								<li className="nav-item">
									<button className={`nav-link w-100 rounded-0 btn btn-sm ${NavClasses.Details}`} onClick={() => handleNavClasses('Details')}><Translate id="Details" /></button>
								</li>
								<li className="nav-item">
									<button className={`nav-link w-100 rounded-0 btn btn-sm ${NavClasses.VetCharges}`} onClick={() => handleNavClasses('VetCharges')}><Translate id="Vet Charges" /></button>
								</li>
								<li className="nav-item">
									<button className={`nav-link w-100 rounded-0 btn btn-sm ${NavClasses.Logs}`} onClick={() => handleNavClasses('Logs')}><Translate id="Logs" /></button>
								</li>
							</React.Fragment>
						}
						{(userTypeId === 5) &&
							<React.Fragment>
								<li className="nav-item">
									<button className={`nav-link w-100 rounded-0 btn btn-sm ${NavClasses.PetOwner}`} onClick={() => handleNavClasses('PetOwner')}><Translate id="Pet / Owner" /></button>
								</li>
								<li className="nav-item">
									<button className={`nav-link w-100  rounded-0 btn btn-sm ${NavClasses.Memorialization}`} onClick={() => handleNavClasses('Memorialization')}><Translate id="Memorialization" /></button>
								</li>
								<li className="nav-item">
									<button className={`nav-link w-100 rounded-0 btn btn-sm ${NavClasses.Printing}`} onClick={() => handleNavClasses('Printing')}><Translate id="Printing" /></button>
								</li>
								<li className="nav-item">
									<button className={`nav-link w-100 rounded-0 btn btn-sm ${NavClasses.Comments}`} onClick={() => handleNavClasses('Comments')}><Translate id="Comments" /></button>
								</li>
								<li className="nav-item">
									<button className={`nav-link w-100 rounded-0 btn btn-sm ${NavClasses.Logs}`} onClick={() => handleNavClasses('Logs')}><Translate id="Activity Logs" /></button>
								</li>
							</React.Fragment>
						}
					</ul>

					{/* PET & OWNER INFORMATION SECTIONS */}
					{
						NavClasses.activeClass === 'PetOwner' &&
						<React.Fragment>
							<div className="card border-secondary">
								{Order.orderTypeId === 1 &&
									<div className={`card-header ${serviceTypeClass}`}>
										{parseInt(Order.orderStatusId) === 1 &&
											<button onClick={() => props.history.push(`/orders/order_supplies/referenceNumber/${Order.petReferenceNumber}/productType/4`)} className="btn btn-info btn-sm btn-addon float-right"><FontAwesomeIcon icon="user-md" /> <Translate id="Add Vet Supplies"/> </button>
										}
										<h5 className="m-0"><Translate id={serviceType} /></h5>
									</div>
								}
								{Order.orderTypeId === 2 &&
									<div className="card-header">
										<h5 className="float-md-right m-0">
											{ values.memorialization === 'home' && <span><FontAwesomeIcon icon="home" /> <Translate id="Memorialization At Home" /></span> }
											{ values.memorialization === 'clinic' && <span><FontAwesomeIcon icon="hospital" /> <Translate id="Memorialization In Hospital" /></span> }
											{ values.memorialization === 'none' && <span><Translate id="No Memorialization" /></span> }
											{enableEditingOrderDetails === false &&
												<button type="button" disabled={orderHoldDisableInputs} onClick={() => setState({enableEditingOrderDetails: true, orderDetailsMessage: '', orderDetailsMessageAlertStatus: ''})} className="btn btn-sm btn-info btn-addon ml-3"><FontAwesomeIcon icon="pen" /> <Translate id="Edit" /></button>
											}
										</h5>
										<h5 className="m-0">
											<FontAwesomeIcon icon="fire" />  <Translate id={serviceType} />
											{ Order.ProductsOrder.find((product) => product.productName === 'Visitation & Viewing') && <span className="ml-3"><FontAwesomeIcon icon="users" /> <Translate id="Visitation & Viewing" /></span>}
										</h5>
									</div>
								}
								{Order.orderTypeId === 3 &&
									<div className={`card-header ${serviceTypeClass}`}>
										{parseInt(Order.orderStatusId) === 1 &&
											<button onClick={() => props.history.push(`/memorialization/referenceNumber/${Order.petReferenceNumber}`)} className="btn btn-info btn-sm btn-addon float-right"><FontAwesomeIcon icon="shopping-cart" /> <Translate id="Add Products"/> </button>
										}
										<h5 className="m-0"><Translate id={serviceType} /></h5>
									</div>
								}
								<div className="card-body">
									{enableEditingOrderDetails === true && ((userTypeId === 5 && values.allowVetChangeMemorialization === true) || userTypeId !== 5) &&
										<div className="card border-secondary mb-3">
											<div className="card-header">
												<h5 className="m-0"><Translate id="Select Memorialization Option" /></h5>
											</div>
											<div className="card-body">
												<div className="row">
													<div className="col-auto">
														{
															parseInt(allowHomeMemorialization) === 1 &&
															<div className="form-check">
																<Field name="memorialization" id="memorializeAtHome" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} component="input" type="radio" value="home" checked={values.memorialization === 'home'} className="form-check-input" />
																<label className={`form-check-label h5 ${values.memorialization !== 'home' && 'small'}`} htmlFor="memorializeAtHome"><Translate id="Memorialization At Home" /></label>
															</div>
														}
														<div className="form-check">
															<Field name="memorialization" id="memorializeInClinic" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} component="input" type="radio" value="clinic" checked={values.memorialization === 'clinic'} className="form-check-input" />
															<label className={`form-check-label h5 ${values.memorialization !== 'clinic' && 'small'}`} htmlFor="memorializeInClinic"><Translate id="Memorialization In Hospital" /></label>
														</div>
														<div className="form-check">
															<Field name="memorialization" id="memorializeNone" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} component="input" type="radio" value="none" checked={values.memorialization === 'none'} className="form-check-input" />
															<label className={`form-check-label h5 ${values.memorialization !== 'none' && 'small'}`} htmlFor="memorializeNone"><Translate id="No Memorialization" /></label>
														</div>
													</div>
													{/* Only show the content for Re-Opening the memorialization if the order is closed and can actually be reopened */}
													{
														(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) &&
														(memorializationOpen === false || parseInt(values.tabMemorializationOpen) === 1) &&
														<React.Fragment>
															<div className="col-auto">
																<div className="form-check">
																	<label className={`form-check-label h5 small`} htmlFor="tabMemorializationOpen"><Translate id="Memorialization Section" /></label>
																	<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} name="tabMemorializationOpen" className="form-control">
																		<option value="1">{props.translate('Open')}</option>
																		<option value="0">{props.translate('Closed')}</option>
																	</Field>
																</div>
															</div>
															<div className="col-auto">
																<div className="form-check">
																	<Field name="tabCremationServicesOpen" id="tabCremationServicesOpen" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false || (values.tabMemorializationOpen === false || parseInt(values.tabMemorializationOpen) === 0)} component="input" type="checkbox" value="1" checked={values.tabCremationServicesOpen === true || values.tabCremationServicesOpen === 1} className="form-check-input" />
																	<label className={`form-check-label h5 small`} htmlFor="tabCremationServicesOpen"><Translate id="Cremation Service Tab" /></label>
																</div>
																<div className="form-check">
																	<Field name="tabDeliveryOpen" id="tabDeliveryOpen" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false || (values.tabMemorializationOpen === false || parseInt(values.tabMemorializationOpen) === 0)} component="input" type="checkbox" value="1" checked={values.tabDeliveryOpen === true || values.tabDeliveryOpen === 1} className="form-check-input" />
																	<label className={`form-check-label h5 small`} htmlFor="tabDeliveryOpen"><Translate id="Delivery Tab" /></label>
																</div>
																<div className="form-check">
																	<Field name="tabJewelryOpen" id="tabJewelryOpen" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false || (values.tabMemorializationOpen === false || parseInt(values.tabMemorializationOpen) === 0)} component="input" type="checkbox" value="1" checked={values.tabJewelryOpen === true || values.tabJewelryOpen === 1} className="form-check-input" />
																	<label className={`form-check-label h5 small`} htmlFor="tabJewelryOpen"><Translate id="Jewelry Tab" /></label>
																</div>
															</div>
															<div className="col-auto">
																<div className="form-check">
																	<Field name="tabKeepsakesOpen" id="tabKeepsakesOpen" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false || (values.tabMemorializationOpen === false || parseInt(values.tabMemorializationOpen) === 0)} component="input" type="checkbox" value="1" checked={values.tabKeepsakesOpen === true || values.tabKeepsakesOpen === 1} className="form-check-input" />
																	<label className={`form-check-label h5 small`} htmlFor="tabKeepsakesOpen"><Translate id="Keepsakes Tab" /></label>
																</div>
																<div className="form-check">
																	<Field name="tabPawPrintsOpen" id="tabPawPrintsOpen" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false || (values.tabMemorializationOpen === false || parseInt(values.tabMemorializationOpen) === 0)} component="input" type="checkbox" value="1" checked={values.tabPawPrintsOpen === true || values.tabPawPrintsOpen === 1} className="form-check-input" />
																	<label className={`form-check-label h5 small`} htmlFor="tabPawPrintsOpen"><Translate id="Paw Prints Tab" /></label>
																</div>
																<div className="form-check">
																	<Field name="tabSpecialServicesOpen" id="tabSpecialServicesOpen" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false || (values.tabMemorializationOpen === false || parseInt(values.tabMemorializationOpen) === 0)} component="input" type="checkbox" value="1" checked={values.tabSpecialServicesOpen === true || values.tabSpecialServicesOpen === 1} className="form-check-input" />
																	<label className={`form-check-label h5 small`} htmlFor="tabSpecialServicesOpen"><Translate id="Special Services Tab" /></label>
																</div>
															</div>
															<div className="col-auto">
																<div className="form-check">
																	<Field name="tabUrnsOpen" id="tabUrnsOpen" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false || (values.tabMemorializationOpen === false || parseInt(values.tabMemorializationOpen) === 0)} component="input" type="checkbox" value="1" checked={values.tabUrnsOpen === true || values.tabUrnsOpen === 1} className="form-check-input" />
																	<label className={`form-check-label h5 small`} htmlFor="tabUrnsOpen"><Translate id="Urns Tab" /></label>
																</div>
															</div>
														</React.Fragment>
													}
												</div>
											</div>
										</div>
									}
									
									{(Order.orderTypeId === 2 || Order.orderTypeId === 3) &&
										<div className="card-deck">
											<div className="card border-secondary mr-0">
												<div className="card-header text-secondary border-secondary">
													<h5 className="m-0"><Translate id="Pet Information" /></h5>
												</div>
												<div className="card-body">
													<div className="form-row">
														<div className="col">
															<Translate id="Pet First Name"/> *
															<Field name="petFirstName" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} showError={true} className={`form-control ${errors.petFirstName && touched.petFirstName && 'is-invalid'}`} />
														</div>
														{/*<div className="col">
															<Translate id="Pet Last Name"/> *
															<Field name="petLastName" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} showError={true} className={`form-control ${errors.petLastName && touched.petLastName && 'is-invalid'}`} />
														</div>*/}
														<div className="col">
															<Translate id="Species"/> *
															<Field component="select" showError={true} name="speciesId" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} className={`form-control ${errors.speciesId && touched.speciesId && 'is-invalid'}`}>
																{/* This render to Static Markup is required because options don't like React children as the label */}
																	{Species.map((species) => {
																			return <option value={species.speciesId} key={species.speciesId}>{species.species}</option>
																		}
																	)}
															</Field>
														</div>
													</div>
													<div className="form-row mt-2">
														<div className="col">
															<Translate id="Pet Color"/> *
															<Field name="petColor" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} showError={true} className={`form-control ${errors.petColor && touched.petColor && 'is-invalid'}`} />
														</div>
														<div className="col">
															<Translate id="Pet Breed"/> *
															<Field name="petBreed" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} showError={true} className={`form-control ${errors.petBreed && touched.petBreed && 'is-invalid'}`} />
														</div>
														<div className="col">
															<Translate id="Weight"/> *
															<Field name="weight" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} showError={true} className={`form-control ${errors.weight && touched.weight && 'is-invalid'}`} />
														</div>
														<div className="col-auto">
															<Translate id="Units"/> *
															<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} name="weightUnits" showError={true} className={`form-control ${errors.weightUnits && touched.weightUnits && 'is-invalid'}`}>
																<option value="lbs">lbs</option>
																<option value="kg">kg</option>
															</Field>
														</div>
														<div className="col-auto">
															<Translate id="Sex"/><br />
															<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} name="sex" showError={true} className={`form-control ${errors.sex && touched.sex && 'is-invalid'}`}>
																<option value="Unspecified">Unspecified</option>
																<option value="Male">Male</option>
																<option value="Female">Female</option>
															</Field>
														</div>
													</div>
												</div>
											</div>

											<div className="card border-secondary">
												<div className="card-header text-secondary border-secondary">
													<h5 className="m-0"><Translate id="Owner Information" /></h5>
												</div>
												<div className="card-body">
													<div className="form-row">
														<div className="col">
															<Translate id="Owner First Name"/> *
															<Field name="ownerFirstName" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} showError={true} required={true} className={`form-control ${errors.ownerFirstName && touched.ownerFirstName && 'is-invalid'}`} />
														</div>
														<div className="col">
															<Translate id="Owner Last Name"/> *
															<Field name="ownerLastName" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} showError={true} className={`form-control ${errors.ownerLastName && touched.ownerLastName && 'is-invalid'}`} />
														</div>
													</div>
													<div className="form-row">
														<div className="col">
															<span className={`${errors.ownerEmail && touched.ownerEmail && 'text-danger'}`}><Translate id="Phone Number"/> *</span>
															<PhoneInput
																country="us"
																disableCountryCode={true}
																disableDropdown={true}
																onlyCountries={["us"]}
																placeholder={"(555) 123 - 4567"}
																value={values.ownerPhoneNumber}
																onChange={ownerPhoneNumber => handlePhoneChange(ownerPhoneNumber)} />
																{/* disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} */}
															{/* <Field name="ownerPhoneNumber" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} showError={true} className={`form-control ${errors.ownerPhoneNumber && touched.ownerPhoneNumber && 'is-invalid'}`} /> */}
														</div>
														<div className="col">
															<Translate id="Email"/>
															<Field name="ownerEmail" disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} className={`form-control ${errors.ownerEmail && touched.ownerEmail && 'is-invalid'}`} />
														</div>
													</div>
													{
														enableEditingOrderDetails === false &&
														<div className="form-row">
															<div className="col">
																<div><Translate id="Address" /></div>
																{
																	(Order.OwnerAddress &&
																	parseInt(Order.OwnerAddress.addressId) > 0 &&
																	<OwnerAddressOutput
																		Countries={Countries}
																		OwnerAddress={Order.OwnerAddress}
																	/>) ||
																	<div className="text-dark">No Address Saved</div>
																}
															</div>
														</div>
													}	
													{
														enableEditingOrderDetails === true &&
														<React.Fragment>
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
																	<Field name="ownerCity" className={`form-control ${errors.city && touched.city && 'is-invalid'}`} />
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
																	<Field name="ownerPostalCode" className={`form-control form-control-num ${errors.postalCode && touched.postalCode && 'is-invalid'}`} />
																</div>
															</div>
														</React.Fragment>
													}												
												</div>
											</div>
										</div>
									}{/* END PET & OWNER INFORMATION SECTIONS */}
									{/* PICKUP & DELIVERY DETAILS SECTIONS */}
									<div className="card-deck mt-3">
										{
											Order.orderTypeId !== 1 &&
											<div className="card border-secondary mr-0">
												<div className="card-header text-secondary border-secondary">
													<h5 className="m-0"><Translate id="Pickup" />: {parseInt(Order.pickupAddressId) === 0 && 'Client Drop Off at Crematory'} {Order.pickupAddressId > 0 && Order.PickupAddress !== null && 'Hospital Pickup'} {Order.PickupAddress !== null && Order.PickupAddress.routeName !== null && <span> - {Order.PickupAddress.routeName}</span>}</h5>
												</div>
												<div className="card-body">
													{enableEditingOrderDetails === false &&
														<React.Fragment>
															{Order.pickupAddressId > 0 && Order.PickupAddress !== null &&
																<div>
																	<h6>{Order.PickupAddress.addressName !== null && `${Order.PickupAddress.addressName} - `}{Order.PickupAddress.addressName === null && `${Order.companyName} - `}{Order.PickupAddress.routeName}</h6>
																	<p>{Order.PickupAddress.address2 === '' ? Order.PickupAddress.address1 : `${Order.PickupAddress.address1} ${Order.PickupAddress.address2}`}<br />
																		{Order.PickupAddress.city}, {Order.PickupAddress.state} {Order.PickupAddress.postalCode}</p>
																</div>
															}
															{
																PickupPetLog &&
																<div>
																	Picked Up: {moment(PickupPetLog.dateCreated).format('MMM D  h:mm A')} by {PickupPetLog.firstName} {PickupPetLog.lastName}
																	<img alt="Pickup Signature" className="w-100" src={PickupPetLog.signatureData}/>
																</div>
															}
														</React.Fragment>
													}
													{enableEditingOrderDetails === true &&
														<React.Fragment>
															<div className="alert alert-warning mt-1 mb-0"><Translate id="Order Details Save Needed Address Warning" /></div>
															<p><Field component="select" name="pickupAddressId" onChange={(event) => handleDeliveryValuesUpdate({name: 'pickupAddressId', value: event.target.value})} className="form-control">
																<option value="0">{props.translate("Client Drop Off at Crematory")}</option>
																{PickupCompanyAddresses.CompanyAddresses.map((address) => {
																		const addressName = address.addressName !== '' && address.addressName !== null ? address.addressName : address.companyName;
																		const addressValue = address.address2 === '' ? address.address1 : `${address.address1} ${address.address2}`;
																		return <option value={address.addressId} key={address.addressId}>{addressName}: {addressValue}, {address.city}, {address.state} {address.postalCode}</option>
																	}
																)}
															</Field></p>
														</React.Fragment>
													}
													{/* OPTIONAL HOSPITAL DEPARTMENT */}
													{enableEditingOrderDetails === false &&
														<React.Fragment>
															{Order.CompanyDepartments !== null && Order.CompanyDepartments.length > 0 &&
																<div>
																	<h6>{props.translate("Hospital Department")}</h6>
																	<p>{Order.companyDepartmentId > 0 && <span>{companyDepartment.departmentName}</span>} {Order.companyDepartmentId === 0 && <span className="text-muted">Not Selected</span>}</p>
																</div>
															}
														</React.Fragment>
													}
													{enableEditingOrderDetails === true &&
														<React.Fragment>
															{Order.CompanyDepartments !== null && Order.CompanyDepartments.length > 0 &&
																<React.Fragment>
																	<h6>{props.translate("Hospital Department")}</h6>
																	<p><Field component="select" name="companyDepartmentId" className="form-control">
																		{Order.CompanyDepartments.length > 1 && <option value="0">{props.translate("Choose a Department")}</option>}
																		{Order.CompanyDepartments.map((department) => {
																				return <option value={department.companyDepartmentId} key={department.companyDepartmentId}>{department.departmentName}</option>
																			}
																		)}
																	</Field></p>
																</React.Fragment>
															}
														</React.Fragment>
													}
												</div>
											</div>
										}
										<div className="card border-secondary">
											<div className="card-header text-secondary border-secondary">
												<h5 className="m-0"><Translate id="Delivery" />: {Order.deliveryMethodName !== '' && Order.deliveryMethodName}{Order.deliveryMethodName === '' && 'Not yet selected'} {Order.DeliveryAddress && Order.DeliveryAddress.routeName !== null && <span> - {Order.DeliveryAddress.routeName}</span>}</h5>
											</div>
											<div className="card-body">
												{
													enableEditingOrderDetails === true &&
													<DeliveryComponent
														CompanyAddresses={DeliveryCompanyAddresses.CompanyAddresses}
														deliveryAddressId={values.deliveryAddressId}
														handleDeliveryValuesUpdate={handleDeliveryValuesUpdate}
														hospitalOptions={{courierDeliveryOffered: Order.courierDeliveryOffered, crematoryPickupOffered: Order.crematoryPickupOffered, hospitalDeliveryOffered: Order.hospitalDeliveryOffered}}
														initialValues={{
															deliveryAddressId: values.deliveryAddressId,
															deliveryMethodProductId: values.deliveryMethodProductId
														}}
														orderDetails={true}
														orderDetailsEditingEnabled={enableEditingOrderDetails}
														petReferenceNumber={Order.petReferenceNumber}
														productTypeId={3}
														showNoDelivery={false}
													/>
												}
												{
													enableEditingOrderDetails === false &&
													<React.Fragment>
														{Order.deliveryAddressId > 0 && Order.DeliveryAddress !== null &&
															<div>
																{Order.DeliveryAddress.ownerName !== "" && <h6>{Order.DeliveryAddress.ownerName}</h6>}
																<h6>{Order.DeliveryAddress.addressName}</h6>
																<p>{Order.DeliveryAddress.address2 === '' ? Order.DeliveryAddress.address1 : `${Order.DeliveryAddress.address1} ${Order.DeliveryAddress.address2}`}<br />
																{Order.DeliveryAddress.city}, {Order.DeliveryAddress.state} {Order.DeliveryAddress.postalCode}</p>
															</div>
														}
														{(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) && Order.dateExpectedDelivery !== null &&
															<div>Expected: {moment(Order.dateExpectedDelivery).format('MM-DD-YYYY')}</div>
														}
														{
															DeliverPetLog &&
															<div>
																Delivered: {moment(DeliverPetLog.dateCreated).format('MMM D, YYYY h:mm A')} by {DeliverPetLog.firstName} {DeliverPetLog.lastName}
																<img alt="Delivery Signature" className="w-100" src={DeliverPetLog.signatureData}/>
															</div>
														}
													</React.Fragment>
												}
											</div>
										</div>
									</div>{/* END PICKUP & DELIVERY DETAILS SECTIONS */}

									{/* BOTTOM ROW (EDIT BUTTON) FOR INFORMATIONAL SECTION */}
									<div className="row mt-2 mb-2">
										<div className="col-12 w-100 border-secondary">
											{/* Buttons */}
											<div className="float-left">
												{enableEditingOrderDetails === false &&
													<button type="button" disabled={orderHoldDisableInputs} onClick={() => setState({enableEditingOrderDetails: true, orderDetailsMessage: '', orderDetailsMessageAlertStatus: ''})} className="btn btn-info btn-addon mr-3"><FontAwesomeIcon icon="pen" /> <Translate id="Enable Editing" /></button>
												}
												{enableEditingOrderDetails === true &&
													<React.Fragment>
														<button type="button" onClick={() => submitForm('Pet/Owner')} className="btn btn-success btn-addon mr-3" disabled={isSubmitting || dirty === false || orderHoldDisableInputs === true}>
															<FontAwesomeIcon icon="check" /> <Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
														</button>
														<button type="button" onClick={() => setState({enableEditingOrderDetails: false, orderDetailsMessage: '', orderDetailsMessageAlertStatus: ''})} className="btn btn-info btn-addon mr-3"><FontAwesomeIcon icon="times" /> <Translate id="Disable Editing" /></button>
													</React.Fragment>
												}
											</div>
											{orderHoldDisableInputs === false && enableEditingOrderDetails === true && requireInitialsEditOrderDetails === 1 &&
												<div className="float-left">
													<Field name="userInitialsOrderDetails" placeholder={`${props.translate('Initials')}*`} disabled={orderHoldDisableInputs || enableEditingOrderDetails === false} showError={true} className={`form-control ${errors.userInitialsOrderDetails && touched.userInitialsOrderDetails && 'is-invalid'}`} />
												</div>
											}

											{orderDetailsMessage !== '' &&
												<div className={`float-left ml-3 alert alert-${orderDetailsMessageAlertStatus} mb-0`}>{props.translate(orderDetailsMessage)}</div>
											}
											{enableEditingOrderDetails === true &&
											<div className="float-right"><button type="button" onClick={() => setState({enableEditingOrderDetails: false, orderDetailsMessage: '', orderDetailsMessageAlertStatus: ''})} className="btn btn-default btn-addon float-right"><FontAwesomeIcon icon="times" /> <Translate id="Cancel" /></button></div>}
										</div>
									</div>{/* END BOTTOM ROW (EDIT BUTTON) FOR INFORMATIONAL SECTION */}
								</div>
							</div>
						</React.Fragment>
					}

					{/* MEMORIALIZATION INFORMATION - PRODUCTS / SERVICES FOR FULLFILLMENT AND PAYMENT */}
					{
						NavClasses.activeClass === 'Memorialization' &&
						<div className="mt-3">
							<div className="card w-100 border-secondary">
								<div className="card-header text-secondary border-secondary">
										{/* Vets can edit Memorialization on their cremation orders as long as the status is still 'Awaiting Pickup at Hospital' */}
										{Order.memorialization !== 'none' && (parseInt(Order.memorializationCheckedOut) !== 1 || parseInt(Order.tabMemorializationOpen) === 1 || (parseInt(userTypeId) === 5 && parseInt(Order.orderStatusId) === 1)) &&
											<button onClick={() => props.history.push(`/memorialization/referenceNumber/${Order.petReferenceNumber}`)} disabled={values.memorialization === 'home' || orderHoldDisableInputs} className="btn btn-info btn-sm btn-addon float-right"><FontAwesomeIcon icon="paw" /> <Translate id="Add Memorialization Products"/> </button>
										}

										{Order.orderTypeId === 1 && parseInt(Order.orderStatusId) === 1 &&
											<button onClick={() => props.history.push(`/orders/order_supplies/referenceNumber/${Order.petReferenceNumber}/productType/4`)} disabled={orderHoldDisableInputs} className="btn btn-info btn-sm btn-addon float-right"><FontAwesomeIcon icon="user-md" /> <Translate id="Add Vet Supplies"/> </button>
										}
										{Order.orderTypeId === 1 && <h5 className="m-0 mt-1"><FontAwesomeIcon icon="user-md" /> <Translate id="Vet Supplies" /></h5>}


										{Order.orderTypeId === 2 &&
											<span className="h5 m-0 mt-1"><FontAwesomeIcon icon="paw" /> <Translate id="Memorializations" /></span>
										}
										{/* For Crematory users, if this is a Walk In Order, allow them to add a 'Walk In Item' to the order. If this is a Vet Order, allow them to create a Products Only order and tie it to this Order */}
										{Order.orderTypeId === 2 && (parseInt(userTypeId) === 1 || parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3) &&
											<React.Fragment>
												{Order.companyType === 'Crematory' && <button type="button" onClick={() => setState({enableWalkInItemLine: true, walkInItemName: 'Walk In Item', walkInItemPrice: '', walkInItemTax: '', walkInItemTaxShown: ''})} disabled={enableWalkInItemLine === true || values.memorialization === 'home' || orderHoldDisableInputs} className="btn btn-info btn-sm btn-addon float-right mr-3"><FontAwesomeIcon icon="plus" /> <Translate id="Add Walk In Item" /></button>}
												{false && Order.companyType !== 'Crematory' && <button type="button" onClick={() => handleCreateProductOnlyOrder()} className="btn btn-info btn-sm btn-addon float-right mr-3"><FontAwesomeIcon icon="plus" /> <Translate id="Create Product Order" /></button>}
											</React.Fragment>
										}

										{Order.orderTypeId === 3 && parseInt(Order.orderStatusId) === 1 &&
											<button onClick={() => props.history.push(`/memorialization/referenceNumber/${Order.petReferenceNumber}`)} disabled={orderHoldDisableInputs} className="btn btn-info btn-sm btn-addon float-right"><FontAwesomeIcon icon="shopping-cart" /> <Translate id="Add Products"/> </button>
										}
										{Order.orderTypeId === 3 && <h5 className="m-0 mt-1"><FontAwesomeIcon icon="shopping-cart" /> <Translate id="Products Order" /></h5>}
								</div>
								<div className="card-body">
									{Order.orderTypeId === 2 && showPaymentPetOwner === true && 
										<React.Fragment>
											{Order.bypassPaymentRequirement === 0 && 
												<React.Fragment>
													{bypassPaymentRequirementShowForm === false && <div className="alert alert-danger text-center mt-n-1">Fulfillment cannot take place until all items are Invoiced to Vet or Paid for by Pet Owner
														<button type="button" className="btn btn-sm btn-danger ml-2 rounded btn-addon" onClick={() => setState({ bypassPaymentRequirementShowForm: true })}><FontAwesomeIcon icon="exclamation" /> Bypass Payment Requirement</button>
													</div>}
													{bypassPaymentRequirementShowForm === true && <div className="alert alert-danger mt-n-1"><div className="form-inline row">
														<div className="col pl-2 pr-0"><input type="text" className="w-100" value={bypassPaymentRequirementReason} placeholder="Reason for bypassing payment requirement? This will allow product fulfillment and cremation. Are you sure?" onChange={(event) => {setState({ bypassPaymentRequirementReason: event.target.value })} } /></div>
														<div className="col-auto pl-0 pr-2"><button type="button" className="btn btn-sm btn-danger ml-2 rounded btn-addon" disabled={bypassPaymentRequirementReason === ''} onClick={() => handleBypassPaymentRequirement()}><FontAwesomeIcon icon="grin-beam" /> Barrett, I promise I know what I am doing</button></div>
													</div></div>
													}
												</React.Fragment>}
											{Order.bypassPaymentRequirement === 1 && <div className="alert alert-danger text-center mt-n-1">Payment requirement has been bypassed for fulfillment and cremation. Payment must still be collected upon pickup.</div>}
										</React.Fragment>
									}
									<table className="table">
										<thead>
											<tr>
												<th></th>
												<th><Translate id="Description" /></th>
												<th><Translate id="Personalization" /></th>
												<th><Translate id="Retail Price" /></th>
												<th><Translate id="Tax" /></th>
												{(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) && 
													<th><Translate id="Fulfillment" />
														{parseInt(Order.orderStatusId) !== 9 && orderStatusUpdatedAwaitingDelivery === false && memorializationProductsOnOrder === true && <button type="button" className="btn btn-sm btn-success btn-addon ml-2 rounded" onClick={() => handleStatusUpdate('Awaiting Delivery')} disabled={allProductsCompletedAndPackaged === false}><FontAwesomeIcon icon={`${(allProductsCompletedAndPackaged === true && 'box') || 'box-open'}`} />Completed</button>}
														{orderStatusUpdatedAwaitingDelivery === true && <span className="ml-2 h5 pt-2 pb-2"><span className="pt-2 pb-2 text-success"><FontAwesomeIcon icon="check" className="" /></span></span>}
													</th>
												}
												{(userTypeId !== 1 && userTypeId !== 2 && userTypeId !== 3) &&
													<th></th>
												}
												<th>{(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) && <GeneratePrintButton disableButton={false} jobId={null} orderId={Order.orderId} printableName={orderProductStickerName} tooltipGenerateButton="" />}</th>
												<th><Translate id="Delete" /></th>
											</tr>
										</thead>
										<tbody>
											{ReorderedProducts.map((product) => {
												if(orderProductIdDeleteOpen === product.orderProductId) {
													// If this product is one that was already paid for by the pet owner, we will display a warning message that this amount will be refunded to the pet owner. The action of actually refunding the price is elsewhere.
													const tempPersonalization = product.priceChargedPersonalization === null ? 0 : product.priceChargedPersonalization;
													const tempTax = product.taxCharged === null ? 0 : product.taxCharged;
													const amountToRefund = Math.add(product.priceCharged, tempPersonalization, tempTax).toFixed(2);
													// Show Delete Reason row
													return (
														<React.Fragment key={product.orderProductId}>
															{product.paymentCompletedPetOwner === 1 &&
																<tr>
																	<td colSpan="8">
																		{product.paymentCompletedAlternative === 0 && <div className="alert alert-danger"><Translate id="Deleting CC Product Warning" /> ${amountToRefund}.</div>}
																		{product.paymentCompletedAlternative === 1 && <div className="alert alert-danger"><Translate id="Deleting Alternative Payment Product Warning" /> ${amountToRefund}.</div>}
																		{refundAttemptError !== '' && <div className="alert alert-danger mb-1"><Translate id={refundAttemptError} /></div>}
																	</td>
																</tr>
															}
															<tr>
																<td colSpan="5">
																	<Field name="deletingReasonOrderProduct" component="textarea" value={deletingReasonOrderProduct} onChange={(event) => setState({deletingReasonOrderProduct: event.target.value})} placeholder={`${props.translate("Reason for deleting product")} ${product.productName} *`} showError={true} className={`form-control ${deletingReasonError && 'is-invalid'}`} />
																</td>
																<td><button type="button" className="btn btn-sm btn-danger btn-addon" disabled={false} onClick={() => handleProductDeleteConfirmation(amountToRefund, product.creditCardChargeId, Order.orderId, product.orderProductId, product.paymentCompletedPetOwner, product.paymentCompletedAlternative)}><FontAwesomeIcon icon="trash-alt" /> <Translate id="Delete"/></button></td>
																<td></td>
																<td><button type="button" className="btn btn-sm btn-default btn-addon" disabled={false} onClick={() => setState({deletingReasonError: false, deletingReasonOrderProduct: '', orderProductIdDeleteOpen: '', refundAttemptError: ''})}><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/></button></td>
															</tr>
														</React.Fragment>
													)
												}
												else if(orderProductIdRefundOpen === product.orderProductId) {
													// If this product is one that was already paid for by the pet owner, we will display a warning message that this amount will be refunded to the pet owner. The action of actually refunding the price is elsewhere.
													const tempPersonalization = product.priceChargedPersonalization === null ? 0 : product.priceChargedPersonalization;
													const tempTax = product.taxCharged === null ? 0 : product.taxCharged;
													const amountToRefund = Math.add(product.priceCharged, tempPersonalization, tempTax).toFixed(2);
													// Show Refund Reason row
													return (
														<React.Fragment key={product.orderProductId}>
															{product.paymentCompletedPetOwner === 1 &&
																<tr>
																	<td colSpan="8">
																		<div className="alert alert-danger">
																			{product.paymentCompletedAlternative === 0 && <React.Fragment><Translate id="You are going to refund the pet owner's credit card" /> ${amountToRefund}.</React.Fragment>}
																			{product.paymentCompletedAlternative === 1 && <React.Fragment><Translate id="You are going to refund the pet owner's E-transfer, cash, or check" /> ${amountToRefund}.</React.Fragment>}
																		</div>
																		{refundAttemptError !== '' && <div className="alert alert-danger mb-1"><Translate id={refundAttemptError} /></div>}
																	</td>
																</tr>
															}
															<tr>
																<td colSpan="5">
																	<Field name="refundingReasonOrderProduct" component="textarea" value={refundingReasonOrderProduct} onChange={(event) => setState({refundingReasonOrderProduct: event.target.value})} placeholder={`${props.translate("Reason for refunding product")} ${product.productName} *`} showError={true} className={`form-control ${refundingReasonError && 'is-invalid'}`} />
																</td>
																<td><button type="button" className="btn btn-sm btn-success btn-addon" disabled={false} onClick={() => handleProductRefundConfirmation(amountToRefund, product.creditCardChargeId, Order.orderId, product.orderProductId, product.paymentCompletedAlternative)}><FontAwesomeIcon icon="dollar-sign" /> <Translate id="Refund"/></button></td>
																<td></td>
																<td><button type="button" className="btn btn-sm btn-default btn-addon" disabled={false} onClick={() => setState({orderProductIdRefundOpen: '', refundingReasonError: false, refundingReasonOrderProduct: ''})}><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/></button></td>
															</tr>
														</React.Fragment>
													)
												}
												else {

													// Need to get the product object from the full Products array matching this productId since it contains the image data.
													const productImage = Products.find((Product) => Product.productId === product.productId);

													// See if this product.orderProductId has any persoalization options in the Order.ProductOptions array
													const ProductOptions = Order.ProductOptions.filter((option) => option.orderProductId === product.orderProductId);

													// Set the total cost of this product - price, personalization, tax
													const tempPriceCharged = product.priceCharged === null ? '0.00' : product.priceCharged;
													const tempPriceChargedPersonalization = product.priceChargedPersonalization === null ? '0.00' : product.priceChargedPersonalization;
													const tempProductSubtotal = Math.add(tempPriceCharged, tempPriceChargedPersonalization).toFixed(2);
													const tempTaxCharged = product.taxCharged === null ? '0.00' : product.taxCharged;

													// Do not add this product's costs to the totals if it has been refunded
													if(product.dateRefunded === null && product.dateDeleted === null) {
														// Total the tax(tempTaxCharged) and subtotals(tempProductSubtotal)
														if(product.productCategory === 'Delivery') {
															tempMemorializationCostDelivery = tempProductSubtotal;
															tempMemorializationTaxDelivery = tempTaxCharged;
														} else {
															tempMemorializationCost = Math.add(tempMemorializationCost, tempProductSubtotal).toFixed(2);
															tempMemorializationTax = Math.add(tempMemorializationTax, tempTaxCharged).toFixed(2);
														}
													}

													// Determine the classes for the status icons for each product
													// Completed and Packaged - last step for most products
													const iconCompletedPackagedBackgroundColor = product.statusCompletedAndPackaged === 1 ? 'black' : 'grey';
													const iconCompletedPackagedColor = product.statusCompletedAndPackaged === 1 ? 'lightgreen' : 'white';
													const alreadyPackagedDeleteDisabled = product.statusCompletedAndPackaged === 1 ? true : false;

													// Step 1 for Paw Prints
													const iconPawPrintTakenBackgroundColor = product.statusPawPrintTaken === 1 ? 'black' : 'grey';
													const iconPawPrintTakenColor = product.statusPawPrintTaken === 1 ? 'lightgreen' : 'white';
													// Step 2 for Paw Prints
													const iconPawPrintCompletedBackgroundColor = product.statusPawPrintCompleted === 1 ? 'black' : 'grey';
													const iconPawPrintCompletedColor = product.statusPawPrintCompleted === 1 ? 'lightgreen' : 'white';
													// Disabled delete button for paw prints if it has already been taken
													const pawPrintDeletedDisabled = product.statusPawPrintTaken === 1 ? true : false;

													// Step 1 for Fur Clipping
													const iconFurClippingTakenBackgroundColor = product.statusFurClippingCompleted === 1 ? 'black' : 'grey';
													const iconFurClippingTakenColor = product.statusFurClippingCompleted === 1 ? 'lightgreen' : 'white';

													// Confirm Status: Step 1 for Visitation - schedule the date, Step 1 for Urns/Keepsakes/Jewelry - ordered by the crematory from the supplier, has been dispatched to engraver (if stocked), or confirmed as stocked
													const iconStatusConfirmedBackgroundColor = product.statusConfirmed === 1 ? 'black' : 'grey';
													const iconStatusConfirmedColor = product.statusConfirmed === 1 ? 'lightgreen' : 'white';

													// Step 2 for Urns/Keepsakes/Jewelry - confirming that the remains have been filled into the product
													const iconRemainsFilledBackgroundColor = product.statusRemainsFilled === 1 ? 'black' : 'grey';
													const iconRemainsFilledColor = product.statusRemainsFilled === 1 ? 'lightgreen' : 'white';
													// Disabled delete button for urns/keepsakes/jewelry if it has already been filled
													const fillabletDeletedDisabled = product.statusRemainsFilled === 1 ? true : false;

													// Set the title for the Delete button IF the button is disabled because a task has been completed on the product already
													let deleteButtonTitle = '';
													if(pawPrintDeletedDisabled) { deleteButtonTitle = 'Cannot be deleted after Paw Print is taken' }
													else if(fillabletDeletedDisabled) { deleteButtonTitle = 'Cannot be deleted after remains filled'}
													else if(alreadyPackagedDeleteDisabled) { deleteButtonTitle = 'Cannot be deleted after packaging completed'}

													// Color default for cost and tax displays
													let priceBadgeClass = '';
													let priceBadgeText = '';
													let priceTextClass = ''
													// If the memorialization 48 window closed, and the pet owners has added items to their basket without completing the checkout process and paying for them, then show those prices as unpaid and show payment form
													if(product.dateDeleted !== null) {
														priceBadgeClass = 'badge badge-danger';
														priceBadgeText = 'DELETED';
														priceTextClass = 'text text-danger';
													// NOT CHECKING FOR CLOSED ANYMORE } else if((moment(Order.dateMemorializationEnds).format() < moment().format() || Order.memorializationCheckedOut === 1) && product.invoiceVet === 0 && product.paymentCompletedPetOwner === 0) {
													} else if(product.invoiceVet === 0 && product.paymentCompletedPetOwner === 0) {
														priceBadgeClass = 'badge badge-info';
														priceBadgeText = 'UNPAID';
														priceTextClass = 'text text-info';

														// Add up the total price and tax that still needs to be paid by the pet owner
														if(product.productCategory === 'Delivery') {
															tempPetOwnerPaymentCostDelivery = tempProductSubtotal;
															tempPetOwnerPaymentTaxDelivery = tempTaxCharged;
														} else {
															tempPetOwnerPaymentCost = Math.add(tempPetOwnerPaymentCost, tempProductSubtotal).toFixed(2);
															tempPetOwnerPaymentTax = Math.add(tempPetOwnerPaymentTax, tempTaxCharged).toFixed(2);
														}
													} else if(product.paymentCompletedPetOwner === 1){
														// Check if this product has been refunded
														if(product.dateRefunded === null) {
															priceBadgeClass = 'badge badge-success';
															priceBadgeText = 'PAID';
															priceTextClass = 'text text-success';
														} else {
															priceBadgeClass = 'badge badge-warning';
															priceBadgeText = 'REFUNDED';
															priceTextClass = 'text text-warning';
														}
													}

													const productName = product.accountProductName !== null && product.accountProductName !== "" ? product.accountProductName : product.productName;
													return (
														<tr key={product.orderProductId} className={`${(product.dateDeleted !== null && 'alert alert-danger') || (product.dateRefunded !== null && 'alert alert-warning')}`}>
															<td><ProductThumbnailLoader product={productImage} size="small" /></td>
															<td>{productName}<br />${product.priceCharged}</td>
															<td>
																{ProductOptions.length > 0 &&
																	ProductOptions.map((option) => {
																		const value = option.valueLabel === 'TEXT' ? option.textString : option.valueLabel;
																		return(
																			<React.Fragment key={option.orderProductProductOptionId}>
																				{
																					(product.dateDeleted !== null || product.dateRefunded !== null) &&
																					<del><span className="text-muted">{option.optionName}: </span>{value}<br /></del>
																				}
																				{
																					product.dateDeleted === null && 
																					product.dateRefunded === null &&
																					<React.Fragment>
																						<span className="text-muted">{option.optionName}: </span>{value}<br />
																					</React.Fragment>
																				}
																			</React.Fragment>
																		)
																	})
																}
																{ProductOptions.length > 0 &&
																	`$${product.priceChargedPersonalization}`
																}
															</td>
															{priceBadgeClass === '' &&
																<td className={priceTextClass}>${tempProductSubtotal}</td>
															}
															{priceBadgeClass !== '' &&
																<td>
																	<div className={priceTextClass}>${tempProductSubtotal}</div>
																	<div className={priceBadgeClass}>{priceBadgeText}</div>
																	{product.paymentCompletedPetOwner === 1 && product.dateRefunded === null && product.dateDeleted == null &&
																		<div><button className="btn btn-info btn-sm btn-addon" onClick={() => setState({orderProductIdRefundOpen: product.orderProductId, refundingReasonError: false, refundingReasonOrderProduct: ''})}><FontAwesomeIcon icon="dollar-sign" /> <Translate id="Refund" /></button></div>
																	}
																</td>
															}

															<td className={priceTextClass}>${tempTaxCharged}</td>

															{/* Start Fullfillment Column */}
															{(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) &&
																<React.Fragment>
																	{/* Only show fulfillment buttons when the pet owner has paid for their items */}
																	<td>
																		{Order.bypassPaymentRequirement === 0 && product.invoiceVet !== 1 && product.paymentCompletedPetOwner !== 1 && product.paymentCompletedAlternative !== 1 && product.payAtPickup !== 1 && product.dateRefunded === null && product.dateDeleted === null &&
																			<React.Fragment>
																				Do NOT fulfill until pet owner pays
																				{/* If the Order was created by a Vet, meaning that the companyId on the Order is not a crematory, AND the currently logged in user is a Crematory user, AND the product here has invoiceVet = 0 and paymentCompletedPetOwner = 0, then allow them to mark the product as invoiceVet */}
																				{
																					Order.companyType === 'Vet' &&
																					(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) &&
																					parseInt(product.invoiceVet) === 0 &&
																					parseInt(product.paymentCompletedPetOwner) === 0 &&
																					<button type="button" className="btn btn-success btn-sm ml-2" onClick={() => handleInvoiceVet(product.orderProductId)}>Invoice Hospital</button>
																				}
																			</React.Fragment>
																		}
																		{product.dateRefunded !== null && product.dateDeleted === null &&
																			<React.Fragment>Do NOT fulfill. Product was refunded.</React.Fragment>
																		}
																		{product.dateRefunded === null && product.dateDeleted !== null &&
																			<React.Fragment>Do NOT fulfill. Product was deleted from order.</React.Fragment>
																		}
																		{(Order.bypassPaymentRequirement === 1 || showPaymentPetOwner === false) && product.dateRefunded === null && product.dateDeleted === null &&
																			<React.Fragment>
																				{/* Visitations need to have a date scheduled, so show a calendar */}
																				{product.statusConfirmedIndicator === 1 && product.statusIsVisitation === 1 &&
																					// <span className="fa-layers fa-fw h1" onClick={() => handleOrderProductStatusUpdate('statusConfirmed', 1, product.orderProductId, productName)}>
																					// 	<FontAwesomeIcon icon="square" color={iconStatusConfirmedBackgroundColor} />
																					// 	<FontAwesomeIcon icon="calendar-alt" color={iconStatusConfirmedColor} transform="shrink-8" />
																					// </span>
																					<div className='custom-control custom-switch mb-2' onChange={() => handleOrderProductStatusUpdate('statusConfirmed', product.statusConfirmed, product.orderProductId, productName)}>
																						<input type='checkbox' className='custom-control-input' id={`statusConfirmed-${product.orderProductId}`} defaultChecked={product.statusConfirmed === 1} />
																						<label className='custom-control-label' htmlFor={`statusConfirmed-${product.orderProductId}`}>
																							<Translate id="Visitation Confirmed" />
																						</label>
																					</div>
																				}
																				{/* Non-Visitation Products that we dont have stock of - show a phone to indicate they need to order it */} {/*  && product.priceChargedPersonalization === null */}
																				{product.statusConfirmedIndicator === 1 && product.statusIsVisitation === 0 && parseInt(product.stockAvailable) === 0 &&
																					// <span className="fa-layers fa-fw h1" onClick={() => handleOrderProductStatusUpdate('statusConfirmed', product.statusPawPrintTaken, product.orderProductId, productName)}>
																					// 	<FontAwesomeIcon icon="circle" color={iconStatusConfirmedBackgroundColor} />
																					// 	<FontAwesomeIcon icon="phone" color={iconStatusConfirmedColor} transform="shrink-8" />
																					// </span>
																					<React.Fragment>
																						<div className='custom-control custom-switch mb-2' onChange={() => handleOrderProductStatusUpdate('statusOrdered', product.statusOrdered, product.orderProductId, productName)}>
																							<input type='checkbox' className='custom-control-input' id={`statusOrdered-${product.orderProductId}`} defaultChecked={product.statusOrdered === 1} />
																							<label className='custom-control-label' htmlFor={`statusOrdered-${product.orderProductId}`}>
																								<Translate id="Product Ordered" />
																							</label>
																						</div>
																						<div className='custom-control custom-switch mb-2' onChange={() => handleOrderProductStatusUpdate('statusConfirmed', product.statusConfirmed, product.orderProductId, productName)}>
																							<input type='checkbox' className='custom-control-input' id={`statusConfirmed-${product.orderProductId}`} defaultChecked={product.statusConfirmed === 1} />
																							<label className='custom-control-label' htmlFor={`statusConfirmed-${product.orderProductId}`}>
																								<Translate id="Product Received / Confirmed" />
																							</label>
																						</div>
																					</React.Fragment>
																					
																				}
																				{/* Non-Visitation Products that we have stock of and need engraving */}
																				{product.statusConfirmedIndicator === 1 && product.statusIsVisitation === 0 && parseInt(product.stockAvailable) > 0 && product.priceChargedPersonalization !== null &&
																					// <span className="fa-layers fa-fw h1" onClick={() => handleOrderProductStatusUpdate('statusConfirmed', product.statusPawPrintTaken, product.orderProductId, productName)}>
																					// 	<FontAwesomeIcon icon="circle" color={iconStatusConfirmedBackgroundColor} />
																					// 	<FontAwesomeIcon icon="pen-alt" color={iconStatusConfirmedColor} transform="shrink-8" />
																					// </span>
																					<div className='custom-control custom-switch mb-2' onChange={() => handleOrderProductStatusUpdate('statusConfirmed', product.statusConfirmed, product.orderProductId, productName)}>
																						<input type='checkbox' className='custom-control-input' id={`statusConfirmed-${product.orderProductId}`} defaultChecked={product.statusConfirmed === 1} />
																						<label className='custom-control-label' htmlFor={`statusConfirmed-${product.orderProductId}`}>
																							<Translate id="In-House Engraving Completed" />
																						</label>
																					</div>
																				}
																				{product.statusIsFurClipping === 1 &&
																					// <span className="fa-layers fa-fw h1" onClick={() => handleOrderProductStatusUpdate('statusFurClippingCompleted', product.statusPawPrintTaken, product.orderProductId, productName)}>
																					// 	<FontAwesomeIcon icon="circle" color={iconFurClippingTakenBackgroundColor} />
																					// 	<FontAwesomeIcon icon="cut" color={iconFurClippingTakenColor} transform="shrink-8" />
																					// </span>
																					<div className='custom-control custom-switch mb-2' onChange={() => handleOrderProductStatusUpdate('statusFurClippingCompleted', product.statusFurClippingCompleted, product.orderProductId, productName)}>
																						<input type='checkbox' className='custom-control-input' id={`statusFurClippingCompleted-${product.orderProductId}`} defaultChecked={product.statusFurClippingCompleted === 1} />
																						<label className='custom-control-label' htmlFor={`statusFurClippingCompleted-${product.orderProductId}`}>
																							<Translate id="Fur Clipping Completed" />
																						</label>
																					</div>
																				}
																				{product.statusIsPawPrint === 1 &&
																					<React.Fragment>
																						{/* <span className="fa-layers fa-fw h1" onClick={() => handleOrderProductStatusUpdate('statusPawPrintTaken', product.statusPawPrintTaken, product.orderProductId, productName)}>
																							<FontAwesomeIcon icon="circle" color={iconPawPrintTakenBackgroundColor} />
																							<FontAwesomeIcon icon="paw" color={iconPawPrintTakenColor} transform="shrink-8" />
																						</span>
																						<span className="fa-layers fa-fw h1" onClick={() => handleOrderProductStatusUpdate('statusPawPrintCompleted', product.statusPawPrintTaken, product.orderProductId, productName)}>
																							<FontAwesomeIcon icon="circle" color={iconPawPrintCompletedBackgroundColor} />
																							<FontAwesomeIcon icon="fire" color={iconPawPrintCompletedColor} transform="shrink-8" />
																						</span> */}
																						<div className='custom-control custom-switch mb-2' onChange={() => handleOrderProductStatusUpdate('statusPawPrintTaken', product.statusPawPrintTaken, product.orderProductId, productName)}>
																							<input type='checkbox' className='custom-control-input' id={`statusPawPrintTaken-${product.orderProductId}`} defaultChecked={product.statusPawPrintTaken === 1} />
																							<label className='custom-control-label' htmlFor={`statusPawPrintTaken-${product.orderProductId}`}>
																								<Translate id="Paw Print Taken" />
																							</label>
																						</div>
																						{
																							product.productName.includes("Ink") === false &&
																							<div className='custom-control custom-switch mb-2' onChange={() => handleOrderProductStatusUpdate('statusPawPrintCompleted', product.statusPawPrintCompleted, product.orderProductId, productName)}>
																								<input type='checkbox' className='custom-control-input' id={`statusPawPrintCompleted-${product.orderProductId}`} defaultChecked={product.statusPawPrintCompleted === 1}/>
																								<label className='custom-control-label' htmlFor={`statusPawPrintCompleted-${product.orderProductId}`}>
																									<Translate id="Paw Print Completed" />
																								</label>
																							</div>
																						}
																						

																					</React.Fragment>
																				}
																				{/* Any product that requires ashes be placed inside of it */}
																				{product.statusRemainsFilledIndicator === 1 &&
																					// <span className="fa-layers fa-fw h1" onClick={() => handleOrderProductStatusUpdate('statusRemainsFilled', product.statusPawPrintTaken, product.orderProductId, productName)}>
																					// 	<FontAwesomeIcon icon="circle" color={iconRemainsFilledBackgroundColor} />
																					// 	<FontAwesomeIcon icon="fire" color={iconRemainsFilledColor} transform="shrink-8" />
																					// </span>
																					<div className='custom-control custom-switch mb-2' onChange={() => handleOrderProductStatusUpdate('statusRemainsFilled', product.statusRemainsFilled, product.orderProductId, productName)}>
																						<input type='checkbox' className='custom-control-input' id={`statusRemainsFilled-${product.orderProductId}`}  defaultChecked={product.statusRemainsFilled === 1}/>
																						<label className='custom-control-label' htmlFor={`statusRemainsFilled-${product.orderProductId}`}>
																							<Translate id="Remains Filled" />
																						</label>
																					</div>
																				}
																				{/* Show the completed and packaged check box */}
																				{product.statusIsBurial === 0 && product.statusIsCremation === 0 && product.statusIsDelivery === 0 &&
																					// <span className="fa-layers fa-fw h1" onClick={() => handleOrderProductStatusUpdate('statusCompletedAndPackaged', product.statusPawPrintTaken, product.orderProductId, productName)}>
																					// 	<FontAwesomeIcon icon="square" color={iconCompletedPackagedBackgroundColor} />
																					// 	<FontAwesomeIcon icon="check" color={iconCompletedPackagedColor} transform="shrink-6" />
																					// </span>
																					<div className='custom-control custom-switch' onChange={() => handleOrderProductStatusUpdate('statusCompletedAndPackaged', product.statusCompletedAndPackaged, product.orderProductId, productName)}>
																						<input type='checkbox' className='custom-control-input' id={`statusCompletedAndPackaged-${product.orderProductId}`}  defaultChecked={product.statusCompletedAndPackaged === 1}/>
																						<label className='custom-control-label' htmlFor={`statusCompletedAndPackaged-${product.orderProductId}`}>
																							<Translate id="Completed and Packaged" />
																						</label>
																					</div>
																				}
																			</React.Fragment>
																		}
																	</td>
																</React.Fragment>
															}
															{(userTypeId !== 1 && userTypeId !== 2 && userTypeId !== 3) &&
																<td></td>
															}
															{/* End Fullfillment Column */}

															{/* Barcode for product */}
															<td>{(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) && parseInt(product.productTypeId) === 3 && product.productCategory !== 'Delivery' && <GeneratePrintButton disableButton={false} jobId={null} orderId={Order.orderId} orderProductId={product.orderProductId} printableName={orderProductStickerName} tooltipGenerateButton="" />}</td>

															{/* For a deleted product, show the deleted reason in the connected columns which were otherwise used for fulfillment and the delete button */}
															{product.dateDeleted !== null &&
																<td colSpan="2"><Translate id="Delete Reason" />:<br /> <span className="text text-danger">{product.deletedReason}</span></td>
															}
															{/* For a refunded product, show the refunded reason in the connected columns which were otherwise used for fulfillment and the delete button */}
															{product.dateRefunded !== null && product.dateDeleted === null &&
																<td colSpan="2"><Translate id="Refund Reason" />:<br /> <span className="text text-warning">{product.refundedReason}</span></td>
															}

															{/* Start Delete Button column */}
															{product.dateRefunded === null && product.dateDeleted === null &&
																<td>
																	{product.statusIsBurial === 0 && product.statusIsCremation === 0 && product.statusIsDelivery === 0 &&
																		<button type="button" disabled={orderHoldDisableInputs || deleteButtonTitle !== ''} className="btn btn-sm btn-danger btn-addon" onClick={() => setState({deletingReasonError: false, deletingReasonOrderProduct: '', orderProductIdDeleteOpen: product.orderProductId, refundAttemptError: ''})} title={deleteButtonTitle}><FontAwesomeIcon icon="trash-alt" /> <Translate id="Delete"/></button>
																	}
																</td>
															}
															{/* End Delete Button column */}
														</tr>
													)
												}
											})}
											{
												enableWalkInItemLine === true &&
												<tr>
													<td className="pt-1 pb-1">&nbsp;</td>
													<td className="pt-1 pb-1">
														<Field className="form-control" name="walkInItemName" value={walkInItemName} onChange={(event) => setState({'walkInItemName': event.target.value})} />
													</td>
													<td className="pt-1 pb-1">&nbsp;</td>
													<td className="pt-1 pb-1">
														<div className="input-group">
															<div className="input-group-prepend">
																<div className="input-group-text">$</div>
															</div>
															<Field className="form-control form-control-num" name="walkInItemPrice" onChange={(event) => handleWalkInItemTax(event.target.value)} />
														</div>
													</td>
													<td className="pt-1 pb-1">
														<select className="form-control" name="walkInItemTax" onChange={(event) => setState({'walkInItemTax': event.target.value})}>
															<option value={walkInItemTaxShown} >Include ${walkInItemTaxShown} Tax</option>
															<option value="0">NO Tax</option>
														</select>
													</td>
													<td className="pt-1 pb-1">
														<button type="button" onClick={() => handleWalkInItemSave()} disabled={values.memorialization === 'home' || orderHoldDisableInputs || walkInItemName === '' || walkInItemPrice === ''} className="btn btn-success btn-sm btn-addon float-left"><FontAwesomeIcon icon="check" /> <Translate id="Save" /></button>
													</td>
													<td className="pt-1 pb-1">&nbsp;</td>
													<td className="pt-1 pb-1">
														<button type="button" onClick={() => setState({enableWalkInItemLine: false, walkInItemName: 'Walk In Item', walkInItemPrice: '', walkInItemTax: '', walkInItemTaxShown: ''})} disabled={values.memorialization === 'home' || orderHoldDisableInputs} className="btn btn-default btn-sm btn-addon float-left"><FontAwesomeIcon icon="times" /> <Translate id="Close" /></button>
													</td>
												</tr>
											}
											<tr>
												<td className="pt-1 pb-1">&nbsp;</td>
												<td className="pt-1 pb-1">&nbsp;</td>
												<td className="pt-1 pb-1">&nbsp;</td>
												{showPaymentPetOwner === false &&
													<React.Fragment>
														<td className="pt-1 pb-1">&nbsp;</td>
														<td className="pt-1 pb-1">&nbsp;</td>
													</React.Fragment>
												}
												{showPaymentPetOwner === true &&
													<React.Fragment>
														<td className="pt-1 pb-1 text-right text-info">Subtotal:</td>
														<td className="pt-1 pb-1 text-info">${tempPetOwnerPaymentCost}</td>
													</React.Fragment>
												}
												<td className="pt-1 pb-1 text-right">Subtotal:</td>
												<td className="pt-1 pb-1">${tempMemorializationCost}</td>
												<td className="pt-1 pb-1">&nbsp;</td>
											</tr>
											<tr>
												<td className="pt-1 pb-1">&nbsp;</td>
												<td className="pt-1 pb-1">&nbsp;</td>
												<td className="pt-1 pb-1">&nbsp;</td>
												{showPaymentPetOwner === false &&
													<React.Fragment>
														<td className="pt-1 pb-1">&nbsp;</td>
														<td className="pt-1 pb-1">&nbsp;</td>
													</React.Fragment>
												}
												{showPaymentPetOwner === true &&
													<React.Fragment>
														<td className="pt-1 pb-1 text-right text-info">Delivery:</td>
														<td className="pt-1 pb-1 text-info">${tempPetOwnerPaymentCostDelivery}</td>
													</React.Fragment>
												}
												<td className="pt-1 pb-1 text-right">Delivery:</td>
												<td className="pt-1 pb-1">${tempMemorializationCostDelivery}</td>
												<td className="pt-1 pb-1">&nbsp;</td>
											</tr>
											<tr>
												<td className="pt-1 pb-1">&nbsp;</td>
												<td className="pt-1 pb-1">&nbsp;</td>
												<td className="pt-1 pb-1">&nbsp;</td>
												{showPaymentPetOwner === false &&
													<React.Fragment>
														<td className="pt-1 pb-1">&nbsp;</td>
														<td className="pt-1 pb-1">&nbsp;</td>
													</React.Fragment>
												}
												{showPaymentPetOwner === true &&
													<React.Fragment>
														<td className="pt-1 pb-1 text-right text-info">Tax:</td>
														<td className="pt-1 pb-1 text-info">${Math.add(tempPetOwnerPaymentTax, tempPetOwnerPaymentTaxDelivery).toFixed(2)}</td>
													</React.Fragment>
												}
												<td className="pt-1 pb-1 text-right">Tax:</td>
												<td className="pt-1 pb-1">${Math.add(tempMemorializationTax, tempMemorializationTaxDelivery).toFixed(2)}</td>
												<td className="pt-1 pb-1">&nbsp;</td>
											</tr>
											<tr>
												{showPaymentPetOwner === false &&
													<React.Fragment>
														<td className="pt-1 pb-1">&nbsp;</td>
														<td className="pt-1 pb-1">&nbsp;</td>
														<td className="pt-1 pb-1">&nbsp;</td>
														<td className="pt-1 pb-1">&nbsp;</td>
														<td className="pt-1 pb-1">&nbsp;</td>
													</React.Fragment>
												}
												{showPaymentPetOwner === true &&
													<React.Fragment>
														<td className="pt-1 pb-1">&nbsp;</td>
														<td className="pt-1 pb-1">&nbsp;</td>
														<td className="pt-1 pb-1">&nbsp;</td>
														<td className="pt-1 pb-1 text-right text-info">Unpaid Total:</td>
														<td className="pt-1 pb-1 text-info">${Math.add(tempPetOwnerPaymentCost, tempPetOwnerPaymentCostDelivery, Math.add(tempPetOwnerPaymentTax, tempPetOwnerPaymentTaxDelivery).toFixed(2)).toFixed(2)}</td>
													</React.Fragment>
												}
												<td className="pt-1 pb-1 text-right">Total:</td>
												<td className="pt-1 pb-1">${Math.add(tempMemorializationCost, tempMemorializationCostDelivery, Math.add(tempMemorializationTax, tempMemorializationTaxDelivery).toFixed(2)).toFixed(2)}</td>
												<td className="pt-1 pb-1">&nbsp;</td>
											</tr>
										</tbody>
									</table>
									{/* orderTypeId 1 is Vet Supply */}
									{
										showPaymentPetOwner === true &&
										parseInt(Order.orderTypeId) !== 1 &&
										<div>
											<h5>Make a Payment</h5>
											<p>{Order.ownerFirstName} {Order.ownerLastName} (Pet: {Order.petFirstName})<br />{Order.ownerPhoneNumber}</p>
											<p className="pt-1 pb-1">
												{paymentFormShow === false && <button type="button" className="btn btn-info btn-sm btn-addon mr-3" disabled={paymentFormShow} onClick={() => setState({paymentFormShow: true})}><FontAwesomeIcon icon="credit-card" /> <Translate id="Pay by Credit Card" /></button>}
												{showPaymentPetOwner === true && Order.paymentAlternativeOffered === 1 && (userTypeId === 1 || userTypeId === 2 || userTypeId === 3) && <React.Fragment>
													{paymentAlternativeShow === false &&<React.Fragment><button type="button" className="btn btn-info btn-sm btn-addon" disabled={paymentAlternativeShow} onClick={() => setState({paymentAlternativeShow: true})}><FontAwesomeIcon icon="dollar-sign" /> <Translate id="Alternative Payment" /></button> <span className="text-muted"><Translate id="Pay by E-Transfer, Cash, or Check" /></span></React.Fragment>}
												</React.Fragment>}
											</p>
											<div>


											</div>
										</div>
									}
									{paymentFormShow &&
										<React.Fragment>
											<div className="row">
												<div className="col-6">
													<h6 className="border-bottom pb-2">Pay by Credit Card <button type="button" className="btn btn-default btn-sm btn-addon float-md-right ml-3 mt-n-2" onClick={() => setState({paymentFormShow: false})}><FontAwesomeIcon icon="times" /> <Translate id="Cancel" /></button></h6>
													<Payment
														Account={Account}
														allowSaveCard={false}
														amount={Math.add(tempPetOwnerPaymentCost, tempPetOwnerPaymentCostDelivery, Math.add(tempPetOwnerPaymentTax, tempPetOwnerPaymentTaxDelivery).toFixed(2)).toFixed(2)}
														description={`Order ${Order.orderId} | Ref: ${Order.petReferenceNumber} | Pet: ${Order.petFirstName}`}
														getPaymentResponse={getPaymentResponse}
														orderId={Order.orderId}
													/>
												</div>
											</div>
										</React.Fragment>
									}
									{/* Only show this row if the paymentAlternativeOffered =1 */}
									{showPaymentPetOwner === true && Order.paymentAlternativeOffered === 1 && (userTypeId === 1 || userTypeId === 2 || userTypeId === 3) &&
										<React.Fragment>
											{paymentAlternativeShow === true &&
												<div className="row">
													<div className="mt-3 col-6">
														<h6 className="border-bottom pb-2">Make Alternative Payment <button type="button" className="btn btn-default btn-sm btn-addon float-md-right ml-3 mt-n-2" onClick={() => setState({paymentAlternativeShow: false})}><FontAwesomeIcon icon="times" /> <Translate id="Cancel" /></button></h6>
														<p className="alert alert-warning pt-1 pb-1"><Translate id="Alternative Payment Warning" /> </p>
														<p className="pt-3 pb-3"><button type="button" className="btn btn-success btn-addon mr-2" onClick={() => handleAlternativePayment('Cash')}><FontAwesomeIcon icon="dollar-sign" /> <Translate id="Cash Payment Completed" /></button></p>
														<p className="pt-3 pb-3"><button type="button" className="btn btn-success btn-addon mr-2" onClick={() => handleAlternativePayment('Check')}><FontAwesomeIcon icon="check" /> <Translate id="Check Payment Completed" /></button></p>
													</div>
												</div>
											}
										</React.Fragment>
									}
								</div>
							</div>
						</div>
					}

					{/* PRINTING */}
					{
						NavClasses.activeClass === 'Printing' &&
						<React.Fragment>
							{(userTypeId === 1 || userTypeId === 2 || userTypeId === 3 || userTypeId === 5) &&
								<div className="mt-3">
									<div className="card w-100 border-secondary">
										<div className="card-header text-secondary border-secondary">
											<h5 className="m-0 mt-1"><FontAwesomeIcon icon="print" /> <Translate id="Packaging &amp; Printing" /></h5>
										</div>
										<div className="card-body">

											<table className="table">
												<thead>
													<tr>
														<th><Translate id="Print" /></th>
														<th><Translate id="Product" /></th>
														<th><Translate id="Status" /></th>
														<th><Translate id="Print" /></th>
														{userTypeId !== 5 && <th><Translate id="Mark as Completed" /></th>}
													</tr>
												</thead>
												<tbody>
													<React.Fragment>
														{Printables.map((printable) => {
															if((userTypeId === 1 || userTypeId === 2 || userTypeId === 3) || (userTypeId === 5 && printable.printableName === 'Order Tag')) {
																// Check for matching printableLog to show if it has been printed - 'find' with get the first match, and the resolver is order by datePrinted desc
																let printableLog = Order.PrintablesLogs.find((printableLog) => printable.printableId === printableLog.printableId);

																// Check if this printable has been marked completed yet. That information is saved into the logOrderActivities db with 'activity' 'Printable marked as completed', and the activityType is 'Printable Completed: X', where X=printableId
																const printableMarkedCompletedLogIndex = Order.LogOrderActivities.findIndex((activity) => parseInt(activity.activityType.substring(0,activity.activityType.indexOf(':'))) === parseInt(printable.printableId) && activity.activity.includes('Printable marked as completed'));
																//const printableMarkedCompletedDateCreated = printableMarkedCompletedLogIndex > -1 ? Order.LogOrderActivities[printableMarkedCompletedLogIndex].dateCreated : null;

																let checkIconColor = "white";
																let squareIconColor = printableMarkedCompletedLogIndex > -1 ? "green" : "lightgray";
																let squareIconTitle = printableMarkedCompletedLogIndex > -1 ? "" : "Click to mark as 'Completed'";
																//let statusCompleted = null;

																// if(printableOrder !== undefined) {
																// 	printableLog = Order.PrintablesLogs.find((log) => printableOrder.printableOrderId === log.printableId);
																//
																// 	checkIconColor = printableOrder.statusCompleted === 1 ? 'lightgreen' : 'white';
																// 	squareIconColor = printableOrder.statusCompleted === 1 ? 'black' : 'lightgray';
																// 	squareIconTitle = printableOrder.statusCompleted === 0 ? "Click to mark as 'Completed'" : '';
																//
																// 	statusCompleted = printableOrder.statusCompleted === 1 ? 0 : 1;
																// }
																// check if this is a printable that gets completed like a certificate of cremation, vs a tag that may get reprinted multiple times

																// show all order printables for cremation orders and product only orders, show just the packing slip for vet supply orders
																if( (printable.printableType === "order" && printable.active === 1 && parseInt(Order.orderTypeId) !== 1) || (printable.printableType === "order" && printable.printableTemplate === "packingSlip" && parseInt(Order.orderTypeId) === 1) ) {
																	// show "order" type Printables here
																	// Commented out for now, currently we are just showing the Generate button for every printable on the account and using the disableGenerateButton as a way to not allow printing ones that cannot be completed yet
																	//const showGenerateButton = printable.printableTemplate === "certificateOfCremation" || printable.printableTemplate === "cremationTag" || printable.printableTemplate === "packingSlip" || printable.printableTemplate === "orderStickers" || printable.printableTemplate === "walkInOrderReceipt"? true : false;
																	const disableGenerateButton = ((printable.printableTemplate === "orderStickers" && Cremation !== null) || (printable.printableTemplate === "certificateOfCremation" && Cremation !== null) || (printable.printableTemplate !== "certificateOfCremation" && printable.printableTemplate !== "orderStickers")) ? false : true;
																	let tooltipGenerateButton = '';
																	if(printable.printableTemplate === "orderStickers" && Cremation === null) {
																		tooltipGenerateButton = 'Cannot create stickers until Cremation is completed';
																	}

																	const printableName = printable.accountPrintableName !== null && printable.accountPrintableName !== '' ? printable.accountPrintableName : printable.printableName;

																	// <input type="checkbox" name={`PrintableId${printable.printableId}`} checked={PrintableIdsChecked.find((item) => parseInt(item) === parseInt(printable.printableId))} onClick={() => handlePrintableSelect(printable.printableId)} />

																	return (
																		<React.Fragment key={printable.printableId}>
																			<tr>
																				<td>
																					<div className="pretty p-default p-pulse">
																						<Field component="input" type="checkbox" name={`PrintableId${printable.printableId}`} checked={printSelectedClicked === false && PrintableIdsChecked.find((item) => parseInt(item) === parseInt(printable.printableId))} onClick={() => handlePrintableSelect(printable.printableId)} className="" />
																						<div className="state p-primary "><label>&nbsp;</label></div>
																					</div>
																				</td>
																				<td>{printableName}</td>
																				<td>
																					{printableLog !== undefined && <span><FontAwesomeIcon icon="circle" className="text-success" /> Printed by {printableLog.firstName} {printableLog.lastName} on {moment(printableLog.datePrinted).format('MMM D, YYYY h:mm A')}</span>}
																					{printableLog === undefined && <span><FontAwesomeIcon icon="circle" className="text-danger" /> <Translate id="NOT PRINTED" /></span>}
																				</td>
																				<td className="pl-0 pr-0">
																					{/*printableOrder !== undefined  && printable.printableTemplate !== "cremationTag" && <a href={printableOrder.File.location} target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm btn-addon"><FontAwesomeIcon icon="print" /> <Translate id="Print"/> </a>*/}
																					{printable.statusQuestionPrompt === 1 && printSelectedQuestionPrompt !== 2 && printableIdsAnswered.findIndex((printIdAnswered) => parseInt(printIdAnswered) === parseInt(printable.printableId)) === -1 && <button type="button" className="btn btn-default btn-sm btn-addon" onClick={() => setState({printableIdQuestionPrompt: printable.printableId})}><FontAwesomeIcon icon="print" /> <Translate id="Print" /></button>}
																					{(printable.statusQuestionPrompt === 0 || printSelectedQuestionPrompt === 2 || printableIdsAnswered.findIndex((printIdAnswered) => parseInt(printIdAnswered) === parseInt(printable.printableId)) > -1)&& <GeneratePrintButton autoPrint={printSelectedClicked === true && PrintableIdsChecked.find((tempChecked) => parseInt(tempChecked) === parseInt(printable.printableId)) ? true : false} disableButton={disableGenerateButton} jobId={null} orderId={Order.orderId} printableId={printable.printableId} printableName={printable.printableName} tooltipGenerateButton={tooltipGenerateButton} />}
																				</td>
																				{
																					userTypeId !== 5 &&
																					<td className="p-1">
																						{printable.statusCompletedIndicator === 1 && printableLog !== undefined && printableMarkedCompletedLogIndex === -1 &&
																							<span className="fa-layers fa-fw h1 m-0 mt-2" title={squareIconTitle} onClick={() => LogOrderActivitySave({ input: {activity: `Printable marked as completed: ${printableName}`, activityType: `${printable.printableId}: Printable Completed`, dbField: 'statusCompleted', dbTable: 'printables', orderId: Order.orderId, showVet: 0, valueNew: 1, valueOld: 0 }})}>
																								<FontAwesomeIcon icon="square" color={squareIconColor} />
																								<FontAwesomeIcon icon="check" color={checkIconColor} transform="shrink-6" />
																							</span>
																						}
																						{printableMarkedCompletedLogIndex > -1 &&
																							<React.Fragment>
																								<span className="fa-layers fa-fw h1 m-0 mt-2" title={squareIconTitle}>
																									<FontAwesomeIcon icon="square" color={squareIconColor} />
																									<FontAwesomeIcon icon="check" color={checkIconColor} transform="shrink-6" />
																								</span>
																								{/*moment(printableMarkedCompletedDateCreated).format('MMM D, YYYY h:mm A')*/}
																							</React.Fragment>

																						}
																					</td>
																				}
																			</tr>
																			{/* If this printable was clicked, and there is a prompt required, show it */}
																			{printableIdQuestionPrompt === printable.printableId && printableIdsAnswered.findIndex((printIdAnswered) => parseInt(printIdAnswered) === parseInt(printable.printableId)) === -1 &&
																				<PrintableQuestionPromptContainer
																					initialValues={{answer: ''}}
																					Order={Order}
																					OrderStatuses={OrderStatuses}
																					printableId={printable.printableId}
																					printableName={printable.printableName}
																					randomNumber={randomNumber}
																					Species={Species}
																					updatePrintableIdsAnswered={(printableId) => updatePrintableIdsAnswered(printableId)}
																				/>
																			}
																		</React.Fragment>
																	);
																} else {
																	return null;
																}
															} else {
																return null
															}
														})}
														{printSelectedQuestionPrompt === 1 &&
															<PrintableQuestionPromptContainer
																handleSetPrintSelectedQuestionPrompt={(value)=>setState({printSelectedQuestionPrompt: value})}
																initialValues={{answer: ''}}
																Order={Order}
																OrderStatuses={OrderStatuses}
																printableId={printableIdQuestionPrompt}
																printSelectedQuestionPrompt={printSelectedQuestionPrompt}
																randomNumber={randomNumber}
																Species={Species}
																updatePrintableIdsAnswered={(printableId) => updatePrintableIdsAnswered(printableId)}
															/>
														}
													</React.Fragment>
												</tbody>
											</table>
											<div className="row">
												<div className="col-auto">
													<button type="button" className="btn btn-dark btn-sm btn-addon ml-2" disabled={PrintableIdsChecked.length === 0 || printSelectedQuestionPrompt === 1} onClick={() => setState({printSelectedClicked: true})}><FontAwesomeIcon icon="print" /> <Translate id="Print Selected" /></button>
												</div>
												{
													printSelectedQuestionPrompt === 1 &&
													<div className="col-auto ml-3">
														<div className="alert alert-warning">Answer the question prompt above before printing</div>
													</div>
												}
											</div>

										</div>
									</div>
								</div>
							}
						</React.Fragment>
					}{/* END PRINTING */}

					{/* ORDER'S COMMENTS SECTION */}
					{		
						NavClasses.activeClass === 'Comments' &&
						<div className="mt-3">
							<div className="card w-100 border-secondary">
								<div className="card-header text-secondary border-secondary">
									<h5 className="m-0">
										{userTypeId !== 5 && <FontAwesomeIcon icon="phone"/>}
										<span className="fa-layers fa-fw ml-1 mr-1">
											<FontAwesomeIcon icon="comment" />
											<FontAwesomeIcon icon="plus" inverse transform="shrink-8" />
										</span>
										{(userTypeId !== 5 && <Translate id="Calls, Comments, and Messages" />) || <Translate id="Comments" />}
									</h5>
								</div>
								<div className="card-body">
									{
										specialInstructions !== '' && specialInstructions !== null &&
										<div className="row mb-3">
											<div className="col-12">
												<div className="alert alert-warning mb-0">
													<h6 className="mb-0">Special Instrutions:</h6>
													{specialInstructions}
												</div>
											</div>
										</div>
									}
									<div className="mb-5">
										{
											showMakeCustomerCall === true &&
											<div className="card border-secondary mt-2">
												<div className="card-header border-secondary">
													<div className="row">
														<div className="col-auto"><span>Call {Order.ownerFirstName} {Order.ownerLastName} (Pet: {Order.petFirstName})</span></div>
														<div className="col">
															<div className="float-right">
																{	
																	customerCallStatus === 'Active' &&
																	<React.Fragment>
																		<span className="mr-2" style={{maxWidth: 100+'px'}}>
																			<ReactStopwatch seconds={0} minutes={0} hours={0} onChange={({ hours, minutes, seconds }) => {}}
																				render={({ formatted, hours, minutes, seconds }) => {
																				return (<span>{ formatted }</span>);
																				}}
																			/>
																		</span>
																	</React.Fragment>
																}
																{
																	customerCallStatus === 'Ready' &&
																	<button type="button" className={`btn btn-sm btn-success float-right`} onClick={() => handleCustomerCall('start')}><FontAwesomeIcon icon="phone" className="mr-1" /> Start Call</button>
																}
															</div>
														</div>
   													</div>
												</div>
												<div className="card-body">
													<div>1. Say Hello</div>
													<div>2. Ask them to buy another paw print</div>
													<div>3. Get off of the phone</div>
													{
														customerCallStatus === 'Active' &&
														<CustomerCallContainer
															handleCustomerCall={(action, comment) => handleCustomerCall(action, comment)}
														/>
													}
														
													{customerCallStatus === 'Ready' && <button type="button" style={{boxShadow: 'none'}} className={`mt-3 btn border-secondary btn-sm btn-addon btn-light`} onClick={() => handleGenericSetState('showMakeCustomerCall', !showMakeCustomerCall)}><FontAwesomeIcon icon="times" className="mr-1" /> Cancel Call</button>}
													{customerCallStatus === 'Summary' &&
														<React.Fragment>
															<div className="mb-2">
																<div className="text-center"><Translate id="Notes From Call" /></div>
																<Field name="customerCallNotes" value={customerCallNotes} component="textarea" onChange={(event) => handleGenericSetState('customerCallNotes', event.target.value)} style={{minHeight: 75+'px'}} className={`form-control`} />
															</div>
															<div className="text-center mb-2">
																<div><Translate id="Mark This Call's Message As"/></div>
																<div className="btn-group btn-warning col-auto p-0" role="group">
																	<button type="button" style={{boxShadow: 'none'}} className={`btn rounded-left ${(customerCallOrderCommentStatus === 'unread' && 'btn-danger text-white') || 'border-secondary btn-light text-secondary'}`} onClick={() => handleGenericSetState('customerCallOrderCommentStatus', 'unread')}>
																		<FontAwesomeIcon icon={`${(customerCallOrderCommentStatus === 'unread' && 'eye-slash') || 'eye'}`} color={`${(customerCallOrderCommentStatus === 'unread' && 'white') || 'lightgray'}`} className="mr-2" />Unread</button>
																	<button type="button" style={{boxShadow: 'none'}} className={`btn ${(customerCallOrderCommentStatus === 'requires_attention' && 'btn-warning text-white') || 'border-secondary btn-light text-secondary'}`} onClick={() => handleGenericSetState('customerCallOrderCommentStatus', 'requires_attention')}>
																		<FontAwesomeIcon icon="exclamation-triangle" color="lightgray" className={`mr-2 ${customerCallOrderCommentStatus === 'requires_attention' && 'text text-white'}`} />Requires Attention</button>
																	<button type="button" style={{boxShadow: 'none'}} className={`btn rounded-right ${(customerCallOrderCommentStatus === 'completed' && 'btn-success text-white') || 'border-secondary btn-light text-secondary'}`} onClick={() => handleGenericSetState('customerCallOrderCommentStatus', 'completed')}>
																		<FontAwesomeIcon icon="check" color="lightgray" className={`mr-2 ${customerCallOrderCommentStatus === 'completed' && 'text text-white'}`}/>Completed</button>
																</div>
															</div>
															<div className="text-center"><button type="button" style={{boxShadow: 'none'}} className={`mt-2 btn text-white btn-sm btn-addon btn-success`} onClick={() => handleCustomerCall('summaryCompleted')}><FontAwesomeIcon icon="check" className="mr-1" /> Summary Completed - Close This Call</button></div>
														</React.Fragment>
													}												
												</div>
											</div>
										}
										{	
											showMakeCustomerCall === false &&
											<div className="row">
												{/* <div className="custom-control custom-switch">
													<input type="checkbox" className="custom-control-input" id="customSwitch1" />
													<label className="custom-control-label" for="customSwitch1">Toggle this switch element</label>
												</div> */}
												<div className="col-12 mb-2">
													{(userTypeId !== 5 && <Translate id="Description of Call, Comment, or Message" />) || <Translate id="Comments" />}
													<Field name="orderComment" disabled={orderHoldDisableInputs} component="textarea" style={{minHeight: 125+'px'}} showError={true} className={`form-control ${errors.orderComment && touched.orderComment && 'is-invalid'}`} />
												</div>
												{
													(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) &&
													<React.Fragment>
														<div className="col-auto">
															<div className="pt-4">
																<button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(showMakeCustomerCall === 'true' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('showMakeCustomerCall', !showMakeCustomerCall)}><FontAwesomeIcon icon="phone" className="mr-1" /> Call</button>
															</div>
														</div>
														<div className="col-auto ml-2">
															<div><Translate id="Message Type"/> *</div>
															<div className="btn-group col-auto p-0" role="group">
																<button type="button" style={{boxShadow: 'none'}} className={`btn rounded-left border-secondary ${(orderCommentType === 'Call' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('orderCommentType', 'Call')}>Call</button>
																<button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(orderCommentType === 'Comment' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('orderCommentType', 'Comment')}>Comment</button>
																<button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(orderCommentType === 'Text' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('orderCommentType', 'Text')}>Text</button>
																<button type="button" style={{boxShadow: 'none'}} className={`btn rounded-right border-secondary ${(orderCommentType === 'Voicemail' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('orderCommentType', 'Voicemail')}>Voicemail</button>
															</div>
														</div>
														<div className="col-auto ml-2">
															<div><Translate id="Message From"/> *</div>
															<div className="btn-group btn-warning col-auto p-0" role="group">
																<button type="button" style={{boxShadow: 'none'}} className={`btn rounded-left border-secondary ${(orderCommentMadeBy === 'Clinic' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('orderCommentMadeBy', 'Clinic')}>Clinic</button>
																<button type="button" style={{boxShadow: 'none'}} className={`btn border-secondary ${(orderCommentMadeBy === 'Crematory' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('orderCommentMadeBy', 'Crematory')}>Crematory</button>
																<button type="button" style={{boxShadow: 'none'}} className={`btn rounded-right border-secondary ${(orderCommentMadeBy === 'Owner' && 'btn-secondary') || 'btn-light text-secondary'}`} onClick={() => handleGenericSetState('orderCommentMadeBy', 'Owner')}>Owner</button>
															</div>
														</div>
														<div className="col-auto">									
															<div><Translate id="Crematory Only"/> *</div>
															<label className="switch mt-1">
																<input type="checkbox" className="bg-danger form-control" name="orderCommentInternal" checked={orderCommentInternal === 1} disabled={orderHoldDisableInputs} onChange={() => handleGenericSetState('orderCommentInternal')} />
																<span className="slider round"></span>
																<span className="absolute-no">NO</span>
															</label>	
														</div>
													</React.Fragment>
												}
												<div className="col">	
													<div className={`${(userTypeId === 5 && 'float-left') || 'float-right'}  pt-4`}>								
														<button type="button" onClick={() => handleCommentSave()} className="btn btn-success btn-addon" disabled={isSubmitting || dirty === false || orderHoldDisableInputs === true}>
															<FontAwesomeIcon icon="check" /> <Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
														</button>
														{requireInitialsEditOrderDetails === 1 &&
															<div className="ml-3">
																<Field name="userInitialsOrderDetails" placeholder={`${props.translate('Initials')}*`} disabled={orderHoldDisableInputs} showError={true} className={`form-control form-control-num ${errors.userInitialsOrderDetails && touched.userInitialsOrderDetails && 'is-invalid'}`} />
															</div>
														}
													</div>
												</div>
											</div>
										}
									</div>
									{initialValues.OrderComments.length > 0 &&
										initialValues.OrderComments.map((comment) => {
											const eyeIcon = comment.orderCommentStatus === 'unread' ? 'eye-slash' : 'eye';
											const eyeIconColor = comment.orderCommentStatus ==='unread' ? 'red' : 'lightgray';
											const eyeIconTitle = comment.orderCommentStatus !=='unread' ? "Click to mark as 'Unread - Hold Cremation'" : '';
											const triangleIconClass = comment.orderCommentStatus ==='requires_attention' ? 'text text-warning' : '';
											const triangleIconTitle = comment.orderCommentStatus !=='requires_attention' ? "Click to mark as 'Requires Attention - OK to Cremate'" : '';
											const checkIconColor = comment.orderCommentStatus === 'completed' ? 'lightgreen' : 'white';
											const squareIconColor = comment.orderCommentStatus === 'completed' ? 'black' : 'lightgray';
											const squareIconTitle = comment.orderCommentStatus !== 'completed' ? "Click to mark as 'Completed - OK to Cremate'" : '';

											// Do Not display any Follow-up Calls that do not have a dateEnd, that is a call that our user is currently on
											if(comment.orderCommentType !== 'Follow-up Call' ||(comment.orderCommentType === 'Follow-up Call' && comment.orderCommentId !== customerCallOrderCommentId)) {
												return (
													<blockquote className="mt-2 pb-1 border-bottom blockquote clearfix" key={comment.orderCommentId}>
														{/* Icon buttons for Unread - Hold Cremation, Requires Attention - OK to Cremate, and Completed - OK to Cremate */}
														{(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) &&
															<span className="float-right">
																{/* Red if the comment is Unread */}
																<span className="h1" onClick={() => OrderCommentSave({input: {orderCommentId: comment.orderCommentId, orderCommentStatus: 'unread'}})}>
																	<FontAwesomeIcon icon={eyeIcon} color={eyeIconColor} title={eyeIconTitle} />
																</span>
																{/* Orange if Requires Attention */}
																<span className="h1" onClick={() => OrderCommentSave({input: {orderCommentId: comment.orderCommentId, orderCommentStatus: 'requires_attention'}})}>
																	<FontAwesomeIcon icon="exclamation-triangle" color="lightgray" className={triangleIconClass} title={triangleIconTitle} />
																</span>
																<span className="fa-layers fa-fw h1 mb-0" title={squareIconTitle} onClick={() => OrderCommentSave({input: {orderCommentId: comment.orderCommentId, orderCommentStatus: 'completed'}})}>
																	<FontAwesomeIcon icon="square" color={squareIconColor} />
																	<FontAwesomeIcon icon="check" color={checkIconColor} transform="shrink-6" />
																</span>
															</span>
														}
														<p className="mb-0 small">{comment.orderComment}</p>
														<footer className="blockquote-footer">
															{comment.firstName} {comment.lastName} at {comment.companyName} : {moment(comment.dateCreated).format('MMM D, YYYY h:mm A')}
															<div className="ml-4"><span className={`badge badge-pill badge-${(comment.orderCommentType === 'Follow-up Call' && 'info') || 'secondary'}`}>{comment.orderCommentType}</span>{comment.orderCommentType !== 'Follow-up Call' && <span className="ml-2 badge badge-pill badge-secondary">{comment.orderCommentMadeBy}</span>}{comment.orderCommentInternal === 1 && <span className="ml-2 badge badge-pill badge-success">Internal Only</span>}</div>
														</footer>
													</blockquote>
												)
											}
										})
									}
								</div>
							</div>
						</div>
					}{/* END ORDER'S COMMENTS SECTION */}


					{/* ORDER STATUS DETAILS & OTHER META DATA */}
					{
						NavClasses.activeClass === 'Details' &&
						<React.Fragment>
							{(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) &&
								<div className="mt-3">
									<div className="card w-100 border-secondary">
										<div className="card-header text-secondary border-secondary">
											<h5 className="m-0"><FontAwesomeIcon icon="info-circle" /> <Translate id="Order Information" /></h5>
										</div>
										<div className="card-body">
											<div className="row border-bottom mb-3 pb-3">
												<div className="col-md-4 border-right">
													<h5><Translate id="Order Status" /></h5>
													<div className="form-inline">
														<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="orderStatusId" className="form-control">
															{OrderStatuses.map((status) => {
																return <option value={status.orderStatusId} key={status.orderStatusId}>{status.orderStatus}</option>
															})}
														</Field>
													</div>
												</div>
												<div className="col-md-4 border-right">
													<h5><Translate id="Special Labels" /></h5>
													<div className="pretty p-default p-pulse">
														<Field name="staffEmployeePet" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} component="input" type="checkbox" checked={values.staffEmployeePet === true || values.staffEmployeePet === 1} className="" />
														<div className="state p-primary "><label>{props.translate('Staff / Employee Pet')}</label></div>
													</div>
													<div className="pretty p-default p-pulse">
														<Field name="familyFriendPet" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} component="input" type="checkbox" checked={values.familyFriendPet === true || values.familyFriendPet === 1} className="" />
														<div className="state p-primary "><label>{props.translate('Family / Friend Pet')}</label></div>
													</div>
													<div className="pretty p-default p-pulse">
														<Field name="servicePet" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} component="input" type="checkbox" checked={values.servicePet === true || values.servicePet === 1} className="" />
														<div className="state p-primary "><label>{props.translate('Service Pet')}</label></div>
													</div>
												</div>
												<div className="col-md-4">
													<h5><Translate id="Pay-at-Pickup Balance" /></h5>
													<p><Translate id="Balance Due" />: ${payAtPickupDue.toFixed(2)}</p>
												</div>
											</div>
											<div className="row border-bottom mb-3 pb-3">
												<div className="col-md-4 border-right">
													<h5><Translate id="Tracking Disk" /></h5>
													<p><Field name="trackingDisk" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} showError={true} className={`form-control ${errors.trackingDisk && touched.trackingDisk && 'is-invalid'}`} /></p>
													<h5><Translate id="Hardware Found" /></h5>
													<Field component="textarea" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="hardwareFound" className="form-control mr-2" />
												</div>
												<div className="col-md-4 border-right">
													<RelatedFilesContainer
														orderId={Order.orderId}
													/>
												</div>
												<div className="col-md-4">
													<h5><Translate id="Hospital Options" /></h5>
													{(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) &&
														<div className="row">
															<div className="col-md">
																<Translate id="Pay by E-Transfer, Cash, or Check"/>
																<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="paymentAlternativeOffered" className={`form-control ${errors.paymentAlternativeOffered && touched.paymentAlternativeOffered && 'is-invalid'}`}>
																	<option value="1">{props.translate('Yes')}</option>
																	<option value="0">{props.translate('No')}</option>
																</Field>
															</div>
														</div>
													}
													<div className="row">
														{/*<div className="col-md">
															<Translate id="Payment Terms"/>
															<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="paymentTerms" className={`form-control ${errors.paymentTerms && touched.paymentTerms && 'is-invalid'}`}>
																<option value="">{props.translate('Select Payment Terms')}</option>
																<option value="net_15">{props.translate('Net 15')}</option>
																<option value="net_30">{props.translate('Net 30')}</option>
															</Field>
														</div>*/}
														<div className="col-md">
															<Translate id="Pay by Credit Card"/>
															<Field component="select" showError={true} disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="payByCreditCardOffered" className={`form-control ${errors.payByCreditCardOffered && 'is-invalid'}`}>
																<option value="1">{props.translate('Yes')}</option>
																<option value="0">{props.translate('No')}</option>
															</Field>
														</div>
														{/* <div className="col-md">
															<Translate id="Pay Vet Order by CC"/>
															<Field component="select" showError={true} disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="payVetOrderByCreditCardOffered" className={`form-control ${errors.payVetOrderByCreditCardOffered && 'is-invalid'}`}>
																<option value="1">{props.translate('Yes')}</option>
																<option value="0">{props.translate('No')}</option>
															</Field>
														</div> */}
														<div className="col-md">
															<Translate id="Pay at Pickup"/>
															<Field component="select" showError={true} disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="payAtPickupOffered" className={`form-control ${errors.payAtPickupOffered && 'is-invalid'}`}>
																<option value="1">{props.translate('Yes')}</option>
																<option value="0">{props.translate('No')}</option>
															</Field>
														</div>

													</div>
													<div className="row">
														<div className="col-md">
															<Translate id="Pickup at Crematory"/>
															<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="crematoryPickupOffered" className={`form-control ${errors.crematoryPickupOffered && 'is-invalid'}`}>
																<option value="1">{props.translate('Yes')}</option>
																<option value="0">{props.translate('No')}</option>
															</Field>
														</div>
														<div className="col-md">
															<Translate id="Courier Delivery"/>
															<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="courierDeliveryOffered" className={`form-control ${errors.courierDeliveryOffered && 'is-invalid'}`}>
																<option value="1">{props.translate('Yes')}</option>
																<option value="0">{props.translate('No')}</option>
															</Field>
														</div>
													</div>
													<div className="row">
														<div className="col-md">
															<Translate id="Hospital Delivery"/>
															<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="hospitalDeliveryOffered" className={`form-control ${errors.hospitalDeliveryOffered && 'is-invalid'}`}>
																<option value="1">{props.translate('Yes')}</option>
																<option value="0">{props.translate('No')}</option>
															</Field>
														</div>
														<div className="col-md">
															<Translate id="Offer private cremations?"/>
															<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="cremationTypesOffered" className={`form-control ${errors.cremationTypesOffered && touched.cremationTypesOffered && 'is-invalid'}`}>
																<option value="individual_and_private">{props.translate('Offer Individual, Offer Private as an Upgrade')}</option>
																<option value="individual_only">{props.translate('Offer Individual, NO Private')}</option>
																<option value="private_only">{props.translate('Offer Private, NO Individual')}</option>
															</Field>
														</div>
													</div>
													<div className="row">
														<div className="col-md">
															<Translate id="Allow paw prints for communal cremations?"/>
															<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="communalPawPrintAllowed" className={`form-control ${errors.communalPawPrintAllowed && touched.communalPawPrintAllowed && 'is-invalid'}`}>
																<option value="no">{props.translate('No')}</option>
																<option value="clinic_only">{props.translate('In Clinic Only')}</option>
																<option value="home_and_clinic">{props.translate('At Home and In Clinic')}</option>
															</Field>
														</div>
													</div>
													<div className="row">
														<div className="col-md">
															<Translate id="Home Memorialization Edit Cremation"/>
															<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="homeMemorializationsEditCremation" className={`form-control ${errors.homeMemorializationsEditCremation && touched.homeMemorializationsEditCremation && 'is-invalid'}`}>
																<option value={0}>{props.translate("No")}</option>
																<option value={1}>{props.translate("Yes")}</option>
															</Field>
														</div>
													</div>
													<div className="row">
														<div className="col-md">
															<Translate id="Expedited Cremation Allowed" />
															<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="expeditedCremationAllowed" className={`form-control ${errors.expeditedCremationAllowed && touched.expeditedCremationAllowed && 'is-invalid'}`}>
																<option value={0}>{props.translate("No")}</option>
																<option value={1}>{props.translate("Yes")}</option>
															</Field>
														</div>
														<div className="col-md">
															<Translate id="Visitation Allowed" />
															<Field component="select" disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} name="visitationAllowed" className={`form-control ${errors.visitationAllowed && touched.visitationAllowed && 'is-invalid'}`}>
																<option value={0}>{props.translate("No")}</option>
																<option value={1}>{props.translate("Yes")}</option>
															</Field>
														</div>
													</div>
												</div>
											</div>
											{/* Buttons */}
											<div className="mt-3">
												<div className="float-left">
													{enableEditingOrderInformation === false &&
														<button type="button" disabled={orderHoldDisableInputs} onClick={() => setState({enableEditingOrderInformation: true, orderInformationMessage: '', orderInformationMessageAlertStatus: ''})} className="btn btn-info btn-addon mr-3"><Translate id="Enable Editing" /></button>
													}
													{enableEditingOrderInformation === true &&
														<React.Fragment>
															<button type="button" onClick={() => handleHospitalOptionsSave()} className="btn btn-success btn-addon mr-3" disabled={isSubmitting || dirty === false || orderHoldDisableInputs === true}>
																<FontAwesomeIcon icon="check" /> <Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
															</button>
															<button type="button" onClick={() => setState({enableEditingOrderInformation: false, orderInformationMessage: '', orderInformationMessageAlertStatus: ''})} className="btn btn-info btn-addon mr-3"><Translate id="Disable Editing" /></button>
														</React.Fragment>
													}
												</div>
												{orderHoldDisableInputs === false && enableEditingOrderInformation === true && requireInitialsEditOrderDetails === 1 &&
													<div className="float-left">
														<Field name="userInitialsOrderInformation" placeholder={`${props.translate('Initials')}*`} disabled={orderHoldDisableInputs || enableEditingOrderInformation === false} showError={true} className={`form-control ${errors.userInitialsOrderInformation && touched.userInitialsOrderInformation && 'is-invalid'}`} />
													</div>
												}
												{orderInformationMessage !== '' &&
													<div className={`float-left alert alert-${orderInformationMessageAlertStatus} mb-0 ml-3`}>{props.translate(orderInformationMessage)}</div>
												}
											</div>
										</div>
									</div>
								</div>
							}
						</React.Fragment>
					}{/* END ORDER STATUS */}

					{/* VET CHARGES FOR INVOICING */}
					{
						NavClasses.activeClass === 'VetCharges' &&
						<React.Fragment>
							{(userTypeId === 1 || userTypeId === 2 || userTypeId === 3) &&
								<div className="mt-3">
									<div className="card w-100 border-secondary">
										<div className="card-header text-secondary border-secondary">
											<h5 className="m-0">
												<FontAwesomeIcon icon="user-md" /> <Translate id="Veterinary Charges" />
												{Order.ItemsInvoice.findIndex((item) => parseInt(item.invoiceId) > 0) === -1 && <button type="button" className="btn btn-info btn-sm btn-addon float-right" disabled={addAdjustmentFormShow === true} onClick={() => setState({addAdjustmentFormShow: true})}><FontAwesomeIcon icon="plus" /> <Translate id="Add an Adjustment"/> </button>}
											</h5>
										</div>
										{/* Also check that there are invoiceItems which have an invoiceId. When this order has not been invoiced, adjustments can still be added without an invoiceId */}
										{Order.ItemsInvoice.length > 0 && Order.ItemsInvoice.findIndex((item) => parseInt(item.invoiceId) > 0) > -1 &&
											<div className="mt-2">
												<InvoiceDetails
													orderDetailsParent={true}
													orderId={Order.orderId}
												/>
											</div>
										}
										{addAdjustmentFormShow === true &&
											<div className="border p-3">
												<div className="form-row">
													<div className="col-md-6">
													<label htmlFor="invoiceItemDescription"><Translate id="Adjustment Description for Crematory Use" /></label><br />
														<Field className="form-control" name="invoiceItemDescription" onChange={(event) => setState({'invoiceItemDescription': event.target.value})} aria-describedby="invoiceItemDescriptionHelp" />
														<small className="form-text text-muted" id="invoiceItemDescriptionHelp"><Translate id="Will appear on the Invoice" /></small>
													</div>
													<div className="col-md-6">
														<label htmlFor="invoiceItemDescriptionPrivate"><Translate id="Adjustment Description for Crematory Use (Private)" /></label><br />
														<Field className="form-control" name="invoiceItemDescriptionPrivate" onChange={(event) => setState({'invoiceItemDescriptionPrivate': event.target.value})} aria-describedby="invoiceItemDescriptionPrivateHelp" />
														<small className="form-text text-muted" id="invoiceItemDescriptionPrivateHelp"><Translate id="Will NOT appear on the Invoice" /></small>
													</div>
												</div>
												<div className="form-row">
													<div className="col-md-auto">
														<label htmlFor="invoiceItemType"><Translate id="Adjustment Type" /></label>
														<Field component="select" showError={true} name="invoiceItemType" className="form-control" onChange={(event) => setState({'invoiceItemType': event.target.value})} >
															<option value="Adjustment">{props.translate("Adjustment")}</option>
															<option value="Charity">{props.translate("Charity")}</option>
															<option value="Commission">{props.translate("Commission")}</option>
															<option value="Cremation">{props.translate("Cremation")}</option>
															<option value="Purchase">{props.translate("Purchase")}</option>
														</Field>
													</div>
													<div className="col-md-auto">
														<label htmlFor="invoiceCostSubtotal">Subtotal</label>
														<div className="input-group">
															<div className="input-group-prepend">
																<div className="input-group-text">$</div>
															</div>
															<Field className="form-control form-control-num" name="invoiceCostSubtotal" onChange={(event) => handleAddAdjustmentOnChange('invoiceCostSubtotal', event.target.value)} />
														</div>
														<small className="form-text text-muted" id="invoiceCostSubtotalHelp">Can be negative</small>
													</div>
													<div className="col-md-auto">
														<label htmlFor="adjustmentAddTax">Tax</label>
														<select className="form-control" name="adjustmentAddTax" onChange={(event) => handleAddAdjustmentOnChange('adjustmentAddTax', event.target.value)}>
															<option value={1} >Include ${taxDue} Tax</option>
															<option value={0}>NO Tax</option>
														</select>
													</div>
												</div>
												<div className="mt-3">
													{/* invoiceCostTotal =  invoiceCostSubtotal + taxDue */}
													<h6>Item Total: ${invoiceCostTotal}</h6>
													<button type="button" className="btn btn-success btn-sm btn-addon" onClick={() => handleInvoiceItemAdjustmentSave()} disabled={parseInt(invoiceCostSubtotal) === 0 || invoiceCostSubtotal === '' || invoiceItemDescription === ''}><FontAwesomeIcon icon="check" /> <Translate id="Save"/> </button>
													<button type="button" className="btn btn-default btn-sm btn-addon ml-3" onClick={() => handleInvoiceAdjustmentCancel()}><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/> </button>
												</div>
											</div>
										}

										{/* Also check that there are invoiceItems which do not have an invoiceId. When this order has not been invoiced, adjustments can still be added without an invoiceId */}
										{
											Order.ItemsInvoice.findIndex((item) => parseInt(item.invoiceId) > 0) === -1 &&
											<div className="card-body">
												<table className="table">
													<thead>
														<tr>
															<th></th>
															<th><Translate id="Description" /></th>
															<th><Translate id="Subtotal" /></th>
															<th><Translate id="Tax" /></th>
															<th><Translate id="Total" /></th>
															<th></th>
														</tr>
													</thead>
													<tbody>
														{ReorderedProducts.map((product) => {

															// Do not include products that have been refunded or that have been deleted
															if(product.dateDeleted === null && product.dateRefunded === null) {
																const tempInvoiceCharged = product.invoiceCostCharged === null ? '0.00' : product.invoiceCostCharged;
																const tempInvoiceChargedPersonalization = product.invoiceCostChargedPersonalization === null ? '0.00' : product.invoiceCostChargedPersonalization;
																const tempInvoiceSubtotal = Math.add(tempInvoiceCharged, tempInvoiceChargedPersonalization).toFixed(2);
																const tempTaxChargedInvoice = product.taxChargedInvoice === null ? '0.00' : product.taxChargedInvoice;
																const tempInvoiceTotal = Math.add(tempInvoiceSubtotal,tempTaxChargedInvoice).toFixed(2);
																// console.log("tempInvoiceCharged: ", tempInvoiceCharged, " tempInvoiceSubtotal: ", tempInvoiceSubtotal, " tempTaxChargedInvoice: ", tempTaxChargedInvoice, " tempInvoiceTotal: ", tempInvoiceTotal)
																const tempPriceCharged = product.priceCharged === null ? '0.00' : product.priceCharged;
																const tempPriceChargedPersonalization = product.priceChargedPersonalization === null ? '0.00' : product.priceChargedPersonalization;
																const tempProductSubtotal = Math.add(tempPriceCharged, tempPriceChargedPersonalization).toFixed(2);
																const tempTaxCharged = product.taxCharged === null ? '0.00' : product.taxCharged;
																const tempPriceTotal = Math.add(tempProductSubtotal,tempTaxCharged).toFixed(2);
																// console.log("tempPriceCharged: ", tempPriceCharged, " tempProductSubtotal: ", tempProductSubtotal, " tempTaxCharged: ", tempTaxCharged, " tempPriceTotal: ", tempPriceTotal)
																// amount that is the difference between the tempPriceTotal and the total invoice costs + invoice tax for this product. It is only used for products where the vet will be credited
																if(product.invoiceVet === 1) {
																	tempVetChargesCost = Math.add(tempVetChargesCost, tempInvoiceSubtotal).toFixed(2);
																	tempVetChargesTax =  Math.add(tempVetChargesTax, tempTaxChargedInvoice).toFixed(2);
																} else {
																	if(product.paymentCompletedVetOrder === 0) {
																		// Determine the difference between the price and the invoice for the subtotal and tax so we can subtract that from the running totals
																		const differenceSubtotal = Math.subtract(tempProductSubtotal,tempInvoiceSubtotal).toFixed(2);
																		const differenceTax = Math.subtract(tempTaxCharged,tempTaxChargedInvoice).toFixed(2);
																		tempVetChargesCost = Math.subtract(tempVetChargesCost, differenceSubtotal).toFixed(2);
																		tempVetChargesTax =  Math.subtract(tempVetChargesTax, differenceTax).toFixed(2);
																	}
																	// This is new functionality 11/25/20 - Barrett
																	// If paymentCompletedVetOrder = 1, then the Vet has completed payment for the Pet Owner and they will not be invoiced.
																	else if(product.paymentCompletedVetOrder === 1) {
																		// Do nothing, we don't need to add this product's cost to the invoice amount since it is already paid for.
																	}
																}
																// Need to get the product object from the full Products array matching this productId since it contains the image data.
																const productImage = Products.find((Product) => Product.productId === product.productId);

																return (
																	<React.Fragment key={product.orderProductId}>
																		{/* Hide the CHARGE row if there is only a CREDIT */}
																		{
																			(tempInvoiceTotal !== '0.00' || (tempInvoiceTotal === '0.00' && tempPriceTotal === '0.00')) &&
																			<React.Fragment>
																				<tr>
																					<td><ProductThumbnailLoader product={productImage} size="tiny" /></td>
																					<td>
																						<h5 className="m-0">
																							{product.accountProductName !== null && product.accountProductName !== "" && <span>{product.accountProductName}</span>}
																							{!(product.accountProductName !== null && product.accountProductName !== "") && <span>{product.productName}</span>}
																						</h5>
																					</td>
																					<td>
																						<span className="text-danger">${tempInvoiceSubtotal}</span>
																					</td>
																					<td>
																						<span className="text-danger">${tempTaxChargedInvoice}</span>
																					</td>
																					<td>
																						<span className="text-danger">${tempInvoiceTotal}</span>
																					</td>
																					<td>
																						<span className="badge badge-danger"><Translate id="CHARGE" /></span>
																					</td>
																				</tr>
																			</React.Fragment>
																		}
																		{/* Option 1: Hide the CREDIT row unless there is a value */}
																		{
																			(parseInt(product.invoiceVet) === 0 && tempPriceTotal !== '0.00') &&
																			<React.Fragment>
																				<tr>
																					{/* If the CHARGE row was hidden, then show the image and description (product name) */}
																					{
																						(tempInvoiceTotal !== '0.00' || (tempInvoiceTotal === '0.00' && tempPriceTotal === '0.00')) &&
																						<React.Fragment>
																							<td></td>
																							<td></td>
																						</React.Fragment>
																					}
																					{
																						!(tempInvoiceTotal !== '0.00' || (tempInvoiceTotal === '0.00' && tempPriceTotal === '0.00')) &&
																						<React.Fragment>
																							<td><ProductThumbnailLoader product={productImage} size="tiny" /></td>
																							<td>
																								<h5 className="m-0">
																									{product.accountProductName !== null && product.accountProductName !== "" && <span>{product.accountProductName}</span>}
																									{!(product.accountProductName !== null && product.accountProductName !== "") && <span>{product.productName}</span>}
																								</h5>
																							</td>
																						</React.Fragment>
																					}
																					<td>
																						<span className="text-success">$-{tempProductSubtotal}</span>
																					</td>
																					<td>
																						<span className="text-success">$-{tempTaxCharged}</span>
																					</td>
																					<td><span className="text-success">$-{tempPriceTotal}</span></td>
																					<td>
																						<span className="mr-2 badge badge-success"><Translate id="CREDIT" /></span> 
																						({
																							parseInt(product.paymentCompletedPetOwner) === 1 && 
																							<React.Fragment>
																								<Translate id="Funds Collected" />:  
																								<span className="ml-1">
																									{(parseInt(product.paymentCompletedAlternative) === 1 && product.paymentCompletedAlternativeMethod !== null && <Translate id={product.paymentCompletedAlternativeMethod} />) 
																									|| (parseInt(product.paymentCompletedAlternative) === 1 && product.paymentCompletedAlternativeMethod === null && <Translate id="Alt Method" />) 
																									|| <Translate id="Credit Card" />}</span>
																							</React.Fragment>
																							
																						}
																						{
																							parseInt(product.paymentCompletedPetOwner) === 0 && 
																							<Translate id="UNPAID" />
																						})
																					</td>
																				</tr>
																			</React.Fragment>
																		}
																		{/* Option 2: Alternatively, show the CREDIT line if this is a Vet Order and they have paid directly for the order, and it is marked as paid by the pet owner's CC/Cash/Check */}
																		{
																			(parseInt(product.invoiceVet) === 0 && tempPriceTotal === '0.00' && product.paymentCompletedPetOwner === 1 && tempInvoiceTotal !== '0.00') &&
																			<React.Fragment>
																				<tr>
																					<React.Fragment>
																						<td></td>
																						<td></td>
																					</React.Fragment>
																					<td>
																						<span className="text-success">-${tempInvoiceSubtotal}</span>
																					</td>
																					<td>
																						<span className="text-success">-${tempTaxChargedInvoice}</span>
																					</td>
																					<td>
																						<span className="text-success">-${tempInvoiceTotal}</span>
																					</td>
																					<td>
																						<span className="mr-2 badge badge-success"><Translate id="CREDIT" /></span> 
																						({
																							parseInt(product.paymentCompletedPetOwner) === 1 && 
																							<React.Fragment>
																								<Translate id="Funds Collected" />:  
																								<span className="ml-1">
																									{(parseInt(product.paymentCompletedAlternative) === 1 && product.paymentCompletedAlternativeMethod !== null && <Translate id={product.paymentCompletedAlternativeMethod} />) 
																									|| (parseInt(product.paymentCompletedAlternative) === 1 && product.paymentCompletedAlternativeMethod === null && <Translate id="Alt Method" />) 
																									|| <Translate id="Credit Card" />}</span>
																							</React.Fragment>
																							
																						}
																						{
																							parseInt(product.paymentCompletedPetOwner) === 0 && 
																							<Translate id="UNPAID" />
																						})
																					</td>
																				</tr>
																			</React.Fragment>
																		}
																	</React.Fragment>
																)
															} else {
																return null
															}
														})}

														{/* Display invoice adjustments / items */}
														{Order.ItemsInvoice.map((item) => {
															tempVetChargesCost = Math.add(tempVetChargesCost, item.invoiceCostSubtotal).toFixed(2);
															tempVetChargesTax =  Math.add(tempVetChargesTax, item.taxDue).toFixed(2);
															return (
																<tr key={item.invoiceItemId}>
																	<td></td>
																	<td>
																		<h5 className="m-0">{item.invoiceItemType}</h5>
																		<div>{item.invoiceItemDescription}</div>
																		{item.invoiceItemDescriptionPrivate !== '' && item.invoiceItemDescriptionPrivate !== null && <div>(Private: {item.invoiceItemDescriptionPrivate})</div>}
																	</td>
																	<td>
																		{item.invoiceCostTotal <= 0 && <React.Fragment><span className="text-success">${item.invoiceCostSubtotal}</span></React.Fragment>}
																		{item.invoiceCostTotal > 0 && <React.Fragment><span className="text-danger">${item.invoiceCostSubtotal}</span></React.Fragment>}
																	</td>
																	<td>
																		{item.invoiceCostTotal <= 0 && <React.Fragment><span className="text-success">${item.taxDue}</span></React.Fragment>}
																		{item.invoiceCostTotal > 0 && <React.Fragment><span className="text-danger">${item.taxDue}</span></React.Fragment>}
																	</td>
																	{/*<td>${item.invoiceCostSubtotal}</td>
																	<td>${item.taxDue}</td>*/}
																	<td>
																		{item.invoiceCostTotal <= 0 && <React.Fragment><span className="text-success">${item.invoiceCostTotal}</span></React.Fragment>}
																		{item.invoiceCostTotal > 0 && <React.Fragment><span className="text-danger">${item.invoiceCostTotal}</span></React.Fragment>}
																	</td>
																	<td>
																		{item.invoiceCostTotal <= 0 && <React.Fragment><span className="badge badge-success">CREDIT</span></React.Fragment>}
																		{item.invoiceCostTotal > 0 && <React.Fragment><span className="badge badge-danger">CHARGE</span></React.Fragment>}
																	</td>
																</tr>
															)
														})}

														{/* Display the total costs as the last row */}
														<tr>
															<td></td>
															<td></td>
															<td></td>
															<td></td>
															{/*<td>${tempVetChargesCost}</td>
															<td>${tempVetChargesTax}</td>*/}
															<td>
																{Math.add(tempVetChargesCost, tempVetChargesTax) <= 0 && <React.Fragment><div className="h5 m-0 text-success">${Math.add(tempVetChargesCost, tempVetChargesTax).toFixed(2)}</div></React.Fragment>}
																{Math.add(tempVetChargesCost, tempVetChargesTax) > 0 && <React.Fragment><div className="h5 m-0 text-danger">${Math.add(tempVetChargesCost, tempVetChargesTax).toFixed(2)}</div></React.Fragment>}
															</td>
															<td>
																{Math.add(tempVetChargesCost, tempVetChargesTax) <= 0 && <React.Fragment><div className="badge badge-success">CREDIT</div></React.Fragment>}
																{Math.add(tempVetChargesCost, tempVetChargesTax) > 0 && <React.Fragment><div className="badge badge-danger">CHARGE</div></React.Fragment>}
															</td>
														</tr>
													</tbody>
												</table>
												{/* Allow Vet / Pet Owner to pay directly for ONLY THIS ORDER if there is a balance > 0 due, and their clinic/account is allowed to do so */}
												{
													Math.add(tempVetChargesCost, tempVetChargesTax) > 0 &&
													Order.payVetOrderByCreditCardOffered === 1 &&
													parseInt(Order.orderTypeId) !== 1 &&
													<div>
														<h5>Accept Payment From Vet - This order WILL NOT need to be paid on their invoice afterwards. The order will show zero balance remaining on their monthly invoice.</h5>
														<p>{Order.ownerFirstName} {Order.ownerLastName} (Pet: {Order.petFirstName})<br />{Order.ownerPhoneNumber}</p>
														<p className="pt-1 pb-1">
															{vetPaymentFormShow === false && <button type="button" className="btn btn-info btn-sm btn-addon mr-3" disabled={vetPaymentFormShow} onClick={() => setState({vetPaymentFormShow: true})}><FontAwesomeIcon icon="credit-card" /> <Translate id="Pay by Credit Card" /></button>}
															{vetPaymentAlternativeShow === false && <button type="button" className="btn btn-info btn-sm btn-addon" disabled={vetPaymentAlternativeShow} onClick={() => setState({vetPaymentAlternativeShow: true})}><FontAwesomeIcon icon="dollar-sign" /> <Translate id="Pay by Cash or Check" /></button>}
														</p>
													</div>
												}
												{vetPaymentFormShow === true &&
													<React.Fragment>
														<div className="row">
															<div className="col-6">
																<h6 className="border-bottom pb-2">Pay by Credit Card <button type="button" className="btn btn-default btn-sm btn-addon float-md-right ml-3 mt-n-2" onClick={() => setState({vetPaymentFormShow: false})}><FontAwesomeIcon icon="times" /> <Translate id="Cancel" /></button></h6>

																<Payment
																	Account={Account}
																	allowSaveCard={false}
																	amount={Math.add(tempVetChargesCost, tempVetChargesTax).toFixed(2)}
																	description={`Order ${Order.orderId} | Ref: ${Order.petReferenceNumber} | Pet: ${Order.petFirstName} | Vet Order Paided Directly`}
																	getPaymentResponse={getPaymentResponse}
																	orderId={Order.orderId}
																	vetOrderPaid={true}
																/>
															</div>
														</div>
													</React.Fragment>
												}
												{vetPaymentAlternativeShow === true &&
													<div className="row">
														<div className="mt-3 col-6">
															<h6 className="border-bottom pb-2">Make Alternative Payment <button type="button" className="btn btn-default btn-sm btn-addon float-md-right ml-3 mt-n-2" onClick={() => setState({vetPaymentAlternativeShow: false})}><FontAwesomeIcon icon="times" /> <Translate id="Cancel" /></button></h6>
															<p className="alert alert-warning pt-1 pb-1"><Translate id="Alternative Payment Warning" /> </p>
															<p className="pt-3 pb-3"><button type="button" className="btn btn-success btn-addon mr-2" onClick={() => handleAlternativePayment('Cash', true)}><FontAwesomeIcon icon="dollar-sign" /> <Translate id="Cash Payment Completed" /></button></p>
															<p className="pt-3 pb-3"><button type="button" className="btn btn-success btn-addon mr-2" onClick={() => handleAlternativePayment('Check', true)}><FontAwesomeIcon icon="check" /> <Translate id="Check Payment Completed" /></button></p>
														</div>
													</div>
												}
											</div>
										}
									</div>
								</div>
							}
						</React.Fragment>
					}{/* END VET CHARGES FOR INVOICING */}

					{/* CREMATION LOGS AND ORDER ACTIVITIES */}
					{
						NavClasses.activeClass === 'Logs' &&
						<React.Fragment>
							{/* CREMATION LOGS */}
							{Order.orderTypeId === 2 && (userTypeId === 1 || userTypeId === 2 || userTypeId === 3) &&
								<div className="mt-3">
									<div className="card w-100 border-secondary">
										<div className="card-header text-secondary border-secondary">
											<h5 className="m-0"><FontAwesomeIcon icon="fire" /> <Translate id="Cremation Log" /></h5>
										</div>
										<div className="card-body">
											<table className="table">
												<thead>
													<tr>
														<th>&nbsp;</th>
														<th><Translate id="Date" /></th>
														<th><Translate id="Machine" /></th>
														<th><Translate id="Operator" /></th>
														<th><Translate id="Log #" /></th>
													</tr>
												</thead>
												{Cremation && <tbody>
													<tr>
														<td><Translate id="Cremation Start" /></td>
														<td>{moment(Cremation.dateCremationStart).format('hh:mm A MMM DD, YYYY')}</td>
														<td>{Cremation.machineName}</td>
														<td>{Cremation.UserStart && Cremation.UserStart.firstName} {Cremation.UserStart && Cremation.UserStart.lastName}</td>
														<td>{Cremation.cremationLogId}</td>
													</tr>
													{Cremation.dateCremationEnd !== null &&
														<tr>
															<td><Translate id="Cremation End" /></td>
															<td>{moment(Cremation.dateCremationEnd).format('hh:mm A MMM, DD YYYY')} {Cremation.cremationEndScheduledMinutes > 0 && ` (+${Cremation.cremationEndScheduledMinutes} min.)`}</td>
															<td>{Cremation.machineName}</td>
															<td>{Cremation.UserEnd && Cremation.UserEnd.firstName} {Cremation.UserEnd && Cremation.UserEnd.lastName}</td>
															<td>{Cremation.cremationLogId}</td>
														</tr>
													}
												</tbody>}
												{Cremation === null &&
													<tbody>
														<tr>
															<td colSpan={5}>
																The Cremation has not been performed yet.
															</td>
														</tr>
													</tbody>

												}
											</table>
										</div>
									</div>
								</div>
							}{/* ENDCREMATION LOGS */}

							{/* ORDER ACTIVITIES */}
							<div className="mt-3">
								<div className="card w-100 border-secondary">
									<div className="card-header text-secondary border-secondary">
										<h5 className="m-0"><FontAwesomeIcon icon="clipboard-list" /> <Translate id="Order Activity Log" /></h5>
									</div>
									<div className="card-body">
										<table className="table">
											<thead>
												<tr>
													<th><Translate id="Date" /></th>
													<th><Translate id="Activity" /></th>
													{requireInitialsEditOrderDetails === 1 && <th><Translate id="Initials Entered" /></th>}
													<th><Translate id="Person Responsible" /></th>
												</tr>
											</thead>
											<tbody>
												{Order.LogOrderActivities.map((log) => {
													let displayLogEntry = true;
													if( userTypeId === 5 && log.showVet === 0 ) {
														displayLogEntry = false;
													}
													return (
														<React.Fragment key={log.logOrderActivityId}>
															{displayLogEntry === true && <tr key={log.logOrderActivityId}>
																<td>{moment(log.dateCreated).format('hh:mm A')} on {moment(log.dateCreated).format('MMM DD, YYYY')}</td>
																<td>{log.activity}</td>
																{requireInitialsEditOrderDetails === 1 && <td>{log.userInitials}</td>}
																<td>
																	{log.loggedInUserId !== null && <span>{log.loggedInUserFirstName} {log.loggedInUserLastName}</span>}
																	{log.loggedInUserId === null && <span>Pet Owner</span>}
																</td>
															</tr>}
														</React.Fragment>
													)
												})}
											</tbody>
										</table>
									</div>
								</div>
							</div>{/* END ORDER ACTIVITIES */}
						</React.Fragment>
					}					
				</div>


			</React.Fragment>
		);
	} else if(initialValues.orderStatus === 'Deleted') {
		// This condition gets hit if a user were to attempt to come to this order by changing their URL and the order was already deleted.
		return (
			<DetailColumn>
				<div className="alert alert-success"><Translate id="Order Already Deleted Warning" /> <NavLink to={`/orders`} activeClassName="active">{props.translate('Orders')}</NavLink></div>
			</DetailColumn>
		);
	} else {
		// This condition gets hit once the Order has been deleted
		return (
			<DetailColumn>
				{/*  Display a resulting status message.  */}
				{ Response && Response.message && <div className="alert alert-success">{props.translate(Response.message)} <NavLink to={`/orders`} activeClassName="active">{props.translate('Orders')}</NavLink></div> }
			</DetailColumn>
		);
	}
};

const OrderDetailForm = compose (
	withMutation(AddressSaveMutation, "AddressSave"),
	withMutation(InvoiceItemSaveMutation, "InvoiceItemSave", ["getOrder"]),
	withMutation(LogOrderActivitySaveMutation, "LogOrderActivitySave", ["getOrder"]),
	withMutation(OrderCommentSaveMutation, "OrderCommentSave", ["getOrder"]),
	withMutation(OrderCremationSaveMutation, "OrderCremationSave", ["getOrder"]),
	withMutation(OrderDeleteMutation, "OrderDelete", ["getOrder"]),
	withMutation(OrderHoldSaveMutation, "OrderHoldSave", ["getOrder","getOrders"]),
	withMutation(OrderProductDeleteMutation, "OrderProductDelete", ["getOrder"]),
	withMutation(OrderProductRefundMutation, "OrderProductRefund", ["getOrder"]),
	withMutation(OrderProductRemoveMutation, "OrderProductRemove"),
	withMutation(OrderProductSaveMutation, "OrderProductSave", ["getOrder", "getOrders"]),
	withMutation(OrderProductsPaidMutation, "OrderProductsPaid", ["getOrder"]),
	withMutation(OrderSaveMutation, "OrderSave", ["getOrder"]),	
	withMutation(OrderStatusUpdateMutation, "OrderStatusUpdate"),
	withMutation(PetCheckerMutation, "PetReferenceNumberCheck"),
	withMutation(ProductOrderDuplicateCremationOrderMutation, "DuplicateOrder"),
	withFormik({
		validationSchema: () => Yup.object().shape({
			petColor: Yup.string().required("Enter a pet color"),
			petFirstName: Yup.string().required("Enter a pet first name"),
			petReferenceNumber: Yup.string().required("Enter a pet reference number"),
			weight: Yup.string().required("Enter the weight")
	   })
	}),
	withState({
		addAdjustmentFormShow: false,
		adjustmentAddTax: 1,
		bypassPaymentRequirementReason: '',
		bypassPaymentRequirementShowForm: false,
		customerCallNotes: '',
		customerCallOrderCommentId: 0,
		customerCallOrderCommentStatus: 'unread',
		customerCallStatus: 'Ready',
		deletingReasonOrderProduct: '',
		enableEditingOrderDetails: false,
		enableEditingOrderInformation: false,
		enableWalkInItemLine: false,
		initialLoad: true,
		invoiceCostSubtotal: 0,
		invoiceCostTotal: 0,
		invoiceItemDescription: '',
		invoiceItemDescriptionPrivate: '',
		invoiceItemType: 'Adjustment',
		NavClasses: {
			activeClass: 'PetOwner',
			Comments: 'btn-success opacity-65 border border-white',
			Details: 'btn-success opacity-65 border border-white',
			Logs: 'btn-success opacity-65 border border-white',
			Memorialization: 'btn-success opacity-65 border border-white',
			PetOwner: 'btn-success',
			Printing: 'btn-success opacity-65 border border-white',
			VetCharges: 'btn-success opacity-65 border border-white'
		},
		orderCommentInternal: 1,
		orderCommentMadeBy: 'Clinic',
		orderCommentType: 'Comment',
		orderDetailsMessage: '',
		orderDetailsMessageAlertStatus: '',
		orderInformationMessage: '',
		orderInformationMessageAlertStatus: '',
		orderProductIdDeleteOpen: '',
		orderProductIdRefundOpen: '',
		orderScanMessage: '',
		orderStatusUpdatedAwaitingDelivery: false,
		ownerPhoneNumber: '',
		paymentAlternativeShow: false,
		paymentFormShow: false,
		petReferenceNumberOrderScan: '',
		printableIdsAnswered: [],
		PrintableIdsChecked: [],
		printableIdQuestionPrompt: 0,
		printSelectedClicked: false,
		printSelectedQuestionPrompt: 0,
		refundAttemptError: '',
		refundingReasonError: false,
		refundingReasonOrderProduct: '',
		showMakeCustomerCall: false,
		showPlaceHoldForm: false,
		showProductsMemorialization: false,
		showRemoveHoldForm: false,
		taxDue: 0,
		totalCharity: 0,
		vetPaymentFormShow: false,
		vetPaymentAlternativeShow: false,
		walkInItemName: 'Walk In Item',
		walkInItemPrice: '',
		walkInItemTax: '',
		walkInItemTaxShown: ''
	}),
	queryWithLoading({ gqlString: getAddressTypes, name: "addressTypes"}),
	queryWithLoading({
		gqlString: getCompanyAddressesQuery,
		variablesFunction: (props) => ({companyId: parseInt(props.Order.companyId) > 0 ? parseInt(props.Order.companyId) : 0, returnAllAddresses: true}),
		name: "DeliveryCompanyAddresses"
	}),
	queryWithLoading({
		gqlString: getCompanyAddressesQuery,
		variablesFunction: (props) => ({companyId: parseInt(props.Order.companyId) > 0 ? parseInt(props.Order.companyId) : 0, returnAllAddresses: true}),
		name: "PickupCompanyAddresses"
	}),
	withTranslate
)(OrderDetailFormContent);

class OrderDetailsClass extends React.Component {
	constructor(props) {
    	super(props)
		console.log({props})
		this.state= {
			errors: {},
			hideOrderForm: false,
			showDeleteOrderForm: false
		}
		//this.props.data.Order.OrderHold.length > 0 ? true :
	}

	handleStateChange = (name, value) => {
		this.setState({ [name]: value });
	}


	render () {
		const { Order, Order: { OwnerAddress }, OrderServiceStatuses, OrderStatuses, Printables, Products, Species } = this.props.data;

		// Set the owner address variables if there is an owner address
		let ownerAddressId = OwnerAddress ? OwnerAddress.addressId : 0;
		let ownerAddress1 = OwnerAddress ? OwnerAddress.address1 : '';
		let ownerAddress2 = OwnerAddress ? OwnerAddress.address2 : '';
		let ownerCity = OwnerAddress ? OwnerAddress.city : '';
		let ownerPostalCode = OwnerAddress ? OwnerAddress.postalCode : '';
		let ownerStateId = OwnerAddress ? OwnerAddress.stateId : '';
		let navigationSection = this.props.match.params.section ? this.props.match.params.section : ''; 
		console.log(this.props)
		return (
			<React.Fragment>
				<OrderDetailForm
					Account={this.props.Account}
					accountId={this.props.Account.accountId}
					Cremation={this.props.Cremation.CremationOrderDetails}
					DeliveryLogs={this.props.DeliveryLogs.DeliveryLogOrderDetails}
					handleStateChange={this.handleStateChange}
					history={this.props.history}
					initialValues={{...this.props.data.Order, oldDeliveryProductId: parseInt(this.props.data.Order.deliveryMethodProductId), ownerAddressId, ownerAddress1, ownerAddress2, ownerCity, ownerPostalCode, ownerStateId, orderComment: '', orderDeleteReason: '', orderHold: '', userInitialsOrderDetails: '', userInitialsOrderInformation: ''}}
					navigationSection={navigationSection}
					Order={Order}
					OrderServiceStatuses={OrderServiceStatuses}
					OrderStatuses={OrderStatuses}
					Printables={Printables}
					Products={Products}
					Species={Species}
					state={this.state}
					taxRate={this.props.Account.Settings.find((setting) => setting.name === 'taxRate').value}
					userTypeId={parseInt(this.props.Session.User.userTypeId)}
					User={this.props.Session.User}
				/>
			</React.Fragment>
		)
	}
}

export const OrderDetails = compose(
	withRouter,
	queryWithLoading({
		gqlString: getOrderQuery, variablesFunction: (props) => ({ includeDeleted: true, orderId: props.match.params.orderId }),
		requiredPermission: { permission: "orders", permissionLevel: 3},
		options: {
			fetchPolicy: 'network-only'
		}
	}),
	queryWithLoading({
		gqlString: getCremationOrderDetailsQuery, variablesFunction: (props) => ({ orderId: props.match.params.orderId }),
		requiredPermission: { permission: "orders", permissionLevel: 1},
		name: "Cremation",
		options: {
			fetchPolicy: 'network-only'
		}
	}),
	queryWithLoading({
		gqlString: 	getDeliveryLogOrderDetailsQuery,
		variablesFunction: (props) => ({ orderId: props.match.params.orderId }),
		name: "DeliveryLogs"
	}),
	withSession,
	withTranslate
)(OrderDetailsClass)
