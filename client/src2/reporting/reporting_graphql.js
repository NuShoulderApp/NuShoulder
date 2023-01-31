import gql from "graphql-tag";

// used for Invoice 'forecasting' page to show how much has been ordered for a time span.
// export const GetInvoiceForecasting = gql`
// 	query InvoiceForecasting ($clinicId: ID, $dateEnd: String, $dateStart: String){
// 		InvoiceForecasting (dateEnd: $dateEnd, dateStart: $dateStart, clinicId: $clinicId) {
// 			companyId
// 			dateCreated
// 			invoiceCost
// 			invoiceCostCharged
// 			invoiceCostChargedPersonalization
// 			invoiceCostPersonalization
// 			invoiceCostSubtotal
// 			invoiceCostTotal
// 			invoiceVet
// 			isFurClipping
// 			isPawPrint
// 			memorialization
// 			orderDate
// 			orderId
// 			orderProductId
// 			orderServiceStatusId
// 			orderStatusId
// 			orderType
// 			orderTypeId
// 			personalizeProduct
// 			petFirstName
// 			petReferenceNumber
// 			priceCharged
// 			priceChargedPersonalization
// 			productCategory
// 			productCategoryId
// 			productId
// 			productName
// 			productType
// 			productTypeId
// 			statusIsCremation
// 			statusIsDelivery
// 			statusIsFurClipping
// 			statusIsPawPrint
// 			taxCharged
// 			taxChargedInvoice
// 			taxDue
// 			taxRate
// 			vetSupplyOrder
// 		}
// 	}
// `;

// export const GetInvoiceItemsForecasting = gql`
// 	query InvoiceItemsForecasting ($clinicId: ID, $dateEnd: String, $dateStart: String){
// 		InvoiceItemsForecasting (dateEnd: $dateEnd, dateStart: $dateStart, clinicId: $clinicId) {
// 			adjustmentInvoiceCostSubtotal
// 			adjustmentInvoiceCostTotal
// 			adjustmentInvoiceItemDescription
// 			adjustmentInvoiceItemDescriptionPrivate
// 			adjustmentInvoiceItemType
// 			adjustmentOrderId
// 			adjustmentTaxDue
// 		}
// 	}
// `;
