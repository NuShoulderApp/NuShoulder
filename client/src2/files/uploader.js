import React from 'react';
import { graphql } from 'react-apollo';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// FileUploader -- this component acts like a file input for formik forms.


// renders a file input -- for use in formik forms. untested
export const FileInput = (props) => {
	let { innerRef, ...input_props } = props;
	return (
		<React.Fragment>
			<input {...input_props} ref={innerRef} type="file" />
		</React.Fragment>
	)
}

// Renders a file input which uploads a file and returns result in onChange()
// expected props:
//		-mutate(): will be called with {file: File}. Should upload/save file and return result
//		-onChange(result): will be called with result of mutate
//		-onError(err): will be called in case of mutate error
//		-children: content for button
export function FileUploader(props) {
	let {
		children,
		mutate,
		onChange=(_)=>(_),
		onError=(_)=>(_),
		...input_props
	} = props;

	let fileInput = React.createRef();

	let resetFileInput = () => {
		fileInput.current.value = '';
	}

	let handleChange = () => {
		let file = fileInput.current.files[0];
		resetFileInput();
		// mutate file, reuturn result with onChange
		mutate({file}).then(onChange).catch(onError);
	}

	return (
		<React.Fragment>
			<label className="btn btn-info btn-addon btn-sm m-0">
				<FontAwesomeIcon icon="upload" /> {children}
				<input {...input_props} ref={fileInput} type="file" onChange={handleChange} style={{display: 'none'}} />
			</label>
		</React.Fragment>
	)
}

// Takes in a mutation and some optional customizations, then returns a wrapped FileUploader
export function createConnectedFileUploader(gqlQuery, processResults=(a) => a, component=FileUploader) {
	return graphql(gqlQuery, {
		props: ({mutate}) => ({
			// maybe should have a better name?
			mutate: ({file}) => {
				// upload file and return result
				return mutate.call(this, {variables: {file}}).then((result) => {
					return processResults(result);
				});
			}
		})
	})(component);
}
