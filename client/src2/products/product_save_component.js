import { compose } from "react-apollo";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Math from 'mathjs';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import React from 'react';
import Select from "react-select";
import { withFormik, Field, FieldArray, Form } from "../utilities/IWDFormik";
import { withModalState } from "../utilities/withModal";
import { withRouter, Link } from "react-router-dom";
import { withState } from "react-state-hoc";
import * as Yup from "yup";


import { withSession } from "../utilities/session";

import _ from "lodash";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation, castNumerics } from "../utilities/IWDDb";

import { Translate, withTranslate } from '../translations/IWDTranslation';

import { ProductImageEditor } from './product_images';

// GRAPHQL QUERY
import {
	getProductGroups,
	getProductOptions,
	getProductQuery,
	getProductsQuery,
	getProductPairings,
	getProductsPairingsMemorializations,
	getProductVariationTypes,
	getProductVariationValues,
	ProductAccountSaveMutation,
	ProductAccountWeightTierPriceSaveMutation,
	ProductAccountWeightTierPriceRemoveMutation,
	ProductAttributesSaveMutation,
	ProductGroupSaveMutation,
	ProductImageSaveMutation,
	ProductImageDeleteMutation,
	ProductImageMakeDefaultMutation,
	ProductOptionsReorderMutation,
	ProductSaveMutation
} from './products_graphql';

// Function for drag n drop for Product Options
const ProductOptionsList = (props) => {
	const {
		accountId,
		dragNDropDisabled,
		editable,
		firstTimeLoading,
		message,
		messageStatus,
		personalizationAllowed,
		personalizationDefaultedToYes,
		personalizationRequired,
		ProductAccountSave,
		ProductAttributesSave,
		productId,
		productOptionIds,
		ProductOptionsReorder,
		productOptions,
		ProductOptions: { ProductOptions },
		Product,
		productTypeId,
		SelectedProductOptions,
		setState,
		tempSelectedProductOptions // this is used as the means to be able to update the list of saved Product Options after the ProductAttributesSave mutation.
	} = props;

	// Set the state value for Items to be equal to the ProductOptions if this is the initial load of the function.
	if(firstTimeLoading && SelectedProductOptions !== null) {
		// Create the list of productOptionIds here and save into state
		const tempProductOptionIds = SelectedProductOptions.map((option) => (parseInt(option.value)));
		setState({
			firstTimeLoading: false,
			personalizationAllowed: Product.personalizationAllowed !== null ? Product.personalizationAllowed : 0,
			personalizationDefaultedToYes: Product.personalizationDefaultedToYes !== null ? Product.personalizationDefaultedToYes : 0,
			personalizationRequired: Product.personalizationRequired !== null ? Product.personalizationRequired : 0,
			productOptionIds: tempProductOptionIds.join(),
			productOptions: SelectedProductOptions,
			tempSelectedProductOptions: SelectedProductOptions
		});
	}

	const ProductOptionsSelectValues = ProductOptions.map(({productOptionId: value, optionName: label}) => ({ value, label }) );

	// used for reordering the drag and drop list
	const reorder = (list, startIndex, endIndex) => {
		let result = Array.from(list);
		const [removed] = result.splice(startIndex, 1);
		result.splice(endIndex, 0, removed);

		return result;
	};
	const getItemStyle = (isDragging, draggableStyle) => ({
		// some basic styles to make the items look a bit nicer
		userSelect: 'none',
		padding: 10,
		margin: `0 0 10px 0`,

		// change background colour if dragging
		background: isDragging ? 'lightyellow' : 'white',

		// styles we need to apply on draggables
		...draggableStyle,
	});
	const getListStyle = isDraggingOver => ({
		background: isDraggingOver ? 'lightblue' : 'lightgrey',
		marginTop: '10px',
		padding: 10,
		width: '100%'
	});
	async function onDragEnd(result) {
		// dropped outside the list
		if (!result.destination) {
			return;
		}

		const items = reorder(
			tempSelectedProductOptions,
			result.source.index,
			result.destination.index
		);

		let draggedItem = items[result.destination.index];

		let ProductOptionsReorderInput = {
			productId: productId,
			productOptionId: parseInt(draggedItem.value),
			sortOrderProductOptionOld: result.source.index + 1,
			sortOrderProductOptionNew: result.destination.index + 1
		}

		const { data: { productOptionsReorder: { ProductAttributes }}} = await ProductOptionsReorder({input: ProductOptionsReorderInput});

		const tempProductOptions = _.uniqBy(ProductAttributes,"productOptionId").map(( { productOptionId: value, optionName: label, sortOrderProductOption } ) => ( { value, label, sortOrderProductOption } ) );

		// Update the state variable for displaying the list of reorderable Product Options
		setState({ tempSelectedProductOptions: tempProductOptions });
	}

	// Function for handling changes to the Personalization Product Options multiselect
	function productOptionChange(selectedProductOptions, { option: newOption = {} }) {
		const filteredProductOptions = selectedProductOptions;
		if( filteredProductOptions.length === 0 ) {
			setState({
				dragNDropDisabled: true,
				message: 'Drag and Drop reordering has been disabled. Please save the personalization options to update the list below',
				messageStatus: 'warning',
				productOptions: [],
				productOptionIds: ''
			});
		} else {
			let productOptionIds = filteredProductOptions.map((option) => {
				return option.value;
			})
			productOptionIds = productOptionIds.join();
			setState({
				dragNDropDisabled: true,
				message: 'Drag and Drop reordering has been disabled. Please save the personalization options for them to show up below and enable reordering.',
				messageStatus: 'warning',
				productOptions: filteredProductOptions,
				productOptionIds
			});
		}
	}

	// Save function for the list of productOptions choosen in the multi-selector
	async function handleProductOptionsSave() {
		// Save the productsAccounts variables about personalization
		await ProductAccountSave({input: { personalizationAllowed: parseInt(personalizationAllowed), personalizationDefaultedToYes: parseInt(personalizationDefaultedToYes), personalizationRequired: parseInt(personalizationRequired), productId }});

		const { data: { productAttributesSave }} = await ProductAttributesSave({input: { productId, productOptionIds }});

		if(productAttributesSave.Response.success === true) {
			// Update the list of available Product Options to sort in drag and drop. The uniqBy filters down the list of many productOptionIds
			const tempProductOptions = _.uniqBy(productAttributesSave.ProductAttributes,"productOptionId").map(( { productOptionId: value, optionName: label, sortOrderProductOption } ) => ( { value, label, sortOrderProductOption } ) );

			setState({dragNDropDisabled: false, message: 'Personalization options saved. Please check that the sort order below is correct.', messageStatus: 'success', tempSelectedProductOptions: tempProductOptions});
		} else {
			setState({message: 'Personalization options not saved', messageStatus: 'danger'});
		}
	}

	if(parseInt(productTypeId) === 3) {
		return (
			<div className="" style={{marginBottom: '400px'}}>
				<div className="card p-3">
					<div className="row mt-3">
						<div className="col-md-3">
							<Translate id="Personalization Allowed?" />
							<Field name="personalizationAllowed" value={personalizationAllowed} component="select" className="form-control" onChange={(event) => setState({personalizationAllowed: event.target.value})}>
								<option value="1">{props.translate('Yes')}</option>
								<option value="0">{props.translate('No')}</option>
							</Field>
						</div>
						<div className="col-md-3">
							<Translate id="Personalization Required?" />
							<Field name="personalizationRequired" value={personalizationRequired} component="select" className="form-control" onChange={(event) => setState({personalizationRequired: event.target.value})}>
								<option value="1">{props.translate('Yes')}</option>
								<option value="0">{props.translate('No')}</option>
							</Field>
						</div>
						<div className="col-md-3">
							<Translate id="Default Personalization to Yes?" />
							<Field name="personalizationDefaultedToYes" value={personalizationDefaultedToYes} component="select" className="form-control" onChange={(event) => setState({personalizationDefaultedToYes: event.target.value})}>
								<option value="1">{props.translate('Yes')}</option>
								<option value="0">{props.translate('No')}</option>
							</Field>
						</div>
					</div>

					<div className="row mt-3">
						<div className="col-12">
							<Translate id="Personalization" />
							{!editable && parseInt(accountId) !== 1 && ProductOptions.length > 0 &&
								<p>
									{ProductOptions.map((productOption) => {
										return <span className="badge badge-secondary mr-3" key={productOption.productOptionId}>{productOption.optionName}</span>
									})}
								</p>
							}
							{!editable && parseInt(accountId) !== 1 && ProductOptions.length === 0 &&
								<p><span className="badge badge-secondary">No Personalization</span></p>
							}
							{!(!editable && parseInt(accountId) !== 1) && <Field component={Select}
								showError={true}
								className=""
								name="productOptions"
								value={productOptions}
								options={ProductOptionsSelectValues}
								onChange={ productOptionChange }
								isMulti
							/>}
						</div>
						<div className="col-12 mt-2">
							<button type="button" className="btn btn-success" onClick={() => handleProductOptionsSave()}><Translate id="Save" /></button>
						</div>
						{
							message !== '' &&
							<div className="col-auto mt-2">
								<div className={`alert alert-${messageStatus} mb-0`}>{message}</div>
							</div>
						}
					</div>
					{/* Drag and Drop productAttributes created from the selected productOptions above into the display order. Use the productOptions sortOrder by default when adding a productAttribute to a product */}
					{
						tempSelectedProductOptions.length > 0 &&
						<div className="row">
							<div className="col-12">
								<DragDropContext onDragEnd={onDragEnd}>
									<Droppable droppableId="droppable">
										{(provided, snapshot) => (
											<div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)}>
												{tempSelectedProductOptions.map((item, index) => {
													return (
														<Draggable isDragDisabled={dragNDropDisabled} key={item.value} draggableId={item.value} index={index}>
															{(provided, snapshot) => (
															<div ref={provided.innerRef}
																{...provided.draggableProps}
																{...provided.dragHandleProps}
																style={getItemStyle( snapshot.isDragging, provided.draggableProps.style )}
															>
																<span className="text-muted mr-3"><FontAwesomeIcon icon="grip-vertical" /></span> {item.label}
															</div>
															)}
														</Draggable>
													)
												})}
												{provided.placeholder}
											</div>
										)}
									</Droppable>
								</DragDropContext>
							</div>
						</div>
					}
				</div>
			</div>
		)
	} else {
		return false;
	}
};

