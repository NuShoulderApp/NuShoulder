import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, withRouter } from "react-router-dom";
import { compose } from "react-apollo";
import { Translate } from '../translations/IWDTranslation';

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading } from '../utilities/IWDDb';

import { withTranslate } from '../translations/IWDTranslation';
import { ProductThumbnail } from './product_images';

import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withState } from "react-state-hoc";

import _ from "lodash";

// GRAPHQL QUERY
import {
	getProductsQuery
} from './products_graphql';

// DISPLAY CONTENT
const ProductsContent = (props) => {
	const {
		values,
		Products,
		match: {
			isExact
		}
	} = props;

	// Track Product Type and Category for output
	let currentProductTypeId = null;
	let currentProductCategoryId = null;
	let previousProductTypeId = null;
	let previousProductCategoryId = null;

	// <Link to={`/new_orders/burial`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="New Burial Order"/> </Link>
	// <Link to={`/new_orders/supplies`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Order Supplies"/> </Link>
	// <Link to={`/new_orders/products`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Product Only Order"/> </Link>

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				<h3><span className="text-white text-shadow"><Translate id="Admin Products"/></span>
						{
							// If we are not in the create route, show the add button.
							isExact &&
							<Link to={`/products/product_save`} className="btn btn-info btn-addon float-right"><FontAwesomeIcon icon="plus" /> <Translate id="Add Product"/> </Link>
						}
						{
							isExact && false &&
							<Link to={`/products/product_categories`} className="btn btn-info float-right mr-2"><Translate id="Product Categories"/> </Link>
						}
						{
							isExact && false &&
							<Link to={`/products/product_materials`} className="btn btn-info float-right mr-2"><Translate id="Product Materials"/> </Link>
						}
						{
							isExact && false &&
							<Link to={`/memorialization`} className="btn btn-info float-right mr-2"><Translate id="Memorialization Products"/> </Link>
						}
				</h3>
				<div className="card p-3">
					<table className="table table-striped">
						<thead>
							<tr>
								<th></th>
								<th>Product Name</th>
								<th>Type</th>
								<th>Category</th>
								<th>Group</th>
								<th>Active</th>
								<th>Edit</th>
							</tr>
						</thead>
						<tbody>
							{Products.length > 0 &&
								Products.map((product) => {
									previousProductTypeId = currentProductTypeId;
									previousProductCategoryId = currentProductCategoryId;

									currentProductTypeId = product.productTypeId;
									currentProductCategoryId = product.productCategoryId;

									let showProduct = false;
									if (parseInt(product.productAccountActive) === parseInt(values.active) &&
										( parseInt(product.productTypeId) === parseInt(values.productTypeId) || isNaN(parseInt(values.productTypeId)) ) &&
										( parseInt(product.productCategoryId) === parseInt(values.productCategoryId) || isNaN(parseInt(values.productCategoryId)) )
									) {
										showProduct = true;
									}
									
									return (
										<React.Fragment key={product.productId}>
											{currentProductTypeId !== previousProductTypeId && <tr>
												<td colSpan="7" className="h3 bg-dark text-light">{product.productType}</td>
											</tr>}
											{currentProductCategoryId !== previousProductCategoryId && <tr>
												<td colSpan="7" className="h5 bg-secondary text-light">{product.productCategory}</td>
											</tr>}
											{showProduct === true && <tr>
												<th>{product && <ProductThumbnail product={product} size="tiny" />}</th>
												<td>{product.accountProductName !== null && product.accountProductName !== "" && <span>
														<span>{product.accountProductName}</span>
														{product.productName !== product.accountProductName && <small className="text-muted"><br />({product.productName})</small>}
													</span>}
													{!(product.accountProductName !== null && product.accountProductName !== "") && <span>
														{product.productName}
													</span>}
												</td>
												<td>{product.productType}</td>
												<td>{product.productCategory}</td>
												<td>{product.productGroup}</td>
												<td>{product.productAccountActive === 1 && <span className="badge badge-success">Active</span>} {product.productAccountActive === 0 && <span className="badge badge-secondary">Inactive</span>}</td>
												<td>
													<Link className="btn btn-sm btn-info btn-addon" to={`products/product_save/${product.productId}`}><FontAwesomeIcon icon="pen" /> Edit</Link>
												</td>
											</tr>}
										</React.Fragment>
									)
								})
							}

						</tbody>
					</table>
				</div>
			</div>
		</React.Fragment>
	)
};

