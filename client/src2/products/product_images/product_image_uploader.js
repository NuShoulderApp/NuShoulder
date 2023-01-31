import React from 'react';

import { Translate } from '../../translations/IWDTranslation';
import { createConnectedFileUploader } from '../../files/uploader';

import { ProductImageUploadMutation, getSpeciesQuery } from '../products_graphql';
import { ProductImageThumbnail } from './product_thumbnails';
import { Field } from '../../utilities/IWDFormik';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Select from "react-select";
import { compose } from "react-apollo";
import { queryWithLoading } from '../../utilities/IWDDb';


/*
	Components that deal with file uploads and productImage manipulation
*/

// Create file upload button for product Images
export const ProductFileUploader = createConnectedFileUploader(ProductImageUploadMutation, ({data}) => {
	if (data.uploadProductImage.Response && data.uploadProductImage.Response.success) {
		return data.uploadProductImage.image;
	} else {
		return null;
	}
});

export const ProductImageUploader = compose(
	queryWithLoading({
		gqlString: getSpeciesQuery,
		name: "Species"
	})
)(ProductImageUploaderContent)

// component to handle display + editing of product image data inside a form
function ProductImageUploaderContent(props) {
	let {
		field: { name, value={ caption: '', image: {}, Species: []} }, // value will be current productImage object
		setDefaultImage,
		removeImage,
		updateImage,
		Species: {
			Species
		}
	} = props;

	const ALL_SPECIES_ARRAY = [{value: "ALL_SPECIES", label: "All Species"}];
	const SpeciesSelectValues = ALL_SPECIES_ARRAY.concat(Species.map(({ speciesId: value, species: label}) => ({ value, label }) ));

	const selectedSpecies = value.Species || [];

	const SpeciesValue = selectedSpecies.length > 0 ? selectedSpecies.map(({ speciesId: value, species: label}) => ({ value, label }) ) : ALL_SPECIES_ARRAY;
	function speciesChange(selectedSpecies, { option: newOption = {} }) {
		// Filter out the ALL_SPECIES item.
		const filteredSpecies = selectedSpecies.filter(( { value } ) => value !== "ALL_SPECIES");

		// After filtering, if there are no species to show, set it to ALL_SPECIES_ARRAY.
		if( newOption.value === "ALL_SPECIES" || filteredSpecies.length === 0 ) {
			updateImage({
				...value,
				Species: []
			});
		} else {
			const selectedSpeciesIds = filteredSpecies.map(( { value } ) => value);

			const selectedSpecies = Species.filter(({ speciesId }) => selectedSpeciesIds.includes(speciesId)  );

			updateImage({
				...value,
				Species: selectedSpecies
			});
		}
	 }

	// let handleImageChange = (image) => {
	// 	if (image) {
	// 		let new_value = {
	// 			...value,
	// 			image
	// 		}
	// 		updateImage(new_value);
	// 	}
	// }

	let handleCaptionChange = (e) => {
		let caption = e.target.value;
		let new_value = {
			...value,
			caption
		}
		updateImage(new_value);
	}

	return (
		<div className="p-3 border">
			<div className="row">
				<div className="col-md-6">
					{value && <ProductImageThumbnail productImage={value} size="large" /> }
				</div>

				<div className="col-md-6">
					<p>
						<label>
							<Translate id="Caption" />
							<input name={`${name}_caption`} type="textarea" onChange={handleCaptionChange} value={value.caption || ''} className='form-control'/>
						</label>
					</p>
					<div>
						<Translate id="Species" />
						<Field component={Select}
							showError={true}
							className=""
							name="Species"
							value={SpeciesValue}
							options={SpeciesSelectValues}
							onChange={ speciesChange }
							isMulti
						/>
					</div>
				</div>
			</div>
			<div>
				{/*<span className="mr-3">
					<ProductFileUploader name={name} onChange={handleImageChange} accept="image/*"> <Translate id="Change Image"/> </ProductFileUploader>
				</span>*/}
				{Boolean(value.defaultImage) === false &&
					<button type="button" className="btn btn-info btn-sm btn-addon mr-3" onClick={() => setDefaultImage(value.productImageId)}>
						<FontAwesomeIcon icon="check" /> <Translate id="Make Default"/>
					</button>
				}
				<button type="button" className="btn btn-danger btn-sm btn-addon" onClick={() => removeImage(value)}>
					<FontAwesomeIcon icon="times" /> <Translate id="Remove Image"/>
				</button>
			</div>
		</div>
	);
}
