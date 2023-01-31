import React from 'react';
import { compose, graphql } from 'react-apollo';
import _ from 'lodash';
import * as Yup from 'yup';

import { Formik, Field, Form, FieldArray } from '../utilities/IWDFormik';
import { UploadMemorialImage, CreateMemorial } from './memorials_graphql';
import { createConnectedFileUploader } from '../files/uploader';
import { Thumbnail } from '../files/images';

import { ConnectedSpeciesSelector } from '../pets/species';
import { Translate } from '../translations/IWDTranslation';

const EMPTY_MEMORIAL_FIELDS = { memorialId: 0, authorEmail: '', breed: '', dateBorn: '2000-01-01', dateDied: '2000-01-01', memorial: '', memorialStatusId: 1, petId: 0, speciesId: 0, petName: '' };

// This could go in container file.

// Combine the saveMemorialImage with the FileUploader
const MemorialFileUploader = createConnectedFileUploader(UploadMemorialImage, (result) => {
	let image = result.data.uploadMemorialImage.memorialImage;
	return image;
});


// Renders a MemorialFileUploader input for uploading images, and a list of uploaded images
function ImageUploader (props) {
	let {
		form,
		name,
		push,
		remove,
	} = props;
	return (
		<React.Fragment>
			<div>
				<MemorialFileUploader name={name} accept="image/*" onChange={push}><Translate id="Add a Photo"/></MemorialFileUploader>
			</div>
			<div>
				{form.values.images.map((image, ind) => {
					return (
						<div key={image.memorialImageId}>
							<Thumbnail image={image} type="memorial-thumb" size="small" />
							{/*
								TODO: add caption
							*/}
							<button type="button" className="btn btn-danger" onClick={() => remove(ind)}><Translate id="Remove"/></button>
						</div>
					);
				})}
			</div>
		</React.Fragment>
	);
}


// This doesn't really need to be separate from the form...
function MemorialDataFields (props) {
	/* this doesn't actually use any props right now
	let {
		//form
	} = props;
	*/

	return (
		<React.Fragment>
			<div>
				<label><Translate id="Pet Name"/></label>
				<Field name="petName" className="form-control" showError={true} />
			</div>
			<div>
				<label><Translate id="Species"/></label>
				<Field component={ConnectedSpeciesSelector} name="speciesId" className="form-control" showError={true} />
			</div>
			<div>
				<label><Translate id="Breed"/></label>
				<Field name="breed" className="form-control" showError={true} />
			</div>
			<div className="row">
				<div className="col">
					<label><Translate id="Born"/></label><br />
					<Field name="dateBorn" className="form-control" showError={true} />
				</div>
				<div className="col">
					<label><Translate id="Died"/></label><br />
					<Field name="dateDied" className="form-control" showError={true} />
				</div>
				</div>
			<div>
				<label><Translate id="Your Memorial"/></label><br />
				<Field component="textarea" name="memorial" className="form-control" showError={true} />
			</div>
		</React.Fragment>
	)
}

// This could go in container file.
// Injects onSubmit prop that will create a memorial, set the Form Response, and return the data.
export const MemorialCreateForm = compose(
	graphql(CreateMemorial,
		{
			props: ({mutate, ownProps}) => ({
				// inject onSubmit into form
				onSubmit(values, Form) {
					// create payload
					let { images, ...memorial_data } = values;
					let imageIds = images.map((i) => i.memorialImageId);
					memorial_data.images = imageIds;
					let variables = {
						memorial_data
					}
					//console.log("ownProps: ", {ownProps});
					// save memorial then set response
					return mutate({variables}).then(({data}) => {
						let Response = data.memorialCreate.Response;
						Form.setStatus(Response);

						// if parent provided onSubmit, call that
						if (typeof ownProps.onSubmit === 'function') {
							ownProps.onSubmit(data.memorialCreate);
						}

						return data.memorialCreate;
					}).catch((err) => {
						Form.setStatus({
							success: false,
							message: err.message
						})
					}).finally((result) => {
						Form.setSubmitting(false);
						return result;
					});
				}
			}),
			options: (props) => ({
				// refetch memorial List to get new memorial in list
				refetchQueries: ['MemorialList'],
				// pass through provided options
				...(_.pick(props, ['onCompleted', 'onError']))
			})
		}
	)
)(MemorialForm);


function memorialFormValidationSchema() {
	return Yup.object().shape({
		dateDied: Yup.date().required("dateDied is required"),
		dateBorn: Yup.date(),
		petName: Yup.string().required("Pet Name is required"),
		memorial: Yup.string().required("Memorial text must not be empty"),
		speciesId: Yup.number()
	})
}

// Form to display/edit memorial data. Includes memorial image uploader with list of uploaded memorialImages
export function MemorialForm (props) {
	let {
		onSubmit,
		loading,
		error,
	} = props;

	return (
		<React.Fragment>
			<Formik
				validationSchema={memorialFormValidationSchema}
				onSubmit={onSubmit}
				initialValues={{...EMPTY_MEMORIAL_FIELDS, images: []}}>
				{({ handleSubmit, handleChange, handleBlur, values, isValid, errors, status }) => {
					return (
						<Form>
							<div className="container card p-3">
								<h3><Translate id="Create a Memorial"/></h3>
								<div> {(loading || error) && (JSON.stringify(error) || 'loading')} </div>
								{ status && <div className={'alert alert-' + (status.success ? 'success' : 'danger')}>{status.message}</div> }

								<div className="row">
									<div className="col">
										{/* Basic inputs for memorial data */}
										<MemorialDataFields />
									</div>
									<div className="col">
										{/* Uploads images and displays previews of uploaded images which will be added to memorial */}
										<FieldArray name="images" component={ImageUploader} />
									</div>
								</div>
								<div>
									<p><button type="submit" disabled={!isValid} className="btn btn-success"><Translate id="Submit"/></button></p>
								</div>
							</div>
						</Form>
					)
				}}
			</Formik>
		</React.Fragment>
	)
}