import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { withFormik, Form } from "../utilities/IWDFormik";
import { withRouter } from "react-router-dom";
import { compose } from "react-apollo";

import { withMutation } from '../utilities/IWDDb';
import { Translate, withTranslate } from '../translations/IWDTranslation';
// import { DeliveryComponent } from '../deliveries/delivery_component';

// GRAPHQL QUERY
import {
	OrderSaveMutation
} from './orders_graphql';

import {
	PetReferenceNumberGenerateMutation
} from '../pet_reference_numbers/pet_reference_numbers_graphql';

const OrderSuppliesFormContent = (props) => {
	return (
		<div className="w-100 p-1">
			<div className="card p-3">
				<Form>
					<h5>To request additional supplies, please click the button below and order items and quantities as required from our online store. Our driver will deliver the items on the next pick up day.</h5>
					<button type="submit" className="btn btn-info btn-addon"><FontAwesomeIcon icon="plus" /> <Translate id="Create Supplies Order" /></button>
					<div>Any charges will be billed to your veterinary account.</div>
				</Form>
			</div>
		</div>
	);
};

export const OrderSupplies = compose (
	withMutation(OrderSaveMutation, "OrderSave", ["getOrders"]),
	withMutation(PetReferenceNumberGenerateMutation, "PetReferenceNumberGenerate"),
	withFormik({
		handleSubmit: async ( input, { props: { history, OrderSave, PetReferenceNumberGenerate } } ) => {
			// Generate a random petReferenceNumber
			const { data: { petReferenceNumberGenerate }} = await PetReferenceNumberGenerate({ input: { numberToGenerate: 1} });
			const petReferenceNumber = petReferenceNumberGenerate.PetReferenceNumbers[0].petReferenceNumber;
			// Async/Await Perform the mutation (to the server) and decompose the result.
			const { data: { orderSave }} = await OrderSave({ input: {
				memorialization: 'clinic',
				orderStatusId: 2,
				orderTypeId: 1,
				petReferenceNumber: petReferenceNumber,
				vetSupplyOrder: 1
			}});

			if(orderSave.Response.success === true) {
				// This goes to the same page as a normal cremation memorialization
				history.push(`/orders/order_supplies/referenceNumber/${petReferenceNumber}/productType/4`)
			}
		}
	}),
	withRouter,
	withTranslate
)(OrderSuppliesFormContent);
