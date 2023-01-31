import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import { compose } from "react-apollo";
import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import {
	getProductMaterialsQuery,
	ProductMaterialSaveMutation
} from './products_graphql';

const ProductMaterialFormContent = (props) => {
	const {
		dirty,
		errors,
		isSubmitting,
		resetState,
		Response,
		touched
	} = props;

	return (
		<React.Fragment>
			<div className="container">
				{/*  Display a resulting status message.  */}
				{ Response && dirty === false && <div className="row"><div className="col-12 alert alert-success">{props.translate(Response.message)}</div></div> }
					<Form className="row">
						<div className="col-12">
							<Translate id="Product Material Name"/> *
							<Field name="materialName" showError={true}  className={`form-control ${errors.materialName && touched.materialName && 'is-invalid'}`} />
						</div>
						<div className="col-12">
							<Translate id="Product Material Description"/>
							<Field name="materialDescription" component="textarea" showError={true} className={`form-control ${errors.materialDescription && touched.materialDescription && 'is-invalid'}`} />
						</div>

						<div className="mt-3 col-12">
							<button type="submit" className="btn btn-success btn-sm" disabled={isSubmitting || dirty === false}>
								<Translate id={isSubmitting ? "SAVING..." : "SAVE"}/>
							</button>
							<button type="button" onClick={() => resetState(false)} className="btn btn-default btn-sm float-right">
								<Translate id={dirty ? "Cancel" : "Close"} />
							</button>
						</div>
					</Form>
			</div>
		</React.Fragment>
	);
};

const ProductMaterialForm = compose (
	withMutation(ProductMaterialSaveMutation, "ProductMaterialSave", ["getProductMaterials"]),
	withFormik({
		handleSubmit: async ( input, { props: { handleEdit, ProductMaterialSave, setResponse, }} ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			const { data: { productMaterialSave }} = await ProductMaterialSave({ input });

			handleEdit(productMaterialSave.ProductMaterial);

			setResponse(productMaterialSave.Response);
		},
		validationSchema: () => Yup.object().shape({
			materialName: Yup.string().required("Enter a Material Name")
	   })
	}),
	withTranslate
)(ProductMaterialFormContent);

class ProductMaterialsClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state= {
			material: {
				materialDescription: "",
				materialName: "",
				productMaterialId: 0
			},
			showMaterialForm: false
		}

	}

	handleEdit = (material) => this.setState({material, showMaterialForm: true});

	resetState = (value) => this.setState({
							material: {
								materialDescription: "",
								materialName: "",
								productMaterialId: 0
							},
							showMaterialForm: value
	});

	render () {
		const { ProductMaterials } = this.props.data;

		return (
			<React.Fragment>
				<div className="w-100 p-1">
					<h3><span className="text-white text-shadow"><Translate id="Product Materials" /></span>
						<button className="btn btn-info btn-addon btn-sm float-right" onClick={() => this.resetState(true)}><FontAwesomeIcon icon="plus" /> <Translate id="Add Material" /></button>
					</h3>
					<div className="card p-3">
						<div className="row">
								<div className="col-md">
									<table className="table table-striped">
										<thead>
											<tr>
												<th>Material</th>
												<th>Description</th>
												<th>Edit</th>
											</tr>
										</thead>
										<tbody>
											{ProductMaterials.map((material) => {
												return (
													<tr key={material.productMaterialId}>
														<td>{material.materialName}</td>
														<td>{material.materialDescription}</td>
														<td className="pl-0 pr-0"><button className="btn btn-info btn-sm" onClick={() => this.handleEdit(material)}><Translate id="Edit" /></button></td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
								{this.state.showMaterialForm === true &&
									<div className="col-md">
										<ProductMaterialForm
											handleEdit={this.handleEdit}
											initialValues={this.state.material}
											resetState={this.resetState}
										/>
									</div>
								}
						</div>
					</div>
				</div>
			</React.Fragment>
		)
	}
}

export const ProductMaterials = compose(
	withRouter,
	queryWithLoading({
		gqlString: getProductMaterialsQuery,
		requiredPermission: { permission: "products", permissionLevel: 4}
	}),
	withTranslate
)(ProductMaterialsClass)
