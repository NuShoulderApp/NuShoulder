import _ from "lodash";
import mathjs from 'mathjs';
import { Response } from "../../utilities/helpers";
import { defaultImage, images } from './Image';
import { orderProductsPriceCalculations } from "./OrderProduct"
import { getProductAttributes } from "./ProductAttribute";

// NOTE: use camelCase for fields and PascalCase for types and objects

export async function getProductById(productId, context) {
	return await context.knex('products')
		.select('products.*', 'productsAccounts.*', 'productSpecies.speciesId', 'productsAccounts.active AS productAccountActive')
		.join('productsAccounts', 'productsAccounts.productId', 'products.productId')
		.leftJoin('productSpecies', 'productSpecies.productId', 'products.productId')
		.where('products.productId', productId )
		.andWhere('productsAccounts.accountId', context.Account.accountId)
		.first();
}

export async function getProductsByAccountId(accountId, context) {
	return await context.knex('products')
		.select('products.*', 'productsAccounts.*', 'productSpecies.speciesId', 'productsAccounts.active AS productAccountActive' )
		.join('productsAccounts', 'productsAccounts.productId', 'products.productId')
		.leftJoin('productSpecies', 'productSpecies.productId', 'products.productId')
		.where('productsAccounts.accountId', accountId)
		.orderBy('productsAccounts.sortOrder', 'ASC')
		.orderBy("products.productName", "ASC");
}

// SUB RESOLVERS
export const SubResolvers = {
	// resolve a productImage object based on provided root.defaultImage
	defaultImage,
	images,
	async ProductAccountWeightTierPrice({ productId, accountId }, args, context){
		return await context.knex("productsPricesWeights").where({ productId, accountId });
	},
	async ProductCompanyWeightTierPrice({ productId, accountId }, { companyId }, context){
		console.log(`Prod: ${productId} | Acc: ${accountId} | Com: ${companyId}`)
		return await context.knex("productsCompaniesPricesWeights").where({ productId, accountId, companyId });
	},
	height({ heightEnglish, heightMetric }, args, context) {
		return context.Account.getSettingValue("measurementSystem") === "English" ?  heightEnglish : heightMetric;
	},
	length({ lengthEnglish, lengthMetric }, args, context) {
		return context.Account.getSettingValue("measurementSystem") === "English" ?  lengthEnglish : lengthMetric;
	},
	width({ widthEnglish, widthMetric }, args, context) {
		return context.Account.getSettingValue("measurementSystem") === "English" ?  widthEnglish : widthMetric;
	},
	async ProductCompanyPrice({ productId }, args, context) {
		return await context.knex("productsCompaniesPrices").where({ companyId: args.companyId, productId }).first();
	},
	async ProductCompanyPromotions({ productId }, { companyId }, context) {
		return await context.knex("productsCompaniesPromotions").where({ productId, companyId });
	},
	async ProductAttributes({ productId }, args, context) {
		return await getProductAttributes(productId, context);
	},
	async ProductVariations({ productId }, args, context) {
		return await context.knex("productsVariations").where({ productId });
	},
	async Species({ productId }, args, context) {
		return await context.knex("productSpecies")
			.join("species","productSpecies.speciesId", "species.speciesId")
			.where({ productId });
	}
};

