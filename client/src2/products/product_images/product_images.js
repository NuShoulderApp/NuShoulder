import React from 'react';

import { Translate } from '../../translations/IWDTranslation';
import { ProductFileUploader, ProductImageUploader } from './product_image_uploader';
import { ProductImageThumbnail } from './product_thumbnails';

/*
	Core product Image components
*/


// component to handle display + editing of product's list of images
export function ProductImageList (props) {
	let {
		images=[],
		onClickHandler
	} = props;

	return (
		<React.Fragment>
			{images.map((productImage, ind) => {
				return (
					<div key={productImage.productImageId || ind} className="col-auto pl-0 pr-0" onClick={onClickHandler.bind(null, productImage)}>
						<ProductImageThumbnail productImage={productImage} size="tiny" />
					</div>
				);
			})}
		</React.Fragment>
	);
}

// Component to display and edit list of product images
export class ProductImageEditor extends React.Component {
	constructor(props) {
		super(props);

		let selectedImageId = null;
		let selectedImageIdx = -1;
		if (props.form.values && props.form.values.defaultImage) {
			selectedImageId = props.form.values.defaultImage.productImageId;
			selectedImageIdx = props.form.values[props.name].findIndex((i) => i.productImageId === selectedImageId)
		}

		this.state = {
			// this component would probably work better if it used the index to keep selction info
			selectedImageId,
			selectedImageIdx,
		};
	}

	// invoked before render. compare state to new props, and update selected image if image list has changed
	static getDerivedStateFromProps(props, state) {
		let listName = props.name;
		let images = (props.form && props.form.values && props.form.values[listName] ? props.form.values[listName] : []);

		let selectedImage;
		if (state.selectedImageIdx > -1) selectedImage = images[state.selectedImageIdx];

		// If the selectedImageId and selectedImageIdx are not consistent, then the list has changed.
		// need to update the id and idx accordingly
		if ( !selectedImage || selectedImage.productImageId !== state.selectedImageId ) {
			// try to keep image with same ID selected
			let sameImageIdx = images.findIndex((i) => i.productImageId === state.selectedImageId);
			if (sameImageIdx > -1) {
				// update idx to match new location
				return {
					selectedImageIdx: sameImageIdx
				}
			}

			// if we are here, image with same ID no longer exists.
			// Fallback to using greatest idx that's <= selectedImageIdx

			let selectedImageIdx = Math.min(state.selectedImageIdx, images.length - 1);
			let selectedImageId = null;
			if(images[selectedImageIdx] !== undefined) {
				selectedImageId = images[selectedImageIdx].productImageId;
			}
			return {
				selectedImageIdx,
				selectedImageId
			}
		}

		return null;
	}

	setImage(img) {
		let images = this.props.form.values[this.props.name];
		let selectedImageIdx = images.findIndex((i) => i.productImageId === img.productImageId);
		this.setState({
			selectedImageId: img.productImageId,
			selectedImageIdx
		});
	}

	// update image in images[] array of product object
	setDefaultImage(productImageId) {
		let images = this.props.form.values[this.props.name];
		let newImages = images.map((image) => {
			return {
				...image,
				defaultImage: (image.productImageId === productImageId ? 1 : 0)
			}
		});
		this.props.form.setFieldValue(this.props.name, newImages);
	}

	// update single image in images[] array
	updateImage(image) {
		let newImages = this.props.form.values.images.map((i) => {
			return (i.productImageId === image.productImageId ? image : i);
		});
		this.props.form.setFieldValue(this.props.name, newImages);
	}

	async removeImage(image) {
		let { productImageId } = image;
		let idx = this.props.form.values[this.props.name].findIndex((i) => i.productImageId === productImageId);
		if (idx >= 0) {
			this.props.remove(idx);
		}

		this.setState({selectedImageId: null});
	}

	addImage(image) {
		// This is a function from the FieldArray, it should be a complete entry for the data type of the value.
		this.props.push({productImageId: -1, Species:[], image });
	}

	render() {
		let {
			form: { values },
			name,
		} = this.props;

		let images = values[name] || [];

		let cur_img;
		if (images && images.length) {
			cur_img = images.find((i) => i.productImageId === this.state.selectedImageId);
		}

		return (
			<React.Fragment>
				<div className="border-top border-bottom">
					<div>
						<Translate id="Product Images" />:
					</div>
					{/* list of product's images, with a button to add more */}
					<div className="p-3 border">
						<div className="row">
							{images.length < 10 && (
								<div className="col-auto mr-3 mt-3">
									{/* A file uploader that will upload a new file and return a fileId, which will need to be saved in the productImage record */}
									<ProductFileUploader className="ml-1 thumbnail thumbnail-tiny" name="new_image" accept="image/*" onChange={this.addImage.bind(this)}>
										Add a Photo
									</ProductFileUploader>
								</div>
							)}
							<ProductImageList images={images} onClickHandler={this.setImage.bind(this)} />
						</div>
					</div>

					{
						cur_img &&
						<div className="mt-3">
							{/* Editor for the currently selected image */ }
							<ProductImageUploader
								removeImage={this.removeImage.bind(this)}
								setDefaultImage={this.setDefaultImage.bind(this)}
								field={{name, value: cur_img}}
								updateImage={this.updateImage.bind(this)}
							/>
						</div>
					}
				</div>
			</React.Fragment>
		)
	}
}