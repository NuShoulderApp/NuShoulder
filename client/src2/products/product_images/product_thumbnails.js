import React from 'react';
import { compose } from "react-apollo";
import { queryWithLoading } from '../../utilities/IWDDb';

import { Image } from '../../files/images';

import {
	getProductImageQuery
} from '../products_graphql';

/*
	Components to display thumbnails
*/

// Works the same as the ProductImage thumbnail, but takes Product as input.
export function ProductThumbnail(props) {
	let {
		product={},
		speciesid=0,
		//imageToDisplay TODO: configure this component to display other product images
		...thumbnailProps
	} = props;

	if (product.Product) {
		product = product.Product;
	};

	let {
		defaultImage={},
		//images=[]
	} = product;

	// If there is a speciesid passed in (has to be speciesid not speciesId for some reason with DOM props), then check if the default image is specific for that species.
	// If it is not, then check if any of the other images are for that species, and make the first matching one the default image instead.
	if(speciesid > 0) {
		if(defaultImage && defaultImage.Species && defaultImage.Species.length > 0) {
			const matchingSpeciesIndex = defaultImage.Species.findIndex((species) => parseInt(species.speciesId) === parseInt(speciesid));
			if(matchingSpeciesIndex === -1) {
				// Since the species does not match the default image, check if there are any other images for this product that are species to this species.
				//Otherwise, choose an image that does not have a species specified over one that has a non-matching species specified

				// Same functionality here as in the below else (OPTION 1)
				const anyMatchingSpeciesIndex = product.images.filter((image) => image.Species.length > 0 && image.productImageId !== defaultImage.productImageId);
				if(anyMatchingSpeciesIndex.length > 0) {
					// Just need to find the first image that matches the speciesId to use as a default
					let foundMatchingSpeciesImage = false;
					anyMatchingSpeciesIndex.forEach((image) => {
						const newDefaultIndex = image.Species.findIndex((species) => parseInt(species.speciesId) === parseInt(speciesid));
						if(newDefaultIndex > -1) {
							foundMatchingSpeciesImage = true;
							defaultImage = image;
						}
					});

					// If no match is found, just set the default to the first image that does not have any Species array.
					if(foundMatchingSpeciesImage === false) {
						// Same functionality here as in the below else (OPTION 2)
						const noSpeciesArrayImages = product.images.filter((image) => image.Species.length === 0);
						if(noSpeciesArrayImages.length > 0) {
							defaultImage = noSpeciesArrayImages[0];
						}
					}
				} else {
					// Same functionality here as in the above if (OPTION 2)
					const noSpeciesArrayImages = product.images.filter((image) => image.Species.length === 0);
					if(noSpeciesArrayImages.length > 0) {
						defaultImage = noSpeciesArrayImages[0];
					}
				}
			}
		} else {
			// Same functionality here as in the above if (OPTION 1)
			const anyMatchingSpeciesIndex = product.images.filter((image) => image.Species.length > 0);
			if(anyMatchingSpeciesIndex.length > 0) {
				// Just need to find the first image that matches the speciesId to use as a default
				anyMatchingSpeciesIndex.forEach((image) => {
					const newDefaultIndex = image.Species.findIndex((species) => parseInt(species.speciesId) === parseInt(speciesid));
					if(newDefaultIndex > -1) {
						defaultImage = image;
					}
				})
			}
		}
	}

	return <ProductImageThumbnail {...thumbnailProps} productImage={defaultImage} />
}

// Display an image using a productImage and the desired image size as input
export function ProductImageThumbnail(props) {
	let {
		// productImage data
		productImage,

		// props to indicate how image should be rendered
		size='full',
		height=0,
		width=0,
		className='',
		style={}
	} = props;

	if (!productImage) productImage = {};

	let {
		caption='',
		image={location: ''},
		thumbnails=[]
	} = productImage;

	// Try to get thumbnail matching desired size from productImage.thumbnails
	let location = null;
	let thumbnail = null;
	if (size) {
		thumbnail = thumbnails.find((t) => t.size === size);
	} else if (width && height) {
		thumbnail = thumbnails.find((t) => t.height === height && t.width === width);
	}
	if (thumbnail) {
		location = thumbnail.file.location;
	}

	// fallback to displaying full-size image
	if (!location) {
		location = image.location;
	}

	return (
		<React.Fragment>
			<Image style={style} image={{location, caption}} className={`${className} thumbnail thumbnail-${size}`} />
		</React.Fragment>
	);
}


export const ProductThumbnailLoader = compose(
	queryWithLoading({
		gqlString: getProductImageQuery,
		variablesFunction: (props) => ({productId: props.product.productId}),
		name: "product"
	})
)(ProductThumbnail)