const ProductOptionsListContainer = compose(
	queryWithLoading({ gqlString: getProductOptions, name: "ProductOptions" }),
	withFormik(),
	withMutation(ProductAccountSaveMutation, "ProductAccountSave"),
	withMutation(ProductAttributesSaveMutation, "ProductAttributesSave"),
	withMutation(ProductOptionsReorderMutation, "ProductOptionsReorder"),
	withState({
		dragNDropDisabled: false,
		firstTimeLoading: true,
		message: '',
		messageStatus: '',
		productOptionIds: '',
		productOptions: [],
		tempSelectedProductOptions: []
	}),
	withTranslate
)(ProductOptionsList)


const ProductSaveFormContent = (props) => {
	const {
		dirty,
		errors,
		isSubmitting,
		initialLoad,
		initialValues,
		PairableProducts,
		Product,
		ProductCategories,
		ProductGroups,
		ProductMaterials,
		ProductPairings,
		ProductTypes,
		ProductVariationTypes,
		ProductVariationValues,
		Response,
		setState,
		showMemorializationFields,
		Species,
		setFieldValue,
		setFieldTouched,
		submitForm,
		tempProductVariationValues,
		tempProductVariations,
		touched,
		values,
		isValid
	} = props;

	// Check for the state variable 'initialLoad', which we will set to false after the first load here. Use this variable as a means to set up the initial state of this form.
	if(initialLoad === true) {
		
		// Set the initial array for the tempProductVariations. Only needed when the productId has already been saved, AND there are ProductsVariations records in the db for the productId
		let initialTempProductVariations = Product && parseInt(Product.productId) > 0 && Product.ProductVariations.length > 0 ? Product.ProductVariations.map((variation) => variation.productVariationValueId) : [];

		// This setState will cause the container to reload initially, and reset the initialLoading state so that this if condition does not get hit again. 
		setState({
			initialLoad: false,
			showMemorializationFields: parseInt(initialValues.productTypeId) === 3 ? true : false,
			tempProductVariations: initialTempProductVariations
		})
	}

	// B-CS Change 8-12-20: Removed props.Account determination for measuring system, hardcoding to US.
	// B-CS Change 8-14-20: Changed back, trying to actually use the getSettingValue function.
	const measurementLength = props.Account.getSettingValue("measurementSystem") === "Metric" ? "cm" : "in";
	const measurementWeight = props.Account.getSettingValue("measurementSystem") === "Metric" ? "kgs" : "lbs";
	// const measurementLength = "in";
	// const measurementWeight = "lbs";
	
	const ALL_SPECIES_ARRAY = [{value: "ALL_SPECIES", label: "All Species"}];

	const SpeciesSelectValues = ALL_SPECIES_ARRAY.concat(Species.map(({ speciesId: value, species: label}) => ({ value, label }) ));

	const SpeciesValue = values.Species.length > 0 ? values.Species : ALL_SPECIES_ARRAY;

	let showWeightPricing = false;
	if(Product !== null && Product.productTypeId !== undefined && Product.productTypeId === "2") {
		showWeightPricing = true;
	}

	// show overrides for product name and descriptions
	if(values.accountDescriptionLong !== null && values.accountDescriptionLong !== "" && values.descriptionLong === initialValues.descriptionLong) {
		values.descriptionLong = values.accountDescriptionLong;
	};
	if(values.accountDescriptionShort !== null && values.accountDescriptionShort !== "" && values.descriptionShort === initialValues.descriptionShort) {
		values.descriptionShort = values.accountDescriptionShort;
	};
	if(values.accountProductName !== null && values.accountProductName !== "" && values.productName === initialValues.productName) {
		values.productName = values.accountProductName;
	};


	// Duplicate the Product
	async function handleDuplicateProduct() {
		values.duplicateProduct = true;
		values.duplicateProductId = values.productId;
		values.productId = 0;
		submitForm();
	}

	// Product Groups - For the selected productGroupId within state, show all of the other products which have this Id too
	// MIGHT NOT NEED TO DO THIS BJH

	// Product Type onChange function - show/hide the Product Group, Variation Types / Values form fields. Shows fields when 'Memorialization' products are shown.
	function productTypeChange(value) {
		// Update the productTypeId in the value object because by calling  function for the field's onChange, the value ofunction does not get updated.
		values.productTypeId = parseInt(value);
		if(
			ProductTypes.find((type) => parseInt(type.productTypeId) === parseInt(value)) && ProductTypes.find((type) => parseInt(type.productTypeId) === parseInt(value)).productType === 'Memorialization'
		) {
			setState({showMemorializationFields: true})
		} else {
			setState({showMemorializationFields: false})
		}
	}

	// Product Variation Type onChange function - updates the array of Product Variation Values to only show ones that are of the selected Variation Type
	function productVariationTypeChange(selectedValue) {
		// Filter the aray of Product Variation Values that match the productVariationTypeId passed in
		let temp = ProductVariationValues.filter((variation) => parseInt(variation.productVariationTypeId) === parseInt(selectedValue));

		// Set the productVairationTypeId that was passed in
		values.productVariationTypeId = selectedValue;

		// Set the state variable that is used for the array of Product Variation Values to be the filtered array
		setState({ tempProductVariationValues: temp })
	}

	// Product Variation Value onClick function for removal of variation value from list.
	async function removeProductVariation(variationId) {
		// We only have a list of a temp array of productVariationValueIds within the state, so remove the id from that temp array.
		let newArray = tempProductVariations.filter((v) => parseInt(variationId) !== parseInt(v));
		// Cause content to refresh using setState and update the tempProductVariations so the list will reflect this removal.
		setState({ tempProductVariations: newArray });
	}
	
	// onClick add function for Product Variation. This ONLY adds the productVariationValueId to an array, which NEEDS to be saved with the rest of the product information.
	async function addProductVariation() {
		// Push the productVariationValueId to the temp array, which will be saved later
		tempProductVariations.push(values.productVariationValueId);
		setState({tempProductVariations});
	}

	function speciesChange(selectedSpecies, { option: newOption = {} }) {
		// Filter out the ALL_SPECIES item.
		const filteredSpecies = selectedSpecies.filter(( { value } ) => value !== "ALL_SPECIES");

		// After filtering, if there are no species to show, set it to ALL_SPECIES_ARRAY.
		if( newOption.value === "ALL_SPECIES" || filteredSpecies.length === 0 ) {
			setFieldValue("Species", ALL_SPECIES_ARRAY);
		} else {
			setFieldValue("Species", filteredSpecies);
		}
	}
	
	return (
		<React.Fragment>
			<div className="">
				{/*  Display a resulting status message.  */}
				{ Response && dirty === false && <div className="row"><div className="col-12 alert alert-success">{props.translate(Response.message)}</div></div> }
					<Form>
						<div className="">
							{
								parseInt(values.productId) > 0 &&
								<div className="row mb-2">
									<div className="mt-3 col-12">
										<button type="button" onClick={() => handleDuplicateProduct()} className="btn btn-success">
											<Translate id="Duplicate Product" />
										</button>
									</div>								
								</div>
							}
							<div className="row mb-2">
								<div className="col-6">
									<Translate id="Product Name"/>
									<Field name="productName" showError={true}  className={`form-control ${errors.productName && touched.productName && 'is-invalid'}`} />
								</div>
								<div className="col-6">
									<Translate id="Short Description"/>
									<Field name="descriptionShort" showError={true}  className={`form-control ${errors.descriptionShort && touched.descriptionShort && 'is-invalid'}`} />
								</div>
							</div>
							<div className="row mb-2">
								<div className="col-6">
									<Translate id="Product Type"/>
									<Field component="select" onChange={(event) => productTypeChange(event.target.value)} value={values.productTypeId} disabled={!values.editable && parseInt(values.accountId) !== 1} showError={true} name="productTypeId" className={`form-control ${errors.productTypeId && touched.productTypeId && 'is-invalid'}`}>
										{/* This render to Static Markup is required because options don't like React children as the label */}
											<option value="0">{props.translate('Select a Product Type')}</option>
											{ProductTypes.map((type) => {
													return <option value={type.productTypeId} key={type.productTypeId}>{props.translate(type.productType)}</option>
												}
											)}
									</Field>
								</div>
								<div className="col-6">
									<Translate id="Product Category"/>
									<Field component="select" disabled={!values.editable && parseInt(values.accountId) !== 1} showError={true} name="productCategoryId" className={`form-control ${errors.productCategoryId && touched.productCategoryId && 'is-invalid'}`}>
										{/* This render to Static Markup is required because options don't like React children as the label */}
											<option value="">{props.translate('Select a Product Category')}</option>
											{ProductCategories.map((category) => {
													return <option value={category.productCategoryId} key={category.productCategoryId}>{props.translate(category.productCategory)}</option>
												}
											)}
									</Field>
								</div>
							</div>
							{
								showMemorializationFields === true &&
								<React.Fragment>
									<div className="border p-3">
										<h4>Memorialization Product Info Only</h4>
										{
											parseInt(values.productId) === 0 &&
											<div className="mb-2">You must save this product before adding accessories</div>
										}
										<div className="alert alert-success">This product accessory connection (ex: PP to PP stand) still needs Programmer to add the saving and deleting functionality. Ask Barrett if you need accessories connected.</div>
										{
											parseInt(values.productId) > 0 &&
											<div className="row mb-2">
												<div className="col-6">
													<Translate id="Accessory Product that THIS Product Can Use"/>
													<Field component="select" name="childProductId" className="form-control">
														{/* This render to Static Markup is required because options don't like React children as the label */}
															<option value="0">{props.translate('Select an Accesory Product')}</option>
															{PairableProducts.map((product) => {
																	return <option value={parseInt(product.productId)} key={parseInt(product.productId)}>{props.translate(product.productName)}</option>
																}
															)}
													</Field>
													{
														parseInt(values.productId) > 0 &&
														ProductPairings.length > 0 &&
														ProductPairings.filter((product) => parseInt(product.parentProductId) === parseInt(values.productId)).length > 0 &&
														ProductPairings.filter((product) => parseInt(product.parentProductId) === parseInt(values.productId)).map((pairings) => {
															return <div key={`child-${pairings.childProductId}`}>{pairings.childProduct}</div>
														})
													}
												</div>
												<div className="col-6">
													<Translate id="Parent Product that THIS Accessory Product Can Be Used By"/>
													<Field component="select" name="parentProductId" className="form-control">
														{/* This render to Static Markup is required because options don't like React children as the label */}
															<option value="0">{props.translate('Select a Parent Product')}</option>
															{PairableProducts.map((product) => {
																	return <option value={parseInt(product.productId)} key={parseInt(product.productId)}>{props.translate(product.productName)}</option>
																}
															)}
													</Field>
													{
														parseInt(values.productId) > 0 &&
														ProductPairings.length > 0 &&
														ProductPairings.filter((product) => parseInt(product.childProductId) === parseInt(values.productId)).length > 0 &&
														ProductPairings.filter((product) => parseInt(product.childProductId) === parseInt(values.productId)).map((pairings) => {
															return <div key={`parent-${pairings.parentProductId}`}>{pairings.parentProduct}</div>
														})
													}

												</div>
											</div>
										}
										<div className="row mb-2">
											<div className="col-6">
												<Translate id="Product Group"/>
												<Field component="select" name="productGroupId" className={`form-control ${errors.productGroupId && touched.productGroupId && 'is-invalid'}`}>
													{/* This render to Static Markup is required because options don't like React children as the label */}
														<option value="0">{props.translate('Select a Product Group')}</option>
														{ProductGroups.map((group) => {
																return <option value={parseInt(group.productGroupId)} key={parseInt(group.productGroupId)}>{props.translate(group.productGroup)}</option>
															}
														)}
												</Field>
											</div>
											<div className="col-6">
												<Translate id="New Product Group"/>
												<Field name="productGroup" showError={true}  className={`form-control ${errors.productGroup && touched.productGroup && 'is-invalid'}`} />
											</div>
										</div>
										<div className="row mb-2 border p-2 m-1">
											<div className="col-6">
												<p>This product's variation within the above group:</p>
												<Translate id="Product Variation Type"/>
												<Field component="select" name="productVariationTypeId" onChange={(event) => productVariationTypeChange(event.target.value)} className={`form-control ${errors.productVariationTypeId && touched.productVariationTypeId && 'is-invalid'}`}>
													{/* This render to Static Markup is required because options don't like React children as the label */}
														<option value="0">{props.translate('Select a Product Variation Type')}</option>
														{ProductVariationTypes.map((types) => {
																return <option value={parseInt(types.productVariationTypeId)} key={parseInt(types.productVariationTypeId)}>{props.translate(types.productVariationType)}</option>
															}
														)}
												</Field>
												<br />
												<Translate id="Product Type Variation Value"/>
												<Field component="select" name="productVariationValueId" className={`form-control ${errors.productVariationValueId && touched.productVariationValueId && 'is-invalid'}`}>
													{/* This render to Static Markup is required because options don't like React children as the label */}
														<option value="0">{props.translate('Select a Product Variation Value')}</option>
														{tempProductVariationValues.map((values) => {
																return <option value={parseInt(values.productVariationValueId)} key={parseInt(values.productVariationValueId)}>{props.translate(values.productVariationValue)}</option>
															}
														)}
												</Field>
												<button type="button" onClick={() => addProductVariation()} className="btn btn-success mt-2" disabled={parseInt(values.productVariationValueId) === 0}>Add Variation</button>
											</div>
											<div className="col-6">
												<p>Current Product Variations</p>
												<table className="table table-striped">
													<tbody>
														{tempProductVariations.length > 0 &&
															tempProductVariations.map((variation) => {
																return (
																	<React.Fragment key={variation}>
																		<tr>
																			<td colSpan="9" className="h3 bg-dark text-light">{ProductVariationValues.find((pv) => parseInt(pv.productVariationValueId) === parseInt(variation)).productVariationValue}</td>
																			<td colSpan="3"><button type="button" className="btn-sm btn-dnager" onClick={() => removeProductVariation(parseInt(variation))}>Remove</button></td>
																		</tr>
																	</React.Fragment>
																)
															})
														}
													</tbody>
												</table>
												<div className="alert alert-danger">You must click the save button at the bottom of this form in order for the variations to get saved.</div>
											</div>
										</div>	
									</div>							
								</React.Fragment>
							}
							<div className="row mb-2">
								<div className="col-12">
									<Translate id="Long Description"/>
									<Field component="textarea" name="descriptionLong" showError={true} className={`form-control ${errors.descriptionLong && touched.descriptionLong && 'is-invalid'}`} />
								</div>
							</div>
							<div className="row mb-2">
								<div className="col-md-3">
									<Translate id="Is a Paw Print?" />
									<Field name="isPawPrint" component="select" disabled={!values.editable && parseInt(values.accountId) !== 1} className={`form-control ${errors.isPawPrint && touched.isPawPrint && 'is-invalid'}`}>
										<option value="1">{props.translate('Yes')}</option>
										<option value="0">{props.translate('No')}</option>
									</Field>
								</div>
								<div className="col-md-3">
									<Translate id="Requires a Paw Print? (e.g. a stand)" />
									<Field name="requiresPawPrint" component="select" disabled={!values.editable && parseInt(values.accountId) !== 1} className={`form-control ${errors.requiresPawPrint && touched.requiresPawPrint && 'is-invalid'}`}>
										<option value="1">{props.translate('Yes')}</option>
										<option value="0">{props.translate('No')}</option>
									</Field>
								</div>
								<div className="col-md-3">
									<Translate id="Is a Fur Clipping?" />
									<Field name="isFurClipping" component="select" disabled={!values.editable && parseInt(values.accountId) !== 1} className={`form-control ${errors.isFurClipping && touched.isFurClipping && 'is-invalid'}`}>
										<option value="1">{props.translate('Yes')}</option>
										<option value="0">{props.translate('No')}</option>
									</Field>
								</div>
								<div className="col-md-3">
									<Translate id="Fragile?" />
									<Field name="fragile" component="select" disabled={!values.editable && parseInt(values.accountId) !== 1} className={`form-control ${errors.fragile && touched.fragile && 'is-invalid'}`}>
										<option value="1">{props.translate('Yes')}</option>
										<option value="0">{props.translate('No')}</option>
									</Field>
								</div>
							</div>
							<div className="row mb-2">
								<div className="col-md-3">
									<Translate id="Can hold remains?" />
									<Field name="remainsFilledIndicator" component="select" disabled={!values.editable && parseInt(values.accountId) !== 1} className={`form-control ${errors.remainsFilledIndicator && touched.remainsFilledIndicator && 'is-invalid'}`}>
										<option value="1">{props.translate('Yes')}</option>
										<option value="0">{props.translate('No')}</option>
									</Field>
								</div>
								<div className="col-md-3">
									<Translate id="Pet Min Weight" />
									<div className="input-group">
										<Field name="petWeightMin" showError={true} disabled={!values.editable && parseInt(values.accountId) !== 1} className={`form-control ${errors.petWeightMin && touched.petWeightMin && 'is-invalid'}`} />
										<div className="input-group-append">
											<div className="input-group-text">{measurementWeight}</div>
										</div>
									</div>
								</div>
								<div className="col-md-3">
									<Translate id="Pet Max Weight" />
									<div className="input-group">
										<Field name="petWeightMax" showError={true} disabled={!values.editable && parseInt(values.accountId) !== 1} className={`form-control ${errors.petWeightMax && touched.petWeightMax && 'is-invalid'}`} />
										<div className="input-group-append">
											<div className="input-group-text">{measurementWeight}</div>
										</div>
									</div>
								</div>
							</div>
							{/* 1 = burial, 2 = cremation */}
							{
								parseInt(values.productTypeId) !== 1 && parseInt(values.productTypeId) !== 2 &&
								<React.Fragment>
									<div className="row mb-2">
										<div className="col-3">
											<Translate id="Weight" />
											<div className="input-group">
												<Field name="weight" disabled={!values.editable && parseInt(values.accountId) !== 1} showError={true}  className={`form-control ${errors.weight && touched.weight && 'is-invalid'}`} />
												<div className="input-group-append">
													<div className="input-group-text">{measurementWeight}</div>
												</div>
											</div>
										</div>
										<div className="col-3">
											<Translate id="Height" />
											<div className="input-group">
												<Field name="height" disabled={!values.editable && parseInt(values.accountId) !== 1} showError={true}  className={`form-control ${errors.height && touched.height && 'is-invalid'}`} />
												<div className="input-group-append">
													<div className="input-group-text">{measurementLength}</div>
												</div>
											</div>
										</div>
										<div className="col-3">
											<Translate id="Length" />
											<div className="input-group">
												<Field name="length" disabled={!values.editable && parseInt(values.accountId) !== 1} showError={true}  className={`form-control ${errors.length && touched.length && 'is-invalid'}`} />
												<div className="input-group-append">
													<div className="input-group-text">{measurementLength}</div>
												</div>
											</div>
										</div>
										<div className="col-3">
											<Translate id="Width" />
											<div className="input-group">
												<Field name="width" disabled={!values.editable && parseInt(values.accountId) !== 1} showError={true}  className={`form-control ${errors.width && touched.width && 'is-invalid'}`} />
												<div className="input-group-append">
													<div className="input-group-text">{measurementLength}</div>
												</div>
											</div>
										</div>
									</div>
									<div className="row mb-2">
										<div className="col-3">
											<Translate id="Product Material"/>
											<Field component="select" disabled={!values.editable && parseInt(values.accountId) !== 1} showError={true} name="productMaterialId" className={`form-control ${errors.productMaterialId && touched.productMaterialId && 'is-invalid'}`}>
												{/* This render to Static Markup is required because options don't like React children as the label */}
													<option value="">{props.translate('Select a Product Material')}</option>
													{ProductMaterials.map((material) => {
															return <option value={material.productMaterialId} key={material.productMaterialId}>{props.translate(material.materialName)}</option>
														}
													)}
											</Field>
										</div>
										<div className="col-3">
											<Translate id="Product Model"/>
											<Field name="productModel" disabled={!values.editable && parseInt(values.accountId) !== 1} showError={true}  className={`form-control ${errors.productModel && touched.productModel && 'is-invalid'}`} />
										</div>
										<div className="col-3">
											<Translate id="Species"/> *
											{!values.editable && parseInt(values.accountId) !== 1 && SpeciesValue.length > 0 &&
												<p>
													{SpeciesValue.map((species) => {
														return <span className="badge badge-secondary mr-3" key={species.value}>{species.label}</span>
													})}
												</p>
											}
											{!values.editable && parseInt(values.accountId) !== 1 && SpeciesValue.length === 0 &&
												<p><span className="badge badge-secondary">All Species</span></p>
											}
											{!(!values.editable && parseInt(values.accountId) !== 1) && <Field component={Select}
												showError={true}
												className={`${errors.Species && touched.Species && "is-invalid"}`}
												name="Species"
												value={SpeciesValue}
												options={SpeciesSelectValues}
												onChange={ speciesChange }
												onBlur={() => setFieldTouched("Species")}
												isMulti
											/>}
										</div>
										<div className="col-3">
											<Translate id="Product Active" />
											<Field name="active" component="select" className={`form-control ${errors.active && touched.active && 'is-invalid'}`}>
												<option value="1">{props.translate('Yes')}</option>
												<option value="0">{props.translate('No')}</option>
											</Field>
										</div>
										<div className="col-3">
											<Translate id="Stock Available"/>
											<Field name="stockAvailable" showError={true} className={`form-control ${errors.stockAvailable && touched.stockAvailable && 'is-invalid'}`} />
										</div>
										<div className="col-3">
											<Translate id="Stock Check" />
											<Field name="stockCheck" component="select" className={`form-control ${errors.stockCheck && touched.stockCheck && 'is-invalid'}`}>
												<option value="1">{props.translate('Yes')}</option>
												<option value="0">{props.translate('No')}</option>
											</Field>
										</div>
									</div>
								</React.Fragment>
							}
								

							{/* This is duplicated in the condition above that has inputs for productTypeId !== 1 && 2 */}
							{
								(parseInt(values.productTypeId) === 1 || parseInt(values.productTypeId) === 2) &&
								<div className="row mb-2">
									<div className="col-3">
										<Translate id="Product Active" />
										<Field name="active" component="select" className={`form-control ${errors.active && touched.active && 'is-invalid'}`}>
											<option value="1">{props.translate('Yes')}</option>
											<option value="0">{props.translate('No')}</option>
										</Field>
									</div>
								</div>
							}
							<div className="row">
								<div className="col-3">
									<Translate id="Hospital Cost" />
									<div className="input-group">
										<div className="input-group-prepend">
											<div className="input-group-text">$</div>
										</div>
										<Field showError={true} name="invoiceCost" className={`form-control-num form-control ${errors.invoiceCost && touched.invoiceCost && 'is-invalid'}`} />
									</div>
								</div>
								<div className="col-3">
									<Translate id="Suggested Retail Price" />
									<div className="input-group">
										<div className="input-group-prepend">
											<div className="input-group-text">$</div>
										</div>
										<Field showError={true} name="priceRetail" className={`form-control-num form-control ${errors.priceRetail && touched.priceRetail && 'is-invalid'}`} />
									</div>
								</div>
								<div className="col-3">
									<Translate id="Our Cost" />
									<div className="input-group">
										<div className="input-group-prepend">
											<div className="input-group-text">$</div>
										</div>
										<Field showError={true} name="crematoryCost" className={`form-control-num form-control ${errors.crematoryCost && touched.crematoryCost && 'is-invalid'}`} />
									</div>
								</div>
								<div className="col-3">
									<Translate id="Sort Order" />
									<Field showError={true} name="sortOrder" className={`form-control-num form-control ${errors.sortOrder && touched.sortOrder && 'is-invalid'}`} />
								</div>
							</div>
							<div className="row mt-3">
								<div className="col-3">
									<Translate id="Tax Rate" />
									<div className="input-group">
										<Field showError={true} name="taxRate" className={`form-control-num form-control ${errors.taxRate && touched.taxRate && 'is-invalid'}`} />
										<div className="input-group-append">
											<div className="input-group-text">%</div>
										</div>
									</div>
								</div>
								{/* B-CS 8-12-20: Hardcode taxRate to 0.06, removed props.Account.getSettingValue("taxRate") */}
								<div className="col-9 mt-2">INSTRUCTIONS: Leave Tax Rate blank for the account setting {Math.multiply(props.Account.getSettingValue("taxRate"), 100).toFixed(2)}% to be applied. Otherwise, enter '0' for no tax to be applied for this product.</div>
							</div>



							<div className="row mt-3">
								<div className="col-12">
									{/* handles edit + display of product image + related info
										https://stackoverflow.com/questions/37065663/array-of-object-deep-comparison-with-lodash
										_(initialValues.images).xorWith(values.images, _.isEqual).isEmpty()
										Compares images array we start with and images array from changes
									 */}
									{_(initialValues.images).xorWith(values.images, _.isEqual).isEmpty() === false && <div className="alert alert-warning">Use the Save button below to save any changes to the Product Images, including Adding, Updating, and Removing them.</div>}
									<FieldArray
										name="images"
										component={ProductImageEditor}
									/>
									{_(initialValues.images).xorWith(values.images, _.isEqual).isEmpty() === false && <div className="alert alert-warning">Use the Save button below to save any changes to the Product Images, including Adding, Updating, and Removing them.</div>}
								</div>
							</div>

							<div className="row">
								<div className="mt-3 col-12">
									<button type="submit" className="btn btn-success" disabled={isSubmitting === true || dirty === false || isValid === false}>
										<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
									</button>
									<Link to={`/products`} className="btn btn-default btn-addon float-right"><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/></Link>
								</div>
							</div>
						</div>
					</Form>

					<div className="row mt-3">
						<div className="col-12">
							{/*<ProductPricing initialValues={ _.pick(Product, "invoiceCost,priceRetail,productId".split(",")) }/>*/}
							{
								showWeightPricing &&
								<React.Fragment>
									<WeightUnitBasedPricing initialValues={ _.pick(Product, "productId,unitWeightInvoiceCost,unitWeightPriceRetail,unitWeightPriceInterval,unitWeightPriceIntervalUnits,unitWeightPriceMax,unitWeightPriceMin".split(",")) } />
									<ProductWeightTierBasedPricing Product={Product} />
								</React.Fragment>
							}
						</div>
					</div>
			</div>
		</React.Fragment>
	);
};

