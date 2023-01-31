import React from 'react';
import Math from 'mathjs';

import { withState } from "react-state-hoc";

import update from "immutability-helper";

import { withSession } from "../utilities/session";

import { ProductThumbnail } from "../products/product_images";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withFormik, Field, Form } from "../utilities/IWDFormik";

import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { withModalState } from "../utilities/withModal";

import * as Yup from "yup";

import { withMutation } from "../utilities/IWDDb";

import _ from "lodash";
import { compose, graphql } from "react-apollo";

import { withTranslate, Translate } from '../translations/IWDTranslation';

import { ProductCompanyPromotions } from "./company_product_promotions_component";

import {
	ProductCompanyPriceSaveMutation,
	ProductCompanyPriceFragment,
	ProductCompanyWeightTierPriceSaveMutation,
	ProductCompanyWeightTierPriceRemoveMutation
} from "./companies_graphql";

const ProductCategoriesContent = (props) => {
	let Products = props.Company.Company.Products;

	const ProductCategories = props.ProductCategories.ProductCategories.filter((cat)=> Products.find((prod) => prod.productCategoryId === cat.productCategoryId));

	const {
		calledFromOrderDetails=false,
		Company: { Company },
		ProductSpecies=[],
		selectedProduct,
		selectedProduct: { editProductValues },
		selectedCategory = (ProductCategories[0] || {}).productCategoryId,
		setState,
		speciesId='',
		userTypeId
	} = props;

	// If this is called from the Order Details, then we need to narrow the Products down based on species if applicable.
	if(calledFromOrderDetails === true && ProductSpecies.length > 0) {
		// Update the Products array to only be for products that the species can use
		Products = Products.map((product) => {
			// Check if this product has any records in the productSpecies table, if there are none then return the product object to be included in the products displayed
			if(ProductSpecies.findIndex((species) => parseInt(species.productId) === parseInt(product.productId)) > -1) {
				// Filter the ProductSpecies down to only this product
				const tempProductSpecies = ProductSpecies.filter((tempSpecies) => parseInt(tempSpecies.productId) === parseInt(product.productId));
				// If this speciesId is in the filtered array of species that use this product, then include this product in the products displayed, otherwise, do not show this produc.
				if(tempProductSpecies.findIndex((tempPS) => tempPS.speciesId === parseInt(speciesId)) > -1) {
					return product;
				} else {
					return false;
				}
			} else {
				return product;
			}
		});
		Products = Products.filter((product) => product !== false);
	}

	return ProductCategories.map((props) => (
		<React.Fragment key={props.productCategoryId}>
			<div className="bg-info text-light text-bold p-2 text-uppercase mb-2">
				<FontAwesomeIcon icon="caret-right" className="mr-2" onClick={() => setState({ selectedCategory: props.productCategoryId })} />
				{props.productCategory}
			</div>
			{
				selectedCategory === props.productCategoryId &&
				<table className="table table-striped table-light">
					<thead>
						<tr className="thead-dark">
							{calledFromOrderDetails === false &&
								<React.Fragment>
									<th>&nbsp;</th>
									<th>&nbsp;</th>
								</React.Fragment>
							}
							<th>Product / Model</th>
							<th>Hospital Cost</th>
							<th>Suggested Retail Price</th>
							<th>Hospital Retail Price</th>
							<th>Personalization Cost</th>
							<th>Suggested Personalization Retail Price</th>
							<th>Personalization Retail Price</th>
							{calledFromOrderDetails === false && <th>Edit</th>}
						</tr>
					</thead>
					<tbody>
						{
							Products.filter((Product) => Product.productCategoryId === props.productCategoryId ).map((Product) => {
								const editProduct = selectedProduct.productId === Product.productId && editProductValues === true;

								const showWeightPricing = Product.productTypeId === "2";

								// Get the ProductCompanyPrice record from the Product, or an empty object if needed.
								const ProductCompanyPrice = Product.ProductCompanyPrice || {};

								// Set the Hospital Cost (invoice cost) variable based on if there is a company default discount or an invoiceCost in the ProductCompanyPrice
								let displayInvoiceCost = Product.invoiceCost;
								// The company override will take 1st effect
								if(ProductCompanyPrice.invoiceCost) {
									displayInvoiceCost = ProductCompanyPrice.invoiceCost;
								}
								// The company default discount will take effect if there isnt not a company override
								else if(Company.defaultDiscount > 0) {
									displayInvoiceCost = Math.multiply(Product.priceRetail, Math.subtract(100,Company.defaultDiscount), 0.01).toFixed(2);
								}

								// Set the Hospital Personalization Cost (invoice cost personalization) variable based on if there is a company default discount or an invoiceCostPersonalization in the ProductCompanyPrice
								let displayInvoiceCostPersonalization = Product.invoiceCostPersonalization;
								// The company override will take 1st effect
								if(ProductCompanyPrice.invoiceCostPersonalization) {
									displayInvoiceCostPersonalization = ProductCompanyPrice.invoiceCostPersonalization;

								}
								// The company default discount will take effect if there isnt not a company override
								else if(Company.defaultDiscount > 0 && Product.invoiceCostPersonalization === '0.00') {
									displayInvoiceCostPersonalization = Math.multiply(Product.priceRetailPersonalization, Math.subtract(100,Company.defaultDiscount), 0.01).toFixed(2);
								}

								let MainResult = null;
								if (editProduct) {
									MainResult = (
										<EditCompanyProductPriceRow
											cancel={() => setState({ selectedProduct: { ...Product, editProductValues: false } })}
											Company={Company}
											Product={Product}
											selectedProduct={selectedProduct}
											userTypeId={userTypeId}
										/>
									);
								} else {
									MainResult = (
										<tr>
											{calledFromOrderDetails === false &&
												<React.Fragment>
													<td onClick={() => setState({ selectedProduct: selectedProduct === Product ? {} : Product })}>
														<FontAwesomeIcon icon="caret-right" />
													</td>
													<td>
														<ProductThumbnail product={Product} size="tiny" />
													</td>
												</React.Fragment>
											}
											<td>{Product.accountProductName !== null && Product.accountProductName !== "" && <span>{Product.accountProductName}</span>}
												{!(Product.accountProductName !== null && Product.accountProductName !== "") && <span>{Product.productName}</span>}
											</td>
											<td>${displayInvoiceCost}</td>
											<td>
												${Product.priceRetail}
											</td>
											<td>
												{
													ProductCompanyPrice.priceRetail
													?	`$${ ProductCompanyPrice.priceRetail }`
													: <span className="text-muted">Suggested</span>
												}
												{
													showWeightPricing &&
													<React.Fragment>
														<br />
														<span className="small">+ Weight Based Costs</span>
													</React.Fragment>
												}
											</td>
											<td>
												${displayInvoiceCostPersonalization}
											</td>
											<td>
												${ Product.priceRetailPersonalization }
											</td>
											<td>
												{
													ProductCompanyPrice.priceRetailPersonalization
													?	`$${ ProductCompanyPrice.priceRetailPersonalization }`
													: <span className="text-muted">Suggested</span>
												}
											</td>
											{calledFromOrderDetails === false &&
												<td className="pl-0 pr-0">
													<button type="button" className="btn btn-info btn-sm btn-addon" onClick={ () => setState({ selectedProduct: { ...Product, editProductValues: true } }) }>
														<FontAwesomeIcon icon="pen" />
														<Translate id="Edit"/>
													</button>
												</td>
											}
										</tr>
									);
								}

								return (
									<React.Fragment key={Product.productId}>
										{ MainResult }
										{
											selectedProduct.productId === Product.productId &&
											(parseInt(userTypeId) === 2 || parseInt(userTypeId) === 3) &&
											<tr>
												<td colSpan="10">
													{
														showWeightPricing &&
														<React.Fragment>
															<WeightUnitBasedPricing Product={Product}
																initialValues={ {
																	..."productCompanyPriceId,unitWeightInvoiceCost,unitWeightPriceRetail,unitWeightPriceInterval,unitWeightPriceIntervalUnits,unitWeightPriceMax,unitWeightPriceMin"
																		.split(",").reduce((acc, key) => ({ ...acc, [key]: ProductCompanyPrice[key] || ""}) ,{}),
																	companyId: Company.companyId,
																	productId: Product.productId
																}}
															/>

															<ProductAccountWeightTierBasedPricing ProductAccountWeightTierPrice={Product.ProductAccountWeightTierPrice} />
															<ProductCompanyWeightTierBasedPricing companyId={ Company.companyId } Product={Product} />
														</React.Fragment>
													}

													<ProductCompanyPromotions companyId={ Company.companyId } productId={Product.productId} />
												</td>
											</tr>
										}
									</React.Fragment>
								)}
							)
						}
					</tbody>
				</table>
			}
		</React.Fragment>
	));
}

