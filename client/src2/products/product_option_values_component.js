import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';	// IMPORTANT: Add any icons you want to use to the index.js import { ... } from '@fortawesome/free-solid-svg-icons' AND library.add(...)
import React from 'react';
import { withFormik, Field } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import { withState } from "react-state-hoc";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	getProductOptionValues,
	ProductOptionValueSaveMutation
} from './products_graphql';

const ProductOptionValuesList = (props) => {
	const {
		editId,
		messageOptionAdded,
		messageOptionAddedStatus,
		ProductOptionValues: { ProductOptionValues },
		ProductOptionValueSave,
		productOptionValueSaved,
		setState,
		valueLabel
	} = props;

	// Function for when table row's Edit button is clicked
	function handleEdit(productOptionValueId) {
		const EditProductOptionValue = ProductOptionValues.find((optionValue) => parseInt(optionValue.productOptionValueId) === parseInt(productOptionValueId));

		setState({
			editId: parseInt(productOptionValueId),
			messageOptionAdded: '',
			messageOptionAddedStatus: '',
			productOptionValueSaved: false,
			valueLabel: EditProductOptionValue ? EditProductOptionValue.valueLabel : ''
		})
	}

	// Function for adding new product option
	function handleAdd() {
		setState({
			editId: -1,
			messageOptionAdded: '',
			messageOptionAddedStatus: '',
			productOptionValueSaved: false,
			valueLabel: ''
		});
	}

	// Function for when In-line Save button is clicked
	async function handleSaveProductOptionValue(productOptionValueId) {
		const { data: { productOptionValueSave }} = await ProductOptionValueSave({ input: { productOptionValueId, valueLabel } });

		if(productOptionValueSave.Response.success === true) {
			//const tempProductOptionValues = productOptionSave.ProductOptionValues.map(( { productOptionValueId: value, valueLabel: label } ) => ( { value, label } ) );
			// If this was a newly added product option, then we want to close the add form and show a success message at the top of the form.
			if(editId === -1) {
				setState({
					editId: productOptionValueSave.productOptionValueId,
					messageOptionAdded: 'Product Option Value added to list, and the edit form is opened below.',
					messageOptionAddedStatus: 'success',
					productOptionValueSaved: true
				});
			} else {
				setState({
					productOptionValueSaved: true
				});
			}
		} else {
			setState({message: 'Product Option Value not saved', messageStatus: 'danger'});
		}
	}

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				<h3><span className="text-white text-shadow"><Translate id="Product Option Values Admin" /></span>
					<button type="button" className="btn btn-info btn-addon btn-sm float-right" onClick={() => handleAdd()}><FontAwesomeIcon icon="plus" /> <Translate id="Add Product Option Value" /></button>
				</h3>
				<div className="card p-3">
					<table className="table table-striped">
						<thead>
							<tr>
								<th><Translate id="Product Option Value" /></th>
								<th><Translate id="Edit" /></th>
							</tr>
						</thead>
						<tbody>
							{/* Display the success message when a new product option is added */}
							{
								messageOptionAdded !== '' &&
								<tr>
									<td colSpan="2">
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
											<Field value={valueLabel} name="valueLabel" onChange={(event) => setState({productOptionValueSaved: false, valueLabel: event.target.value})} className="form-control" />
										</td>
										<td>
											<button className="btn btn-success btn-sm mr-3" onClick={() => handleSaveProductOptionValue(0)} disabled={valueLabel === ''}><Translate id="Save" /></button>
											<button className="btn btn-default btn-sm btn-addon" onClick={() => setState({editId: 0, productOptionValueSaved: false})}><FontAwesomeIcon icon="times" /> <Translate id="Close" /></button>
										</td>
									</tr>
								</React.Fragment>
							}
							{ProductOptionValues.map((option) => {
								return (
									<React.Fragment key={option.productOptionValueId}>
										{
											parseInt(editId) === parseInt(option.productOptionValueId) &&
											<React.Fragment>
												<tr>
													<td>
														<Field value={valueLabel} name="valueLabel" onChange={(event) => setState({productOptionValueSaved: false, valueLabel: event.target.value})} className="form-control" />
													</td>
													<td>
														<button className="btn btn-success btn-sm mr-3" disabled={productOptionValueSaved || valueLabel === ''} onClick={() => handleSaveProductOptionValue(option.productOptionValueId)}>
															{
																productOptionValueSaved &&
																<React.Fragment><Translate id="Saved" /> <FontAwesomeIcon icon="check" /></React.Fragment>
															}
															{
																productOptionValueSaved === false &&
																<Translate id="Save" />
															}
														</button>
														<button className="btn btn-default btn-sm btn-addon" onClick={() => setState({editId: 0, productOptionValueSaved: false})}><FontAwesomeIcon icon="times" /> <Translate id="Close" /></button>
													</td>
												</tr>
											</React.Fragment>
										}
										{
											parseInt(editId) !== parseInt(option.productOptionValueId) &&
											<tr>
												<td>{option.valueLabel}</td>
												<td className="pl-0 pr-0">{option.valueLabel !== "TEXT" && <button className="btn btn-info btn-sm btn-addon" onClick={() => handleEdit(option.productOptionValueId)}><FontAwesomeIcon icon="pen" /> <Translate id="Edit" /></button>}</td>
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

export const ProductOptionValues = compose(
	queryWithLoading({
		gqlString: getProductOptionValues,
		name: 'ProductOptionValues',
		requiredPermission: { permission: "products", permissionLevel: 4}
	}),
	withFormik(),
	withMutation(ProductOptionValueSaveMutation, "ProductOptionValueSave", ["getProductOptionValues"]),
	withRouter,
	withState({
		editId: 0,
		message: '',
		messageOptionAdded: '',
		messageOptionAddedStatus: '',
		messageStatus: '',
		productOptionValueSaved: false,
		valueLabel: ''
	}),
	withTranslate
)(ProductOptionValuesList)
