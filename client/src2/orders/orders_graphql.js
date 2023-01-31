import gql from 'graphql-tag';

// common fields for Product images
export const productImageFields = `
	productId
	productImageId
	caption
	defaultImage
	image {
		location
		filename
		fileId
	}
	thumbnails {
		size
		height
		width
		file {
			location
			filename
		}
	}
`;

export const completeRouteStopMutation = gql `
	mutation completeRouteStop($input: RouteStopInput!) {
		completeRouteStop(input: $input){
			Response {
				success
				message
			}
			jobId
		}
	}
`;

export const getCremationOrderQuery = gql`
	query getCremationOrder {
		OrderServiceStatuses {
			orderServiceStatusId
			orderServiceStatus
		}
		OrderStatuses {
			orderStatusId
			orderStatus
		}
		CremationProducts {
			accountProductName
			productCategory
			productId
			productName
		}
		DeliveryProducts {
			accountProductName
			productId
			productName
		}
		Species {
			speciesId
			species
		}
	}
`;


export const getDeletedCremationProductQuery = gql`
	query getDeletedCremationProduct($orderId: ID!) {
		DeletedCremationProduct (orderId: $orderId) {
			creditCardChargeId
			dateDeleted
			dateRefunded
			deletedFirstName
			deletedLastName
			deletedReason
			invoiceCostCharged
			invoiceCostChargedPersonalization
			invoiceVet
			orderProductId
			payAtPickupOffered
			paymentCompletedAlternative
			paymentCompletedAlternativeMethod
			paymentCompletedPetOwner
			paymentCompletedVetOrder
			priceCharged
			priceChargedPersonalization
			productCategory
			productCategoryId
			productId
			productName
			productTypeId
			refundedFirstName
			refundedLastName
			refundedReason
			statusCompletedAndPackaged
			statusConfirmed
			statusConfirmedIndicator
			statusFurClippingCompleted
			statusIsBurial
			statusIsCremation
			statusIsDelivery
			statusIsFurClipping
			statusIsPawPrint
			statusIsVisitation
			statusOrdered
			statusOrderedIndicator
			statusPawPrintCompleted
			statusPawPrintTaken
			statusRemainsFilled
			statusRemainsFilledIndicator
			statusRequiresPawPrint
			taxCharged
			taxChargedInvoice
		}
	}
`;

export const getOrderServiceStatusesQuery = gql`
	query getOrderServiceStatuses {
		OrderServiceStatuses {
			orderServiceStatusId
			orderServiceStatus
		}
	}
`;