const EditCompanyProductPriceRowContent = (props) => {
	const {
		cancel,
		Company,
		handleBlur,
		handleChange,
		initialValues,
		isSubmitting,
		Product,
		Response,
		selectedProduct,
		setResponse,
		setState,
		userTypeId
	} = props;

	const showWeightPricing = Product.productTypeId === "2";

	const updateFormValue = (field, value) => setState(({initialValues}) => ({ initialValues : { ...initialValues, [field] : value }}));

	const saveProductCompanyPrices = async (Product) => {
		const input = {
			..._.mapValues(initialValues, (value) => value === "" ? null : value) ,
			productId: Product.productId,
			companyId: Company.companyId,
			productCompanyPriceId: Product.ProductCompanyPrice ? Product.ProductCompanyPrice.productCompanyPriceId : undefined
		};

		const { data: { productCompanyPriceSave: { Response } } } = await props.productCompanyPriceSave({ input });

		setResponse(Response);
	}

	// Set the Hospital Cost (invoice cost) variable based on if there is a company default discount - This is the display below the actual input where they can set the product company price override
	let displayInvoiceCost = Product.invoiceCost;
	// The company default discount will take effect
	if(Company.defaultDiscount > 0) {
		displayInvoiceCost = Math.multiply(Product.priceRetail, Math.subtract(100,Company.defaultDiscount), 0.01).toFixed(2);
	}

	// Set the Hospital Personalization Cost (invoice cost personalization) variable based on if there is a company default discount - This is the display below the actual input where they can set the product company price override
	let displayInvoiceCostPersonalization = Product.invoiceCostPersonalization;
	// The company default discount will take effect if there isnt not a company override
	if(Company.defaultDiscount > 0) {
		displayInvoiceCostPersonalization = Math.multiply(Product.priceRetailPersonalization, Math.subtract(100,Company.defaultDiscount), 0.01).toFixed(2);
	}


	return (
		<tr>
			<td onClick={() => setState({ selectedProduct: selectedProduct === Product ? {} : Product })}>
				<FontAwesomeIcon icon="caret-right" />
				{Product.productId}
			</td>
			<td>
				<ProductThumbnail product={Product} size="tiny" />
			</td>
			<td>{ Product.productName }</td>
			<td>
				{
					parseInt(userTypeId) !== 5 &&
					<React.Fragment>
						<Field type="text"
							showError={true}
							name="invoiceCost"
							value={ initialValues.invoiceCost || "" }
							onChange={(props) => updateFormValue("invoiceCost", props.target.value) }
							onBlur={handleBlur}
						/>
						<span className="text-muted">${displayInvoiceCost}</span>
					</React.Fragment>
				}
				{
					parseInt(userTypeId) === 5 &&
					<span>${Product.invoiceCost}</span>
				}
			</td>
			<td>
				${ Product.priceRetail}
			</td>
			<td>
				<Field type="text"
					showError={true}
					name="priceRetail"
					value={ initialValues.priceRetail || "" }
					onChange={(props) => updateFormValue("priceRetail", props.target.value) }
					onBlur={handleBlur}
				/>
				<span className="text-muted">Suggested</span>
				{
					showWeightPricing &&
					<React.Fragment>
						<br />
						<span className="small">+ Weight Based Costs</span>
					</React.Fragment>
				}
			</td>
			<td>
				{
					parseInt(userTypeId) !== 5 &&
					<React.Fragment>
						<Field type="text"
							showError={true}
							name="invoiceCostPersonalization"
							value={ initialValues.invoiceCostPersonalization || "" }
							onChange={(props) => updateFormValue("invoiceCostPersonalization", props.target.value) }
							onBlur={handleBlur}
						/>
						<span className="text-muted">${displayInvoiceCostPersonalization}</span>
					</React.Fragment>
				}
				{
					parseInt(userTypeId) === 5 &&
					<span>${ Product.invoiceCostPersonalization }</span>
				}
			</td>
			<td>
				${ Product.priceRetailPersonalization }
			</td>
			<td>
				<Field type="text"
					showError={true}
					name="priceRetailPersonalization"
					value={ initialValues.priceRetailPersonalization || "" }
					onChange={(props) => { updateFormValue("priceRetailPersonalization", props.target.value);  handleChange(props); } }
					onBlur={handleBlur}
				/>
				<span className="text-muted">Suggested</span>
			</td>
			<td className="text-nowrap">
				<button type="button"
					disabled={ isSubmitting }
					className="btn btn-info btn-sm btn-addon"
					onClick={() => saveProductCompanyPrices(Product)}>
						<FontAwesomeIcon icon="pen" />
						Save
				</button>
				<button type="button" className="btn btn-default ml-2" onClick={ cancel }>
					<Translate id="Cancel"/>
				</button>

				{ Response && <div className="alert alert-success">{Response.message}</div> }
			</td>
		</tr>
	);
};