const ProductSaveForm = compose (
	withRouter,
	withSession,
	withState({
		initialLoad: true,
		showMemorializationFields: false,
		tempProductVariations: [],
		tempProductVariationValues: []
	}),
	withMutation(ProductGroupSaveMutation, "ProductGroupSave", [{query: getProductGroups}]),
	withMutation(ProductImageMakeDefaultMutation, "setImageDefault", [{query: getProductsQuery}]),
	withMutation(ProductImageDeleteMutation, "deleteImage", [{query: getProductsQuery}]),
	withMutation(ProductImageSaveMutation, "saveImage"),
	withMutation(ProductSaveMutation, "ProductSave", [{query: getProductsQuery}]),
	withFormik({
		handleSubmit: async ( formData, { props: { deleteImage, initialValues, ProductGroupSave, ProductSave, resetInitialValues, saveImage, setImageDefault, setResponse, tempProductVariations, history }, resetForm} ) => {
			const {
				defaultImage,
				images = [],
				productOptions,
				Species,
				...inputData
			} = formData;		

			// Create the 'tempInput', which we will then remove the unnecessary input variables from next.
			// Ensure we don't send strings for numeric fields by using castNumerics
			// Convert tempProductVariations from an array into a string list so we can pass it through to the save function
			const tempInput = {
				...castNumerics(inputData, "active,weight,height,width,length,personalizationAllowed,personalizationDefaultedToYes,personalizationRequired,fragile,isFurClipping,isPawPrint,remainsFilledIndicator,requiresPawPrint,productMaterialId,sortOrder,stockCheck", true),
				productOptionIds: productOptions.map( ( { value } ) => parseFloat(value)),
				productVariations: tempProductVariations,
				speciesIds: Species.filter(( {value} ) => value !== "ALL_SPECIES" ).map( ( { value } ) => parseFloat(value))
			}

			// Remove form input variales that should not get passed to the productSave function
			const input = _.omit(tempInput, ["productVariationTypeId", "productVariationValueId"]);

			// update the input value for taxRate, need to consider a blank value to be null, otherwise divide by 100 to get the percentage that we will want to save into the db.
			input.taxRate = input.taxRate === '' ? null : Math.divide(parseFloat(input.taxRate),100);

			//  Set petWeightMin and petWeightMax to null if they are blank since blank cant be saved for ints
			input.petWeightMax = input.petWeightMax === '' ? null : parseInt(input.petWeightMax);
			input.petWeightMin = input.petWeightMin === '' ? null : parseInt(input.petWeightMin);

			// If a "New Product Group" is entered, then add it to the productGroups db and return the new Id to pass to the products table. 
			// Otherwise the productGroupId will be 0 or whatever is selected from the group dropdown. For adding a new group, the Id will always be sent to the server as 0.
			if(input.productGroup !== '') {
				let productGroupResponse = await ProductGroupSave({ input: { productGroup: input.productGroup, productGroupId: 0 }});
				input.productGroupId = productGroupResponse.data.productGroupSave.Response && productGroupResponse.data.productGroupSave.Response.success === true ? parseInt(productGroupResponse.data.productGroupSave.productGroupId) : input.productGroupId;
			}
			
			let productId = input.productId;
			let productSaveResponse = {};

			if(input.productId === 0) {
				// Async/Await Perform the mutation (to the server) and decompose the result.
				productSaveResponse = await ProductSave({ input });
				// If there was an error, show the message and return.
				if (productSaveResponse.Response && productSaveResponse.Response.success === false) {
					return setResponse(productSaveResponse.Response);
				}
				productId = productSaveResponse.data.productSave.Product.productId;
			}

			// Get the original images.
			const oldImages = initialValues.images.map(({ productImageId }) => productImageId);

			// Get the new image.
			const curImages = images.map(({ productImageId }) => productImageId);

			// Figure out any images we need to delete.
			const missingImages = oldImages.filter((productImageId) => curImages.includes(productImageId) === false);

			// Delete the images.
			await Promise.all(missingImages.map(async (productImageId) => {
				const { data: {removeProductImage} } = await deleteImage({image: {productImageId}});
				if (!removeProductImage.Response || !removeProductImage.Response.success) {
					setResponse({ message: "Error removing productImages", success: false});
				}
			}));

			// Save updates to product's images (captions, new images)
			const results = await Promise.all(images.map(async (image) => {
				// Save the image
				const { data: { saveProductImage: { productImage } } } = await saveImage({
					image: {
						caption: image.caption,
						fileId: parseInt(image.image.fileId),
						productId: parseInt(productId),
						productImageId: image.productImageId,
						speciesIds: image.Species.map(({ speciesId }) => parseFloat(speciesId))
					}
				});

				return productImage;
			}));

			if (results.includes(null)) {
				return setResponse({ message: 'Error saving product images', success: false});
			}

			// Look up the default image Id.
			const defaultImageId = (images.find(({ defaultImage }) => defaultImage === 1 ) || { productImageId: 0 }).productImageId;

			// If the default image has been specified, try to set it.
			if( defaultImageId !== undefined  && defaultImageId > 0 ) {
				// Save the default image.
				const { data: { makeProductImageDefault }} = await setImageDefault({productImageId: defaultImageId});

				// If there was an error, set the response and return.
				if (makeProductImageDefault.Response.success === false) {
					return setResponse(makeProductImageDefault.Response);
				}
			}
			if( input.productId === 0) {
				history.push("/products/product_save/" + productId);
				//return resetInitialValues(productSaveResponse.data.productSave.Product);
			} else {
				let productSaveResponse = await ProductSave({ input });
				// call function for reseting the initialValues in the class, this will rerender the form and get the productId set correctly for updating if the save button is clicked again if this was an insert.
				setResponse({success: true, message: "Product Updates Saved"});
				let productSave = productSaveResponse.data.productSave;

				return resetInitialValues(productSave.Product);
			}
		},
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		validationSchema: () => Yup.object().shape({
			crematoryCost: Yup.number().typeError("Enter a valid number for Our Cost"),
			invoiceCost: Yup.number().typeError("Enter a valid number for Hospital Cost").required("Hospital Cost is required"),
			petWeightMax: Yup.number().integer("Enter a positive whole number for Pet Max Weight").positive("Enter a positive whole number for Pet Max Weight").typeError("Enter a positive whole number for Pet Max Weight"),
			petWeightMin: Yup.number().integer("Enter a positive whole number for Pet Max Weight").positive("Enter a positive whole number for Pet Max Weight").typeError("Enter a positive whole number for Pet Min Weight"),
			priceRetail: Yup.number().typeError("Enter a valid number for Suggested Retail Price").required("Suggested Retail Price is required"),
			productCategoryId: Yup.number().required("Select a product category"),
			productName: Yup.string().required("Enter a product name"),
			productTypeId: Yup.number().required("Select a product type"),
			sortOrder: Yup.string().required("Enter a numeric Sort Order")
	   })
	}),
	withTranslate
)(ProductSaveFormContent);