export const getOrderQuery = gql`
	query getOrder($includeDeleted: Boolean, $orderId: ID!) {
		Order (orderId: $orderId) {
			allowHomeMemorialization
			bypassPaymentRequirement
			communalPawPrintAllowed
			companyId
			companyDepartmentId
			CompanyDepartments {
				companyDepartmentId
				active
				companyId
				departmentName
			}
			companyName
			companyType
			courierDeliveryOffered
			crematoryPickupOffered
			cremationTypesOffered
			dateCreated
			dateExpectedDelivery
			dateMemorializationEnds
			DeliveryAddress {
				address1
				address2
				addressId
				addressName
				addressTypeId
				city
				countryId
				ownerName
				pickupDays
				postalCode
				routeId
				routeName
				state
				stateId
				deliveryInstructions
			}
			deliveryAddressId
			deliveryMethodName
			deliveryMethodProductId
			expeditedCremationAllowed
			familyFriendPet
			hardwareFound
			homeMemorializationsEditCremation
			hospitalDeliveryOffered
			ItemsInvoice {
				deleted
				deletedByUserId
				deletedReason
				invoiceCost
				invoiceCostPersonalization
				invoiceCostSubtotal
				invoiceCostTotal
				invoiceId
				invoiceItemDescriptionPrivate

				invoiceItemDescription
				invoiceItemId
				invoiceItemType
				orderId
				orderProductId
				petReferenceNumber
				productName
				taxDue
				taxRate
				totalCharity
			}
			LogOrderActivities {
				logOrderActivityId
				accountId
				activity
				activityType
				dateCreated
				dbField
				dbTable
				loggedInUserId
				loggedInUserFirstName
				loggedInUserLastName
				orderId
				showVet
				userInitials
				valueNew
				valueOld
			}
			memorialization
			memorializationCheckedOut
			OrderComments {
				companyName
				dateCreated
				dateEnded
				firstName
				lastName
				orderComment
				orderCommentId
				orderCommentInternal
				orderCommentMadeBy
				orderCommentStatus
				orderCommentType
			}
			OrderHold {
				companyTypeId
				dateCreated
				dateRemoved
				firstName
				lastName
				orderHold
				orderHoldId
				orderHoldReason
				orderHoldRemovedReason
				orderId
				removerId
				userId
			}
			orderId
			orderServiceStatus
			orderServiceStatusId
			orderStatus
			orderStatusId
			orderTypeId
			OwnerAddress {
				address1
				address2
				addressId
				addressTypeId
				city
				countryId
				postalCode
				state
				stateId
				deliveryInstructions
			}
			ownerAddressId
			ownerEmail
			ownerFirstName
			ownerLastName
			ownerPhoneNumber
			payAtPickupOffered
			payByCreditCardOffered
			payVetOrderByCreditCardOffered
			paymentAlternativeOffered
			paymentTerms
			petBreed
			petColor
			petFirstName
			petLastName
			petReferenceNumber
			PickupAddress {
				address1
				address2
				addressId
				addressName
				addressTypeId
				city
				countryId
				pickupDays
				postalCode
				routeId
				routeName
				state
				stateId
				deliveryInstructions
			}
			pickupAddressId
			PrintablesOrders {
				dateCreated
				filedId
				File {
					filename
					location
				}
				orderId
				printableId
				printableOrderId
				statusCompleted
			}
			PrintablesLogs {
				datePrinted
				fileId
				File {
					filename
					location
				}
				orderId
				printableId
				printableLogId
				userId
				firstName
				lastName
			}
			ProductCompanyPromotion {
				productCompanyPromotionId
				productId
				amountDiscount
				units
				personalization
				maxQuantity
				Products {
					productName
					productId
				}
				ProductCategory {
					productCategoryId
					productCategory
				}
			}
			ProductOptions {
				optionName
				orderProductId
				orderProductProductOptionId
				productAttributeId
				productOptionId
				productOptionValueId
				sortOrderProductOption
				textString
				valueLabel
			}
			ProductsOrder (includeDeleted: $includeDeleted) {
				accountDescriptionLong
				accountDescriptionShort
				accountProductName
				creditCardChargeId
				dateDeleted
				dateRefunded
				deletedFirstName
				deletedLastName
				deletedReason
				invoiceCostCharged
				invoiceCostChargedPersonalization
				invoiceVet
				orderProductId
				payAtPickup
				payAtPickupOffered
				paymentCompletedAlternative
				paymentCompletedAlternativeMethod
				paymentCompletedPetOwner
				paymentCompletedVetOrder
				priceCharged
				priceChargedPersonalization
				productAccountActive
				productCategory
				productCategoryId
				productId
				productName
				productTypeId
				refundedFirstName
				refundedLastName
				refundedReason
				statusCompletedAndPackaged
				statusConfirmed
				statusConfirmedIndicator
				statusFurClippingCompleted
				statusIsBurial
				statusIsCremation
				statusIsDelivery
				statusIsFurClipping
				statusIsPawPrint
				statusIsVisitation
				statusOrdered
				statusOrderedIndicator
				statusPawPrintCompleted
				statusPawPrintTaken
				statusRemainsFilled
				statusRemainsFilledIndicator
				statusRequiresPawPrint
				stockAvailable
				stockCheck
				taxCharged
				taxChargedInvoice
			}
			requireInitialsEditOrderDetails
			servicePet
			sex
			specialInstructions
			speciesId
			staffEmployeePet
			tabCremationServicesOpen
			tabDeliveryOpen
			tabJewelryOpen
			tabKeepsakesOpen
			tabMemorializationOpen
			tabPawPrintsOpen
			tabSpecialServicesOpen
			tabUrnsOpen
			trackingDisk
			visitationAllowed
			weight
			weightUnits
		}
		OrderServiceStatuses {
			orderServiceStatusId
			orderServiceStatus
		}
		OrderStatuses {
			orderStatusId
			orderStatus
		}
		Printables {
			printableId
			accountId
			accountPrintableName
			active
			allowCache
			printableImageFileId
			printableName
			printableTemplate
			printableType
			statusCompletedIndicator
			statusQuestionPrompt
		}
		Products {
			productCategory
			productId
			productName
			

		}
		Species {
			speciesId
			species
		}
	}`;

