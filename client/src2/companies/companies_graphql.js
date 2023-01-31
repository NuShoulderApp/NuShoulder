import gql from 'graphql-tag';

import { productImageFields } from "../products/products_graphql"

const companyFields = `
	accountId
	accountNumber
	active
	allowHomeMemorialization
	bccHospitalForCustomerEmails
	communalPawPrintAllowed
	companyId
	companyName
	companyNameLegal
	companyDescription
	companyIconId
	companyLogoId
	companyTypeId
	courierDeliveryOffered
	crematoryPickupOffered
	cremationTypesOffered
	defaultDiscount
	defaultUnits
	expeditedCremationAllowed
	homeMemorializationsEditCremation
	hospitalDeliveryOffered
	hoursOfOperation
	invoiceEmail
	payAtPickupOffered
	payByCreditCardOffered
	payVetOrderByCreditCardOffered
	paymentTerms
	petReferenceNumberAutoGenerate
	requireInitialsEditOrderDetails
	sendOwnerEmailCompletedDelivered
	visitationAllowed
`;

// Implemented as a fragment so we can update the cache on demand.
export const ProductCompanyPriceFragment = gql `
	fragment ProductCompanyPriceFragment on Product {
		ProductCompanyPrice(companyId: $companyId){
			productCompanyPriceId
			priceRetail
			priceRetailPersonalization
			productId
			companyId
			invoiceCost
			invoiceCostPersonalization
			unitWeightInvoiceCost
			unitWeightPriceRetail
			unitWeightPriceInterval
			unitWeightPriceIntervalUnits
			unitWeightPriceMax
			unitWeightPriceMin
		}
	}
`;

export const getCompanyAddressesQuery = gql`
    query getCompanyAddresses($companyId: ID, $returnAllAddresses: Boolean, $userId: ID) {
		CompanyAddresses (companyId: $companyId, returnAllAddresses: $returnAllAddresses, userId: $userId) {
            accountId
            active
			addressName
			address1
            address2
            addressId
            addressTypeId
            city
            companyAddressId
            companyId
            companyName
            countryId
            deliveryInstructions
			ownerName
            postalCode
            state
			stateId
			routeId
			routeStopOrder
		}
	}
`;

export const getCompanyPhonesQuery = gql`
    query getCompanyPhones($companyId: ID, $userId: ID) {
		CompanyPhones (companyId: $companyId, userId: $userId) {
		    accountId,
		    active,
		    phoneId,
		    companyId,
            companyPhoneId
		}
	}
`;

export const getCompanyProductPromotionsQuery = gql`
	query getProductCompanyPromotions($companyId: ID!, $productId: ID!) {
		ProductCompanyPromotions (companyId: $companyId, productId: $productId) {
			productCompanyPromotionId
			ProductCategory {
				productCategoryId
				productCategory
			}
			Products {
				productId
				productName
			}
			amountDiscount
			maxQuantity
			units
			personalization
			retail
		}
	}
`;

export const getCompanyOptionsQuery = gql`
	query getCompanyOptions($companyId: ID!) {
		Company (companyId: $companyId) {
			${companyFields}
			CompanyDepartments {
				companyDepartmentId
				active
				companyId
				departmentName
			}
		}
	}
`;

export const getCompanyQuery = gql`
	${ProductCompanyPriceFragment}
    query getCompany($companyId: ID!) {
		Company (companyId: $companyId) {
			${companyFields}
			Products {
				active
				accountDescriptionLong
				accountDescriptionShort
				accountProductName
				productId
				invoiceCost
				invoiceCostPersonalization
				priceRetail
				priceRetailPersonalization
				productAccountActive
				productCategoryId
				productTypeId
				productName
				unitWeightInvoiceCost
				unitWeightPriceRetail
				unitWeightPriceInterval
				unitWeightPriceIntervalUnits
				unitWeightPriceMax
				unitWeightPriceMin
				defaultImage {
					${productImageFields}
				}
				...ProductCompanyPriceFragment
				ProductAccountWeightTierPrice {
					productPriceWeightId
					productId
					accountId
					invoiceCost
					priceRetail
					weightMin
					weightMax
					weightUnits
				}
				ProductCompanyWeightTierPrice (companyId: $companyId) {
					productCompanyPriceWeightId
					productId
					accountId
					invoiceCost
					priceRetail
					weightMin
					weightMax
					weightUnits
				}
			}
            CompanyAddresses {
                accountId
                active
				addressName
				address1
                address2
                addressId
                addressTypeId
				billingCode
                city
                companyAddressId
                companyId
				countryId
				deliveryInstructions
				ownerName
                postalCode
                state
				stateId
				routeId
				routeStopOrder
			}
			CompanyDepartments {
				companyDepartmentId
				active
				companyId
				departmentName
			}
            CompanyPhones {
                active,
                companyId,
                companyPhoneId,
                phone,
                phoneId,
                phoneLabel,
                phoneType,
                phoneTypeId
            }
		}
	}
`;

export const getCompaniesQuery = gql`
    query getCompanies($accountId: ID) {
		Companies (accountId: $accountId) {
		  accountId
			accountNumber
			active
			communalPawPrintAllowed
			companyId
			companyName
			companyNameLegal
			companyDescription
			companyIconId
			companyLogoId
			companyTypeId
			courierDeliveryOffered
			crematoryPickupOffered
			cremationTypesOffered
			defaultDiscount
			homeMemorializationsEditCremation
			hospitalDeliveryOffered
			hoursOfOperation
			invoiceEmail
			payAtPickupOffered
			payByCreditCardOffered
			payVetOrderByCreditCardOffered
			paymentTerms
		}
	}`;