const ProductWeightTierBasedPricingContent = (props) => {
	const {
		errors,
		touched,
		isSubmitting,
		dirty,
		Response
	} = props;

	const Product = props.Product || { ProductAccountWeightTierPrice: [] };

	const emptyTier = {
		productId: Product.productId,
		productPriceWeightId:0,
		weightMin: "",
		weightMax: "",
		invoiceCost: "",
		priceRetail: ""
	};

	const measurementWeight = props.Account.getSettingValue("measurementSystem") === "Metric" ? "kg" : "lb";

	return (
		<Form>
			<div>
				<p className="small float-right mt-n-1 mb-1">
					{ Response && dirty === false && <span className="alert alert-success mr-2">{props.translate(Response.message)}</span> }
					<button type="button" onClick={() => props.setState({ initialValues: emptyTier })} className="btn btn-info btn-sm btn-addon">
						<FontAwesomeIcon icon="plus" />
						<Translate id="Add a Tier"/>
					</button>
				</p>
				<h6>Weight Tier Based Pricing</h6>
			</div>

			{
				props.initialValues.productPriceWeightId === 0 &&
				<div className="border p-3">
					<div className="form-row">
						<div className="col-md-2">
							<label htmlFor="minWeight">Min Weight</label>
							<div className="input-group">
								<Field showError={true} name="weightMin" className={`form-control-num form-control ${errors.weightMin && touched.weightMin && 'is-invalid'}`} />
								<div className="input-group-append">
									<div className="input-group-text">{measurementWeight}</div>
								</div>
							</div>
						</div>
						<div className="col-md-2">
							<label htmlFor="maxWeight">Max Weight</label>
							<div className="input-group">
								<Field showError={true} name="weightMax" className={`form-control-num form-control ${errors.weightMax && touched.weightMax && 'is-invalid'}`} />
								<div className="input-group-append">
									<div className="input-group-text">{measurementWeight}</div>
								</div>
							</div>
						</div>
						<div className="col-md-2">
							<label htmlFor="invoiceCost">Hospital Cost</label>
							<div className="input-group">
								<div className="input-group-prepend">
									<div className="input-group-text">$</div>
								</div>
								<Field showError={true} name="invoiceCost" className={`form-control-num form-control ${errors.invoiceCost && touched.invoiceCost && 'is-invalid'}`} />
							</div>
						</div>
						<div className="col-md-2">
							<label htmlFor="priceRetail">Suggested Retail Price</label>
							<div className="input-group">
								<div className="input-group-prepend">
									<div className="input-group-text">$</div>
								</div>
								<Field showError={true} name="priceRetail" className={`form-control-num form-control ${errors.priceRetail && touched.priceRetail && 'is-invalid'}`} />
							</div>
						</div>
					</div>
					<p className="mt-3">
						<button type="submit" className="btn btn-success btn-sm btn-addon" disabled={isSubmitting || dirty === false}>
							<FontAwesomeIcon icon="check" />
							<Translate id="Save"/>
						</button>
						<button type="button" className="btn btn-default btn-sm btn-addon ml-3" disabled={isSubmitting} onClick={() => props.setState({ initialValues: {} })}>
							<FontAwesomeIcon icon="times" />
							<Translate id="Cancel"/>
						</button>
					</p>
				</div>
			}

			<table className="table table-striped w-100 small">
				<thead>
					<tr>
						<th>Min Weight</th>
						<th>Max Weight</th>
						<th>Hospital Cost</th>
						<th>Suggested Retail Price</th>
						<th>Edit</th>
					</tr>
				</thead>
				<tbody>
					{
						Product.ProductAccountWeightTierPrice.length === 0 &&
						<tr><td colSpan="5"> No Price Tiers Saved </td></tr>
					}

					{ Product.ProductAccountWeightTierPrice.map((WeightTierPrice) => (
						<tr key={WeightTierPrice.productPriceWeightId}>
							{
								props.initialValues.productPriceWeightId !== WeightTierPrice.productPriceWeightId &&
									<React.Fragment>
									<td>
										{ WeightTierPrice.weightMin } { measurementWeight }
									</td>
									<td>
										{ WeightTierPrice.weightMax }  { measurementWeight }
									</td>
									<td>
										${ WeightTierPrice.invoiceCost }
									</td>
									<td>
										${ WeightTierPrice.priceRetail }
									</td>
									<td className="pl-0 pr-0">
										<button type="button"
											onClick={() => props.setState({ initialValues: WeightTierPrice }) }
											className="btn btn-info btn-sm btn-addon">
											<FontAwesomeIcon icon="pen" />
											<Translate id="Edit"/>
										</button>
									</td>
								</React.Fragment>
							}

							{
								props.initialValues.productPriceWeightId === WeightTierPrice.productPriceWeightId &&
								<React.Fragment>
									<td>
										<div className="input-group">
											<Field showError={true} name="weightMin" className={`form-control-num form-control ${errors.weightMin && touched.weightMin && 'is-invalid'}`} />
											<div className="input-group-append">
												<div className="input-group-text">
													{ measurementWeight }
												</div>
											</div>
										</div>
									</td>
									<td>
										<div className="input-group">
											<Field showError={true} name="weightMax" className={`form-control-num form-control ${errors.weightMax && touched.weightMax && 'is-invalid'}`} />
											<div className="input-group-append">
												<div className="input-group-text">
												{ measurementWeight }
												</div>
											</div>
										</div>
									</td>

									<td>
										<div className="input-group">
											<div className="input-group-prepend">
												<div className="input-group-text">$</div>
											</div>
											<Field showError={true} name="invoiceCost" className={`form-control-num form-control ${errors.invoiceCost && touched.invoiceCost && 'is-invalid'}`} />
										</div>
									</td>

									<td>
										<div className="input-group">
											<div className="input-group-prepend">
												<div className="input-group-text">$</div>
											</div>
											<Field showError={true} name="priceRetail" className={`form-control-num form-control ${errors.priceRetail && touched.priceRetail && 'is-invalid'}`} />
										</div>
									</td>
									<td>
										<button type="submit" className="btn btn-success btn-sm btn-addon" disabled={isSubmitting || dirty === false}>
											<FontAwesomeIcon icon="check" />
											<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
										</button>
										<button className="btn btn-default btn-sm btn-addon ml-3" disabled={isSubmitting} onClick={() => props.setState({ initialValues: {} })}>
											<FontAwesomeIcon icon="times" />
											<Translate id="Cancel"/>
										</button>
										<React.Fragment>
											<button type="button" className="btn btn-danger btn-sm btn-addon ml-3 float-right" onClick={props.modal.toggleModal}><Translate id="Remove" /></button>
											{/* Modal requires state, use withModal (in compose below) if needed. */}
											<Modal isOpen={props.modal.modalOpen} toggle={props.modal.toggleModal}>
												<ModalHeader><Translate id="Remove Tier"/></ModalHeader>
												<ModalBody>
													<Translate id="Remove Tier Confirmation" />{/*Are you sure you want to remove the product price tier:.*/}
												</ModalBody>
												<ModalFooter>
													<button type="button" onClick={() =>  props.ProductAccountWeightTierPriceRemove({ productPriceWeightId: props.initialValues.productPriceWeightId })} className="btn btn-danger">
														<Translate id="Remove Tier"/>
													</button>
													<button onClick={props.modal.toggleModal} className="btn btn-default ml-3"><Translate id="Cancel"/></button>
												</ModalFooter>
											</Modal>
										</React.Fragment>
									</td>
								</React.Fragment>
							}
						</tr>
					))}
				</tbody>
			</table>
		</Form>
	);
};

