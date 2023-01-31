import { compose } from "react-apollo";
import { withRouter } from '../utilities/IWDReactRouter'; // for URL routing
import { queryWithLoading, withMutation } from '../utilities/IWDDb';

import { CompanyUpdateClass } from './company_component'; // generic company info form

// GRAPHQL QUERY
import {
	getCompanyQuery
} from './companies_graphql';

import {
	getProductCategoriesQuery
} from "../products/products_graphql";

import {
	getUsersQuery,
	UsersLoginsSaveMutation
} from "../users/users_graphql";

// This component does the exact same functionality as the component_component.js, expect that it is accessed for Vet Staff, so the requiredPermissions are different.
export const MyHospital = compose(
	withRouter,
	withMutation(UsersLoginsSaveMutation, "UsersLoginsSave", ["getUsers"]),
	queryWithLoading({gqlString: getProductCategoriesQuery, name: "ProductCategories"}),
	queryWithLoading({
		gqlString: getCompanyQuery,
		variablesFunction: (props) => ({companyId: props.Session.User.companyId}),
		requiredPermission: { permission: "company_self", permissionLevel: 3},
		name: "Company",
		notFoundCheck: ({Company}) => Company.Company === null
	}),
	queryWithLoading({
		gqlString: getUsersQuery,
		variablesFunction: (props) => ({companyId: props.Session.User.companyId, userTypeId: [5]}),
		name: "Users"
	})

)(CompanyUpdateClass)