export const InvoiceableCompaniesQuery = gql`
	query getInvoiceableCompanies {
		InvoiceableCompanies {
			companyId
			companyName
		}
	}
`;


export const CompaniesTypesQuery = gql`
    query getCompanyTypes {
		CompanyTypes {
			companyType
			companyTypeId
	  	}
	}
`;

export const CompanyAddressSaveMutation = gql`
	mutation companyAddressSave($input: CompanyAddressInput!) {
		companyAddressSave (input: $input) {
            CompanyAddress {
				accountId
				active
				addressName
				address1
				address2
				addressId
				addressTypeId
				city
				ownerName
				postalCode
				stateId
				companyAddressId
				companyId
				deliveryInstructions
				routeId
			}
			Response {
				success
				message
			}
		}
	}
`;
export const CompanyAddressRemoveMutation = gql`
	mutation companyAddressRemove($companyAddressId: ID!) {
		companyAddressRemove (companyAddressId: $companyAddressId) {
			Response{
				success
				message
			}
		}
	}
`;


export const CompanyDepartmentSaveMutation = gql`
	mutation companyDepartmentSave($input: CompanyDepartmentInput!) {
		companyDepartmentSave (input: $input) {
			Response {
				success
				message
			}
			CompanyDepartment {
				companyDepartmentId,
				active,
				companyId,
				departmentName
			}
		}
	}
`;
export const CompanyDepartmentRemoveMutation = gql`
	mutation companyDepartmentRemove($companyDepartmentId: ID!) {
		companyDepartmentRemove (companyDepartmentId: $companyDepartmentId) {
			Response{
				success
				message
			}
		}
	}
`;


export const CompanyPhoneSaveMutation = gql`
	mutation companyPhoneSave($input: CompanyPhoneInput!) {
		companyPhoneSave (input: $input) {
			Response {
				success
				message
			}
			CompanyPhone {
				accountId,
				active,
				phone,
				phoneId,
				phoneLabel,
				phoneTypeId,
				companyId,
				companyPhoneId
			}
		}
	}
`;
export const CompanyPhoneRemoveMutation = gql`
	mutation companyPhoneRemove($companyPhoneId: ID!) {
		companyPhoneRemove (companyPhoneId: $companyPhoneId) {
			Response{
				success
				message
			}
		}
	}
`;

export const CompanySaveMutation = gql`
    mutation companySave($input: CompanyInput!) {
		companySave (input: $input) {
			Company {
				${companyFields}
			}
			Response {
				success
				message
			}
		}
	}
`;

export const CompanyUserCreateMutation = gql`
    mutation companyUserCreate($input: CompanyUserInput!) {
		companyUserCreate (input: $input) {
            action,
            user {
                email,
                firstName,
                lastName,
                userId
            },
            users {
                dateCreated,
                email,
                firstName,
                lastName,
                middleName,
                userId,
                userTypeId
            }
		}
	}
`;

export const ProductCompanyPriceSaveMutation = gql`
	mutation productCompanyPriceSave($input: ProductCompanyPriceInput!){
		productCompanyPriceSave(input: $input){
		Response {
			success
			message
			code
		}
		ProductCompanyPrice {
			productCompanyPriceId
			priceRetail
			priceRetailPersonalization
			productId
			companyId
			invoiceCost
			invoiceCostPersonalization
			unitWeightInvoiceCost
			unitWeightPriceRetail
			unitWeightPriceInterval
			unitWeightPriceIntervalUnits
			unitWeightPriceMax
			unitWeightPriceMin
		}
		}
	}
`;

export const ProductCompanyWeightTierPriceSaveMutation = gql`
	mutation productCompanyWeightTierPriceSave($input: ProductCompanyWeightTierPriceInput!) {
		productCompanyWeightTierPriceSave(input: $input) {
			Response {
				message
				success
			}
			ProductCompanyWeightTierPrice {
				productCompanyPriceWeightId
				companyId
				productId
				accountId
				invoiceCost
				priceRetail
				weightMin
				weightMax
				weightUnits
			}
		}
	}
`;

export const ProductCompanyWeightTierPriceRemoveMutation = gql`
	mutation productCompanyWeightTierPriceRemove($productCompanyPriceWeightId: ID!) {
		productCompanyWeightTierPriceRemove(productCompanyPriceWeightId: $productCompanyPriceWeightId) {
			Response {
				message
				success
			}
		}
	}
`;

export const ProductCompanyPromotionRemove = gql`
	mutation ProductCompanyPromotionRemove($productCompanyPromotionId: ID!) {
		productCompanyPromotionRemove(productCompanyPromotionId: $productCompanyPromotionId) {
			Response {
				message
				success
			}
		}
	}
`;

export const ProductCompanyPromotionSave = gql`
	mutation ProductCompanyPromotionSave($input: ProductCompanyPromotionInput!) {
		productCompanyPromotionSave(input: $input) {
			Response {
				message
				success
			}
			ProductCompanyPromotion {
				productCompanyPromotionId
				Products {
					productId
					productName
				}
				ProductCategory {
					productCategory
					productCategoryId
				}
				units
				maxQuantity
				amountDiscount
			}
		}
	}
`;