// QUERIES
export const RootResolvers = {
	// Get the Cremation Products for use in the New Order Cremation section.
	async CremationProducts(root, input, context) {
		const knex = context.knex;
		const { productTypeId = 2 } = input;
		console.log({input})
		// If called from order_cremation_component.js, expect arguments ( active, productCategoryId, productTypeId ).
		// Also used from the Cremation Services section/tab of the Memorialization process.
		const [cremationsCategory] = await knex('productCategories').where({ productCategory: 'Cremations'});
		const [optionalServicesCategory] = await knex('productCategories').where({ productCategory: 'Optional Services'});

		let Products = await knex('products')
			.select('products.*', 'productsAccounts.*', 'productCategories.productCategory', 'productsAccounts.active AS productAccountActive')
			.join('productsAccounts', 'productsAccounts.productId', 'products.productId')
			.join('productCategories', 'productCategories.productCategoryId', 'products.productCategoryId')
			.whereIn('productCategories.productCategoryId', [cremationsCategory.productCategoryId, optionalServicesCategory.productCategoryId])
			.andWhere('productsAccounts.active', 1)
			.andWhere('productsAccounts.accountId', context.Account.accountId)
			.andWhere('products.active', 1)
			.andWhere('products.productTypeId', 2)
			.orderBy('productsAccounts.sortOrder', 'ASC')
			.orderBy("products.productName", "ASC");

		if(input.petReferenceNumber !== '' && input.petReferenceNumber !== undefined) {
			Products = await orderProductsPriceCalculations({ calledFrom: 'Product.js, 88', petReferenceNumber: input.petReferenceNumber, Products, productTypeId}, context);
		}

		return Products;
	},

	// Get the Delivery Products for use in the New Order Cremation section.
	async DeliveryProducts(root, input, context) {
		const knex = context.knex;

		const [deliveryCategory] = await knex('productCategories').where({ productCategory: 'Delivery'});

		const Products = await knex('products')
			.select('products.*', 'productsAccounts.*', 'productCategories.productCategory', 'productsAccounts.active AS productAccountActive')
			.join('productsAccounts', 'productsAccounts.productId', 'products.productId')
			.join('productCategories', 'productCategories.productCategoryId', 'products.productCategoryId')
			.where('productCategories.productCategoryId', deliveryCategory.productCategoryId)
			.andWhere('productsAccounts.active', 1)
			.andWhere('productsAccounts.accountId', context.Account.accountId)
			.andWhere('products.active', 1)
			.orderBy('productsAccounts.sortOrder', 'ASC')
			.orderBy("products.productName", "ASC");
		return Products;
	},

	// Set this function as async so we can wait on the knex calls.
	async Product(root, {productId}, context) {
		// We add await here so that the system will wait until the promise resolves before proceeding to the next line assign the result to a single var for use below.
		const Product = await getProductById(productId, context);
		return Product;
	},

	// Get Products - this is used for the CC and Crematory Admins to be able to see their products, not used for showing pet owners or vets which products can be purchased
	// Set this function as async so we can wait on the knex calls.
	async Products(root, input, context) {
		const knex = context.knex;

		const Products = await knex('products')
			.select('products.*', 'productsAccounts.*', 'productTypes.*', 'productCategories.*', 'productGroups.*', 'productsAccounts.active AS productAccountActive')
			.join('productsAccounts', 'productsAccounts.productId', 'products.productId')
			.leftOuterJoin('productTypes', 'productTypes.productTypeId', 'products.productTypeId')
			.leftOuterJoin('productCategories', 'productCategories.productCategoryId', 'products.productCategoryId')
			.leftOuterJoin('productGroups', 'productGroups.productGroupId', 'products.productGroupId')
			.where('productsAccounts.accountId', context.Account.accountId)
			.orderBy("productTypes.productType", "ASC")
			.orderBy("productCategories.productCategory", "ASC")
			.orderBy('productsAccounts.sortOrder', 'ASC')
			.orderBy('productGroups.productGroup', 'ASC')
			.orderBy("products.productName", "ASC");
		return Products;
	},

	// Get Products Pairings - table of child and parent productIds with child=accessory product, parent=product that uses child
	async ProductPairings(root, { productId=0 }, context) {
		const knex = context.knex;

		if(productId > 0) {
			const ProductPairings = await knex('productsPairings')
				.select('products.productName AS parentProduct', 'products2.productName AS childProduct', 'products.productId AS parentProductId', 'products2.productId AS childProductId')
				.join('products', 'products.productId', 'productsPairings.parentProductId')
				.join('products AS products2', 'products2.productId', 'productsPairings.childProductId')
				.where({ childProductId: productId })
				.orWhere({ parentProductId: productId });

			return ProductPairings;

		} else {
			const ProductPairings = await knex('productsPairings')
				.select('products.productName AS parentProduct', 'products2.productName AS childProduct', 'products.productId AS parentProductId', 'products2.productId AS childProductId')
				.join('products', 'products.productId', 'productsPairings.parentProductId')
				.join('products AS products2', 'products2.productId', 'productsPairings.childProductId')
				.orderBy('childProductId', 'ASC')
				.orderBy('parentProductId', 'ASC');

			return ProductPairings;
		}
	},

	// Get Memorialization Products that can be used in Pairings - table of child and parent productIds with child=accessory product, parent=product that uses child
	async ProductsPairingsMemorializations(root, input, context) {
		const knex = context.knex;

		const ProductsPairingsMemorializations = await knex('products')
			.whereIn('productCategoryId', ['1'])
			.orderBy('productName', 'ASC');

		return ProductsPairingsMemorializations;
	},

	// Get the memorialization products, along with other details needed to show pet owners or vets which products are available.
	async ProductsMemorialization(root, { orderId=0, petReferenceNumber, productTypeId, promotionsOnly=false }, context) {
		let Products = await context.knex('products')
			.select('products.*', 'productsAccounts.*', 'productsAccounts.active AS productAccountActive', 'productCategories.productCategory',
				'productCategories2.productCategory as parentCategory', 'productMaterials.materialDescription', 'productMaterials.materialName')
			.join('productsAccounts', 'productsAccounts.productId', 'products.productId')
			.join('productCategories', 'productCategories.productCategoryId', 'products.productCategoryId')
			.leftJoin('productCategories as productCategories2', 'productCategories2.productCategoryId', 'productCategories.parentCategoryId')
			.leftJoin('productMaterials', 'productMaterials.productMaterialId', 'products.productMaterialId')
			.where('products.productTypeId', productTypeId )
			.andWhere('products.active', 1)
			.andWhere('productsAccounts.active', 1)
			.andWhere('productsAccounts.accountId', context.Account.accountId)
			.orderBy('productsAccounts.sortOrder', 'ASC')
			.orderBy('products.productName', 'ASC');

		if(orderId > 0 && petReferenceNumber === '') {
			petReferenceNumber = await context.knex('orders').select('petReferenceNumber').where({orderId});
		}
		if(petReferenceNumber !== '' && petReferenceNumber !== undefined) {
			if( promotionsOnly ) {
				const promotions = await context.knex("orders")
					.join("productsCompaniesPromotions", "orders.companyId", "productsCompaniesPromotions.companyId")
					.join("productsCompaniesPromotionsProducts", "productsCompaniesPromotions.productCompanyPromotionId", "productsCompaniesPromotionsProducts.productCompanyPromotionId" )
					.select("productsCompaniesPromotions.productId as triggerProductId",
						"productsCompaniesPromotionsProducts.productId as linkedProductId")
					.where({ petReferenceNumber });

				// Get a list of products that we should return.
				const promotionalProducts = promotions.reduce((acc, { triggeredProductId, linkedProductId }) => {
					acc[triggeredProductId] = true;
					acc[linkedProductId] = true;
					return acc;
				},{});

				// Filter the main list of products to only include the products with promotions.
				Products = Products.filter(({ productId }) => promotionalProducts[productId]);
			}
			// This is purposely left outside of the above IF statement, and should NOT be inside of an ELSE statement because the Products array can be retreived from within the if
			Products = await orderProductsPriceCalculations({ calledFrom: 'Product.js, 173', petReferenceNumber, Products, productTypeId}, context);
		}

		return Products;
	}
}