export const getOrderProductsQuery = gql`
	query getOrderProducts($orderId: ID, $petReferenceNumber: String!) {
		Order (orderId: $orderId, petReferenceNumber: $petReferenceNumber) {
			companyId
			companyDepartmentId
			companyName
			companyTypeId
			communalPawPrintAllowed
			courierDeliveryOffered
			cremationTypesOffered
			crematoryPickupOffered
			dateCreated
			dateMemorializationEnds
			deliveryAddressId
			deliveryMethodName
			deliveryMethodProductId
			expeditedCremationAllowed
			homeMemorializationsEditCremation
			hospitalDeliveryOffered
			memorialization
			memorializationCheckedOut
			originallyCommunalCremation
			originallyIndividualCremation
			originallyPrivateCremation
			orderId
			orderStatusId
			orderTypeId
			OwnerAddress {
				address1
				address2
				city
				countryId
				postalCode
				stateId
			}
			ownerAddressId
			ownerEmail
			ownerFirstName
			ownerLastName
			ownerPhoneNumber
			payAtPickupOffered
			payByCreditCardOffered
			payVetOrderByCreditCardOffered
			petColor
			petFirstName
			petLastName
			petReferenceNumber
			ProductOptions {
				optionName
				orderProductId
				orderProductProductOptionId
				productAttributeId
				productOptionId
				productOptionValueId
				sortOrderProductOption
				textString
				valueLabel
			}
			ProductCompanyPromotion {
				productCompanyPromotionId
				productId
				amountDiscount
				units
				personalization
				retail
				maxQuantity
				Products {
					productName
					productId
				}
				ProductCategory {
					productCategoryId
					productCategory
				}
			}
			ProductsCompanyPrice {
				invoiceCost
				invoiceCostPersonalization
				priceRetail
				productId
				unitWeightInvoiceCost
				unitWeightPriceRetail
				unitWeightPriceInterval
				unitWeightPriceIntervalUnits
				unitWeightPriceMax
				unitWeightPriceMin
			}
			ProductsOrder {
				accountDescriptionLong
				accountDescriptionShort
				accountProductName
				creditCardChargeId
				canUseKeepsakeStand
				descriptionShort
				descriptionLong
				invoiceVet
				orderProductCreated
				orderProductId
				parentCategory
				paymentCompletedAlternative
				paymentCompletedAlternativeMethod
				paymentCompletedPetOwner
				paymentCompletedVetOrder
				personalizationAllowed
				personalizeProduct
				personalizationConfirmed
				priceCharged
				priceChargedPersonalization
				productAccountActive
				productCategory
				productId
				productName
				productTypeId
				statusRemainsFilledIndicator
				taxCharged
				taxRate
			}
			specialInstructions
			speciesId
			tabCremationServicesOpen
			tabDeliveryOpen
			tabJewelryOpen
			tabKeepsakesOpen
			tabMemorializationOpen
			tabPawPrintsOpen
			tabSpecialServicesOpen
			tabUrnsOpen
			trackingDisk
			visitationAllowed
			weight
			weightUnits
		}
	}`;

