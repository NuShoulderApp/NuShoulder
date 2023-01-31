import { Response } from "../../utilities/helpers";
import Math from 'mathjs';
import _ from "lodash";
import { Mutations as PaymentMutations} from './Payment';
import { ProductsCompaniesPromotionsQuery } from "./Order";

// NOTE: use camelCase for fields and PascalCase for types and objects

async function updateOrdersProductsPricesCharged(orderId, context) {
	const knex = context.knex;

	// Get the price calculations for the products attached to the order.
	const UpdatedOrdersProducts = await orderProductsPriceCalculations({ orderId, orderCalculationMode: true }, context);

	// Get the products on the orders so we can know if we need to apply personalization prices.
	const ordersProducts = await knex("ordersProducts").where({ orderId, dateDeleted: null, dateRefunded: null }).select("orderProductId", "personalizeProduct");

	// Get the account tax rate from the settings.
	const accountTaxRate = context.Account.Settings.getSettingValue("taxRate");

	// Loop over all of the products on the order and wait on the knex calls for all of them.
	return await Promise.all(UpdatedOrdersProducts.map(( product ) => {
		const {
			orderProductId,
			calculatedInvoiceCost,
			calculatedInvoiceCostPersonalization,
			calculatedPriceRetail,
			calculatedPriceRetailPersonalization,
			promotionalPriceRetail,
			promotionalPriceRetailPersonalization,
			promotionalInvoiceCost,
			promotionalInvoiceCostPersonalization,
			productCompanyPromotionId,
			statusIsCremation
		} = product;

		// Look up the current product to see if we need to apply personalization pricing.
		const personalizeProduct = ordersProducts.find((orderProduct) => orderProduct.orderProductId === orderProductId ).personalizeProduct;

		// Calculate the tax charges.
		const tempTaxRate = product.taxRate !== null ? product.taxRate : accountTaxRate;

		if( productCompanyPromotionId !== null ) {
			// This product has a promotion attached, so use promotional Pricing.

			// Store the invoice and retail cost for calculating tax. - Make sure these are not null
			let invoiceCost = promotionalInvoiceCost !== null ? promotionalInvoiceCost : 0;
			let retailPrice = promotionalPriceRetail !== null ? promotionalPriceRetail : 0;

			// Make sure these are not null
			const tempPromotionalInvoiceCostPersonalization = promotionalInvoiceCostPersonalization !== null ? promotionalInvoiceCostPersonalization : 0;
			const tempPromotionalPriceRetailPersonalization = promotionalPriceRetailPersonalization !== null ? promotionalPriceRetailPersonalization : 0;

			//////// IMPORTANT!!!!!!!! ////////
			// Calculate the tax charges BEFORE ADDING IN ANY PERSONALIZATION COSTS. ENGRAVING IS A SERVICE AND THEREFORE TAX IS NOT CHARGED. 
			const taxChargedInvoice = statusIsCremation === 1 ? '0.00' : Math.multiply(invoiceCost, tempTaxRate).toFixed(2);
			const taxCharged = statusIsCremation === 1 ? '0.00' : Math.multiply(retailPrice, tempTaxRate).toFixed(2);
			
			//////// IMPORTANT!!!!!!!! ////////
			// If this product includes personalization, add those values in AFTER ADDING IN ANY PERSONALIZATION COSTS. ENGRAVING IS A SERVICE AND THEREFORE TAX IS NOT CHARGED. 
			if( personalizeProduct === 1 ) {
				invoiceCost = Math.add(invoiceCost, tempPromotionalInvoiceCostPersonalization).toFixed(2);
				retailPrice = Math.add(retailPrice, tempPromotionalPriceRetailPersonalization).toFixed(2);
			}

			// Return the knex update query.
			return knex("ordersProducts")
				.update({
					priceCharged: promotionalPriceRetail,
					priceChargedPersonalization: personalizeProduct === 1 ? tempPromotionalPriceRetailPersonalization : null,
					taxCharged,
					taxChargedInvoice,
					productCompanyPromotionId,
					invoiceCostCharged: promotionalInvoiceCost,
					invoiceCostChargedPersonalization: personalizeProduct === 1 ? tempPromotionalInvoiceCostPersonalization : null
				})
				.where({ orderId, orderProductId });
		} else {
			// This product does not have a promotion attached, so use calculated Pricing.

			// Store the invoice and retail cost for calculating tax. - Make sure these are not null
			let invoiceCost = calculatedInvoiceCost !== null ? calculatedInvoiceCost : 0;
			let retailPrice = calculatedPriceRetail !== null ? calculatedPriceRetail : 0;

			// Make sure these are not null
			const tempCalculatedInvoiceCostPersonalization = calculatedInvoiceCostPersonalization !== null ? calculatedInvoiceCostPersonalization : 0;
			const tempCalculatedPriceRetailPersonalization = calculatedPriceRetailPersonalization !== null ? calculatedPriceRetailPersonalization : 0;

			//////// IMPORTANT!!!!!!!! ////////
			// Calculate the tax charges BEFORE ADDING IN ANY PERSONALIZATION COSTS. ENGRAVING IS A SERVICE AND THEREFORE TAX IS NOT CHARGED. 
			const taxChargedInvoice = statusIsCremation === 1 ? '0.00' : Math.multiply(invoiceCost, tempTaxRate).toFixed(2);
			const taxCharged = statusIsCremation === 1 ? '0.00' : Math.multiply(retailPrice, tempTaxRate).toFixed(2);

			//////// IMPORTANT!!!!!!!! ////////
			// If this product includes personalization, add those values in AFTER ADDING IN ANY PERSONALIZATION COSTS. ENGRAVING IS A SERVICE AND THEREFORE TAX IS NOT CHARGED. 
			if( personalizeProduct === 1 ) {
				invoiceCost = Math.add(invoiceCost, tempCalculatedInvoiceCostPersonalization).toFixed(2);
				retailPrice = Math.add(retailPrice, tempCalculatedPriceRetailPersonalization).toFixed(2);
			}

			// Return the knex update query.
			return knex("ordersProducts")
				.update({
					priceCharged: calculatedPriceRetail,
					priceChargedPersonalization: personalizeProduct === 1 ? tempCalculatedPriceRetailPersonalization: null,
					taxCharged,
					taxChargedInvoice,
					productCompanyPromotionId: null,
					invoiceCostCharged: calculatedInvoiceCost,
					invoiceCostChargedPersonalization: personalizeProduct === 1 ? tempCalculatedInvoiceCostPersonalization: null
				})
				.where({ orderId, orderProductId });
		}
	}));
}

