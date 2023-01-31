import React from "react";
import { Route as RrRoute } from "react-router";

import { Translate } from '../translations/IWDTranslation';

import { withSession } from "./session";

// Re-export everything in react-router overrides will come below.
export * from "react-router";

// Export a Rout component that will check for permission.
export const Route = withSession((props) => {
	if(props.requiredPermission !== undefined && props.Session.hasPermission(props.requiredPermission) === false) {
		return <p><Translate id="Permission Warning Route"/>{/*You do not have the required permissions for this page*/}</p>;
	} else {
		return (<RrRoute {...props} />);
	}
});