import React from 'react';

import { withState } from "react-state-hoc";

import { withFormik, Field, Form } from "../utilities/IWDFormik";
import Select from "react-select";

import * as Yup from "yup";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { withModalState } from "../utilities/withModal";

import { withMutation, queryWithLoading } from "../utilities/IWDDb";

import { compose } from "react-apollo";

import { Translate, withTranslate } from '../translations/IWDTranslation';

import {
	getCompanyProductPromotionsQuery,
	ProductCompanyPromotionRemove,
	ProductCompanyPromotionSave,
} from "./companies_graphql";

import {
	getProductCategoriesQuery,
	getProductsListQuery
} from '../products/products_graphql';

const ProductCompanyPromotionsContent = (props) => {
	const {
		Promotions: {
			ProductCompanyPromotions
		},
		initialValues,
		errors,
		touched,
		setState,
		isSubmitting,
		dirty,
		companyId,
		productId,
		setFieldValue,
		setFieldTouched,
		Products: {
			Products: AllProducts
		},
		ProductCategories: {
			ProductCategories
		},
		values
	} = props;

	const emptyPromotion = {
		productCompanyPromotionId: "0",
		companyId,
		productId,
		productCategoryId: 0,
		productIds: [],
		amountDiscount: "",
		maxQuantity: "",
		units: "",
		personalization: 0,
		retail: 1
	};

	return <Form>
		<div>
			<p className="small float-right mt-n-1 mb-1">
				<button type="button" onClick={() => setState({ initialValues: emptyPromotion })} className="btn btn-info btn-sm btn-addon">
					<FontAwesomeIcon icon="plus" />
					<Translate id="Add a Promotion"/>
				</button>
			</p>
			<h6>Promotional Pricing</h6>
			<p className="small mb-3">Buying this product will result in the following promotions applying to other products</p>
		</div>

		<table className="table table-striped w-100 small">
			<thead>
				<tr>
					<th>Category</th>
					<th>Products/Models</th>
					<th>Discount</th>
					<th>Discount Units</th>
					<th>Max Quantity Applicable</th>
					<th>Applies to Retail</th>
					<th>Applies to Personalization</th>
					<th>Edit</th>
					<th>Delete</th>
				</tr>
			</thead>
			<tbody>
				{
					values.productCompanyPromotionId === "0" &&
					<EditRow
						key="EditRow"
						AllProducts={AllProducts}
						ProductCategories={ProductCategories}
						setFieldValue={setFieldValue}
						setFieldTouched={setFieldTouched}
						values={values}
						errors={errors}
						isSubmitting={isSubmitting}
						dirty={dirty}
						setState={setState}
						touched={touched}
						translate={props.translate}
					/>
				}

				{ ProductCompanyPromotions.length === 0 && <tr><td colSpan="7"> No promotions available for this product</td></tr> }
				{
					ProductCompanyPromotions.map((Promotion) => {
						const {
							amountDiscount,
							Products,
							units,
							maxQuantity
						} = Promotion;
						if ( initialValues.productCompanyPromotionId === Promotion.productCompanyPromotionId ) {
							return (
								<EditRow
									key="EditRow"
									AllProducts={AllProducts}
									ProductCategories={ProductCategories}
									setFieldValue={setFieldValue}
									setFieldTouched={setFieldTouched}
									values={values}
									errors={errors}
									isSubmitting={isSubmitting}
									dirty={dirty}
									setState={setState}
									touched={touched}
									translate={props.translate}
								/>
							);
						} else {
							return (
								<tr key={Promotion.productCompanyPromotionId}>
									<td>{Promotion.ProductCategory.productCategory}</td>
									<td>
										{ Products.map(({productId, productName}) => <div key={productId}>{productName}</div>) }
									</td>
									<td colSpan="2">
										{units === 1 ? `${amountDiscount}%` : units === 2 ? `$${amountDiscount}` : "" }
									</td>
									<td>{ maxQuantity }</td>
									<td>{ Promotion.retail === 1 ? "Yes" : "No" }</td>
									<td>{ Promotion.personalization === 1 ? "Yes" : "No" }</td>
									<td className="pl-0 pr-0">
										<button
											type="button"
											className="btn btn-info btn-sm btn-addon"
											onClick={() => props.setState({
												initialValues: {
													productCompanyPromotionId: Promotion.productCompanyPromotionId,
													companyId,
													productId,
													productCategoryId: Promotion.ProductCategory.productCategoryId,
													productIds: Promotion.Products.map(({productName, productId}) => ({ value: productId, label: productName })),
													amountDiscount: Promotion.amountDiscount,
													maxQuantity: Promotion.maxQuantity,
													units: Promotion.units,
													personalization: Promotion.personalization,
													retail: Promotion.retail
												}
											}) }
										>
											<FontAwesomeIcon icon="pen" />
											<Translate id="Edit"/>
										</button>
									</td>
									<td>
										<button type="button" className="btn btn-danger btn-sm btn-addon"
											onClick={() => props.modal.toggleModal(Promotion)}
										>
											<FontAwesomeIcon icon="trash-alt" />
											<Translate id="Delete"/>
										</button>
									</td>
								</tr>
							);
						}
					})
				}
			</tbody>
		</table>
		<Modal isOpen={props.modal.modalOpen} toggle={props.modal.toggleModal}>
			<ModalHeader><Translate id="Remove Promotion"/></ModalHeader>
			<ModalBody>
				<Translate id="Remove Product Promotion Confirmation" />
				<div className="mt-2">
					<b>Category:</b> {(props.modal.data.ProductCategory || {}).productCategory}<br/>
					<b>Products/Models:</b>
					<div className="pl-3">
						{(props.modal.data.Products || []).map(({productId, productName}) => <div key={productId}>{productName}</div>) }
					</div>
					<b>Discount:</b> ${props.modal.data.amountDiscount}<br/>
					<b>Discount Units:</b> {props.modal.data.units}<br/>
					<b>Max Quantity Applicable:</b> {props.modal.data.maxQuantity}
				</div>
			</ModalBody>
			<ModalFooter>
				<button type="button"
					onClick={async () =>  {
							await props.ProductCompanyPromotionRemove({ productCompanyPromotionId: props.modal.data.productCompanyPromotionId });
							props.modal.toggleModal();
						} }
						className="btn btn-danger">
					<Translate id="Remove Promotion"/>
				</button>
				<button onClick={props.modal.toggleModal} className="btn btn-default ml-3">
					<Translate id="Cancel"/>
				</button>
			</ModalFooter>
		</Modal>
	</Form>
};


