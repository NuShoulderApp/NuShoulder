import React from "react";
import { withApollo, compose, graphql } from "react-apollo";
import { withRouter } from '../utilities/IWDReactRouter';
import { LogoutMutation } from './auth_graphql';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';	// IMPORTANT: Add any icons you want to use to the index.js import { ... } from '@fortawesome/free-solid-svg-icons' AND library.add(...)
//import { initCache } from "../index";
import { Translate } from '../translations/IWDTranslation';

export const LogoutComponent = (props) => {
	// Click handler for the logout button.
	const onClick = async () => {
		// Execute the mutate to alert the server that we are logging out.
		await props.mutate().then(() => {
			// Reset the cache and call the session query.
			sessionStorage.clear()
			props.client.clearStore().then(() => {
				props.client.resetStore();
				props.history.push('/login')
			});
		}) ;
	}

	return <button className="ml-3 mr-3 btn btn-danger" onClick={onClick}><FontAwesomeIcon icon="unlock" />  <Translate id="Logout"/> </button>
};

// Add withApollo to clear the store and withRouter to relocate.
const Logout = compose(
		withApollo,
		withRouter,
		graphql(LogoutMutation)
)(LogoutComponent)

export { Logout }
