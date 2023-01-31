import React from "react";
import SignaturePad from "signature_pad";

export class SignatureInput extends React.Component {
	// Create a ref where the canvas DOM element will be stored.
	canvasRef = React.createRef();

	// On first mount, initialize the signature pad.
	componentDidMount() {
		// Create a new signature pad with the ref and the callback to update send the signature data to the parent after the user updates it.
		this.signaturePad = new SignaturePad(this.canvasRef.current, {	onEnd: 	({ target }) => this.props.onChange(target.toDataURL()) });

		// If data was supplied, send it.
		if(this.props.signatureData !== "") {
			this.signaturePad.fromDataURL(this.props.signatureData);
		}
	}

	componentDidUpdate(prevProps) {
		// If the previous props had signature data and the new ones don't we want to clear the canvas.
		if( prevProps.signatureData !== "" && this.props.signatureData === "") {
			this.signaturePad.clear();
		}
	}

	render() {
		return (
			<canvas className="border" ref={this.canvasRef} height={this.props.height} width={this.props.width} />
		)
	}
}