const EditRow = (props) => {
	const {
		AllProducts,
		ProductCategories,
		setFieldValue,
		setFieldTouched,
		values,
		errors,
		touched,
		isSubmitting,
		dirty,
		setState
	} = props;

	// Create a map of product category IDs to their parent.  If they are a parent, they will just map to themselves.
	const categoryMap = ProductCategories.reduce((acc, {productCategoryId, parentCategoryId}) => ({ ...acc, [productCategoryId]: parentCategoryId === "0" ? productCategoryId : parentCategoryId }) , {} );

	// Filter the products based on the selected category (via the categoryMap)
	const ProductsOptions = AllProducts
		.filter(({ productCategoryId }) => categoryMap[productCategoryId] === values.productCategoryId)
		.map(({ productId, productName }) => ( { value: productId, label: productName  } ));

	const selectedProducts = ProductsOptions.filter(({ value }) => values.productIds.some((product) => product.value === value ));
	const selectedCategoryLabel = (ProductCategories.find(({ productCategoryId }) => productCategoryId === values.productCategoryId ) || {}).productCategory;

	return (
		<tr key="EditRow">
			<td>
				{/* If there are selected products then the product category should not be changed. */}
				{
					selectedProducts.length > 0 ? selectedCategoryLabel :
					<Field
						component="select"
						showError={true}
						name="productCategoryId"
						className={`form-control ${errors.productCategoryId && touched.productCategoryId && 'is-invalid'}`}>
							<option value="">{props.translate("Select a Product Category")}</option>
							{ProductCategories.filter(({parentCategoryId}) => parentCategoryId === "0" ).map((category) => {
									return <option value={category.productCategoryId} key={category.productCategoryId}>{props.translate(category.productCategory)}</option>
								}
							)}
					</Field>
				}
			</td>
			<td>
				<Field component={Select}
					showError={true}
					className={`${errors.productIds && touched.productIds && 'is-invalid'}`}
					name="productIds"
					value={selectedProducts}
					options={ProductsOptions}
					onChange={(value) => setFieldValue("productIds", value) }
					onBlur={() => setFieldTouched("productIds")}
					isMulti
				/>
			</td>
			<td>
				<Field
					showError={true}
					name="amountDiscount"
					className={`form-control-num form-control ${errors.amountDiscount && touched.amountDiscount && 'is-invalid'}`}
				/>
			</td>
			<td>
				<Field showError={true}
					component="select"
					name="units"
					className={`form-control-num form-control ${errors.units && touched.units && 'is-invalid'}`}
				>
					<option value="">{props.translate("Select a Unit")}</option>
					<option value="1">%</option>
					<option value="2">$</option>
				</Field>
			</td>
			<td>
				<Field showError={true} name="maxQuantity" className={`form-control-num form-control ${errors.maxQuantity && touched.maxQuantity && 'is-invalid'}`} />
			</td>
			<td>
				<Field showError={true}
					component="select"
					name="retail"
					className={`form-control-num form-control ${errors.retail && touched.retail && 'is-invalid'}`}
				>
					<option value="0">No</option>
					<option value="1">Yes</option>
				</Field>
			</td>
			<td>
				<Field showError={true}
					component="select"
					name="personalization"
					className={`form-control-num form-control ${errors.personalization && touched.personalization && 'is-invalid'}`}
				>
					<option value="0">No</option>
					<option value="1">Yes</option>
				</Field>
			</td>
			<td>
				<button type="submit" className="btn btn-success btn-sm btn-addon" disabled={isSubmitting || dirty === false}>
					<FontAwesomeIcon icon="pen" />
					<Translate id={isSubmitting ? "SAVING..." : "SAVE"} />
				</button>
			</td>
			<td>
				<button
					type="button"
					className="btn btn-default btn-sm btn-addon ml-3"
					onClick={() => setState({ initialValues: {} }) }
				>
					<FontAwesomeIcon icon="times" />
					<Translate id="Cancel"/>
				</button>
			</td>
		</tr>
	);
}