export const ProductWeightTierBasedPricing = compose(
	withModalState,
	withSession,
	withMutation(ProductAccountWeightTierPriceRemoveMutation, "ProductAccountWeightTierPriceRemove", ["getProduct"]),
	withMutation(ProductAccountWeightTierPriceSaveMutation, "ProductAccountWeightTierPriceSave", ["getProduct"]),
	withState({ initialValues: {}}),
	withFormik({
		handleSubmit: async (inputValues, { props: { ProductAccountWeightTierPriceSave, setState, setResponse }}) => {
			const input = _.mapValues(inputValues, (value, key) => {
				if( ["weightMin","weightMax"].find((field) => field === key)) {
					return parseFloat(value);
				} else if( ["priceRetail","invoiceCost"].find((field) => field === key) && value === "") {
					return null;
				} else {
					return value;
				}
			} );

			const result = await ProductAccountWeightTierPriceSave({ input });
			setState({ initialValues: {} });
			setResponse(result.data.productAccountWeightTierPriceSave.Response);
		},
		validate: (values ) => {
			let errors = {};

			if(values.weightMin === '') { errors.weightMin = 'Enter a weight'; } else { delete errors.weightMin; };
			if(values.weightMax === '') { errors.weightMax = 'Enter a weight'; } else { delete errors.weightMax; };
			if(values.invoiceCost === '') { errors.invoiceCost = 'Enter a cost'; } else { delete errors.invoiceCost; };
			if(values.priceRetail === '') { errors.priceRetail = 'Enter a price'; } else { delete errors.priceRetail; };

			return errors
		}
	}),
	withTranslate
)(ProductWeightTierBasedPricingContent);