// WRAP CONTENT
const ProductsContentContainer = compose(
	withRouter,
	withState({

	}),
	withTranslate
)(ProductsContent)

// DISPLAY FILTER FORM
const ProductsFilter = (props) => {
	const {
		values,
		errors,
		data: {
			Products
		}
	} = props;

	// get unique options for category filter select
	let categoryOptions = [];
	Products.forEach(product => {
		// Check if the productCategoryId already exists in the array 'categoryOptions'
		if (!categoryOptions.find((category) => category.productCategoryId === product.productCategoryId)) {
			// If not, pushes category info to categoryOptions
			categoryOptions.push({
				productCategoryId: product.productCategoryId,
				productCategory: product.productCategory
			});
		}
	});

	// display filters
	return (
		<div className="w-100 p-1">
			<div className="card p-3">
				<Form>
					<div className="row">
						<div className="col-12 form-row">
							<div className="col-auto">
								<Translate id="Active" />
								<Field component="select" name="active" showError={true} className={`form-control ${errors.active && 'is-invalid'}`}>
									<option value="1">{props.translate('Yes')}</option>
									<option value="0">{props.translate('No')}</option>
								</Field>
							</div>
							<div className="col-auto">
								<Translate id="Product Type" />
								<Field component="select" name="productTypeId" showError={true} className={`form-control ${errors.productTypeId && 'is-invalid'}`}>
									<option value="">{props.translate('All Types')}</option>
									<option value="2">{props.translate('Cremation')}</option>
									<option value="3">{props.translate('Memorialization')}</option>
									<option value="4">{props.translate('Vet Supplies')}</option>
								</Field>
							</div>
							<div className="col-auto">
								<Translate id="Category" />
								<Field component="select" name="productCategoryId" showError={true} className={`form-control ${errors.productTypeId && 'is-invalid'}`}>
									<option value="">{props.translate('All Categories')}</option>
									 { categoryOptions.map((category) => {
										 return (
											<option key={category.productCategoryId} value={category.productCategoryId}>{category.productCategory}</option>
										 )
									 })}
								</Field>
							</div>
						</div>
					</div>
					<div className="row">
						<div className="col-12">
								<ProductsContentContainer
									values={values}
									Products={Products}
								/>
						</div>
					</div>
				</Form>
			</div>
		</div>
	)
}

// WRAP FILTER FORM: wrap the filter form withFormik to handle the form submission and get the Products data from server
const ProductsFilterContainer = compose(
	withRouter,
	withFormik({
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value),
		handleSubmit: async ( FilterInputValues, FormikForm ) => {},
		validate: (values) => {
			let errors = {};
			return errors
		}
	}),
	queryWithLoading({
		gqlString: getProductsQuery,
		variablesFunction: (props) => ({accountId: 0}),
		requiredPermission: { permission: "products", permissionLevel: 4},
		fetchPolicy: 'network-only' // we don't want to get the response from the Apollo cache
	}),
	withTranslate
)(ProductsFilter)

// MAIN CLASS: that wraps the filter form and the list
class ProductsFilterClass extends React.Component {
	constructor(props) {
    	super(props)
		//const { OrderServiceStatuses, OrderStatuses } = props.data;
		//const { Company } = props.Company;

		this.state= {
			active: 1,
			productCategoryId: null,
			productTypeId: null

		}
	}

	handleFormReload = (values) => {
		this.setState({
			active: values.active,
			productCategoryId: values.productCategoryId,
			productTypeId: values.productTypeId
		})
	};

	render () {
		return (
			<React.Fragment>
				<ProductsFilterContainer
					handleFormReload={this.handleFormReload}
					initialValues={this.state}
				/>
			</React.Fragment>
		)
	}
}

// EXPORT MAIN CLASS: 'Products' to Use in other places
export const Products = compose(
	withRouter,
	withTranslate
)(ProductsFilterClass)
