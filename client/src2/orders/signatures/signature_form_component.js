import React from 'react';
// import SignaturePad from 'signature_pad';
import { Formik, Form, Field } from '../../utilities/IWDFormik';
import { compose } from 'react-apollo';

import { SaveSignatureTest } from './signatures_graphql';
import { withMutation } from '../../utilities/IWDDb';

import { SignatureInput } from './singature_input_component';

export const SignatureInputTest = compose(
	withMutation(SaveSignatureTest, "saveSignature")
)(SignatureForm)

function SignatureForm(props) {
	let {
		saveSignature=(_)=>(_)
	} = props;

	return (
		<React.Fragment>
			<Formik
				initialValues={{ signatureName: '', signatureData: '', signatureFilename: '' }}
				onSubmit={(values, form) => {
					//console.log("saving signature...")
					saveSignature({ sigInput: values }).then(result => {
						form.setStatus(result.SignatureSaveResult);
						form.setSubmitting(false);
					});
				}}
				render={({values, status}) => (
					//</React.Fragment>console.log("render: ", {values, form}),
					<Form>
						<div className="container">
							<div className="row">
								<div className="col-auto">
									<h3>Signature: </h3>
								</div>
								<div className="col-auto">
									{status && (console.log("Status: ", {status}), JSON.stringify(status))}
								</div>
							</div>
							<div className="row">
								<div className="col-auto">
									<Field name="signatureData" component={SignatureInput} height={400} width={800} />
								</div>
							</div>
							<div className="row">
								<div className="col-auto">
									<Field name="signatureName" />
								</div>
							</div>
							<div className="row">
								<div className="col-auto">
									<button type="submit">Upload</button>
								</div>
							</div>
						</div>
					</Form>
				)}
				>
			</Formik>
		</React.Fragment>
	)
}