// Function to update the product cache to show the new record.
const updateProductCompanyPrice = (cache, response) => {
	const {
		data: {
			productCompanyPriceSave: {
				ProductCompanyPrice,
				Response : {
					code
				}
			}
		}
	} = response;

	// If the code is 2, then the mutation was an insert and we have to manually add the record to the cache.
	if( code === 2 ) {
		// Setup the base read/write fragment parameters.
		const fragmentValues = {
			id: `Product_${ProductCompanyPrice.productId}`,
			fragment: ProductCompanyPriceFragment,
			variables: {
				companyId: ProductCompanyPrice.companyId
			}
		};

		// Read the fragment from the cache.
		const cachedProductCompanyPrice = cache.readFragment(fragmentValues);

		// Update the result with the new data.
		const newProductCompanyPrice = update(cachedProductCompanyPrice, { ProductCompanyPrice: { $set : ProductCompanyPrice } } );

		// Update the cache.
		cache.writeFragment({
			...fragmentValues,
			data: newProductCompanyPrice
		});

	}
}

const EditCompanyProductPriceRow = compose(
	withState(({Product: { ProductCompanyPrice }}) => ({ initialValues: { ...ProductCompanyPrice } })),
	graphql(ProductCompanyPriceSaveMutation,
		{
			options: { update: updateProductCompanyPrice },
			props: ({mutate}) => ({ "productCompanyPriceSave": (variables) => mutate({ variables }) } )
		}
	),
	// Formik is added here to enable the usage of Field.
	withFormik({
		validationSchema: () => Yup.object().shape({
			invoiceCost: Yup.number().typeError("Enter a valid number for Hospital Cost"),
			priceRetail: Yup.number().typeError("Enter a valid number for Hospital Retail Price"),
			invoiceCostPersonalization: Yup.number().typeError("Enter a valid number for Personalization Cost"),
			priceRetailPersonalization: Yup.number().typeError("Enter a valid number for Personalization Retail Price")
		})
	})
)(EditCompanyProductPriceRowContent);

