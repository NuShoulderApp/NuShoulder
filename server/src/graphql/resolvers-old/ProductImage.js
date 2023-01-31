// import standard database connection object
import _ from "lodash";
import Stream from 'stream';
import sharp from 'sharp';

import { Response } from "../../utilities/helpers";
import { uploadFile, getFileStreamByFileId } from './File';
import { getProductById } from "./Product";

const PRODUCT_IMAGE_CONFIG = {
	thumbnails: [
		{ height: 550, width: 550, name: 'large' },
		{ height: 200, width: 200, name: 'medium' },
		{ height: 100, width: 100, name: 'small' },
		{ height: 60, width: 60, name: 'tiny' }
	]
}

async function saveProductImage(productImage, context) {
	const knex = context.knex;

	let {
		caption,
		defaultImage=undefined,
		fileId,
		productId,
		productImageId=0,
		speciesIds=[]
	} = productImage;

	let result;
	if (productImageId > 0) {
		await knex("productImageSpecies").del({ productImageId });

		result = await knex('productImages').where({productImageId}).update({
			fileId,
			productId,
			defaultImage,
			caption
		});
	} else {
		// Check to see if there are any other images for this product. If none, then set this image to be the defaultImage.
		let images = await getImagesForProduct(productId, false, context);

		defaultImage = images.length === 0 ? 1 : defaultImage;

		[productImageId] = await knex('productImages').insert({
			fileId,
			productId,
			defaultImage,
			caption
		});
		result = productImageId;
	}

	if (result > 0) {
		// Add the species if there are any.
		if( speciesIds.length > 0 ) {
			await knex("productImageSpecies").insert(speciesIds.map((speciesId) => ({ productImageId, speciesId })));
		}

		return productImageId;
	}
}

function ProductImage(data) {
	data.image = _.pick(data, ['accountId', 'bucket', 'folder', 'filename', 'fileId' ]);
	return data;
}

export async function getImagesForProduct(productId, defaultOnly=false, context) {
	const knex = context.knex;

	let query = knex('productImages')
		.leftJoin('files', 'files.fileId', 'productImages.fileId')
		.where('files.accountId', context.Account.accountId) // current account
		.andWhere( 'productImages.productId', productId );
	if (defaultOnly) {
		query = query.where('defaultImage', 1)
	}

	let data = await query;
	let images = data.map((productImage) => {
		return new ProductImage(productImage);
	});

	return images;
}

export async function getProductImageById(productImageId, defaultOnly=false, context) {
	const knex = context.knex;

	let query = knex('productImages')
		.leftJoin('files', 'files.fileId', 'productImages.fileId')
		.where({productImageId});
	if (defaultOnly) {
		query = query.where('defaultImage', 1)
	}
	let data = await query.first();
	if (data) {
		return new ProductImage(data);
	}
	return data;
}

async function createProductImageThumbnails(productImage, context) {
	const knex = context.knex;

	let {
		fileId,
		productImageId
	} = productImage;

	// create a pipeline to process input stream and upload files
	let pipeline = sharp();
	let fileInfo = await getFileStreamByFileId(fileId, context);
	// setup a separate upload stream for each thumbnail
	let uploadPromises = PRODUCT_IMAGE_CONFIG.thumbnails.reduce((results, thumbSpec) => {
		let uploadStream = new Stream.PassThrough();
		pipeline.clone().resize(thumbSpec.width, thumbSpec.height).pipe(uploadStream);

		// start an upload with the new stream
		let fileData = {
			...fileInfo,
			filename: `${thumbSpec.name}_${fileInfo.filename}`,
			// Send the stream wrapped in a createReadStream to keep with the API.
			createReadStream: () => uploadStream
		};
		let uploadPromise = uploadFile(fileData, context, 'products').then((fileData) => ({
			fileData,
			thumbnail: thumbSpec
		}));

		results.unshift(
			uploadPromise
		);

		return results;
	}, []);

	// pipe stream into uploads to start process
	fileInfo.stream.pipe(pipeline);

	// save newly created image sizes into database
	let uploadResults = await Promise.all(uploadPromises);
	let thumbnailData = uploadResults.map((result) => {
		let { fileData, thumbnail } = result;
		return {
			productImageId,
			imageSizeName: thumbnail.name,
			imageHeight: thumbnail.height,
			imageWidth: thumbnail.width,
			fileId: fileData.fileId
		};
	});

	// Remove the previous sizes.
	await knex("productImagesSizes").del().where({ productImageId });

	// save metadata into DB table
	let productImageSizeId = await knex('productImagesSizes').insert(thumbnailData);

	// add IDs to results
	return thumbnailData.map((d) => {
		let result = {...d, productImageSizeId};
		productImageSizeId = productImageSizeId + 1;
		return result;
	});
}