// Given an orderId or petReferenceNumber to get the companyId and pet weight from the Order, accept an array of Product(s) and return the array with the calculated priceRetail and priceRetailPersonalization
export async function orderProductsPriceCalculations(input, context) {
	/*
		PRODUCT PRICING
		1) Get Crematory Account Product Price, Personalization Price, Hospital Cost, Personalization Cost
		2) Get for Hospital Default Discount - apply this to calculate the Hospital Hospital Cost, Personalization Cost from the Crematory Account Product Price, Personalization Price
		3) Get Hospital Product Price, Personalization Price, Hospital Cost, Personalization Cost - if these are numeric then use these prices and costs
		4) Apply Hospital Promotional Pricing Discounts
	*/
	const knex = context.knex;

	let {
		orderId = 0,
		petReferenceNumber = "",
		Products,
		productTypeId,
		orderCalculationMode = false
	} = input;

	// Get the order from either the orderId or the petReferenceNumber
	let order = {};
	if(orderId > 0) {
		const [orderResult] = await knex('orders').where({ orderId });
		order = orderResult;
	} else if(petReferenceNumber !== '' && petReferenceNumber !== null) {
		const [orderResult] = await knex('orders').where({ petReferenceNumber });
		order = orderResult;
	}

	// If this is order calculation mode, we will ignore any specified products and get a new copy of the orders products.
	if( orderCalculationMode === true ) {
		Products = await knex("orders")
			.join("ordersProducts","orders.orderId","ordersProducts.orderId")
			.join("productsAccounts",(builder) =>  builder.on("ordersProducts.productId","=","productsAccounts.productId").andOn("productsAccounts.accountId","=","orders.accountId"))
			.join("products", "products.productId", "ordersProducts.productId")
			.where("orders.orderId", order.orderId)
			.whereNull("ordersProducts.dateDeleted")
			.whereNull("ordersProducts.dateRefunded")
			.select("productsAccounts.*",
				"products.productTypeId",
				"ordersProducts.priceCharged",
				"ordersProducts.priceChargedPersonalization",
				"ordersProducts.statusIsCremation",
				"ordersProducts.taxCharged",
				"ordersProducts.taxChargedInvoice",
				"ordersProducts.invoiceCostCharged",
				"ordersProducts.invoiceCostChargedPersonalization",
				"ordersProducts.productCompanyPromotionId",
				"ordersProducts.orderProductId"
			)
			// We want to order by promotions first so they get applied to the same product.
			.orderBy("ordersProducts.productCompanyPromotionId", "desc")
			// Finally order by the order in which the products were added to the order.
			.orderBy("ordersProducts.orderProductId","asc");
	}

	// Get the defaultDiscount for the company
	const [company] = await knex('companies').where('companyId', order.companyId);
	const defaultDiscount = company.defaultDiscount > 0 ? Math.divide(company.defaultDiscount, 100) : 0;

	const productsPricesWeights = parseInt(productTypeId) !== 4 ? await context.knex('productsPricesWeights').where('accountId', context.Account.accountId).orderBy('weightMin', 'DESC') : [];
	const productsCompaniesPrices = await context.knex('productsCompaniesPrices').where('companyId', order.companyId);
	const productsCompaniesPricesWeights = parseInt(productTypeId) !== 4 ? await context.knex('productsCompaniesPricesWeights').where('companyId', order.companyId).orderBy('weightMin', 'DESC') : [];

	const PromotionsQuery = ProductsCompaniesPromotionsQuery( order.orderId, context )
		.join("productsCompaniesPromotionsProducts","productsCompaniesPromotions.productCompanyPromotionId", "productsCompaniesPromotionsProducts.productCompanyPromotionId")
		.select("productsCompaniesPromotionsProducts.productId as promotionProductId")
		.orderBy("productsCompaniesPromotionsProducts.productId");

	// The list of promotions to apply will depend on the calculation mode.
	let productsCompaniesPromotions;

	if( orderCalculationMode === false ) { // Called from Product Details content within Memorialization 'BH'
		// We are in product list mode.  We need to apply any valid promotions to all possible products.

		// If the promotion has been applied the maximum number of times we will not show any products as reduced pricing.
		// Here we get the count to compare to the max quantity
		const promotionUsedCount = knex("ordersProducts")
			.select(knex.raw("count(1) as promotionUsedCount"), "productCompanyPromotionId")
			.where("ordersProducts.orderId", order.orderId)
			.whereNull("ordersProducts.dateDeleted")
			.whereNull("ordersProducts.dateRefunded")
			.whereNotNull("productCompanyPromotionId")
			.groupBy("productCompanyPromotionId")
			.as("promotionUsedCount");

		// Left join the subquery.
		PromotionsQuery.leftJoin(promotionUsedCount, "productsCompaniesPromotionsProducts.productCompanyPromotionId", "promotionUsedCount.productCompanyPromotionId" )
			.select(knex.raw("coalesce(promotionUsedCount, 0) as promotionUsedCount"));

		// Execute the query.
		productsCompaniesPromotions = await PromotionsQuery;

		// Filter out any promotions that should not be applied.
		productsCompaniesPromotions = productsCompaniesPromotions.filter(( { maxQuantity, promotionUsedCount   } ) => promotionUsedCount < maxQuantity );

	} else {
		productsCompaniesPromotions = await PromotionsQuery;
	}

	// Set the weight on the order for lbs and kg for use below
	let weightLBS = 0;
	let weightKG = 0
	let weight = order.weight !== null ? order.weight : 0;
	if(parseInt(productTypeId) !== 4) {
		weightLBS = order.weightUnits === 'lbs' ? weight : Math.multiply(weight, 2.2);
		weightKG = order.weightUnits === 'kg' ? weight : Math.divide(weight, 2.2);
	}

	let promotionsUsageCount = {};

	// Check if there are any Cremation Products which have already been paid for by the pet owner
	const VetInvoicedForCremationProduct = await knex("ordersProducts").where({ invoiceVet: 1, orderId: order.orderId, statusIsCremation: 1 });
	const PetOwnerPaidForCremationProduct = await knex("ordersProducts").where({ orderId: order.orderId, paymentCompletedPetOwner: 1, statusIsCremation: 1 });
	// Check to see if there is an ordersProducts record for this order that is a deleted Cremation Product.
	//const DeletedCremationProduct = await knex("ordersProducts").where({ orderId: order.orderId, statusIsCremation: 1 }).whereNotNull('dateDeleted');

	// for each product, get the actual priceRetail based on discounts and weight based pricing
	return Products.map((product) => {
		// Tier based weight pricing, searching using the LBS and KG weight based on what the weightUnit in this table's record is
		let productPriceWeight = parseInt(productTypeId) !== 4 ? productsPricesWeights.find((weight) => ((weight.weightMin <= Math.floor(weightLBS) && weight.weightMax >= Math.floor(weightLBS) && weight.weightUnits === 'lbs') || (weight.weightMin <= Math.floor(weightKG) && weight.weightMax >= Math.floor(weightKG) && weight.weightUnits === 'kg')) && weight.productId === product.productId) : [];

		// Company override pricing per product
		let productCompanyPrice = productsCompaniesPrices.find((companyPrice) => product.productId === companyPrice.productId);

		// Company override tier based weight pricing, searching using the LBS and KG weight based on what the weightUnit in this table's record is
		let productCompanyPriceWeight = parseInt(productTypeId) !== 4 ? productsCompaniesPricesWeights.find((weight) => ((weight.weightMin <= Math.floor(weightLBS) && weight.weightMax >= Math.floor(weightLBS) && weight.weightUnits === 'lbs') || (weight.weightMin <= Math.floor(weightKG) && weight.weightMax >= Math.floor(weightKG) && weight.weightUnits === 'kg')) && weight.productId === product.productId) : [];

		// Do pricing calculations based on the results for this product
		let tempPricing = {};

		// Check all of these values to make sure nothing is null, otherwise set them to 0. All of these are options within a terinary, so we want them to otherwise be 0 for being used later in some Math. function
		let productPriceRetail = product.priceRetail !== null ? product.priceRetail : 0;
		let productPriceRetailPersonalization = product.priceRetailPersonalization !== null ? product.priceRetailPersonalization : 0;
		let productUnitWeightInvoiceCost = product.unitWeightInvoiceCost !== null ? product.unitWeightInvoiceCost : 0;
		let productUnitWeightPriceInterval = product.unitWeightPriceInterval !== null ? product.unitWeightPriceInterval : 0;
		let productUnitWeightPriceRetail = product.unitWeightPriceRetail !== null ? product.unitWeightPriceRetail : 0;
		let productUnitWeightPriceIntervalUnits = product.unitWeightPriceIntervalUnits !== null ? product.unitWeightPriceIntervalUnits : 0;
		let productUnitWeightPriceMax = product.unitWeightPriceMax !== null ? product.unitWeightPriceMax : 0;
		let productUnitWeightPriceMin = product.unitWeightPriceMin !== null ? product.unitWeightPriceMin : 0;

		// Set the invoice pricing, using the company's defaultDiscount to override the Account invoice pricing if the defaultDiscount exists. Override both of those if there is product specific pricing for the company.
		if(defaultDiscount > 0) {
			tempPricing.tempInvoiceCost = (productCompanyPrice && productCompanyPrice.invoiceCost !== null) ? productCompanyPrice.invoiceCost : Math.multiply(productPriceRetail, Math.subtract(1,defaultDiscount));
			tempPricing.tempInvoiceCostPersonalization = (productCompanyPrice && productCompanyPrice.invoiceCostPersonalization !== null) ? productCompanyPrice.invoiceCostPersonalization : product.invoiceCostPersonalization;
		} else {
			tempPricing.tempInvoiceCost = (productCompanyPrice && productCompanyPrice.invoiceCost !== null) ? productCompanyPrice.invoiceCost : product.invoiceCost;
			tempPricing.tempInvoiceCostPersonalization = (productCompanyPrice && productCompanyPrice.invoiceCostPersonalization !== null) ? productCompanyPrice.invoiceCostPersonalization : product.invoiceCostPersonalization;
		}

		// If there is a price override for this company for this product, use that as the base priceRetail, otherwise use the priceRetail from the productsAccounts table
		tempPricing.tempPriceRetail = (productCompanyPrice && productCompanyPrice.priceRetail !== null) ? productCompanyPrice.priceRetail : productPriceRetail;
		tempPricing.tempPriceRetailPersonalization = (productCompanyPrice && productCompanyPrice.priceRetailPersonalization !== null) ? productCompanyPrice.priceRetailPersonalization : productPriceRetailPersonalization;
		tempPricing.tempUnitWeightInvoiceCost = (productCompanyPrice && productCompanyPrice.unitWeightInvoiceCost !== null) ? productCompanyPrice.unitWeightInvoiceCost : productUnitWeightInvoiceCost;
		tempPricing.tempUnitWeightPriceRetail = (productCompanyPrice && productCompanyPrice.unitWeightPriceRetail !== null) ? productCompanyPrice.unitWeightPriceRetail : productUnitWeightPriceRetail;
		tempPricing.tempUnitWeightPriceInterval = (productCompanyPrice && productCompanyPrice.unitWeightPriceInterval !== null) ? productCompanyPrice.unitWeightPriceInterval : productUnitWeightPriceInterval;
		tempPricing.tempUnitWeightPriceIntervalUnits = (productCompanyPrice && productCompanyPrice.unitWeightPriceIntervalUnits !== null) ? productCompanyPrice.unitWeightPriceIntervalUnits : productUnitWeightPriceIntervalUnits;
		tempPricing.tempUnitWeightPriceMax = (productCompanyPrice && productCompanyPrice.unitWeightPriceMax !== null) ? productCompanyPrice.unitWeightPriceMax : productUnitWeightPriceMax;
		tempPricing.tempUnitWeightPriceMin = (productCompanyPrice && productCompanyPrice.unitWeightPriceMin !== null) ? productCompanyPrice.unitWeightPriceMin : productUnitWeightPriceMin;

		// If there is a tier based weight price override for this company for weight, use that as the base, otherwise use the tier pricing from the productsPricesWeights table
		let tempTierInvoice = productPriceWeight && productPriceWeight.invoiceCost !== null && productPriceWeight.invoiceCost !== undefined ? productPriceWeight.invoiceCost : 0; // default Tiers for the account invoice
		if(parseInt(productTypeId) !== 4) {
			tempTierInvoice = productCompanyPriceWeight && productCompanyPriceWeight.invoiceCost !== null ? productCompanyPriceWeight.invoiceCost : tempTierInvoice; // overrides for the company invoicing
		}

		let tempTierPrice = productPriceWeight && productPriceWeight.priceRetail !== null && productPriceWeight.priceRetail !== undefined ? productPriceWeight.priceRetail : 0; // default Tiers for the account pricing
		if(parseInt(productTypeId) !== 4) {
			tempTierPrice = productCompanyPriceWeight && productCompanyPriceWeight.priceRetail !== null ? productCompanyPriceWeight.priceRetail : tempTierPrice; // overrides for the company pricing
		}

		// Only need to apply weight based pricing logic if the weight of the pet is greater than the min price for the unitWeightPricing to be applied, and less than the max
		// Initially, determine is the pet weighs over the max weight, so we can just charge the max amount.
		let additionalInvoiceForWeight = 0;
		let additionalPriceForWeight = 0;
		// Check if there is any unit weight pricing for this product
		if(tempPricing.tempUnitWeightPriceRetail > 0) {
			let units = tempPricing.tempUnitWeightPriceIntervalUnits;
			if((units === 'lbs' && weightLBS > tempPricing.tempUnitWeightPriceMax) || (units === 'kg' && weightKG > tempPricing.tempUnitWeightPriceMax)) {
				// charge the max amount
				const weightOverMin = Math.subtract(tempPricing.tempUnitWeightPriceMax, tempPricing.tempUnitWeightPriceMin); // Determine how much the pet is over the
				const weightUnitIntervalsOver = Math.ceil(Math.divide(weightOverMin, tempPricing.tempUnitWeightPriceInterval)); // Determine how many unitIntervals the weight is over the min, rounded up
				additionalPriceForWeight = Math.multiply(weightUnitIntervalsOver, tempPricing.tempUnitWeightPriceRetail);
				additionalInvoiceForWeight = Math.multiply(weightUnitIntervalsOver, tempPricing.tempUnitWeightInvoiceCost);
			}
			else if((units === 'lbs' && weightLBS > tempPricing.tempUnitWeightPriceMin) || (units === 'kg' && weightKG > tempPricing.tempUnitWeightPriceMin)) {
				let convertedWeight = units === 'lbs' ? weightLBS : weightKG; // Set the weight in the correct units
				const weightOverMin = Math.subtract(convertedWeight, tempPricing.tempUnitWeightPriceMin); // Determine how much the pet is over the
				const weightUnitIntervalsOver = Math.ceil(Math.divide(weightOverMin, tempPricing.tempUnitWeightPriceInterval)); // Determine how many unitIntervals the weight is over the min, rounded up
				additionalPriceForWeight = Math.multiply(weightUnitIntervalsOver, tempPricing.tempUnitWeightPriceRetail);
				additionalInvoiceForWeight = Math.multiply(weightUnitIntervalsOver, tempPricing.tempUnitWeightInvoiceCost);
			}
		}

		let tempAdditionalInvoiceForWeight = additionalInvoiceForWeight === 0 || additionalInvoiceForWeight > 0 ? additionalInvoiceForWeight : 0;
		let tempAdditionalPriceForWeight = additionalPriceForWeight === 0 || additionalPriceForWeight > 0 ? additionalPriceForWeight : 0;

		// Add the Tier Based pricing to the additionalPriceForWeight calculated above;
		if(tempTierInvoice > 0) {
			tempAdditionalInvoiceForWeight = Math.add(tempAdditionalInvoiceForWeight, tempTierInvoice);
		}
		if(tempTierPrice > 0) {
			tempAdditionalPriceForWeight = Math.add(tempAdditionalPriceForWeight, tempTierPrice);
		}
		let finalInvoiceCost = tempAdditionalInvoiceForWeight;
		if(tempPricing.tempInvoiceCost > 0) {
			finalInvoiceCost = Math.add(tempPricing.tempInvoiceCost, tempAdditionalInvoiceForWeight);
		}
		let finalPriceRetail = tempAdditionalPriceForWeight;
		if(tempPricing.tempPriceRetail > 0) {
			finalPriceRetail = Math.add(tempPricing.tempPriceRetail, tempAdditionalPriceForWeight);
		}

		// Starting code for figuring out pricing if there are multiple products that have been paid for
		// if(VetInvoicedForCremationProduct.length > 0 && (product.productCategoryId === 7 || product.statusIsCremation === 1) && VetInvoicedForCremationProduct.findIndex((cremationProduct) => parseInt(cremationProduct.productId) === parseInt(product.productId)) > -1) {
		// 	let totalVetPriceCharged = 0
		// 	VetInvoicedForCremationProduct.forEach((vetPrice) => {
		// 		const vetPriceCharged = vetPrice.priceCharged !== null ? vetPrice.priceCharged : 0;
		// 		totalVetPriceCharged = Math.add(totalVetPriceCharged, vetPriceCharged);
		// 	})
		// 	//const oldVetCremationProductPriceCharged = VetInvoicedForCremationProduct[0].priceCharged !== null ? VetInvoicedForCremationProduct[0].priceCharged : 0;
		// 	finalPriceRetail = Math.subtract(finalPriceRetail, totalVetPriceCharged);
		// }

		// If there is already a Cremation Product on this order that has been paid for, we need to account for that in our caclculated price to display in the memorialization process
		if(VetInvoicedForCremationProduct.length > 0 && (product.productCategoryId === 7 || product.statusIsCremation === 1) && parseInt(VetInvoicedForCremationProduct[0].productId) !== parseInt(product.productId)) {
			const oldVetCremationProductPriceCharged = VetInvoicedForCremationProduct[0].priceCharged !== null ? VetInvoicedForCremationProduct[0].priceCharged : 0;
			finalPriceRetail = Math.subtract(finalPriceRetail, oldVetCremationProductPriceCharged);
		}
		if(PetOwnerPaidForCremationProduct.length > 0 && (product.productCategoryId === 7 || product.statusIsCremation === 1) && parseInt(PetOwnerPaidForCremationProduct[0].productId) !== parseInt(product.productId)) {
			const oldPetOwnerCremationProductPriceCharged = PetOwnerPaidForCremationProduct[0].priceCharged !== null ? PetOwnerPaidForCremationProduct[0].priceCharged : 0;
			finalPriceRetail = Math.subtract(finalPriceRetail, oldPetOwnerCremationProductPriceCharged);
		}
		// if(DeletedCremationProduct.length > 0 && (product.productCategoryId === 7 || product.statusIsCremation === 1) && parseInt(DeletedCremationProduct[0].productId) !== parseInt(product.productId)) {
		// 	const oldCremationProductPriceCharged = DeletedCremationProduct[0].priceCharged !== null ? DeletedCremationProduct[0].priceCharged : 0;
		// 	finalPriceRetail = Math.subtract(finalPriceRetail, oldCremationProductPriceCharged);
		// }

		product.calculatedInvoiceCost = finalInvoiceCost.toFixed(2);
		product.calculatedInvoiceCostPersonalization = tempPricing.tempInvoiceCostPersonalization;

		product.calculatedPriceRetail = finalPriceRetail.toFixed(2);
		product.calculatedPriceRetailPersonalization = tempPricing.tempPriceRetailPersonalization;

		/*
			If the product has a promotion applied to it already, we will look it up in the list of possible promotions and use it if it's found.
			its possible that the triggering product has been removed so the promotion may not be found.
		*/
		let promotion;
		if( product.productCompanyPromotionId !== null ) {
			promotion = productsCompaniesPromotions.find(({ productCompanyPromotionId }) => parseInt(product.productCompanyPromotionId) === parseInt(productCompanyPromotionId) );
		}

		// If we do not yet have an applicable promotion, look it up based on the product Id.
		if( promotion === undefined ) {
			promotion = productsCompaniesPromotions.find(({ promotionProductId }) => parseInt(product.productId) === parseInt(promotionProductId) );
		}
		/*
			If we have found a promotion and we are not in order calculation mode then we should apply the promotion. If
			we have a promotion and are in order calculation module, we need to make sure we have not applied the promotion
			the maximum number of times before applying it.
		*/

		if ( promotion !== undefined &&  ( orderCalculationMode === false  || (promotionsUsageCount[promotion.productCompanyPromotionId] || 0) < promotion.maxQuantity )) {
			const {
				calculatedPriceRetail,
				calculatedPriceRetailPersonalization,
				calculatedInvoiceCost,
				calculatedInvoiceCostPersonalization
			} = product;

			const {
				units,
				amountDiscount
			} = promotion;
			// If the promotion applies to the retail price, calculate it.
			let promotionalPriceRetail = parseFloat(calculatedPriceRetail);
			let promotionalInvoiceCost = parseFloat(calculatedInvoiceCost);

			if(promotion.retail === 1) {
				promotionalPriceRetail = units === 1 ? calculatedPriceRetail * (100 - amountDiscount) / 100 : calculatedPriceRetail - amountDiscount;
				promotionalInvoiceCost = units === 1 ? calculatedInvoiceCost * (100 - amountDiscount) / 100 : calculatedInvoiceCost - amountDiscount;
			}

			// If the promotion applies to the personalization price, calculate it.
			let promotionalPriceRetailPersonalization = parseFloat(calculatedPriceRetailPersonalization);
			let promotionalInvoiceCostPersonalization = parseFloat(calculatedInvoiceCostPersonalization);
			if( promotion.personalization === 1 ) {
				promotionalPriceRetailPersonalization = units === 1 ? calculatedPriceRetailPersonalization * (100 - amountDiscount) / 100 : calculatedPriceRetailPersonalization - amountDiscount;
				promotionalInvoiceCostPersonalization = units === 1 ? calculatedInvoiceCostPersonalization * (100 - amountDiscount) / 100 : calculatedInvoiceCostPersonalization - amountDiscount;
			}

			// Set the promotional prices.
			product.promotionalPriceRetail = promotionalPriceRetail.toFixed(2);
			product.promotionalPriceRetailPersonalization =	promotionalPriceRetailPersonalization.toFixed(2);
			product.promotionalInvoiceCost = promotionalInvoiceCost.toFixed(2);
			product.promotionalInvoiceCostPersonalization =	promotionalInvoiceCostPersonalization.toFixed(2);
			product.productCompanyPromotionId = promotion.productCompanyPromotionId;

			// Add one to the promotion used count to make sure not to apply to promotion too many times.
			promotionsUsageCount[promotion.productCompanyPromotionId] = (promotionsUsageCount[promotion.productCompanyPromotionId] || 0) + 1;
		} else {
			// There is no promotion currently, null out the prices.
			product.promotionalPriceRetail = null;
			product.promotionalPersonalizationRetailPrice = null;
			product.promotionalInvoiceCost = null;
			product.promotionalInvoiceCostPersonalization = null;
			product.productCompanyPromotionId = null;
		}
		return product;
	});
}

