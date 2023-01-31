import gql from "graphql-tag";

export const getInvoiceQuery = gql`
	query getInvoice ($invoiceId: ID!, $orderId: ID) {
        Invoice (invoiceId: $invoiceId, orderId: $orderId) {
            accountId
            commissionType
            companyAddressId
            companyId
            companyName
            dateCreated
            dateInvoiceDue
            dateInvoicePaid
			dateInvoiceSent
			dateInvoice
			emailedTo
			File {
				fileId
				mimeType
				dateCreated
			}
            invoiceId
            ItemsInvoice {
				accountDescriptionLong
				accountDescriptionShort
				accountProductName
				dateCreated
            	deleted
            	deletedByUserId
            	deletedReason
				familyFriendPet
				invoiceCost
                invoiceCostPersonalization
                invoiceCostSubtotal
                invoiceCostTotal
            	invoiceItemDescriptionPrivate
            	invoiceItemDescription
                invoiceItemId
            	invoiceItemType
            	orderId
            	orderProductId
                petReferenceNumber
				productName
				servicePet
				staffEmployeePet
            	taxDue
            	taxRate
            	totalCharity
            }
            paymentTerms
            taxDue
            totalCharity
            totalDue
        }
	}
`;

export const getInvoicesQuery = gql`
	query getInvoices ($accountId: ID, $companyId: ID) {
        Invoices (accountId: $accountId, companyId: $companyId) {
            accountId
            commissionType
            companyId
            companyName
            dateCreated
            dateInvoiceDue
            dateInvoicePaid
            dateInvoiceSent
            emailedTo
			File {
				fileId
				mimeType
			}
            invoiceId
            paymentTerms
            taxDue
            totalCharity
            totalDue
        }
	}
`;

export const getInvoiceableAdjustmentsQuery = gql`
	query getInvoiceableAdjustments ($companyId: ID, $dateEnd: Date, $dateStart: Date) {
		InvoiceableAdjustments (companyId: $companyId, dateEnd: $dateEnd, dateStart: $dateStart) {
			companyName
			familyFriendPet
            invoiceCostCharged
            invoiceCostChargedPersonalization
			invoiceCostSubtotal
			invoiceCostTotal
			invoiceItemDescription
			invoiceItemId
			invoiceItemType
			invoiceVet
			orderId
			orderProductId
            petReferenceNumber
			priceCharged
			priceChargedPersonalization
			servicePet
			staffEmployeePet
            taxCharged
            taxChargedInvoice
			taxDue
        }
	}
`;

export const getInvoiceableOrdersProductsQuery = gql`
	query getInvoiceableOrdersProducts ($companyId: ID, $dateEnd: Date, $dateStart: Date) {
		InvoiceableOrdersProducts (companyId: $companyId, dateEnd: $dateEnd, dateStart: $dateStart) {
			accountDescriptionLong
			accountDescriptionShort
			accountProductName
			companyName
			familyFriendPet
            invoiceCostCharged
            invoiceCostChargedPersonalization
			invoiceVet
			orderId
			orderProductId
            petReferenceNumber
			priceCharged
			priceChargedPersonalization
			productCategoryId
            productId
			productName
            productTypeId
            productType
			servicePet
			staffEmployeePet
            taxCharged
            taxChargedInvoice
        }
	}
`;

export const GetInvoices = gql`
    query InvoiceList($cursor: InvoiceListCursorInput) {
        Invoices (cursor: $cursor) {
            invoices {
                invoiceId
                accountId
                commissionType
                companyAddressId
                companyId
                companyName
                dateCreated
                dateInvoiceDue
                dateInvoicePaid
                dateInvoiceSent
                emailedTo
				File {
					fileId
					mimeType
				}
                paymentTerms
                taxDue
                totalCharity
                totalDue
            }
            cursor {
                after
            }
        }
	}
`;

// used for Invoice 'forecasting' page to show how much has been ordered for a time span.
export const GetInvoiceForecasting = gql`
	query InvoiceForecasting ($clinicId: ID, $dateEnd: String, $dateStart: String, $filterOrderTypeDate: String){
		InvoiceForecasting (dateEnd: $dateEnd, dateStart: $dateStart, clinicId: $clinicId, filterOrderTypeDate: $filterOrderTypeDate) {
			companyId
			dateCreated
			invoiceCost
			invoiceCostCharged
			invoiceCostChargedPersonalization
			invoiceCostPersonalization
			invoiceCostSubtotal
			invoiceCostTotal
			invoiceVet
			isFurClipping
			isPawPrint
			memorialization
			orderDate
			orderId
			orderProductId
			orderServiceStatusId
			orderStatusId
			orderType
			orderTypeId
			personalizeProduct
			petFirstName
			petReferenceNumber
			priceCharged
			priceChargedPersonalization
			productCategory
			productCategoryId
			productId
			productName
			productType
			productTypeId
			statusIsCremation
			statusIsDelivery
			statusIsFurClipping
			statusIsPawPrint
			taxCharged
			taxChargedInvoice
			taxDue
			taxRate
			vetSupplyOrder
		}
	}
`;

export const GetInvoiceItemsForecasting = gql`
	query InvoiceItemsForecasting ($clinicId: ID, $dateEnd: String, $dateStart: String){
		InvoiceItemsForecasting (dateEnd: $dateEnd, dateStart: $dateStart, clinicId: $clinicId) {
			adjustmentInvoiceCostSubtotal
			adjustmentInvoiceCostTotal
			adjustmentInvoiceItemDescription
			adjustmentInvoiceItemDescriptionPrivate
			adjustmentInvoiceItemType
			adjustmentOrderId
			adjustmentTaxDue
		}
	}
`;

export const InvoiceItemDeleteMutation = gql`
    mutation invoiceItemDelete($input: InvoiceItemInput!) {
		invoiceItemDelete (input: $input) {
			Response {
				success
				message
			}
		}
	}
`;

export const InvoiceItemSaveMutation = gql`
    mutation invoiceItemSave($input: InvoiceItemInput!) {
		invoiceItemSave (input: $input) {
			Response {
				success
				message
			}
		}
	}
`;

export const InvoiceSaveMutation = gql`
    mutation invoiceSave($input: InvoiceInput!) {
		invoiceSave (input: $input) {
			Response {
				success
				message
			}
		}
	}
`;

export const InvoiceGenerateAllMutation = gql`
    mutation invoiceGenerateAll($input: InvoiceGeneralAllInput!) {
		invoiceGenerateAll (input: $input) {
			Response {
				success
				message
			}
		}
	}
`;

export const InvoiceSaveAndSendMutation = gql`
	mutation invoiceSaveAndSend($input: InvoiceSaveAndSendInput){
		invoiceSaveAndSend(input: $input){
			Response {
				success
				message
			}
			Invoice {
				invoiceId
				emailedTo
				dateInvoice
				File {
					fileId
					mimeType
					dateCreated
				}
				jobId
			}
		}
	}
`;
