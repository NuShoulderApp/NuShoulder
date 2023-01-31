export async function getFileByID(fileId, context) {
	return await context.knex('files').where({fileId}).first();
}

export async function getFileStreamByFileId(fileId, context) {
	const {
		accountId,
		encoding,
		folder,
		filename,
		mimeType: mimetype
	} = await getFileByID(fileId, context);

	return {
		stream: await getFileStream(accountId, folder, filename, context),
		filename,
		mimetype,
		encoding
	};
}

export function getFileStream(accountId, folder, filename, context) {
	const Key = `${accountId || context.Account.accountId}/${folder ? folder + '/' : ''}${filename}`;

	const s3 = context.Account.s3;

	return s3.getObject({ Key }).createReadStream();
}

async function getSignedUrl(folder, filename, context) {
	const s3 = context.Account.s3;

	const filepath = `${context.Account.accountId}/${folder}/${filename}`.replace('//', '/');

	const params = {
		Key: filepath,
		// expiration in 3600 seconds = 1 hour
		Expires: 3600
	}

	//eslint-disable-next-line
	return await new Promise((resolve, reject) => {
		s3.getSignedUrl('getObject', params, (err, url) => {
			if (err) reject(err);
			resolve(url);
		});
	});
}

// remove all characters that aren't valid, and add prefix
export function cleanFilename(filename) {
	const now = new Date();
	const date_str = [
		now.getFullYear(),
		now.getMonth() + 1, // getMonth is 0 indexed, adding 1 for clarity
		now.getDate(),
		now.getHours(),
		now.getMinutes(),
		now.getSeconds(),
		now.getMilliseconds()
	].join("");

	const prefix = `${date_str}`;
	const clean = filename.replace(/[^0-9a-zA-Z_.-]/g, '');

	return `${prefix}_${clean}`
}

export function getS3FileBase64(s3, params) {
	return new Promise(async (res,err) => {
		try {
			const stream = await s3.getObject(params).createReadStream();

			stream.on("readable", () => {
				let chunk;
				let result="";
				while (null !== (chunk = stream.read())) {
					result += chunk.toString("base64");
				}
				res(result);
			});

		} catch(e) {
			console.log("BASE64 Error: ", e)
			err(e);
		}
	});
}

// Upload file to s3 using context, add record to files table
export async function uploadFile(file, context, folder='', performCleanFileName=true) {
	console.log("uploadFile called!!")
	console.log({file})
	console.log({folder})
	const knex = context.knex;

	const fileResult = await file;
	console.log('FileResult in file.js: ', fileResult)
	const { createReadStream, filename, mimetype, encoding } = fileResult;

	// Invoice excel file creation will already have the datetime prefix
	const cleanName = performCleanFileName === true ? cleanFilename(filename, context) : filename;

	const accountId = context.Account.accountId;

	// create the full path, making sure the folder + filename don't introduce extra forward slashes
	let uploadDestination;
	if (folder) {
		uploadDestination = `${accountId}/${folder}/${cleanName}`.replace('//', '/');
	} else {
		uploadDestination = `${accountId}/${cleanName}`.replace('//', '/');
	}
	console.log({uploadDestination})
	const s3 = context.Account.s3;

	// eslint-disable-next-line
	const uploadResult = await new Promise((resolve, reject) => {
		s3.upload({
			Body: createReadStream(),
			Bucket: process.env.S3_BUCKET,
			ContentEncoding: encoding,
			ContentType: mimetype,
			Key: uploadDestination,
			Metadata: {
				"content-type": mimetype
			}
		}, null, (err, data) => {
			console.log({err})
			console.log({data})
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
	console.log({uploadResult})
	const path = uploadResult.Key.split('/');

	let result_filename;
	let result_folder;

	if (path.length > 1) {
		// extract + remove filename from path
		result_filename = path.pop();
		// remove accountId from path
		path.splice(0, 1);
		// folder is remaining path
		result_folder = path.join('/');
	} else {
		// This shouldn't happen, because there should be at least ${accountId}/filename
		result_filename = uploadResult.Key;
		result_folder = ''
	}

	// 	pathname is ${bucket}/${accountId}/${folder}/${filename}
	// 	the pieces are saved separately into files table.
	const file_data = {
		accountId: context.Account.accountId,
		bucket: uploadResult.Bucket, // This is set per account when s3 interface object is created
		encoding,
		folder: result_folder,
		filename: result_filename,
		mimeType: mimetype
	}
	console.log('Save File!')
	const [fileId] = await knex('files').insert(file_data);

	// if client code wants the dateCreated, it's going to have to get it from db.
	return {
		...file_data,
		fileId
	};
}

// Generic resovlers that can be used for any file in files table
export const SubResolvers = {
	async location(root, args, context) {
		const {
			accountId,
			folder='',
			filename
		} = root;

		// The resolver setup here requires that all the filename, bucket, folder, and accountId info from the files table
		// be passed to this resolver in the root object.
		// Unless we change the way our model works (specifically, how we cache DB info in resolvers),
		// 	we cannot recover if we are missing that data.
		if (!filename) throw new Error('implement me -- no file name');

		// TODO: not sure whether this check is actually helpful
		if (context.Account.accountId !== accountId) return '';

		// file path will be somthing like {bucket}.{server}/{folder}/{filename}
		// create signed url based on file path info
		return await getSignedUrl(folder, filename, context);
	}
}

export const RootResolvers = {
	async File(root, { fileId }, context) {
		return await context.knex("files").where({ fileId }).first();
	}
}

export const Mutations = {
	async singleUpload(root, { file }, context) {
		const UploadedFile = await uploadFile(file, context, 'ordersFiles');

		return UploadedFile;
	}
}