// QUERIES
const OrderProductRootResolvers = {
	async DeletedCremationProduct(root, {orderId}, context) {
		const [OrderProduct] = await context.knex('ordersProducts').where({orderId, statusIsCremation: 1}).whereNotNull('dateDeleted');
		return OrderProduct;
	},

	async OrderProduct(root, {orderProductId}, context) {
		// Here we only want to get the order values - we will get all of the products on the order using the subresolver above.
		const OrderProduct = await context.knex('ordersProducts')
			.select('companies.companyName', 'productsAccounts.*', 'orders.petFirstName', 'orders.petReferenceNumber', 'orders.ownerLastName', 'ordersProducts.*')
			.join('orders', 'orders.orderId', 'ordersProducts.orderId')
			.join('companies', 'companies.companyId', 'orders.companyId')
			.join('productsAccounts', 'productsAccounts.productId', 'ordersProducts.productId')
			.where('ordersProducts.orderProductId', orderProductId)
			.andWhere('productsAccounts.accountId', context.Account.accountId);

		return OrderProduct;
	},

	// Get a distinct list of the orderProductIds for this order that have personalization.
	async OrderProductsPersonalization(root, {orderId=0, orderIds=''}, context) {
		const OrderProductsPersonalization = await context.knex('orderProductProductOptions')
			.distinct('ordersProducts.orderProductId', 'ordersProducts.orderId')
			.select()
			.join('ordersProducts', 'ordersProducts.orderProductId', 'orderProductProductOptions.orderProductId')
			.whereNull('ordersProducts.dateDeleted')
			.whereNull('ordersProducts.dateRefunded')
			.whereIn('ordersProducts.orderId', function() {
				if(orderIds !== '') {
					this.select('orderId')
						.from('orders')
						.whereIn('orderId', orderIds.split(","))
				} else {
					this.select('orderId')
						.from('orders')
						.where('orderId', orderId)
				}
			})

		return OrderProductsPersonalization;
	},

	// This gets the orderProducts to be printed out on the stickers. Called from order details, this is to generate all the product stickers at once.
	async OrderProductsPrintables(root, {orderId=0, orderIds=''}, context) {
		// Here we only want to get the order values - we will get all of the products on the order using the subresolver above.
		const OrderProducts = await context.knex('ordersProducts')
			.select('companies.companyName', 'orders.orderId', 'orders.ownerLastName', 'orders.petFirstName', 'orders.petReferenceNumber', 'ordersProducts.orderProductId', 'products.*', 'productsAccounts.*', 'productCategories.*', 'pc.productCategory as parentCategory')
			.join('products', 'products.productId', 'ordersProducts.productId')
			.join('productsAccounts', 'productsAccounts.productId', 'ordersProducts.productId')
			.join('orders', 'orders.orderId', 'ordersProducts.orderId')
			.join('companies', 'companies.companyId', 'orders.companyId')
			.join('productCategories', 'productCategories.productCategoryId', 'products.productCategoryId')
			.leftJoin('productCategories as pc', 'pc.productCategoryId', 'productCategories.parentCategoryId')
			.whereNull('ordersProducts.dateDeleted')
			.whereNull('ordersProducts.dateRefunded')
			.whereIn('ordersProducts.orderId', function() {
				if(orderIds !== '') {
					this.select('orderId')
						.from('orders')
						.whereIn('orderId', orderIds.split(","))
				} else {
					this.select('orderId')
						.from('orders')
						.where('orderId', orderId)
				}
			})
			.andWhere('productsAccounts.accountId', context.Account.accountId)
			.andWhere('products.productTypeId', 3)
			.andWhereNot('productCategories.productCategory', 'Delivery');

		return OrderProducts;
	},
	async OrderProducts(root, {petReferenceNumber}, context) {
		// Here we only want to get the order values - we will get all of the products on the order using the subresolver above.
		const [Order] = await context.knex('orders').where({petReferenceNumber});
		return Order;
	}
}