export const getOrderStatusLogsQuery = gql`
	query getOrder($includeDeleted: Boolean, $orderId: ID, $petReferenceNumber: String) {
		Order (orderId: $orderId, petReferenceNumber: $petReferenceNumber) {
			allowHomeMemorialization
			communalPawPrintAllowed
			companyId
			companyName
			companyNameLegal
			companyType
			courierDeliveryOffered
			crematoryPickupOffered
			cremationTypesOffered
			dateCreated
			dateExpectedDelivery
			dateMemorializationEnds
			DeliveryAddress {
				address1
				address2
				addressId
				addressName
				addressTypeId
				city
				countryId
				ownerName
				pickupDays
				postalCode
				routeId
				routeName
				state
				stateId
				deliveryInstructions
			}
			deliveryAddressId
			deliveryMethodName
			deliveryMethodProductId
			expeditedCremationAllowed
			familyFriendPet
			hardwareFound
			homeMemorializationsEditCremation
			hospitalDeliveryOffered
			LogOrderActivities {
				logOrderActivityId
				accountId
				activity
				activityType
				dateCreated
				dbField
				dbTable
				loggedInUserId
				loggedInUserFirstName
				loggedInUserLastName
				orderId
				showVet
				userInitials
				valueNew
				valueOld
			}
			memorialization
			memorializationCheckedOut
			orderCompletedIndicator
			orderId
			orderServiceStatus
			orderServiceStatusId
			orderStatus
			orderStatusId
			orderTypeId
			ownerEmail
			ownerFirstName
			ownerLastName
			ownerPhoneNumber
			payAtPickupOffered
			payByCreditCardOffered
			payVetOrderByCreditCardOffered
			paymentAlternativeOffered
			paymentTerms
			petBreed
			petColor
			petFirstName
			petLastName
			petReferenceNumber
			PickupAddress {
				address1
				address2
				addressId
				addressName
				addressTypeId
				city
				countryId
				pickupDays
				postalCode
				routeId
				routeName
				state
				stateId
				deliveryInstructions
			}
			pickupAddressId
			ProductsOrder (includeDeleted: $includeDeleted) {
				accountDescriptionLong
				accountDescriptionShort
				accountProductName
				creditCardChargeId
				dateDeleted
				dateRefunded
				deletedFirstName
				deletedLastName
				deletedReason
				invoiceCostCharged
				invoiceCostChargedPersonalization
				invoiceVet
				orderProductId
				payAtPickup
				payAtPickupOffered
				paymentCompletedAlternative
				paymentCompletedAlternativeMethod
				paymentCompletedPetOwner
				paymentCompletedVetOrder
				priceCharged
				priceChargedPersonalization
				productAccountActive
				productCategory
				productCategoryId
				productId
				productName
				productTypeId
				refundedFirstName
				refundedLastName
				refundedReason
				statusCompletedAndPackaged
				statusConfirmed
				statusConfirmedIndicator
				statusFurClippingCompleted
				statusIsBurial
				statusIsCremation
				statusIsDelivery
				statusIsFurClipping
				statusIsPawPrint
				statusIsVisitation
				statusOrdered
				statusOrderedIndicator
				statusPawPrintCompleted
				statusPawPrintTaken
				statusRemainsFilled
				statusRemainsFilledIndicator
				statusRequiresPawPrint
				taxCharged
				taxChargedInvoice
			}
			servicePet
			sex
			specialInstructions
			speciesId
			staffEmployeePet
			tabCremationServicesOpen
			tabDeliveryOpen
			tabJewelryOpen
			tabKeepsakesOpen
			tabMemorializationOpen
			tabPawPrintsOpen
			tabSpecialServicesOpen
			tabUrnsOpen
			trackingDisk
			visitationAllowed
			weight
			weightUnits
		}
		OrderServiceStatuses {
			orderServiceStatusId
			orderServiceStatus
		}
		OrderStatuses {
			orderStatusId
			orderStatus
		}
		Species {
			speciesId
			species
		}
	}`;

export const getOrderStatusesQuery = gql`
	query getOrderStatuses {
		OrderStatuses {
			active
			barcode
			defaultSortOrder
			editable
			orderStatus
			orderStatusId
			orderCompletedIndicator
			visibleOrderUpdater
			sortOrder
			statusAtCrematory
			statusAtVet
			statusInTransit
		}
	}`;