// MUTATIONS
export const Mutations = {
	async productCompanyWeightTierPriceSave(root, { input }, context) {
		if( input.productCompanyPriceWeightId > 0) {
			await context.knex("productsCompaniesPricesWeights").update(input).where("productCompanyPriceWeightId",input.productCompanyPriceWeightId);

			return Response(true,"Company Weight Tier Price Successfully Updated", { ProductCompanyWeightTierPrice: input });
		} else if(input.productCompanyPriceWeightId == 0) {
			const { value: measurement } = context.Account.Settings.find(({ name }) => name === "measurementSystem" );
			if ( measurement === "Metric" ) {
				input.weightUnits = "kg";
			} else {
				input.weightUnits = "lbs";
			}

			const [productCompanyPriceWeightId] = await context.knex("productsCompaniesPricesWeights").insert({...input, accountId: context.Account.accountId });

			return Response(true,"Company Weight Tier Price Successfully Updated", { ProductCompanyWeightTierPrice: { ...input, productCompanyPriceWeightId } });
		}
	},
	async productCompanyWeightTierPriceRemove(root, { productCompanyPriceWeightId }, context) {
		await context.knex("productsCompaniesPricesWeights").delete().where({ productCompanyPriceWeightId, accountId: context.Account.accountId });

		return Response(true,"Company Weight Tier Price Successfully Removed");
	},
	async productAccountWeightTierPriceSave(root, { input }, context) {
		const { value: measurement } = context.Account.Settings.find(({ name }) => name === "measurementSystem" );
		if ( measurement === "Metric" ) {
			input.weightUnits = "kg";
		} else {
			input.weightUnits = "lbs";
		}

		if( input.productPriceWeightId > 0) {
			await context.knex("productsPricesWeights").update(input).where("productPriceWeightId",input.productPriceWeightId);

			return Response(true,"Weight Tier Price Successfully Updated", { ProductAccountWeightTierPrice: input });
		} else if(input.productPriceWeightId == 0) {
			const [productPriceWeightId] = await context.knex("productsPricesWeights").insert({...input, accountId: context.Account.accountId });

			return Response(true,"Weight Tier Price Successfully Updated", { ProductAccountWeightTierPrice: { ...input, productPriceWeightId } });
		}
	},
	async productAccountWeightTierPriceRemove(root, { productPriceWeightId }, context) {
		await context.knex("productsPricesWeights").delete().where({productPriceWeightId, accountId: context.Account.accountId });

		return Response(true,"Weight Tier Price Successfully Removed");
	},

	// input is a product object with the data to insert or update
	async productSave(root, { input }, context) {
		const knex = context.knex;

		const {
			duplicateProduct = false,
			duplicateProductId = 0,
			productId,
			productOptionIds,
			productVariations,
			speciesIds = [],
		} = input;

		// Products fields - these change based on which account we are working on and if the product is marked as editable or not
		let productsColumns = "";
		let productsAccountsFields = "";
		if(context.Account.accountId === 1 || (context.Account.accountId !== 1 && input.editable === 1)) {
			productsColumns = `
				productId,productName,productTypeId,productCategoryId,descriptionShort,descriptionLong,editable,
				productGroupId,productMaterialId,productModel,weight,weightUnits,displayForCommunal,
				displayForIndividual,displayForStore,displayForVet,urnWeightUnit,
				urnWeightLowerBoundLbs,urnWeightUpperBoundLbs,urnWeightLowerBoundKg,urnWeightUpperBoundKg,
				urnIsFreeWithDiscount,orderedIndicator,confirmedIndicator,remainsFilledIndicator,
				isPawPrint,requiresPawPrint,isFurClipping,fragile
			`.replace(/[\t\n]/g,"").split(",");
			// Products accounts fields.
			productsAccountsFields = `
				active,productId,productAccountId,sortOrder,stockAvailable,stockCheck,petWeightMax,petWeightMin,
				crematoryCost,priceRetail,priceRetailPersonalization,invoiceCost,
				invoiceCostPersonalization,taxRate,unitWeightInvoiceCost,unitWeightPriceInterval,unitWeightPriceIntervalUnits,
				unitWeightPriceMax,unitWeightPriceMin,unitWeightPriceRetail
			`.replace(/[\t\n]/g,"").split(",");
		} else if (context.Account.accountId !== 1 && input.editable === 0) {
			productsColumns = `
				productId,productTypeId,productCategoryId,editable,productGroupId,
				productMaterialId,productModel,weight,weightUnits,displayForCommunal,
				displayForIndividual,displayForStore,displayForVet,urnWeightUnit,
				urnWeightLowerBoundLbs,urnWeightUpperBoundLbs,urnWeightLowerBoundKg,urnWeightUpperBoundKg,
				urnIsFreeWithDiscount,orderedIndicator,confirmedIndicator,remainsFilledIndicator,
				isPawPrint,requiresPawPrint,isFurClipping,fragile
			`.replace(/[\t\n]/g,"").split(",");
			// Products accounts fields.
			productsAccountsFields = `
				active,accountDescriptionLong,accountDescriptionShort,accountProductName,productId,productAccountId,sortOrder,stockAvailable,stockCheck,
				crematoryCost,priceRetail,priceRetailPersonalization,invoiceCost,petWeightMax,petWeightMin,
				invoiceCostPersonalization,taxRate,unitWeightInvoiceCost,unitWeightPriceInterval,unitWeightPriceIntervalUnits,
				unitWeightPriceMax,unitWeightPriceMin,unitWeightPriceRetail
			`.replace(/[\t\n]/g,"").split(",");
			// override name and description from input
			input.accountDescriptionLong = input.descriptionLong;
			input.accountDescriptionShort = input.descriptionShort;
			input.accountProductName = input.productName;
		}

		const { value: measurement } = context.Account.Settings.find(({ name }) => name === "measurementSystem" );

		// If the value is an empty string or null, return undefined so knex will not update.
		const checkNull = (value) => value === "" || value === null ? undefined : value;
		// convert a value from metric to english units.
		const toEnglishUnits = (value) => value === undefined ? undefined : mathjs.round(value * 0.39370, 2);
		// convert a value from english to metric units.
		const toMetricUnits = (value) =>  value === undefined ? undefined : mathjs.round(value / 0.39370, 2);

		let	height = checkNull(input.height),
			length = checkNull(input.length),
			width = checkNull(input.width),
			heightEnglish,
			lengthEnglish,
			widthEnglish,
			heightMetric,
			lengthMetric,
			widthMetric;

		if ( measurement === "Metric" ) {
			heightEnglish = toEnglishUnits(height);
			lengthEnglish = toEnglishUnits(length);
			widthEnglish = toEnglishUnits(width);
			heightMetric = height;
			lengthMetric = length;
			widthMetric = width;
			input.unitWeightPriceIntervalUnits = "kg";
		} else {
			heightEnglish = height;
			lengthEnglish = length;
			widthEnglish = width;
			heightMetric = toMetricUnits(height);
			lengthMetric = toMetricUnits(length);
			widthMetric = toMetricUnits(width);
			input.unitWeightPriceIntervalUnits = "lbs";
		}

		const personalization = productOptionIds ? 1 : 0;

		if(productId > 0) {
			await knex('products')
				.where({ productId })
				.update({
					..._.pick(input, productsColumns),
					heightEnglish,
					lengthEnglish,
					widthEnglish,
					heightMetric,
					lengthMetric,
					personalization,
					widthMetric
				});

			// update the connection in the productsAccounts table, if there is an accountId, meaning that the user is not a Crematory Software admin
			await knex('productsAccounts')
				.where({ productId, accountId: context.Account.accountId })
				.update(_.pick(input, productsAccountsFields ));

			// delete all of the species for this product.
			await knex("productSpecies").del().where({ productId });

			// Insert the species.
			await knex("productSpecies").insert(speciesIds.map((speciesId) => ({ productId, speciesId })));

			// Save any productVariations that were passed in from the save form
			// LATER: There may be an issue where we are calling this mutation from places other than the Products Admin. If so, then we may not be passing in the productVariations array, which would cause us to delete any productVariation connected in the db, without replacing those records with new ones.
			//				(continued): Therefore, once the product is first saved, we require that any existing productVariations be replaced by at least one other variation. If this is an issue later, we can either manually update the db or add code with a flag variable which tells us to update the productsVariations table.
			if(productVariations.length > 0) {
				// First, remove all previous productsVariations records for this productId.
				await knex('productsVariations')
					.delete()
					.where({productId});

				// Create an insert object array from the productVariations
				let productVariationsInsertArray = productVariations.map((variation) => {
					return {
						productId,
						productVariationValueId: parseInt(variation)
					}
				});

				await knex('productsVariations')
					.insert(productVariationsInsertArray);
			}

			// The multiselect for product options has been moved to its own section so it doesnt save with the rest of the product information
			//await updateProductAttributes(productId, productOptionIds, context);

			return Response(true,"Product Successfully Updated", {Product: RootResolvers.Product(root, { productId }, context)});
		} else {
			// mark products on accountId 1 NOT editable, all others editable
			input.editable = 1;
			if(context.Account.accountId === 1) {
				input.editable = 0;
			}

			const [newProductId] =  await knex('products')
				.insert({
					..._.pick(input, productsColumns),
					heightEnglish,
					lengthEnglish,
					widthEnglish,
					heightMetric,
					lengthMetric,
					personalization,
					widthMetric,
					dateCreated: knex.fn.now()
				});

			// create the connection for the account to the product - we only need to do this if the user is not a Crematory Software admin because those users only create products available to everyone.
			await knex('productsAccounts')
				.insert({
					..._.pick(input, productsAccountsFields),
					accountId: context.Account.accountId,
					active: 1,
					productId: newProductId
				});

			// Insert the species.
			await knex("productSpecies").insert(speciesIds.map((speciesId) => ({ productId: newProductId, speciesId })));

			// Save any productVariations that were passed in from the save form
			if(productVariations.length > 0) {
				// Create an insert object array from the productVariations
				let productVariationsInsertArray = productVariations.map((variation) => {
					return {
						productId: newProductId,
						productVariationValueId: parseInt(variation)
					}
				});

				await knex('productsVariations')
					.insert(productVariationsInsertArray);
			}

			// The multiselect for product options has been moved to its own section so it doesnt save with the rest of the product information
			//await updateProductAttributes(productId, productOptionIds, context);

			// If this is getting saved a duplicate of another product, grab the other product's content that wasn't passed in
			if(duplicateProduct === true) {
				// 1) productAttributes
				let DuplicateProductAttributes = await knex("productAttributes").where('productId', duplicateProductId);

				if(DuplicateProductAttributes.length > 0) {
					// Create an insert object array from the DuplicateProductAttributes
					let DuplicateProductAttributesInsertArray = DuplicateProductAttributes.map((attribute) => {
						return {
							accountId: attribute.accountId,
							productId: newProductId,
							productOptionId: attribute.productOptionId,
							sortOrderProductOption: attribute.sortOrderProductOption
						}
					});

					await knex('productAttributes')
						.insert(DuplicateProductAttributesInsertArray);
				}

				// 2) Set personalizationAllowed and other fields that are only in the attributes section of the product save form
				await knex('productsAccounts').update({
					personalizationAllowed: input.personalizationAllowed,
					personalizationDefaultedToYes: input.personalizationDefaultedToYes,
					personalizationRequired: input.personalizationRequired			
		 		}).where({accountId: context.Account.accountId, productId: newProductId});

			}

			return Response(true,"Product Successfully Created", {Product: RootResolvers.Product(root, { productId: newProductId }, context) });
		}
	}
}
