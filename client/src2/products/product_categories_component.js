import _ from 'lodash';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';	// IMPORTANT: Add any icons you want to use to the index.js import { ... } from '@fortawesome/free-solid-svg-icons' AND library.add(...)
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import { compose } from "react-apollo";
import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';
// Contains the layout for columns
import { DetailColumn, SidebarColumn} from '../layouts/application';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	getProductCategoriesQuery,
	ProductCategorySaveMutation
} from './products_graphql';

const ProductCategoryFormContent = (props) => {
	const {
		dirty,
		errors,
		isSubmitting,
		ProductCategories,
		ProductTypes,
		resetState,
		Response,
		touched
	} = props;

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				{/*  Display a resulting status message.  */}
				{ Response && dirty === false && <div className="row"><div className="col-12 alert alert-success">{props.translate(Response.message)}</div></div> }
					<Form className="row">
						<div className="col-6">
							<Translate id="Product Category"/> *
							<Field name="productCategory" showError={true}  className={`form-control ${errors.productCategory && touched.productCategory && 'is-invalid'}`} />
						</div>
						<div className="col-6">
							<Translate id="Product Type"/> *
							<Field component="select" showError={true} name="productTypeId" className={`form-control ${errors.productTypeId && touched.productTypeId && 'is-invalid'}`}>
								{/* This render to Static Markup is required because options don't like React children as the label */}
									<option value="">{props.translate('Select a Product Type')}</option>
									{ProductTypes.map((type) => {
											return <option value={type.productTypeId} key={type.productTypeId}>{props.translate(type.productType)}</option>
										}
									)}
							</Field>
						</div>
						<div className="col-6">
							<Translate id="Parent Category"/>
							<Field component="select" showError={true} name="parentCategoryId" className={`form-control ${errors.parentCategoryId && touched.parentCategoryId && 'is-invalid'}`}>
								{/* This render to Static Markup is required because options don't like React children as the label */}
									<option value="">{props.translate('Select a Parent Category')}</option>
									{ProductCategories.map((category) => {
											if(category.parentCategoryId === "0") {
												return <option value={category.productCategoryId} key={category.productCategoryId}>{props.translate(category.productCategory)}</option>
											} else {
												return null;
											}

										}
									)}
							</Field>
						</div>
						<div className="col-3">
							<Translate id="Active" />
							<Field name="active" component="select" className={`form-control ${errors.active && touched.active && 'is-invalid'}`}>
								<option value="1">{props.translate('Yes')}</option>
								<option value="0">{props.translate('No')}</option>
							</Field>
						</div>

						<div className="mt-3 col-12">
							<button type="submit" className="btn btn-success btn-sm" disabled={isSubmitting || dirty === false}>
								<FontAwesomeIcon icon="check" /> <Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
							</button>
							<button type="button" onClick={() => resetState(false)} className="btn btn-default btn-sm btn-addon float-right">
								<FontAwesomeIcon icon="times" /> <Translate id={dirty ? "Cancel" : "Close"}/>
							</button>
						</div>
					</Form>
			</div>
		</React.Fragment>
	);
};

const ProductCategoryForm = compose (
	withMutation(ProductCategorySaveMutation, "ProductCategorySave", ["getProductCategories"]),
	withFormik({
		handleSubmit: async ( input, { props: { handleEdit, ProductCategorySave, setResponse, }} ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			let tempInput =  _.omit(input,["editable"]);
			tempInput.active = parseInt(input.active);
			const { data: { productCategorySave }} = await ProductCategorySave({ input: tempInput });

			handleEdit(productCategorySave.ProductCategory);

			setResponse(productCategorySave.Response);
		},
		validationSchema: () => Yup.object().shape({
			parentCategoryId: Yup.number().required("Select a Parent Category"),
			productCategory: Yup.string().required("Enter a Product Category"),
			productTypeId: Yup.number().required("Select a Product Type")
	   })
	}),
	withTranslate
)(ProductCategoryFormContent);

class ProductCategoriesClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state= {
			category: {
				active: 1,
				parentCategoryId: 0,
				productCategory: "",
				productCategoryId: 0,
				productTypeId: ""
			},
			showCategoryForm: false
		}

	}

	handleEdit = (category) => this.setState({category, showCategoryForm: true});

	resetState = (value) => this.setState({
							category: {
								active: 1,
								parentCategoryId: 0,
								productCategory: "",
								productCategoryId: 0,
								productTypeId: ""
							},
							showCategoryForm: value
	});

	render () {
		const { ProductCategories, ProductTypes } = this.props.data;

		return (
			<React.Fragment>
				<div className="w-100 p-1">
					<h3><span className="text-white text-shadow"><Translate id="Product Categories" /></span>
						<button className="btn btn-info btn-sm btn-addon float-right" onClick={() => this.resetState(true)}><FontAwesomeIcon icon="plus" /> <Translate id="Add Category" /></button>
					</h3>
					<div className="card p-3">
						<div className="row mt-2">
								<DetailColumn>
									<table className="table table-striped">
										<thead>
											<tr>
												<th>Category</th>
												<th>Parent Category</th>
												<th>Type</th>
												<th>Active</th>
												<th>Edit</th>
											</tr>
										</thead>
										<tbody>
											{ProductCategories.map((category) => {
												let ParentCategory = category.parentCategoryId > 0 ? ProductCategories.find((parentCategory) => parentCategory.productCategoryId === category.parentCategoryId) : {'productCategory': ''};
												let ProductType = category.productTypeId > 0 ? ProductTypes.find((type) => type.productTypeId === category.productTypeId) : {'productType': ''};

												if(category.editable === 1 || (category.editable === 0 && category.active === 1) ) {
													return (
														<tr key={category.productCategoryId}>
															<td>{category.productCategory}</td>
															<td>{ParentCategory.productCategory}</td>
															<td>{ProductType.productType}</td>
															<td>{category.active === 1 && <span className="badge badge-success">Active</span>} {category.active === 0 && <span className="badge badge-secondary">Inactive</span>}</td>
															<td className="pl-0 pr-0">{category.editable === 1 && <button className="btn btn-info btn-sm btn-addon" onClick={() => this.handleEdit(category)}><FontAwesomeIcon icon="pen" /> <Translate id="Edit" /></button>}</td>
														</tr>
													)
												} else {
													return null
												}
											})}
										</tbody>
									</table>
								</DetailColumn>
								{this.state.showCategoryForm === true &&
									<SidebarColumn>
										<ProductCategoryForm
											handleEdit={this.handleEdit}
											initialValues={this.state.category}
											ProductCategories={ProductCategories}
											ProductTypes={ProductTypes}
											resetState={this.resetState}
										/>
									</SidebarColumn>
								}
						</div>
					</div>
				</div>
			</React.Fragment>
		)
	}
}

export const ProductCategories = compose(
	withRouter,
	queryWithLoading({
		gqlString: getProductCategoriesQuery,
		requiredPermission: { permission: "product_categories", permissionLevel: 4}
	}),
	withTranslate
)(ProductCategoriesClass)