export const ProductCategories = compose(
	withState({ selectedProduct: {}})
)(ProductCategoriesContent);

// Output the Crematory level weight tier pricing (Read only).
const ProductAccountWeightTierBasedPricingContent = (props) => {
	const measurementWeight = props.Account.getSettingValue("measurementSystem") === "Metric" ? "kg" : "lb";

	return (
		<React.Fragment>
			<h6>Crematory Weight Tier Based Pricing</h6>
			<table className="table table-striped w-100 small">
				<thead>
					<tr>
						<th>Min Weight</th>
						<th>Max Weight</th>
						<th>Hospital Cost</th>
						<th>Suggested Retail Price</th>
					</tr>
				</thead>
				<tbody>
					{
						props.ProductAccountWeightTierPrice.length === 0 &&
						<tr><td colSpan="5"> No Price Tiers Saved </td></tr>
					}

					{ props.ProductAccountWeightTierPrice.map((WeightTierPrice) => (
						<tr key={WeightTierPrice.productPriceWeightId}>
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
						</tr>
					))}
				</tbody>
			</table>
		</React.Fragment>
	);
};

// Wrap the account level weight tier pricing with the session info.
const ProductAccountWeightTierBasedPricing = compose(
	withSession
)(ProductAccountWeightTierBasedPricingContent);