// used for order lists without paging
export const getOrdersQuery = gql`
	query getOrders($orderQueue: String) {
		OrderWorkQueue (orderQueue: $orderQueue) {
			orders {
				companyId
				companyDepartmentId
				companyName
				dateCreated
				dateExpectedDelivery
				dateMemorializationEnds
				dateNextFollowUpCall
				dateScannedAtCrematory
				deliveryAddressId
				deliveryMethodName
				deliveryMethodProductId
				memorialization
				memorializationCheckedOut
				orderCompletedIndicator
				orderId
				orderTypeId
				OrderHold {
					companyTypeId
					dateCreated
					dateRemoved
					firstName
					lastName
					orderHold
					orderHoldId
					orderHoldReason
					orderHoldRemovedReason
					orderId
					removerId
					userId
				}
				pickupAddressId
				ProductsOrder {
					accountDescriptionLong
					accountDescriptionShort
					accountProductName
					creditCardChargeId
					orderProductId
					personalizationConfirmed
					personalizeProduct
					productCategory
					productId
					productMaterialId
					productName
					productTypeId
					statusCompletedAndPackaged
					statusConfirmed
					statusConfirmedIndicator
					statusFurClippingCompleted
					statusIsBurial
					statusIsCremation
					statusIsDelivery
					statusIsFurClipping
					statusIsPawPrint
					statusIsVisitation
					statusOrdered
					statusOrderedIndicator
					statusPawPrintCompleted
					statusPawPrintTaken
					statusRemainsFilled
					statusRemainsFilledIndicator
					statusRequiresPawPrint
					stockAvailable
				}
				orderServiceStatus
				orderServiceStatusId
				orderStatus
				orderStatusId
				orderTypeId
				petFirstName
				petLastName
				petReferenceNumber
				routeId
				statusAtCrematory
				tabMemorializationOpen
				trackingDisk
				weight
				weightUnits
			}
			cursor {
				after
			}
		}
		OrderServiceStatuses {
			orderServiceStatusId
			orderServiceStatus
		}
		OrderStatuses {
			orderStatusId
			orderStatus
		}
	}
`;

export const GetRouteAddresses = gql`
	query GetRouteAddresses($routeId: ID) {
		getRouteAddresses(routeId: $routeId) {
			companyAddressId
			companyId
			addressName
			routeId
			routeStopOrder
			addressId
			address1
			address2
			city
		}
	}
`;

export const GetRoutes = gql`
	query Routes {
		Routes {
			routeId
			routeName
		}
	}
`;

export const GetOrderQueue = gql`
	query OrderQueue($orderQueue: String) {
		OrderWorkQueue (orderQueue: $orderQueue) {
			cursor {
				after
			}
			orders {
				dateCreated
				deliveryAddressId
				pickupAddressId
				orderId
				orderServiceStatus
				orderServiceStatusId
				orderStatus
				orderStatusId
				petFirstName
				petLastName
				petReferenceNumber
			}
			orderQueue
		}
		OrderServiceStatuses {
			orderServiceStatusId
			orderServiceStatus
		}
		OrderStatuses {
			orderStatusId
			orderStatus
		}
	}
`;

// This is the exact same functionality as the above Get query, except that the Orderhold subresolver is included for the Routes workqueue. The reason this is a separate query is that we do not want to unnecessarily include the OrderHold subresolver is all of the other work queues
export const GetRoutesOrderQueue = gql`
	query OrderQueue($orderQueue: String, $orderStatusIds: [ID]) {
		OrderWorkQueue (orderQueue: $orderQueue, orderStatusIds: $orderStatusIds) {
			cursor {
				after
			}
			orders {
				companyId
				companyDepartmentId
				companyName
				dateCreated
				dateMemorializationEnds
				deliveryAddressId
				memorialization
				memorializationCheckedOut
				orderId
				OrderHold {
					companyTypeId
					dateCreated
					dateRemoved
					firstName
					lastName
					orderHold
					orderHoldId
					orderHoldReason
					orderHoldRemovedReason
					orderId
					removerId
					userId
				}
				orderServiceStatus
				orderServiceStatusId
				orderStatus
				orderStatusId
				orderTypeId
				petFirstName
				petLastName
				petReferenceNumber
				pickupAddressId
				ProductsOrder {
					orderProductId
					productCategory
					productCategoryId
					productId
					productName
					productTypeId
					isFurClipping
					isPawPrint
					requiresPawPrint
					statusIsFurClipping
					statusIsPawPrint
				}
				tabMemorializationOpen
				weight
				weightUnits
			}
			orderQueue
		}
		OrderServiceStatuses {
			orderServiceStatusId
			orderServiceStatus
		}
		OrderStatuses {
			orderStatusId
			orderStatus
		}
	}
`;