export const SubResolvers = {
	async thumbnails(root, args, context) {
		const knex = context.knex;

		if (root.productImageId > 0) {
			let thumbs = await knex('productImagesSizes AS pis')
				.join('files AS f', 'pis.fileId', 'f.fileId')
				.where({productImageId: root.productImageId}).select(
					'pis.*',
					'pis.productImageId',
					'pis.imageSizeName as size',
					'pis.imageHeight as height',
					'pis.imageWidth as width',
					'f.*'
				);
			let data = thumbs.map((t) => {
				let { height, width, size, productImageId, productImageSizeId, ...fileData } = t;
				return {
					height,
					width,
					size,
					productImageId,
					productImageSizeId,
					file: {
						...fileData
					}
				}
			});
			return data;
		} else {
			throw new Error('missing productImageId');
		}
	},
	async Species({ productImageId }, args, context) {
		return await context.knex("productImageSpecies")
			.join("species","productImageSpecies.speciesId", "species.speciesId")
			.where({ productImageId })
	}
}

// MUTATIONS
export const Mutations = {
	// Upload an image to s3 and return file data.
	async uploadProductImage(root, { file }, context) {
		const fileInfo = await file;
		
		let uploadResult = await uploadFile({...fileInfo, createReadStream: () => fileInfo.stream}, context, 'products');
		return Response(true,"Product Image Uploaded", {image: uploadResult});
	},

	async makeProductImageDefault(root, { productImageId=0, makeDefault=true }, context) {
		const knex = context.knex;

		// TODO: Check for authorization before updating

		// TODO: consider returning all updated records for caching purposes (currently, a product should only have around 10 images max)

		let { productId } = await knex('productImages').where({productImageId}).select('productId').first();

		let updateResult;
		if (productId > 0 && productImageId > 0) {
			if (makeDefault) {
				// update other rows to have defaultImage = 0, and desired default Image's row to have defaultImage = 1
				updateResult = await knex('productImages as p1')
					.join('productImages as p2', 'p2.productImageId', productImageId)
					.join('files as f', 'p1.fileId', 'f.fileId')
					.update('p1.defaultImage', knex.raw('IF(p1.productImageId = ?, 1, 0)', [productImageId]), ['p1.*'])
					.where('p1.productId', knex.raw('`p2`.`productId`'))
					.andWhere('f.accountId', context.Account.accountId) // either on accountId 1 or current account;
			} else {
				// set defaultImage = 0 for indicated productImageId
				updateResult = await knex('productImages')
					.update('p1.defaultImage', 0, ['p1.*'])
					.where({productImageId});
			}
		}

		// All images for product will be updated. if updateResult = 0, that means no images were found.
		if (updateResult <= 0) {
			return Response(false, "No updates performed", null);
		}

		// Note: just because rows were updated, doesn't mean update was good. Could check for update constraints here.

		//let defaultImage = await getProductImageById(productImageId, true);
		let product = await getProductById(productId, context);
		return Response(true, "Updated Default Product Image", {product});
	},

	// remove a single product image from a product. Should remove all data associated with productImage
	async removeProductImage(root, {image}, context) {
		const knex = context.knex;

		let { productImageId=0 } = image;

		if (!productImageId) {
			return Response(false, "Invalid arguments", {product: null});
		}

		// TODO: consider preventing the removal of the default image

		// TODO: make sure everything is removed, and that there are no broken links after remove
		let thumbFiles = await knex('productImagesSizes').where({productImageId}).select('fileId');
		await knex('productImagesSizes').where({productImageId}).del();
		// TODO: get filenames before this delete and remove file from s3
		await knex('files').whereIn('fileId', thumbFiles.map((f) => f.fileId)).del();

		// TODO: get filenames before this delete and remove file from s3
		let productImage = await knex('productImages').where({productImageId}).select('fileId', 'productId').first();
		await knex('files').where('fileId', productImage.fileId).del();
		await knex('productImages').where({productImageId}).del();

		// return result
		let product = await getProductById(productImage.productId || 0, context);
		return Response(true, "Removed Product Image", {product});
	},

	async saveProductImage(root, { image }, context) {
		const {
			fileId=0,
			productId=0,
			productImageId=0
		} = image;

		if (!fileId || !productId) {
			return Response(false, "Invalid data", {});
		}

		// Get the old image to help decide when to update the thumbnails.
		const oldImage = await getProductImageById(productImageId,false, context);

		image.productImageId = await saveProductImage(image, context);

		// for new images only, create thumbnails
		if( productImageId !== image.productImageId || oldImage.fileId !== image.fileId ) {
			await createProductImageThumbnails(image, context);
		}

		return Response(true, "Saved Product Image", {productImage: image});
	}
}