const WeightUnitBasedPricingContent = (props) => {
	const {
		isSubmitting,
		dirty,
		initialValues: {
			unitWeightInvoiceCost,
			unitWeightPriceMax,
			unitWeightPriceMin,
			unitWeightPriceRetail,
			unitWeightPriceInterval
		},
		errors,
		touched,
		resetForm
	} = props;

	const measurementWeight = props.Account.getSettingValue("measurementSystem") === "Metric" ? "kg" : "lb";

	const cancel = () => {
		resetForm();
		props.setState({ edit: false });
	}
	return (
		<Form>
			<h6 className="">Weight Unit Based Pricing</h6>
			<p className="small">CURRENTLY: ${unitWeightInvoiceCost} / {unitWeightPriceInterval} {measurementWeight} from {unitWeightPriceMin} to {unitWeightPriceMax} {measurementWeight}</p>
			<table className="table table-striped w-100 small">
				<thead>
					<tr>
						<th>Min Weight</th>
						<th>Max Weight</th>
						<th>Hospital Cost</th>
						<th>Suggested Retail Price</th>
						<th>Interval</th>
						<th>Edit</th>
					</tr>
				</thead>
				<tbody>
					{ props.edit === false &&
						<tr>
							<td>{unitWeightPriceMin} { measurementWeight }</td>
							<td>{unitWeightPriceMax} { measurementWeight }</td>
							<td>${unitWeightInvoiceCost}</td>
							<td>${unitWeightPriceRetail}</td>
							<td>{unitWeightPriceInterval} { measurementWeight }</td>
							<td className="pl-0 pr-0">
								<button
									type="button"
									className="btn btn-info btn-sm btn-addon"
									onClick={() => props.setState({ edit: props.edit === false })}
								>
									<FontAwesomeIcon icon="pen" />
									<Translate id="Edit"/>
								</button>
							</td>
						</tr>
					}

					{
						props.edit === true &&
						<tr>
							<td>
								<div className="input-group">
									<Field showError={true} name="unitWeightPriceMin" className={`form-control-num form-control ${errors.unitWeightPriceMin && touched.unitWeightPriceMin && 'is-invalid'}`} />
									<div className="input-group-append">
										<div className="input-group-text">
											{ measurementWeight }
										</div>
									</div>
								</div>
							</td>
							<td>
								<div className="input-group">
									<Field showError={true} name="unitWeightPriceMax" className={`form-control-num form-control ${errors.unitWeightPriceMax && touched.unitWeightPriceMax && 'is-invalid'}`} />
									<div className="input-group-append">
										<div className="input-group-text">
											{ measurementWeight }
										</div>
									</div>
								</div>
							</td>
							<td>
								<div className="input-group">
									<div className="input-group-prepend">
										<div className="input-group-text">$</div>
									</div>
									<Field showError={true} name="unitWeightInvoiceCost" className={`form-control-num form-control ${errors.unitWeightInvoiceCost && touched.unitWeightInvoiceCost && 'is-invalid'}`} />
								</div>
							</td>

							<td>
								<div className="input-group">
									<div className="input-group-prepend">
										<div className="input-group-text">$</div>
									</div>
									<Field showError={true} name="unitWeightPriceRetail" className={`form-control-num form-control ${errors.unitWeightPriceRetail && touched.unitWeightPriceRetail && 'is-invalid'}`} />
								</div>
							</td>
							<td>
								<div className="input-group">
									<Field showError={true} name="unitWeightPriceInterval" className={`form-control-num form-control ${errors.unitWeightPriceInterval && touched.unitWeightPriceInterval && 'is-invalid'}`} />
									<div className="input-group-append">
										<div className="input-group-text">
											{ measurementWeight }
										</div>
									</div>
								</div>
							</td>
							<td>
								<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
									<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
								</button>
								<button className="btn btn-default ml-2" disabled={isSubmitting} onClick={cancel}>
									<Translate id="Cancel"/>
								</button>
							</td>
						</tr>
					}
				</tbody>
			</table>
		</Form>
	)
}