const WeightUnitBasedPricingContent = (props) => {
	const {
		isSubmitting,
		isValid,
		dirty,
		initialValues: {
			unitWeightInvoiceCost,
			unitWeightPriceMax,
			unitWeightPriceMin,
			unitWeightPriceRetail,
			unitWeightPriceInterval
		},
		Product,
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
			<p className="small">
				CURRENTLY: ${unitWeightInvoiceCost || Product.unitWeightInvoiceCost } / {unitWeightPriceInterval || Product.unitWeightPriceInterval} { measurementWeight }
				&nbsp;from {unitWeightPriceMin || Product.unitWeightPriceMin}  { measurementWeight } to {unitWeightPriceMax || Product.unitWeightPriceMax}  { measurementWeight }
			</p>
			<table className="table table-striped w-100 small">
				<thead>
					<tr>
						<th>Min Weight</th>
						<th>Max Weight</th>
						<th>Hospital Cost</th>
						<th>Suggested Retail Price</th>
						<th>Hospital Retail Price</th>
						<th>Interval</th>
						<th>Edit</th>
					</tr>
				</thead>
				<tbody>
					{ props.edit === false &&
						<tr>
							<td>{unitWeightPriceMin || Product.unitWeightPriceMin} { measurementWeight }</td>
							<td>{unitWeightPriceMax || Product.unitWeightPriceMax} { measurementWeight }</td>
							<td>${unitWeightInvoiceCost || Product.unitWeightInvoiceCost }</td>
							<td>${ Product.unitWeightPriceRetail }</td>
							<td>
								{ unitWeightPriceRetail ? `$${unitWeightPriceRetail}` : "Suggested" }
							</td>
							<td>{unitWeightPriceInterval || Product.unitWeightPriceInterval} { measurementWeight }</td>
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
								{ Product.unitWeightPriceMin } { measurementWeight }
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
								{ Product.unitWeightPriceMax } { measurementWeight }
							</td>
							<td>
								<div className="input-group">
									<div className="input-group-prepend">
										<div className="input-group-text">$</div>
									</div>
									<Field showError={true} name="unitWeightInvoiceCost" className={`form-control-num form-control ${errors.unitWeightinvoiceCost && touched.unitWeightinvoiceCost && 'is-invalid'}`} />
								</div>
								${Product.unitWeightInvoiceCost}
							</td>
							<td>
								${Product.unitWeightPriceRetail}
							</td>
							<td>
								<div className="input-group">
									<div className="input-group-prepend">
										<div className="input-group-text">$</div>
									</div>
									<Field showError={true} name="unitWeightPriceRetail" className={`form-control-num form-control ${errors.unitWeightPriceRetail && touched.unitWeightPriceRetail && 'is-invalid'}`} />
								</div>
								${Product.unitWeightPriceRetail}
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
								{Product.unitWeightPriceInterval} { measurementWeight }
							</td>
							<td>
								<button type="submit"
									className="btn btn-success"
									disabled={isSubmitting || dirty === false || isValid === false}
								>
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

const WeightUnitBasedPricing = compose(
	withSession,
	withState({ edit: false}),
	graphql(ProductCompanyPriceSaveMutation,
		{
			options: { update: updateProductCompanyPrice },
			props: ({mutate}) => ({ "productCompanyPriceSave": (variables) => mutate({ variables }) } )
		}
	),
	withFormik({
		handleSubmit: async (inputValues, component) => {
			const input = _.mapValues(inputValues, (value, key) => {
				if( "unitWeightPriceInterval,unitWeightPriceMax,unitWeightPriceMin".split(",").find((field) => field === key)) {
					return parseFloat(value);
				} else if( value === "" ){
					return null;
				} else {
					return value;
				}
			} );

			await component.props.productCompanyPriceSave({ input });
			component.props.setState({ edit: false });
		},
		validationSchema: () => Yup.object().shape({
			unitWeightPriceMin: Yup.number().typeError("Enter a valid number for Min Weight"),
			unitWeightPriceMax: Yup.number().typeError("Enter a valid number for Max Weight"),
			unitWeightInvoiceCost: Yup.number().typeError("Enter a valid number for Hospital Cost"),
			unitWeightPriceRetail: Yup.number().typeError("Enter a valid number for Hospital Retail Price"),
			unitWeightPriceInterval: Yup.number().typeError("Enter a valid number for interval"),
		})
	})
)(WeightUnitBasedPricingContent);

const ProductCompanyWeightTierBasedPricingContent = (props) => {
	const {
		errors,
		touched,
		isSubmitting,
		dirty,
		isValid,
		Response
	} = props;

	const emptyTier = {
		productId: props.Product.productId,
		companyId: props.companyId,
		productCompanyPriceWeightId:0,
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
				<h6>Hospital Weight Tier Based Pricing</h6>
			</div>

			{
				props.initialValues.productCompanyPriceWeightId === 0 &&
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
							<label htmlFor="hospitalRetailPrice">Hospital Cost</label>
							<div className="input-group">
								<div className="input-group-prepend">
									<div className="input-group-text">$</div>
								</div>
								<Field showError={true} name="invoiceCost" className={`form-control-num form-control ${errors.invoiceCost && touched.invoiceCost && 'is-invalid'}`} />
							</div>
						</div>
						<div className="col-md-2">
							<label htmlFor="hospitalRetailPrice">Hospital Retail Price</label>
							<div className="input-group">
								<div className="input-group-prepend">
									<div className="input-group-text">$</div>
								</div>
								<Field showError={true} name="priceRetail" className={`form-control-num form-control ${errors.priceRetail && touched.priceRetail && 'is-invalid'}`} />
							</div>
						</div>
					</div>
					<p className="mt-3">
						<button type="submit"
							className="btn btn-success btn-sm btn-addon"
							disabled={ isSubmitting || dirty === false || isValid === false }
						>
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
						<th>Hospital Retail Price</th>
						<th>Edit</th>
					</tr>
				</thead>
				<tbody>
					{
						props.Product.ProductCompanyWeightTierPrice.length === 0 &&
						<tr><td colSpan="5"> No Price Tiers Saved </td></tr>
					}

					{ props.Product.ProductCompanyWeightTierPrice.map((WeightTierPrice) => (
						<tr key={WeightTierPrice.productCompanyPriceWeightId}>
							{
								props.initialValues.productCompanyPriceWeightId !== WeightTierPrice.productCompanyPriceWeightId &&
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
								props.initialValues.productCompanyPriceWeightId === WeightTierPrice.productCompanyPriceWeightId &&
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
										<button type="submit" className="btn btn-success btn-sm btn-addon" disabled={isSubmitting || dirty === false || isValid === false}>
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
													<button type="button"
														onClick={() =>  props.ProductCompanyWeightTierPriceRemove({ productCompanyPriceWeightId: props.initialValues.productCompanyPriceWeightId })}
														 className="btn btn-danger">
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

export const ProductCompanyWeightTierBasedPricing = compose(
	withModalState,
	withSession,
	withMutation(ProductCompanyWeightTierPriceRemoveMutation, "ProductCompanyWeightTierPriceRemove", ["getCompany"]),
	withMutation(ProductCompanyWeightTierPriceSaveMutation, "ProductCompanyWeightTierPriceSave", ["getCompany"]),
	withState({ initialValues: {}}),
	withFormik({
		handleSubmit: async (inputValues, { props: { ProductCompanyWeightTierPriceSave, setState, setResponse }}) => {
			const input = _.mapValues(inputValues, (value, key) => {
				if( ["weightMin","weightMax"].find((field) => field === key)) {
					return parseFloat(value);
				} else if( ["priceRetail","invoiceCost"].find((field) => field === key) && value === "") {
					return null;
				} else {
					return value;
				}
			});

			const result = await ProductCompanyWeightTierPriceSave({ input });

			setState({ initialValues: {} });
			setResponse(result.data.productCompanyWeightTierPriceSave.Response);
		},
		validationSchema: () => Yup.object().shape({
			weightMin: Yup.number().typeError("Enter a valid number for Min Weight"),
			weightMax: Yup.number().typeError("Enter a valid number for Max Weight"),
			invoiceCost: Yup.number().typeError("Enter a valid number for Hospital Cost"),
			priceRetail: Yup.number().typeError("Enter a valid number for Retail Price")
		})
	}),
	withTranslate
)(ProductCompanyWeightTierBasedPricingContent);
