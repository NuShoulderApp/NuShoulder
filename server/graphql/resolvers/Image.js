import { getImagesForProduct } from './ProductImage';

// NOTE: use camelCase for fields and PascalCase for types and objects

// resolve a productImage object based on provided root.defaultImage
export async function defaultImage (root, args, context) {
	// get id for image file
	let { productId=0 } = root;
	if (! productId ) return null;
	let [data] = await getImagesForProduct(productId, true, context);

	if (! data) {
		return null;
	}

	return data;
}

export async function images (root, args, context) {
	let { productId=0 } = root;
	if (! productId ) return [];
	let images = await getImagesForProduct(productId, false, context);

	return images;
}