export const WeightUnitBasedPricing = compose(
	withSession,
	withState({ edit: false}),
	withMutation(ProductSaveMutation, "ProductSave"),
	withFormik({
		handleSubmit: async (inputValues, component) => {
			const input = _.mapValues(inputValues, (value, key) => {
				if( "unitWeightPriceInterval,unitWeightPriceMax,unitWeightPriceMin".split(",").find((field) => field === key)) {
					return parseFloat(value);
				} else {
					return value;
				}
			} );

			await component.props.ProductSave({ input });
			component.props.setState({ edit: false });
		},
		validate: (values ) => {
			let errors = {};

			if(values.unitWeightPriceMin === '') { errors.unitWeightPriceMin = 'Enter a weight'; } else { delete errors.unitWeightPriceMin; };
			if(values.unitWeightPriceMax === '') { errors.unitWeightPriceMax = 'Enter a weight'; } else { delete errors.unitWeightPriceMax; };
			if(values.unitWeightInvoiceCost === '') { errors.unitWeightInvoiceCost = 'Enter a cost'; } else { delete errors.unitWeightInvoiceCost; };
			if(values.unitWeightPriceRetail === '') { errors.unitWeightPriceRetail = 'Enter a price'; } else { delete errors.unitWeightPriceRetail; };
			if(values.unitWeightPriceInterval === '' || isNaN(parseFloat(values.unitWeightPriceInterval)) || !isFinite(values.unitWeightPriceInterval)) { errors.unitWeightPriceInterval = 'Enter a valid number'; } else { delete errors.unitWeightPriceInterval; };

			return errors
		}
	})
)(WeightUnitBasedPricingContent);

