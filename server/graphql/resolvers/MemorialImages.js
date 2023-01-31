import Stream from 'stream';
import sharp from 'sharp';
// + const { createReadStream, filename, mimetype } = await upload
// + const stream = createReadStream()
import { Response } from '../../utilities/helpers';
import { getFileByID, uploadFile } from './File';

let default_data = { accountId: 0, caption: '' };


async function saveMemorialImageData(data, context) {
	let query = context.knex('memorialImages').insert({
		...default_data,
		...data
	});
	let [ memorialImageId ] =  await query;
	return memorialImageId;
}

async function getMemorialImageByID(memorialImageId, context) {
	let query = context.knex('memorialImages').where({memorialImageId}).first();
	return await query;
}

// takes an Apollo file promise, and uploads the file stream to s3, creating 'small', 'medium', and 'tiny' sizes
async function uploadImage(file, context) {
	const { stream, filename, mimetype, encoding } = await file;

	let full_upload_stream = new Stream.PassThrough();
	let medium_upload_stream = new Stream.PassThrough();
	let small_upload_stream = new Stream.PassThrough();
	let tiny_upload_stream = new Stream.PassThrough();

	// setup a pipeline of streams to upload to s3
	let pipeline = sharp();
	pipeline.clone().resize(66, 61).pipe(tiny_upload_stream);
	pipeline.clone().resize(130, 120).pipe(small_upload_stream);
	pipeline.clone().resize(216, 216).pipe(medium_upload_stream);
	pipeline.clone().pipe(full_upload_stream);

	// eslint-disable-next-line
	let upload_promises = Promise.all([
		uploadFile({
			createReadStream: () => full_upload_stream,
			mimetype,
			encoding,
			filename
		}, context, 'memorials'),
		uploadFile({
			createReadStream: () => medium_upload_stream,
			mimetype,
			encoding,
			filename: `medium_${filename}`
		}, context, 'memorials'),
		uploadFile({
			createReadStream: () => small_upload_stream,
			mimetype,
			encoding,
			filename: `small_${filename}`
		}, context, 'memorials'),
		uploadFile({
			createReadStream: () => tiny_upload_stream,
			mimetype,
			encoding,
			filename: `tiny_${filename}`
		}, context, 'memorials'),
	]);

	// start upload
	stream.pipe(pipeline);

	// TODO: make sure the right data is being saved for folder + filename + accountId + bucket

	let [full, medium, small, tiny] = await upload_promises;
	//console.log("Result", {full, medium, small, tiny});
	return {
		full,
		medium,
		small,
		tiny
	}
}

// functionality to resolve one of the image files, determined by 'imageType' argument
// expectes file ID to be on root object...
//		if Image already resolved, expects root[imageType].fileId and root[imageType].filename to exist
//		if Image not resolved, expects root[imageType].fileId   OR  root.fullFileId, root.mediumFileId, etc. to exist
async function resolveImage(imageType, root, args, context) {
	let data;
	// first check to see if parent resolver already has data
	if (root[imageType] && root[imageType].fileId && root[imageType].filename) {
		data = root[imageType];
	} else if (! root[imageType] || !root[imageType].fileId) {
		let fileIdAttr = imageType.replace('Image', 'FileId');
		if ( ! root[fileIdAttr]) {
			// couldn't find fileId
			return null;
		}
		data = await getFileByID(root[fileIdAttr], context);
	} else {
		data = await getFileByID(root[imageType].fileId, context);
	}
	return data;
}

const MemorialImageSubResolvers = {
	MemorialImage: {
		// image File resolvers. They expect a valid fileId to be in root[imageType].fileId, where imageType is one of the bound args below.
		fullImage: resolveImage.bind(null, 'fullImage'),
		mediumImage: resolveImage.bind(null, 'mediumImage'),
		smallImage: resolveImage.bind(null, 'smallImage'),
		tinyImage: resolveImage.bind(null, 'tinyImage'),
	},
};


// Upload file, save to memorialImages table and return result
// uploadMemorialImage(file: Upload!): MemorialImageUploadResponse!

// Workflow is currently
//		upload images + enter pet info
//		create memorial

// So memorialId will be set after memorail is created.
const MemorialImageMutations = {
	async uploadMemorialImage(root, args, context) {
		let { file=null, caption='' } = args;

		let file_data = await uploadImage(file, context);
		let {
			full:fullImage,
			medium:mediumImage,
			small:smallImage,
			tiny:tinyImage
		} = file_data;

		let image_data = {
			accountId: context.Account.accountId,
			fullFileId: fullImage.fileId,
			mediumFileId: mediumImage.fileId,
			smallFileId: smallImage.fileId,
			tinyFileId: tinyImage.fileId,
			caption,
			memorialId: 0
		}

		let imageId = await saveMemorialImageData(image_data, context);
		let result_data = await getMemorialImageByID(imageId, context);

		return Response(true, 'Saved Image', {
			memorialImage: {
				...result_data,
				fullImage,
				mediumImage,
				smallImage,
				tinyImage
			}
		});
	}
}

export { MemorialImageSubResolvers as SubResolvers, MemorialImageMutations as Mutations };