// used for Orders list with paging
export const GetOrders = gql`
	query OrderList ($cursor: OrderListCursorInput, $OrderSearchInput: OrderSearchInput){
		Orders (cursor: $cursor, OrderSearchInput: $OrderSearchInput) {
			orders {
				companyId
				companyDepartmentId
				companyName
				dateCreated
				dateMemorializationEnds
				deliveryAddressId
				deliveryMethodName
				deliveryMethodProductId
				memorialization
				memorializationCheckedOut
				orderCompletedIndicator
				orderId
				orderTypeId
				ProductsOrder {
					orderProductId
					productCategoryId
					productId
					productName
					productTypeId
				}
				OrderHold {
					companyTypeId
					dateCreated
					dateRemoved
					firstName
					lastName
					orderHold
					orderHoldId
					orderHoldReason
					orderHoldRemovedReason
					orderId
					removerId
					userId
				}
				orderServiceStatus
				orderServiceStatusId
				orderStatus
				orderStatusId
				ownerEmail
				ownerFirstName
				ownerLastName
				ownerPhoneNumber
				petColor
				petFirstName
				petLastName
				petReferenceNumber
				pickupAddressId
				speciesId
				tabMemorializationOpen
				weight
				weightUnits
			}
			cursor {
				after
			}
		}
	}
`;

export const GeneratePackingSlipMutation = gql`
	mutation generatePackingSlip($input: GeneratePackingSlipInput!) {
		generatePackingSlip (input: $input) {
			Response {
				success
				message
			}
			PrintableOrder {
				dateCreated
				filedId
				File {
					filename
					location
				}
				orderId
				printableId
				printableOrderId
				statusCompleted
			}
		}
	}
`;

export const PetCheckerMutation = gql`
	mutation petReferenceNumberCheck($input: PetReferenceNumberCheckInput!) {
		petReferenceNumberCheck (input: $input) {
			Response {
				success
				message
			}
			Order {
				companyId
				companyDepartmentId
				companyName
				dateCreated
				dateMemorializationEnds
				DeliveryAddress {
					address1
					address2
					addressId
					addressTypeId
					city
					countryId
					ownerName
					postalCode
					state
					stateId
					deliveryInstructions
				}
				deliveryAddressId
				deliveryMethodName
				deliveryMethodProductId
				memorialization
				memorializationCheckedOut
				OrderComments {
					dateCreated
					dateEnded
					orderComment
					orderCommentId
					orderCommentInternal
					orderCommentMadeBy
					orderCommentStatus
					orderCommentType
				}
				OrderHold {
					companyTypeId
					dateCreated
					dateRemoved
					firstName
					lastName
					orderHold
					orderHoldId
					orderHoldReason
					orderHoldRemovedReason
					orderId
					removerId
					userId
				}
				orderId
				orderServiceStatus
				orderServiceStatusId
				orderStatus
				orderStatusId
				orderType
				orderTypeId
				ownerEmail
				ownerFirstName
				ownerLastName
				ownerPhoneNumber
				petColor
				petFirstName
				petLastName
				petReferenceNumber
				PickupAddress {
					address1
					address2
					addressId
					addressTypeId
					city
					countryId
					postalCode
					state
					stateId
					deliveryInstructions
				}
				pickupAddressId
				ProductsOrder {
					orderProductId
					isPawPrint
					isFurClipping
					requiresPawPrint
					productCategoryId
					productId
					productName
					productTypeId
					statusCompletedAndPackaged
					statusConfirmed
					statusConfirmedIndicator
					statusFurClippingCompleted
					statusIsBurial
					statusIsCremation
					statusIsDelivery
					statusIsFurClipping
					statusIsPawPrint
					statusIsVisitation
					statusOrdered
					statusOrderedIndicator
					statusPawPrintCompleted
					statusPawPrintTaken
					statusRemainsFilled
					statusRemainsFilledIndicator
					statusRequiresPawPrint
				}
				speciesId
				tabMemorializationOpen
				trackingDisk
				weight
				weightUnits
			}
		}
	}
`;

