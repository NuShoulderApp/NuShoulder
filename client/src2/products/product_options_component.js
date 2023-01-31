import { compose } from "react-apollo";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';	// IMPORTANT: Add any icons you want to use to the index.js import { ... } from '@fortawesome/free-solid-svg-icons' AND library.add(...)
import React from 'react';
import Select from "react-select";
import { withFormik, Field } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import { withState } from "react-state-hoc";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	getProductOptions,
	getProductOptionTypes,
	getProductOptionValues,
	ProductOptionSaveMutation,
	ProductOptionValuesReorderMutation
} from './products_graphql';

const ProductOptionsList = (props) => {
	const {
		dragNDropDisabled,
		editId,
		isRequired,
		maxLength,
		message,
		messageOptionAdded,
		messageOptionAddedStatus,
		messageStatus,
		minLength,
		optionName,
		ProductOptions: { ProductOptions },
		ProductOptionSave,
		productOptionTypeId,
		ProductOptionTypes: { ProductOptionTypes },
		productOptionValueIds,
		productOptionValues,
		productOptionValuesList, // This is used for the drag and drop, it is set to the same value as the productOptionValues when the Edit button is clicked, but isn't changed when more options are added to the multiselect.
		ProductOptionValues: { ProductOptionValues },
		ProductOptionValuesReorder,
		setState,
	} = props;

	// Map the ProductOptionValues into an array in the value/label format the the multiselector can use.
	const ProductOptionValuesMultiSelect = ProductOptionValues.map(({productOptionValueId: value, valueLabel: label}) => ({ value, label }) );
	// Function for when table row's Edit button is clicked
	function handleEdit(productOptionId) {
		const EditProductOption = ProductOptions.find((option) => parseInt(option.productOptionId) === parseInt(productOptionId));
		const TempProductOptionValues = EditProductOption.ProductOptionValue.map(({productOptionValueId: value, valueLabel: label}) => ({ value, label }) );
		const tempProductOptionValueIds = EditProductOption.ProductOptionValue.map((option) => (parseInt(option.productOptionValueId)));

		setState({
			editId: parseInt(productOptionId),
			isRequired: EditProductOption.isRequired,
			maxLength: EditProductOption.maxLength,
			message: '',
			messageOptionAdded: '',
			messageOptionAddedStatus: '',
			messageStatus: '',
			minLength: EditProductOption.minLength,
			optionName: EditProductOption.optionName,
			productOptionTypeId: EditProductOption.productOptionTypeId,
			productOptionValueIds: tempProductOptionValueIds.join(),
			productOptionValues: TempProductOptionValues,
			productOptionValuesList: TempProductOptionValues
		})
	}

	// Function for adding new product option
	function handleAdd() {
		const tempProductOptionTypeId = ProductOptionTypes.find((type) => type.typeName === 'Dropdown') ? ProductOptionTypes.find((type) => type.typeName === 'Dropdown').productOptionTypeId : 0;

		setState({
			editId: -1,
			isRequired: 1,
			maxLength: 32,
			message: '',
			messageOptionAdded: '',
			messageOptionAddedStatus: '',
			messageStatus: '',
			minLength: 0,
			optionName: '',
			productOptionTypeId: tempProductOptionTypeId,
			productOptionValueIds: '',
			productOptionValues: [],
			productOptionValuesList: []
		});
	}

	// Function for when In-line Save button is clicked
	async function handleSaveProductOption(productOptionId) {
		// If this is a TEXT type, need to clear out all of the product option values, and set it to just the 'TEXT' option. If it is the 'DROPDOWN' type, always remove the 'TEXT' option.
		const tempProductOptionValueIds = ProductOptionTypes.find((type) => type.typeName === 'Text').productOptionTypeId === productOptionTypeId ? ProductOptionValues.find((value) => value.valueLabel === 'TEXT').productOptionValueId : productOptionValueIds;
		const successMessageText = ProductOptionTypes.find((type) => type.typeName === 'Text').productOptionTypeId === productOptionTypeId ? 'Product Option Saved.' : 'Product Option saved. Please check that the sort order below for the Option Values is correct.';

		const { data: { productOptionSave }} = await ProductOptionSave({ input: { isRequired: parseInt(isRequired), maxLength: parseInt(maxLength), minLength: parseInt(minLength), optionName, productOptionId, productOptionTypeId, productOptionValueIds: tempProductOptionValueIds } });

		if(productOptionSave.Response.success === true) {
			const tempProductOptionValues = productOptionSave.ProductOptionValues.map(( { productOptionValueId: value, valueLabel: label } ) => ( { value, label } ) );
			// If this was a newly added product option, then we want to close the add form and show a success message at the top of the form.
			if(editId === -1) {
				setState({
					dragNDropDisabled: false,
					editId: productOptionSave.productOptionId,
					message: successMessageText,
					messageOptionAdded: 'Product Option added to list, and the edit form is opened below. Please scroll down to check that the sort order of Option Values is correct if applicable.',
					messageOptionAddedStatus: 'success',
					messageStatus: 'success',
					productOptionValuesList: tempProductOptionValues
				});
			} else {
				setState({
					dragNDropDisabled: false,
					message: successMessageText,
					messageStatus: 'success',
					productOptionValuesList: tempProductOptionValues});
			}
		} else {
			setState({message: 'Product Option not saved', messageStatus: 'danger'});
		}
	}
	// Function for handling changes to the Product Option Values multiselect
	function productOptionValueChange(selectedProductOptionValues, { option: newOption = {} }) {
		if( selectedProductOptionValues.length === 0 ) {
			setState({
				dragNDropDisabled: true,
				message: 'Drag and Drop reordering has been disabled. Please save the product option values to update the list below',
				messageOptionAdded: '',
				messageOptionAddedStatus: '',
				messageStatus: 'warning',
				productOptionValues: [],
				productOptionValueIds: ''
			});
		} else {
			let productOptionValueIds = selectedProductOptionValues.map((option) => {
				return option.value;
			})
			productOptionValueIds = productOptionValueIds.join();
			setState({
				dragNDropDisabled: true,
				message: 'Drag and Drop reordering has been disabled. Please save the product option values for them to show up below and enable reordering.',
				messageOptionAdded: '',
				messageOptionAddedStatus: '',
				messageStatus: 'warning',
				productOptionValues: selectedProductOptionValues,
				productOptionValueIds
			});
		}
	}
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
			productOptionValuesList,
			result.source.index,
			result.destination.index
		);

		let draggedItem = items[result.destination.index];

		let ProductOptionValuesReorderInput = {
			productOptionId: editId,
			productOptionValueId: parseInt(draggedItem.value),
			sortOrderProductOptionValueOld: result.source.index + 1,
			sortOrderProductOptionValueNew: result.destination.index + 1
		}

		const { data: { productOptionValuesReorder: { ProductOptionValues }}} = await ProductOptionValuesReorder({input: ProductOptionValuesReorderInput});

		const tempProductOptionValues = ProductOptionValues.map(( { productOptionValueId: value, valueLabel: label } ) => ( { value, label } ) );

		// Update the state variable for displaying the list of reorderable Product Options
		setState({ productOptionValuesList: tempProductOptionValues });
	}

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				<h3><span className="text-white text-shadow"><Translate id="Product Options Admin" /></span>
					<button type="button" className="btn btn-info btn-addon btn-sm float-right" onClick={() => handleAdd()}><FontAwesomeIcon icon="plus" /> <Translate id="Add Product Option" /></button>
				</h3>
				<div className="card p-3">
					<table className="table table-striped">
						<thead>
							<tr>
								<th><Translate id="Product Option" /></th>
								<th><Translate id="Type" /></th>
								<th><Translate id="Min Length" /></th>
								<th><Translate id="Max Length" /></th>
								<th><Translate id="Required" /></th>
								<th><Translate id="Edit" /></th>
							</tr>
						</thead>
						<tbody>
							{/* Display the success message when a new product option is added */}
							{
								messageOptionAdded !== '' &&
								<tr>
									<td colSpan="6">
										<div className="row">
											<div className="col-12">
												<div className={`alert alert-${messageOptionAddedStatus} mb-0`}>{messageOptionAdded}</div>
											</div>
										</div>
									</td>
								</tr>
							}
							{
								editId === -1 &&
								<React.Fragment>
									<tr>
										<td>
											<Field value={optionName} name="optionName" onChange={(event) => setState({optionName: event.target.value})} className="form-control" />
										</td>
										<td>
											<Field value={productOptionTypeId} name="productOptionTypeId" onChange={(event) => setState({productOptionTypeId: event.target.value})} component="select" className="form-control">
												{/* Only show the options for Dropdown and Text */}
												{ProductOptionTypes.filter((type) => type.typeName === 'Dropdown' || type.typeName === 'Text').map((type) => {
													return <option value={type.productOptionTypeId} key={type.productOptionTypeId}>{type.typeName}</option>
												})}
											</Field>
										</td>
										<td>
											<Field value={minLength} name="minLength" onChange={(event) => setState({minLength: event.target.value})} className="form-control" />
										</td>
										<td>
											<Field value={maxLength} name="maxLength" onChange={(event) => setState({maxLength: event.target.value})} className="form-control" />
										</td>
										<td>
											<Field value={isRequired} name="isRequired" onChange={(event) => setState({isRequired: event.target.value})} component="select" className="form-control">
												<option value={1}>True</option>
												<option value={0}>False</option>
											</Field>
										</td>
										<td><button className="btn btn-default btn-sm btn-addon" onClick={() => setState({editId: 0})}><FontAwesomeIcon icon="times" /> <Translate id="Close" /></button></td>
									</tr>
									<tr>
										<td colSpan="5">
											{
												ProductOptionTypes.find((type) => type.typeName === 'Text').productOptionTypeId !== productOptionTypeId &&
												<React.Fragment>
													<Translate id="Option Values for this Product Option" />
													<Field component={Select}
														showError={true}
														className=""
														name="productOptionValues"
														value={productOptionValues}
														options={ProductOptionValuesMultiSelect}
														onChange={ productOptionValueChange }
														isMulti
													/>
												</React.Fragment>
											}
										</td>
										<td><button className="btn btn-success mt-4" onClick={() => handleSaveProductOption(0)} disabled={optionName === ''}><Translate id="Save" /></button></td>
									</tr>
									<tr>
										<td colSpan="6">
											{/* Drag and Drop productOptionValues created from the selected productOptionValues multiselect above into the display order */}
											{
												ProductOptionTypes.find((type) => type.typeName === 'Text').productOptionTypeId !== productOptionTypeId &&
												<React.Fragment>
													{
														productOptionValuesList.length > 0 &&
														<DragDropContext onDragEnd={onDragEnd}>
															<Droppable droppableId="droppable">
																{(provided, snapshot) => (
																	<div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)}>
																		{productOptionValuesList.map((item, index) => {
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
													}
												</React.Fragment>
											}
										</td>
									</tr>
								</React.Fragment>
							}
							{ProductOptions.map((option) => {
								return (
									<React.Fragment key={option.productOptionId}>
										{
											parseInt(editId) === parseInt(option.productOptionId) &&
											<React.Fragment>
												<tr>
													<td>
														<Field value={optionName} name="optionName" onChange={(event) => setState({optionName: event.target.value})} className="form-control" />
													</td>
													<td>
														<Field value={productOptionTypeId} name="productOptionTypeId" onChange={(event) => setState({productOptionTypeId: event.target.value})} component="select" className="form-control">
															{/* Only show the options for Dropdown and Text */}
															{ProductOptionTypes.filter((type) => type.typeName === 'Dropdown' || type.typeName === 'Text').map((type) => {
																return <option value={type.productOptionTypeId} key={type.productOptionTypeId}>{type.typeName}</option>
															})}
														</Field>
													</td>
													<td>
														<Field value={minLength} name="minLength" onChange={(event) => setState({minLength: event.target.value})} className="form-control" />
													</td>
													<td>
														<Field value={maxLength} name="maxLength" onChange={(event) => setState({maxLength: event.target.value})} className="form-control" />
													</td>
													<td>
														<Field value={isRequired} name="isRequired" onChange={(event) => setState({isRequired: event.target.value})} component="select" className="form-control">
															<option value={1}>Yes</option>
															<option value={0}>No</option>
														</Field>
													</td>
													<td><button className="btn btn-default btn-sm btn-addon" onClick={() => setState({editId: 0})}><FontAwesomeIcon icon="times" /> <Translate id="Close" /></button></td>
												</tr>
												<tr>
													<td colSpan="5">
														{
															ProductOptionTypes.find((type) => type.typeName === 'Text').productOptionTypeId !== productOptionTypeId &&
															<React.Fragment>
																<Translate id="Option Values for this Product Option" />
																<Field component={Select}
																	showError={true}
																	className=""
																	name="productOptionValues"
																	value={productOptionValues}
																	options={ProductOptionValuesMultiSelect}
																	onChange={ productOptionValueChange }
																	isMulti
																/>
															</React.Fragment>
														}
													</td>
													<td><button className="btn btn-success mt-4" onClick={() => handleSaveProductOption(option.productOptionId)}><Translate id="Save" /></button></td>
												</tr>
												<tr>
													<td colSpan="6">
														{/* Drag and Drop productOptionValues created from the selected productOptionValues multiselect above into the display order */}
														{
															<React.Fragment>
																{
																	message !== '' &&
																	<div className="col-auto">
																		<div className={`alert alert-${messageStatus} mb-0`}>{message}</div>
																	</div>
																}
																{
																	ProductOptionTypes.find((type) => type.typeName === 'Text').productOptionTypeId !== productOptionTypeId &&
																	productOptionValuesList.length > 0 &&
																	<DragDropContext onDragEnd={onDragEnd}>
																		<Droppable droppableId="droppable">
																			{(provided, snapshot) => (
																				<div ref={provided.innerRef} style={getListStyle(snapshot.isDraggingOver)}>
																					{productOptionValuesList.map((item, index) => {
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
																}
															</React.Fragment>
														}
													</td>
												</tr>
											</React.Fragment>
										}
										{
											parseInt(editId) !== parseInt(option.productOptionId) &&
											<tr>
												<td>{option.optionName}</td>
												<td>{option.typeName}</td>
												<td>{option.minLength}</td>
												<td>{option.maxLength}</td>
												<td>{parseInt(option.isRequired) === 1 && <span>Yes</span>}{parseInt(option.isRequired) === 0 && <span>No</span>}</td>
												<td className="pl-0 pr-0"><button className="btn btn-info btn-sm btn-addon" onClick={() => handleEdit(option.productOptionId)}><FontAwesomeIcon icon="pen" /> <Translate id="Edit" /></button></td>
											</tr>
										}
									</React.Fragment>
								)
							})}
						</tbody>
					</table>
				</div>
			</div>
		</React.Fragment>
	)
}

export const ProductOptions = compose(
	queryWithLoading({
		gqlString: getProductOptions,
		name: 'ProductOptions',
		requiredPermission: { permission: "products", permissionLevel: 4}
	}),
	queryWithLoading({
		gqlString: getProductOptionTypes,
		name: 'ProductOptionTypes',
		requiredPermission: { permission: "products", permissionLevel: 4}
	}),
	queryWithLoading({
		gqlString: getProductOptionValues,
		name: 'ProductOptionValues',
		requiredPermission: { permission: "products", permissionLevel: 4}
	}),
	withFormik(),
	withMutation(ProductOptionSaveMutation, "ProductOptionSave", ["getProductOptions"]),
	withMutation(ProductOptionValuesReorderMutation, "ProductOptionValuesReorder"),
	withRouter,
	withState({
		dragNDropDisabled: false,
		editId: 0,
		isRequired: 1,
		maxLength: 0,
		message: '',
		messageOptionAdded: '',
		messageOptionAddedStatus: '',
		messageStatus: '',
		minLength: 0,
		optionName: '',
		productOptionTypeId: 0,
		productOptionValueIds: '',
		productOptionValues: [],
		productOptionValuesList: []
	}),
	withTranslate
)(ProductOptionsList)
