import React from 'react'
// import { graphql, Query, compose } from "react-apollo";
import { Query } from '@apollo/react-components';
import { graphql } from '@apollo/react-hoc';
// import { withSession } from "./session";
import { flowRight as compose, _ } from "lodash";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Function to add a query to a component as props, also adds loading and error functionality.
export function queryWithLoading(variables) {
	const {
		gqlString,
		variablesFunction = () => ({}),
		name = "data",
		options = {},
		//requiredPermission,
		// Default the notFoundCheck to false
		notFoundCheck = () => false,
		// Allow a props function to be supplied.  If not, we will just pass the props through.
		props = (props) => props
	} = variables;

	// return a HOC composed of the GQL and with loading functions.
	return compose(
		// Apply the with Permissions HOC -- this should go before the qraphql in the
		// compose so that the query never runs if they don't have the proper permission.
		 //withPermission(requiredPermission),

		// Set up the graphql query system with proper name and options.
		graphql(
			gqlString,
			{
				name,
				props,
				options: (props) => ({variables: variablesFunction(props), ...options})
			}
		),

		// Apply the with loading HOC bound to the name
		withLoading(name),

		// Apply the page not found check.
		withNotFound(notFoundCheck)
	);
}

// Helper function to show a page not found error notFoundCheck returns true.
const withNotFound = (notFoundCheck) => (WrappedComponent) => (props) => {
	if( notFoundCheck(props) === true )  {
		return <div className="text-muted m-5 text-center h3 w-100">Page Not Found</div>
	} else {
		return <WrappedComponent {...props}/>;
	}
}

// HOC to wrap a component with the ability to display Loading while a query is loading and error if there is an error.
export function withLoading(name, loading_only=false) {
	return (WrappedComponent) => ((props) => {
		const { loading, error } = props[name];
		if (loading) {
			return LoadingContent;
		} else if (!loading_only && error) {
			return (<div className="display-4 text-muted w-100 text-center m-5 p-5"> <FontAwesomeIcon icon="spinner" spin pulse /> Reconnecting... </div>);
		} else {
			return (<WrappedComponent {...props} />)
		}
	});
}

// // HOC to check for a valid permission on the session object before running the query.
// function withPermission(requiredPermission) {
// 	// Return the HOC, wrap the whole thing in session so that we have something to check.
// 	return (WrappedComponent) => withSession((props) => {
// 		// If the permission is not found, return the error message.
// 		if( props.Session.hasPermission(requiredPermission) === false ) {
// 			return <p><Translate id="Permission Warning"/>{/*You do not have the required permissions for this component*/}</p>;
// 		} else {
// 			// Otherwise render the component.
// 			return <WrappedComponent {...props} />
// 		}
// 	});
// }

// Loading spinner for use in both with loading spots.
const LoadingContent = <div className="display-4 text-muted w-100 text-center m-5 p-5"> <FontAwesomeIcon icon="spinner" spin pulse /> Loading... </div>;

/*
	Helper function to set up a mutation with the given gqlString, the name of the mutate function and a list of queries to refetch.
	When awaitRefetchQueries is true, the mutation promise will not resolve until the queries are refetched.
	The resulting mutation function will take a single arg that will be sent as the variables of the query.
*/
export function withMutation(gqlString, name="mutate", refetchQueries=[], awaitRefetchQueries=false) {
	return graphql(gqlString, { options: { refetchQueries, awaitRefetchQueries }, props: ({mutate}) => ({ [name]: (variables) => mutate({ variables }) } )});
}


// UTILITY FUNCTION to wrap React Query component. Called using:
// <QueryTagWithLoading
// 		Component={ UserComponent }  // UserComponent will be wrapped in the <Query> component
// 		query={ getUserQuery } 		 // Query component will execute this graphql query
// 		variables={ { userId: props.match.params.userId } } />	// graphql query will use these passed in variables in the query
// export const QueryTagWithLoading = withSession((props) => {
// 	const {
// 		requiredPermission,
// 		Session
// 	} = props;

// 	// Get the component.
// 	let Component = props.Component ? props.Component : props.children;

// 	// If not found check was supplied, wrap the component in the withNotFound HOC.
// 	if(props.notFoundCheck) {
// 		Component = withNotFound(props.notFoundCheck)(Component);
// 	}

// 	// Wrap the Component in the loading/error checks.
// 	const LoadingComponent = (props,b) => {
// 		const { loading, error } = props;

// 		if (loading) {
// 			return LoadingContent;
// 		} else 	if (error) {
// 			return (<p>We're sorry, we couldn't load the data right now. Please try again later.</p>);
// 		} else {
// 			return (<Component {...props} />);
// 		}
// 	}

// 	// Check permission.
// 	if( Session.hasPermission(requiredPermission) === false ) {
// 		return <p><Translate id="Permission Warning"/>{/*You do not have the required permissions for this component*/}</p>;
// 	}

// 	// will pass through the the query and variables to the React Query component via ...props
// 	return (
// 		<Query {...props}>
// 			{ LoadingComponent }
// 		</Query>
// 	)
// });

// // Helper function to convert values in an object to numbers rather than strings.
// export function castNumerics(object, columns, setNull = false) {
// 	function format(value, key) {
// 		if( colArray.includes(key) ) {
// 			if( value === "" ) {
// 				/*
// 				 	If setNull is true, we will return null to alow the db value to be set to null,
// 				 	if false, we will return undefined to keep this value out of the graphql mutation.
// 				*/
// 				return setNull ? null: undefined;
// 			} else {
// 				// Parse the values as a number (parseFloat will return integers as well as float)
// 				return parseFloat(value);
// 			}
// 		} else {
// 			return value;
// 		}
// 	}

// 	// Split the list of columns to look for.
// 	const colArray = columns.split(",");
//     console.log({object});
//     console.log()
// 	// Map the objects values with the format function.
// 	return _.mapValues(object, format );
// }