// const ProductPricingContent = (props) => {
// 	const {
// 		isSubmitting,
// 		dirty,
// 		initialValues: {
// 			invoiceCost,
// 			priceRetail
// 		},
// 		errors,
// 		touched,
// 		resetForm
// 	} = props;
//
// 	const cancel = () => {
// 		resetForm();
// 		props.setState({ edit: false });
// 	}
//
// 	return (
// 		<Form>
// 			<h6 className="">Product Pricing</h6>
// 			<table className="table table-striped w-100 small">
// 				<thead>
// 					<tr>
// 						<th>Hospital Cost</th>
// 						<th>Suggested Retail Price</th>
// 						<th>Edit</th>
// 					</tr>
// 				</thead>
// 				<tbody>
// 					{ props.edit === false &&
// 						<tr>
// 							<td>${invoiceCost}</td>
// 							<td>${priceRetail}</td>
// 							<td>
// 								<button
// 									type="button"
// 									className="btn btn-info btn-sm btn-addon"
// 									onClick={() => props.setState({ edit: props.edit === false })}
// 								>
// 									<FontAwesomeIcon icon="pen" />
// 									<Translate id="Edit"/>
// 								</button>
// 							</td>
// 						</tr>
// 					}
//
// 					{
// 						props.edit === true &&
// 						<tr>
// 							<td>
// 								<div className="input-group">
// 									<div className="input-group-prepend">
// 										<div className="input-group-text">$</div>
// 									</div>
// 									<Field showError={true} name="invoiceCost" className={`form-control-num form-control ${errors.invoiceCost && touched.invoiceCost && 'is-invalid'}`} />
// 								</div>
// 							</td>
// 							<td>
// 								<div className="input-group">
// 									<div className="input-group-prepend">
// 										<div className="input-group-text">$</div>
// 									</div>
// 									<Field showError={true} name="priceRetail" className={`form-control-num form-control ${errors.priceRetail && touched.priceRetail && 'is-invalid'}`} />
// 								</div>
// 							</td>
// 							<td>
// 								<button type="submit" className="btn btn-success" disabled={isSubmitting || dirty === false}>
// 									<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
// 								</button>
// 								<button className="btn btn-default ml-2" disabled={isSubmitting} onClick={cancel}>
// 									<Translate id="Cancel"/>
// 								</button>
// 							</td>
// 						</tr>
// 					}
// 				</tbody>
// 			</table>
// 		</Form>
// 	);
// };

// const ProductPricing = compose(
// 	withState({ edit: false}),
// 	withMutation(ProductSaveMutation, "ProductSave"),
// 	withFormik({
// 		handleSubmit: async (input, component) => {
// 			await component.props.ProductSave({ input });
// 			component.props.setState({ edit: false });
// 		},
// 		validationSchema: () => Yup.object().shape({
// 			invoiceCost: Yup.number().typeError("Enter a valid number for Hospital Cost").required("Hospital Cost is required"),
// 			priceRetail: Yup.number().typeError("Enter a valid number for Suggested Retail Price").required("Suggested Retail Price is required")
// 		})
// 	})
// )(ProductPricingContent);

class ProductSaveClass extends React.Component {
	constructor(props) {
		super(props);

		this.state = this.getInitialValues(props.match.params.productId > 0 ? props.data.Product : undefined);
	}

	resetInitialValues = (Product) => this.setState(this.getInitialValues(Product));
	
	// This function is used within the handleSubmit callback of Formik above in order to get the productId into the form after there is a new product
	//created so that the details can be updated without having to redirect to the true product edit page with the productId in the URL
	getInitialValues(Product) {
		if(Product !== undefined) {
			 return {
				initialValues: {
					accountId: Product.accountId,
					active: Product.active,
					accountDescriptionLong: Product.accountDescriptionLong,	// account level override for descriptionLong
					accountDescriptionShort: Product.accountDescriptionShort,	// account level override for descriptionShort
					accountProductName: Product.accountProductName,	// account level override for productName
					crematoryCost: Product.crematoryCost,
					defaultImage: Product.defaultImage,
					descriptionLong: Product.descriptionLong,
					descriptionShort: Product.descriptionShort,
					editable: Product.editable,
					height: Product.height,
					images: Product.images,
					invoiceCost: Product.invoiceCost,
					length: Product.length,
					personalizationAllowed: Product.personalizationAllowed,
					personalizationDefaultedToYes: Product.personalizationDefaultedToYes,
					personalizationRequired: Product.personalizationRequired,
					fragile: Product.fragile,
					isFurClipping: Product.isFurClipping,
					isPawPrint: Product.isPawPrint,
					remainsFilledIndicator: Product.remainsFilledIndicator,
					requiresPawPrint: Product.requiresPawPrint,
					petWeightMax: Product.petWeightMax,
					petWeightMin: Product.petWeightMin,
					priceRetail: Product.priceRetail,
					productCategoryId: Product.productCategoryId,
					productGroup: '',
					productGroupId: Product.productGroupId !== null ? parseInt(Product.productGroupId) : 0,
					productId: Product.productId,
					productMaterialId: Product.productMaterialId,
					productModel: Product.productModel,
					productName: Product.productName,
					productTypeId: Product.productTypeId,
					sortOrder: Product.sortOrder,
					stockAvailable: Product.stockAvailable,
					stockCheck: Product.stockCheck,
					taxRate: Product.taxRate !== null ? Math.multiply(Product.taxRate, 100) : '',
					weight: Product.weight,
					weightUnits: Product.weightUnits,
					width: Product.width,
					Species: Product.Species.map(( { speciesId: value, species: label } ) => ({ value, label }) ),
					productOptions: _.uniqBy(Product.ProductAttributes,"productOptionId").map(( { productOptionId: value, optionName: label, sortOrderProductOption } ) => ( { value, label, sortOrderProductOption } ) )
				}
			};
		} else {
			return {
				initialValues: {
					accountId: null,
					active: 1,
					accountDescriptionLong: '',	// account level override for descriptionLong
					accountDescriptionShort: '',	// account level override for descriptionShort
					accountProductName: '',	// account level override for productName
					crematoryCost: '0.00',
					defaultImage: {},
					descriptionLong: '',
					descriptionShort: '',
					editable: 1,
					height: null,
					images: [],
					invoiceCost: '0.00',
					length: null,
					personalizationAllowed: 0,
					personalizationDefaultedToYes: 0,
					personalizationRequired: 0,
					fragile: 0,
					isFurClipping: 0,
					isPawPrint: 0,
					remainsFilledIndicator: 0,
					requiresPawPrint: 0,
					petWeightMax: '',
					petWeightMin: '',
					priceRetail: '0.00',
					productCategoryId: 0,
					productGroup: '',
					productGroupId: 0,
					productId: 0,
					productMaterialId: 0,
					productModel: '',
					productName: '',
					productTypeId: 0,
					sortOrder: 0,
					stockAvailable: '',
					stockCheck: 0,
					taxRate: null,
					weight: null,
					weightUnits: 'Lb',
					width: null,
					Species: [],
					productOptions: []
				}
			};
		}
	}

	render () {
		const {
			data: {
				ProductCategories,
				ProductGroups,
				ProductMaterials,
				ProductTypes,
				Product,
				Species
			},
			PairableProducts: { ProductsPairingsMemorializations: PairableProducts },
			ProductPairings: { ProductPairings },
			ProductVariationTypes: { ProductVariationTypes },
			ProductVariationValues: { ProductVariationValues }
		} = this.props;
		const { initialValues } = this.state;

		const image = (Product && Product.defaultImage) ? Product.defaultImage.image : null;

		const SelectedProductOptions = (Product && Product.ProductAttributes) ? _.uniqBy(Product.ProductAttributes,"productOptionId").map(( { productOptionId: value, optionName: label, sortOrderProductOption } ) => ( { value, label, sortOrderProductOption } ) ) : null;
		
		return (
			<div className="w-100 p-1">
				<div className="card p-3">
					<ProductSaveForm
						initialValues={initialValues}
						PairableProducts={PairableProducts}
						ProductCategories={ProductCategories}
						ProductGroups={ProductGroups}
						ProductMaterials={ProductMaterials}
						ProductPairings={ProductPairings}
						ProductTypes={ProductTypes}
						ProductVariationTypes={ProductVariationTypes}
						ProductVariationValues={ProductVariationValues}
						resetInitialValues={this.resetInitialValues}
						Product={Product}
						Species={Species}
						image={image}
					/>
				</div>
				<div className="mt-3">
					<ProductOptionsListContainer
						accountId={initialValues.accountId}
						editable={initialValues.editable}
						Product={Product}
						productId={this.props.match.params.productId}
						productTypeId={initialValues.productTypeId}
						SelectedProductOptions={SelectedProductOptions}
					/>
				</div>
			</div>
		)
	}
}

export const ProductSave = compose(
	withRouter,
	queryWithLoading({
		gqlString: getProductPairings, variablesFunction: (props) => ({productId: props.match.params.productId ? props.match.params.productId : 0}),
		name: "ProductPairings"
	}),
	queryWithLoading({
		gqlString: getProductQuery, variablesFunction: (props) => ({productId: props.match.params.productId ? props.match.params.productId : 0}),
		requiredPermission: { permission: "products", permissionLevel: 4}
	}),
	queryWithLoading({gqlString: getProductsPairingsMemorializations, name: "PairableProducts"}),
	queryWithLoading({gqlString: getProductVariationTypes, name: "ProductVariationTypes"}),
	queryWithLoading({gqlString: getProductVariationValues, name: "ProductVariationValues"}),
	withTranslate
)(ProductSaveClass)