export const PetReferenceNumberCheckMutation = gql`
	mutation petReferenceNumberCheck($input: PetReferenceNumberCheckInput!) {
		petReferenceNumberCheck (input: $input) {
			Response {
				success
				message
			}
			Order {
				dateMemorializationEnds
				memorialization
				petReferenceNumber
				orderId
				tabMemorializationOpen
			}
		}
	}
`;

export const PetReferenceNumberCompareMutation = gql`
	mutation petReferenceNumberCompare($input: PetReferenceNumberCheckInput!) {
		petReferenceNumberCompare (input: $input) {
			Response {
				success
				message
			}
			Order {
				petReferenceNumber
			}
		}
	}
`;

export const PrintableOrderSaveMutation = gql`
	mutation printableOrderSave($input: PrintableOrderSaveInput!) {
		printableOrderSave (input: $input) {
			Response {
				success
				message
			}
			PrintablesOrder {
				dateCreated
				filedId
				File {
					filename
					location
				}
				orderId
				printableId
				printableOrderId
				statusCompleted
			}
		}
	}
`;


export const OrderCommentSaveMutation = gql`
	mutation orderCommentSave($input: OrderCommentInput!) {
		orderCommentSave (input: $input) {
			Response {
				success
				message
			}
			OrderComment {
				dateCreated
				orderCommentId
			}
		}
	}
`;


export const OrderCremationSaveMutation = gql`
	mutation orderCremationSave($input: OrderInput!) {
		orderCremationSave (input: $input) {
			Response {
				success
				message
			}
			jobId
			OrderCremation {
				companyTypeId
				creatorInitials
				deliveryAddressId
				deliveryMethodProductId
				expeditedCremation
				memorialization
				memorializationCheckedOut
				orderId
				orderServiceStatusId
				orderStatusId
				ownerEmail
				ownerFirstName
				ownerLastName
				ownerPhoneNumber
				petBreed
				petColor
				petFirstName
				petLastName
				petReferenceNumber
				pickupAddressId
				sex
				speciesId
				productId
				weight
				weightUnits
			}
		}
	}
`;

export const OrderStatusUpdateMutation = gql`
	mutation orderStatusUpdate($input: OrderInput!) {
		orderStatusUpdate (input: $input) {
			Response {
				success
				message
			}
			Order {
				companyId
				companyDepartmentId
				companyName
				dateCreated
				dateMemorializationEnds
				DeliveryAddress {
					address1
					address2
					addressId
					addressTypeId
					city
					countryId
					ownerName
					postalCode
					state
					stateId
					deliveryInstructions
				}
				deliveryAddressId
				deliveryMethodName
				deliveryMethodProductId
				memorialization
				memorializationCheckedOut
				OrderComments {
					dateCreated
					dateEnded
					orderComment
					orderCommentId
					orderCommentInternal
					orderCommentMadeBy
					orderCommentStatus
					orderCommentType
				}
				OrderHold {
					companyTypeId
					dateCreated
					dateRemoved
					firstName
					lastName
					orderHold
					orderHoldId
					orderHoldReason
					orderHoldRemovedReason
					orderId
					removerId
					userId
				}
				orderId
				orderServiceStatus
				orderServiceStatusId
				orderStatus
				orderStatusId
				orderType
				orderTypeId
				ownerEmail
				ownerFirstName
				ownerLastName
				ownerPhoneNumber
				petColor
				petFirstName
				petLastName
				petReferenceNumber
				PickupAddress {
					address1
					address2
					addressId
					addressTypeId
					city
					countryId
					postalCode
					state
					stateId
					deliveryInstructions
				}
				pickupAddressId
				ProductsOrder {
					orderProductId
					isPawPrint
					isFurClipping
					requiresPawPrint
					productCategoryId
					productId
					productName
					productTypeId
					statusCompletedAndPackaged
					statusConfirmed
					statusConfirmedIndicator
					statusFurClippingCompleted
					statusIsBurial
					statusIsCremation
					statusIsDelivery
					statusIsFurClipping
					statusIsPawPrint
					statusIsVisitation
					statusOrdered
					statusOrderedIndicator
					statusPawPrintCompleted
					statusPawPrintTaken
					statusRemainsFilled
					statusRemainsFilledIndicator
					statusRequiresPawPrint
				}
				speciesId
				trackingDisk
				weight
				weightUnits
			}
		}
	}
`;

