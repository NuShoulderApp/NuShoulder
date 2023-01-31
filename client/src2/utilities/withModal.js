import React from "react";

/*
	 This is a helper HOC to inject modal functionality into a component that doesn't have state otherwise.
	 It will inject into the props of the component a modal object with a toggleModal function and a modalOpen
	 flag to pass to the Modal tag.
*/
export function withModalState(WrappedComponent) {
	class ModalState extends React.Component {
		state = {
			modalOpen: false,
			data: {}
		};

		toggleModal = (data = {}) => this.setState({ modalOpen: !this.state.modalOpen, data });

		render() {
			const props = {
				toggleModal: this.toggleModal,
				modalOpen: this.state.modalOpen,
				data: this.state.data
			};
			return (<WrappedComponent {...this.props} modal={props}/>);
		}
	}

	return ModalState;
}