// MUTATIONS
const OrderProductMutations = {
	// input is a OrderProduct object with the data to insert or update
	async orderProductSave(root, { input }, context) {
		const knex = context.knex;

		const {
			invoiceCostCharged=null,
			invoiceCostChargedPersonalization=null,
			orderId,
			orderProductId,
			parentCategory=null,
			priceCharged=null,
			priceChargedPersonalization=null,
			pricingAlreadyCalculated=false,
			productCategory=null,
			personalizeProduct,
			productName,
			returnProductOptions=false,
			taxCharged=null,
			taxRate=null,
			walkInItem=false
		} = input;

		// Need to be able to update this if it is a Walk In Item.
		let productId = input.productId;

		// If the product being saved is a Walk In Item (Crematory user/admin creating a line item for a Walk In Order via the Order Details page), then grab the productId of the 'Walk In Item' product and update it.
		if(walkInItem === true) {
			const [walkInItemProductId] = await knex('products')
				.select('productId')
				.where('productName', 'Walk In Item');
			productId = walkInItemProductId.productId;
		}

		if(orderProductId > 0) {
			// Get the current order details before saving so we can do a compare to the input values to see what needs to be logged
			const OrderProduct = await knex('ordersProducts')
				.where({ orderProductId }).first();

			await knex('ordersProducts')
				.where({ orderProductId })
				.update(_.omit(input,["orderProductId","returnProductOptions"]))

			// LOG ORDER ACTIVITY - START
			// Loop through each column of the orders table and compare it to the input values, if they are different, push the column to an array which we will then loop through and log the differences
			let columnsChanged = [];
			const timestamp = knex.fn.now();
			for(var key in OrderProduct) {
				// Verify that the input has the key so that we do not log anything that is not going to be updated
				if(OrderProduct[key] != input[key] && input.hasOwnProperty(key)) {
					let tempActivity = `${_.startCase(key)} changed from '${OrderProduct[key]}' to '${input[key]}'`;
					let tempActivityType = context.Session.LoggedIn === false ? `${_.startCase(key)} changed by pet owner` : `${key} changed by user`;

					let loggedInUserId = context.Session.LoggedIn === false ? null : context.Session.User.userId;

					// set showVet = 0 (false) for crematory staff only fields
					let showVet = 1;
					let hideFieldFromVet = ["statusCompletedAndPackaged", "statusConfirmed", "statusFurClippingCompleted", "statusOrdered", "statusPawPrintCompleted", "statusPawPrintTaken", "statusRemainsFilled", "statusRequiresPawPrint"];
					if( hideFieldFromVet.find(( dbField => dbField === key )) !== undefined) {
						showVet = 0;
						let columnName = _.startCase(key);
						columnName = columnName.substring(7);
						// ${(input[key] === 0 && ' (Undone)') || ''}
						tempActivity = input[key] === 1 ? `${OrderProduct.productName} updated to '${columnName}'` : `Undo (${OrderProduct.productName} updated to '${columnName}')`;
						tempActivityType = 'Asset status updated by user';
					}

					// Completed and Packaged has a one off status different than the other status 'assets'
					if(key === 'statusCompletedAndPackaged') {
						tempActivity = input[key] === 1 ? `${OrderProduct.productName} updated to 'Completed & Packaged'` : `Undo (${OrderProduct.productName} updated to 'Completed & Packaged')`;
						tempActivityType = 'Packaging updated by user';
					}

					const userInitials = context.Session.LoggedIn === false ? null : `${context.Session.User.firstName.substring(0,1)}${context.Session.User.lastName.substring(0,1)}`;

					columnsChanged.push({accountId: context.Account.accountId, activity: tempActivity, activityType: tempActivityType, dateCreated: timestamp, dbField: key, dbTable: 'ordersProducts', loggedInUserId: loggedInUserId, orderId: OrderProduct.orderId, showVet: showVet, userInitials: userInitials, valueNew: input[key], valueOld: OrderProduct[key]});
				}
			}

			// If there are any columns that are changed, then log the change
			if(columnsChanged.length > 0) {
				await knex('logOrderActivities').insert(columnsChanged);
			}
			// LOG ORDER ACTIVITY - END

			if(returnProductOptions === true) { // If this is called from Memorialization's Basket - Adding Engraving to a Product, then return that Product's newly saved (in a different call) options
				const OrderProductProductOptions = await knex('orderProductProductOptions').where({ orderProductId });
				return Response(true,"Item Successfully Updated", {OrderProduct: input, OrderProductProductOptions: OrderProductProductOptions});
			} else {
				return Response(true,"Item Successfully Updated", {OrderProduct: input});
			}
		} else {
			let invoiceVet = 0; // this handles the case of someone not being logged in, memorialization from home
			// Determine if the company adding this Order is a Vet - if so, then the Crematory will need to invoice the Vet for the services/products, so on the ordersProducts record, set flag 'invoiceVet' = 1
			if(context.Session.LoggedIn === true) {
				const [company] = await knex('companies')
					.join('companyTypes', 'companyTypes.companyTypeId', 'companies.companyTypeId')
					.where('companyId', context.Session.User.companyId);

				invoiceVet = company.companyType === 'Vet' ? 1 : 0;
			}

			// Check the productCategory and parentCategory to see which flags we need to add to this orderProduct for use in the Orders Queues
			const [Product] = await knex('products')
				.select('products.remainsFilledIndicator', 'productCategories.productCategory', 'productCategories2.productCategory as parentCategory')
				.join('productCategories', 'productCategories.productCategoryId', 'products.productCategoryId')
				.leftJoin('productCategories as productCategories2', 'productCategories2.productCategoryId', 'productCategories.parentCategoryId')
				.where('products.productId', productId);

			const tempParentCategory = parentCategory === null ? Product.parentCategory : parentCategory;
			const tempProductCategory = productCategory === null ? Product.productCategory : productCategory;

			// Set status defaults in ordersProducts
			let tempStatusCompletedAndPackaged = 1;
			let tempStatusConfirmedIndicator = 0;
			let tempStatusIsBurial = (tempParentCategory === 'Burials' || tempProductCategory === 'Burials') ? 1 : 0;
			let tempStatusIsCremation = (tempParentCategory === 'Cremations' || tempProductCategory === 'Cremations') ? 1 : 0;
			let tempStatusIsDelivery = (tempParentCategory === 'Delivery' || tempProductCategory === 'Delivery') ? 1 : 0;
			let tempStatusIsFurClipping = 0;
			let tempStatusIsPawPrint = 0;
			let tempStatusIsVisitation = 0;
			let tempStatusOrderedIndicator = 0;
			let tempStatusRemainsFilledIndicator = 0;
			let tempStatusRequiresPawPrint = 0;

			// Set statuses based on the product ordered
			if(tempParentCategory === 'Paw Prints' || tempProductCategory === 'Paw Prints') {
				if(productName === 'Fur Clipping' || Product.isFurClipping === 1) {
					tempStatusCompletedAndPackaged = 0;
					tempStatusIsFurClipping = 1;
				} else if(productName === 'Paw Print Stand' || Product.requiresPawPrint === 1) {
					tempStatusCompletedAndPackaged = 0;
					tempStatusRequiresPawPrint = 1;
				} else {
					tempStatusCompletedAndPackaged = 0;
					tempStatusIsPawPrint = 1;
				}
			}
			else if(productName === 'Visitation & Viewing') {
				tempStatusCompletedAndPackaged = 0;
				tempStatusConfirmedIndicator = 1;
				tempStatusIsVisitation = 1;
			}
			else if(Product.remainsFilledIndicator === 1) {
				// indicates that this is a product that can have ashed inside

				// Check to see if there are any Cremation Services on this Order, which indicates that there will be ashes which need to go into an Urn.
				const CremationProduct = await knex('ordersProducts')
					.join('products', 'products.productId', 'ordersProducts.productId')
					.join('productCategories', 'productCategories.productCategoryId', 'products.productCategoryId')
					.leftJoin('productCategories as productCategories2', 'productCategories2.productCategoryId', 'productCategories.parentCategoryId')
					.where('ordersProducts.orderId', orderId )
					.andWhere(function() {
						this.where('productCategories.productCategory', 'Cremations')
							.orWhere('productCategories2.productCategory', 'Cremations')
					})

				tempStatusCompletedAndPackaged = 0;
				tempStatusConfirmedIndicator = 1;
				// Only flag this if there is a cremation service - meaning that there will be ashes produced to put into the product (keepsake or jewelry). For Vet Orders (non-cremation), they just want the product
				tempStatusRemainsFilledIndicator = CremationProduct.length > 0 ? 1 : 0;
			}
			else if(tempParentCategory === 'Veterinary Supplies' || tempProductCategory === 'Veterinary Supplies') {
				tempStatusCompletedAndPackaged = 0;
				tempStatusConfirmedIndicator = 1;
			}
			else if(tempParentCategory === 'Keepsakes' || tempProductCategory === 'Keepsakes' || tempParentCategory === 'Jewelry' || tempProductCategory === 'Jewelry' || tempParentCategory === 'Urns' || tempProductCategory === 'Urns') {
				// For these products we are "confirming" that we have them in stock, or that we have ordered them. This was the original functionality built, and it has been added to as follows:
				// In addition to statusConfirmedIndicator=1, making statusConfirmed needing to be marked 1, we will add another statusOrdered flag, which will always be defaulted to 0, and when needed, it can be marked to 1.
				// This statusOrdered will be used to indicate that the product has been order from TB, and help within the Ordering Products workflow, as well as the Memorialization fulfillment area for clarity
				tempStatusCompletedAndPackaged = 0;
				tempStatusConfirmedIndicator = 1;
			}
			// Handle the statusOrderedIndicator functionality - need to check if this product has any in stock, and that is a tangible product that would need to be ordered
			if(tempStatusConfirmedIndicator === 1 && tempStatusIsVisitation === 0) {
				const [ProductAccount] = await knex('productsAccounts').select('stockAvailable').where('productId', productId).andWhere('accountId', context.Account.accountId);
				if(parseInt(ProductAccount.stockAvailable) === 0) tempStatusOrderedIndicator = 1;
			}

			const [newOrderProductId] = await knex('ordersProducts').insert({
				dateCreated: knex.fn.now(),
				invoiceVet,
				orderId,
				priceCharged,
				productId,
				productName,
				personalizeProduct,
				statusCompletedAndPackaged: tempStatusCompletedAndPackaged,
				statusConfirmedIndicator: tempStatusConfirmedIndicator,
				statusIsBurial: tempStatusIsBurial,
				statusIsCremation: tempStatusIsCremation,
				statusIsDelivery: tempStatusIsDelivery,
				statusIsFurClipping: tempStatusIsFurClipping,
				statusIsPawPrint: tempStatusIsPawPrint,
				statusIsVisitation: tempStatusIsVisitation,
				statusOrderedIndicator: tempStatusOrderedIndicator,
				statusRemainsFilledIndicator: tempStatusRemainsFilledIndicator,
				statusRequiresPawPrint: tempStatusRequiresPawPrint,
				taxCharged
			});

			// Do not update the Order's pricing if the product just added was a Walk In Item
			// if(walkInItem === false && pricingAlreadyCalculated === false) {
			if(walkInItem === false) {
				await updateOrdersProductsPricesCharged(orderId, context);
			} 

			// Commented out 1-5-21 Barrett - this was causing the promotions to not update correctly if the product being added would have an effect on promotions. The above "updateOrdersProductsPricesCharged" accounts for promotions
			// else if(pricingAlreadyCalculated === true) {
			// 	// This is passed in from the Products Memorialization process on the Product Details save function. Since we are already doing full calculation within the Products listings in the Memorialization process,
			// 			// ... this is quite overkill, so just update the costs that are already passed in
			// 	// const taxChargedInvoice = Math.multiply(input.invoiceCostCharged, taxRate).toFixed(2);
			// 	// const taxCharged = Math.multiply(input.priceCharged, taxRate).toFixed(2);

			// 	// These are used if we want to charge tax for personalization - just replace them in the save function below
			// 		// taxCharged: personalizeProduct === true ? Math.multiply(Math.add(priceCharged, priceChargedPersonalization), taxRate).toFixed(2) : Math.multiply(priceCharged, taxRate).toFixed(2),
			// 		// taxChargedInvoice: personalizeProduct === true ? Math.multiply(Math.add(invoiceCostCharged, invoiceCostChargedPersonalization), taxRate).toFixed(2) : Math.multiply(invoiceCostCharged, taxRate).toFixed(2),
			// 	await knex('ordersProducts').update({
			// 		priceChargedPersonalization: personalizeProduct === true ? priceChargedPersonalization : null,
			// 		taxCharged: Math.multiply(priceCharged, taxRate).toFixed(2),
			// 		taxChargedInvoice: Math.multiply(invoiceCostCharged, taxRate).toFixed(2),
			// 		invoiceCostCharged,
			// 		invoiceCostChargedPersonalization: personalizeProduct === true ? invoiceCostChargedPersonalization : null
			// 	})
			// 	.where({orderProductId: newOrderProductId})
			// }

			// Get the base promotions query and join the linked products then execute.
			return Response(true,"Item Successfully Added to Basket", {OrderProduct: { ...input, orderProductId: newOrderProductId }});
		}
	},

	async orderProductDelete(root, { input }, context) {
		const knex = context.knex;
		const { deletedReason, orderProductId } = input;

		const { orderId } = await knex("ordersProducts")
			.select("orderId")
			.first()
			.where({ orderProductId });

		// If user is not logged in, then it is the pet owner doing memorialization.
		const deletedByUserId = context.Session.LoggedIn === true ? context.Session.User.userId : 0;

		await knex('ordersProducts')
			.where({ orderProductId })
			.update({
				dateDeleted: knex.fn.now(),
				deleted: 1,
				deletedByUserId: deletedByUserId,
				deletedReason: deletedReason
			});

		await updateOrdersProductsPricesCharged(orderId, context);

		return Response(true,"Product successfully deleted from order");
	},

	async orderProductConfirmEngraving(root, { input }, context) {
		const knex = context.knex;
		const { orderProductId, personalizationConfirmed } = input;

		await knex('ordersProducts')
			.where({ orderProductId })
			.update({ personalizationConfirmed });

		return Response(true,"Product engraving confirmed");
	},

	async orderProductUndelete(root, { input }, context) {
		const knex = context.knex;
		const { orderProductId } = input;

		const { orderId } = await knex("ordersProducts")
			.select("orderId")
			.first()
			.where({ orderProductId });

		await knex('ordersProducts')
			.where({ orderProductId })
			.update({
				dateDeleted: null,
				deleted: 0,
				deletedByUserId: null,
				deletedReason: null
			});

		await updateOrdersProductsPricesCharged(orderId, context);

		return Response(true,"Product successfully undeleted from order");
	},

	async orderProductRefund(root, { input }, context) {
		const { amount, creditCardChargeId, markOrderDeleted=false, orderId, orderProductId, paymentCompletedAlternative=0, refundingReasonOrderProduct } = input;

		// If this product was paid for without a Credit Card:
		if(paymentCompletedAlternative === 1) {
			// If markOrderDeleted is true, it means that this function was called as a 'delete' the orderProduct, and because it had already been paid for by the pet owner, then we need to refund it. Here we can also mark it as deleted
			if(markOrderDeleted === true) {
				await context.knex('ordersProducts')
					.where({orderProductId})
					.update({
						dateDeleted: context.knex.fn.now(),
						dateRefunded: context.knex.fn.now(),
						deleted: 1,
						deletedByUserId: context.Session.User.userId,
						deletedReason: refundingReasonOrderProduct,
						refundedByUserId: context.Session.User.userId,
						refundedReason: refundingReasonOrderProduct
					});
			} else {
				await context.knex('ordersProducts')
					.where({orderProductId})
					.update({dateRefunded: context.knex.fn.now(), refundedByUserId: context.Session.User.userId, refundedReason: refundingReasonOrderProduct});
			}

			return Response(true,"Refund Successful");
		} else {
			// Invoke the payment processing function for refunds
			const PaymentResult = await PaymentMutations.refundPayment(null, { input: {amount, creditCardChargeId, orderId, orderProductId}}, context);

			// If the refund was successful, update the orderProduct record.
			if(PaymentResult.Response.success === true) {
				// If markOrderDeleted is true, it means that this function was called as a 'delete' the orderProduct, and because it had already been paid for by the pet owner, then we need to refund it. Here we can also mark it as deleted
				if(markOrderDeleted === true) {
					await context.knex('ordersProducts')
						.where({orderProductId})
						.update({
							dateDeleted: context.knex.fn.now(),
							dateRefunded: context.knex.fn.now(),
							deleted: 1,
							deletedByUserId: context.Session.User.userId,
							deletedReason: refundingReasonOrderProduct,
							refundedByUserId: context.Session.User.userId,
							refundedReason: refundingReasonOrderProduct,
							refundId: PaymentResult.Payment.refundId
						});
				} else {
					await context.knex('ordersProducts')
						.where({orderProductId})
						.update({dateRefunded: context.knex.fn.now(), refundedByUserId: context.Session.User.userId, refundedReason: refundingReasonOrderProduct, refundId: PaymentResult.Payment.refundId});
				}

				return Response(true,"Refund Successful");
			} else {
				const responseMessage = PaymentResult.Response.message ? PaymentResult.Response.message : 'Failed';
				return Response(false,responseMessage);
			}
		}
	},

	async orderProductRemove(root, { input }, context) {
		const { orderId, orderProductId, productCategory } = input;

		// See if the product being removed is a 'Delivery' product. If it is, we need to reset the deliveryAddressId = 0, deliveryMethodName = null, deliveryMethodProductId = null on the Order record.
		if(productCategory === 'Delivery') {
			await context.knex('orders')
				.where({ orderId })
				.update({ deliveryAddressId: 0, deliveryMethodName: null, deliveryMethodProductId: null });
		}

		await context.knex('ordersProducts')
			.where({ orderProductId })
			.del();

		await updateOrdersProductsPricesCharged(orderId, context);

		return Response(true,"Item Successfully Removed From Basket", { OrderProduct: input });
	},

	// Update the products on an order which are to be paid by the pet owner - mark "paymentCompletedPetOwner" as 1
	async orderProductsPaid(root, {input}, context) {
		const { alternativePaymentMade=false, creditCardChargeId=0, orderId, paymentCompletedAlternativeMethod='', vetOrderPaid=false } = input;

		// Vet's (if their clinic is allowed - flagged payVetOrderByCreditCardOffered) can pay through Vet Charges section of Order Details.
		if(vetOrderPaid === true) {
			// Update the products to not be invoiceVet=1, so they can be paid in the next conditional if.
			// Marker the orderProduct with paymentCompletedVetOrder here, and paymentCompletedPetOwner below also for added ability to differentiate how it was paid.
			await context.knex('ordersProducts')
				.where({ orderId: orderId, invoiceVet: 1 })
				.update({ invoiceVet: 0, paymentCompletedVetOrder: 1 })

			// Change the product cost values for the Cremation product since it will not be getting invoiced directly to the Vet. "Credits" on invoices are based on these values below.
			const OrderProductCremation = await context.knex('ordersProducts')
				.where({ orderId: orderId, statusIsCremation: 1 });

			if(OrderProductCremation.length > 0) {
				await context.knex('ordersProducts')
					.where({ orderProductId: parseInt(OrderProductCremation[0].orderProductId) })
					.update({ priceCharged: OrderProductCremation[0].invoiceCostCharged })				
			}
		}

		if(alternativePaymentMade === true) {
			// Indicates that the pet owner paid at pick up from the Crematory by e-transfer, cash, or check
			await context.knex('ordersProducts')
				.where({ orderId: orderId, invoiceVet: 0 })
				.update({ paymentCompletedAlternative: 1, paymentCompletedAlternativeMethod, paymentCompletedPetOwner: 1 })

		} else {
			await context.knex('ordersProducts')
				.where({ orderId: orderId, invoiceVet: 0 })
				.update({ creditCardChargeId, paymentCompletedPetOwner: 1 })
		}

		return Response(true,"Success");
	}

}

// EXPORT
export { OrderProductMutations as Mutations, OrderProductRootResolvers }