export const OrderDeleteMutation = gql`
	mutation orderDelete($input: OrderDeleteInput!) {
		orderDelete (input: $input) {
			Response{
				success
				message
			}
			OrderDelete{
				orderId
			}
		}
	}
`;

export const OrderHoldSaveMutation = gql`
	mutation orderHoldSave($input: OrderHoldInput!) {
		orderHoldSave (input: $input) {
			Response{
				success
				message
			}
			OrderHold{
				companyTypeId
				orderHold
				orderHoldId
				orderId
			}
		}
	}
`;

export const OrderProductConfirmEngraving = gql`
	mutation orderProductConfirmEngraving($input: OrderProductInput) {
		orderProductConfirmEngraving (input: $input) {
			Response{
				success
				message
			}
		}
	}
`;

export const OrderProductDeleteMutation = gql`
	mutation orderProductDelete($input: OrderProductInput!) {
		orderProductDelete (input: $input) {
			Response{
				success
				message
			}
		}
	}
`;

// Purposely doing type orderProductDelete here because it has the exact same information as a new orderProductUndelete type would
export const OrderProductUndeleteMutation = gql`
	mutation orderProductUndelete($input: OrderProductInput!) {
		orderProductUndelete (input: $input) {
			Response{
				success
				message
			}
		}
	}
`;

export const OrderProductProductOptionSaveMutation = gql`
	mutation orderProductProductOptionSave($input: OrderProductProductOptionInput!) {
		orderProductProductOptionSave (input: $input) {
			Response{
				success
				message
			}
			OrderProductProductOption{
				orderProductId
				productAttributeId
			}
		}
	}
`;

export const OrderProductRefundMutation = gql`
	mutation orderProductRefund($input: OrderProductRefundInput!) {
		orderProductRefund (input: $input) {
			Response{
				success
				message
			}
		}
	}
`;

export const OrderProductRemoveMutation = gql`
	mutation orderProductRemove($input: OrderProductInput!) {
		orderProductRemove (input: $input) {
			Response{
				success
				message
			}
			OrderProduct{
				orderId
				productId
			}
		}
	}
`;

export const OrderProductSaveMutation = gql`
	mutation orderProductSave($input: OrderProductInput! ) {
		orderProductSave (input: $input) {
			Response{
				success
				message
			}
			OrderProduct{
				orderId
				orderProductId
				productId
				productName
			}
			OrderProductProductOptions {
				optionName
				orderProductId
				orderProductProductOptionId
				productAttributeId
				productOptionId
				productOptionValueId
				sortOrderProductOption
				textString
				valueLabel
			}
		}
	}
`;

export const OrderProductsPaidMutation = gql`
	mutation orderProductsPaid($input: OrderProductInput!) {
		orderProductsPaid (input: $input) {
			Response{
				success
				message
			}
		}
	}
`;

export const OrderSaveMutation = gql`
	mutation orderSave($input: OrderInput!) {
		orderSave (input: $input) {
			Response {
				success
				message
			}
			jobId
			Order {
				deliveryAddressId
				deliveryMethodName
				deliveryMethodProductId
				orderId
				orderTypeId
				petReferenceNumber
				orderStatusId
			}
		}
	}
`;

export const PrintableLogSaveMutation = gql`
	mutation printableLogSave($input: PrintableLogInput!) {
		printableLogSave (input: $input) {
			PrintableLog {
				printableLogId
			}
		}
	}
`;

export const ProductOrderDuplicateCremationOrderMutation = gql`
	mutation productOrderDuplicateCremationOrder($input: OrderInput) {
		productOrderDuplicateCremationOrder (input: $input) {
			orderId
			petReferenceNumber
		}
	}
`;

export const OrderUpdateSubscription = gql`
	subscription {
		OrderUpdateSubscription {
			orderId
			orderStatusId
		}
	}
`;