export const ProductCompanyPromotions = compose(
	withTranslate,
	withModalState,
	withState({ initialValues: {}}),
	queryWithLoading({ gqlString: getProductCategoriesQuery, name: "ProductCategories"}),
	queryWithLoading({ gqlString: getProductsListQuery, name: "Products"}),
	queryWithLoading({
		gqlString: getCompanyProductPromotionsQuery,
		name: "Promotions",
		variablesFunction: ({companyId, productId}) => ({companyId, productId})
	}),
	withMutation(ProductCompanyPromotionRemove, "ProductCompanyPromotionRemove", ["getProductCompanyPromotions"]),
	withMutation(ProductCompanyPromotionSave, "ProductCompanyPromotionSave", ["getProductCompanyPromotions"]),
	withFormik({
		handleSubmit: async (input, form) => {
			let productIds = input.productIds.map(({ value }) => parseInt(value));
			input.maxQuantity = parseInt(input.maxQuantity);
			input.personalization = parseInt(input.personalization);
			input.retail = parseInt(input.retail);
			input.units = parseInt(input.units);

			const result = await form.props.ProductCompanyPromotionSave({ input: { ...input, productIds: productIds } });
			// If the mutation was a success, update the initialValues to the new input structure.
			if( result.data.productCompanyPromotionSave.Response.success === true ) {
				if( input.productCompanyPromotionId === "0" ) {
					form.props.setState({ initialValues: {}});
				} else {
					form.props.setState({ initialValues: { ...input, productCompanyPromotionId: result.data.productCompanyPromotionSave.ProductCompanyPromotion.productCompanyPromotionId }});
				}
			}
		},
		validationSchema: () => Yup.object().shape({
			productCategoryId: Yup.number().required("Select a product category"),
			amountDiscount: Yup.number().required("Enter a Discount Amount"),
			units: Yup.number().required("Enter the number of discount units"),
			maxQuantity: Yup.number().required("Enter the max quantity applicable"),
			productIds: Yup.array().required("Select a product/model")
	   })
	})
)(ProductCompanyPromotionsContent);
