import React from "react";
// NS TO DO - update router to include the old functionality found in NSReactRouter
// use navigate instead of redirect, and routes instead of switch
import { Navigate, Route, Routes } from 'react-router-dom';
// import { Switch, Redirect, Route } from "../utilities/IWDReactRouter";
import { Link } from "react-router-dom";
// import IWDBreadcrumb from '../utilities/IWDBreadcrumb';

import LoginComponent from "../auth/login_componentNS.js";

import { AdminNuHouseScoreComponent } from "../nuhouse_score/admin_nuhouse_score_component.js";
// import { User } from "../users/user_component";

/*

	****************************************************
	*********************** NOTE ***********************

	When adding routes, if you are routing directly to a component, use the component attribute.  It will instantiate
	the component once and reuse it for rerenders.

	The render attribute should be a function and will be executed for each rerender.  This means that a componet
	specified in a render attribute will be reinstantiated every time.


	Currently, the only reasons to use the render attribute is to wrap the content in the breadcrumb, or to
	provide more specific props to the component.


	*********************** NOTE ***********************
	****************************************************

*/



// Temp Route to debug routing issues.
// const TempNotFoundRoute = withRouter((props) => (
// 	<Route component={({location: { pathname }}) => (
// 		<div>
// 			<div>
// 				Path Not Found: {pathname}
// 			</div>
// 			<button onClick={() => {props.history.push('/login')}}> Redirect </button>
// 		</div>
// 	)}/>
// ));

// TOP LEVEL ROUTES
// Public Facing Pages - no need to login
function PublicRoutes(Account) {
	// when changing routes handle assigning a random background to the root div if needed 
	return <Routes>
		<Route exact path="/" element={<LoginComponent />} name="Home" />
		{/* <Route path="/login" render={withBreadcrumb(LoginRoutes,"Login")} /> */}
		<Route path="/login" element={<LoginComponent />} />
		<Route path="/admin_nuhouse_score" element={<AdminNuHouseScoreComponent />} />


		{/* Info pages - restrict to pet above */}
		{/* <Route path="/info" component={InfoRoutes} /> */}

		{/* Temporary Not found route for debugging routing issues.  Shouldn't go out to prod.
		<TempNotFoundRoute /> */}

		{/* <Navigate path="*" to="/login" /> */}
	</Routes>
}

// function LoginRoutes(props){
//     console.log("in login routes function, props: ", props)
// 	return (
// 		<Routes>
// 			<Route exact path={`${props.match.path}`} component={LoginPassword} />
// 			{/* <Route exact path={`${props.match.path}/recoverPassword`} component={RecoverPassword} />
// 			<Route exact path={`${props.match.path}/:token`} component={LoginToken} /> */}
// 		</Routes>
// 	);
// }

// Admin / Crematory / Vet Facing Pages - need to login
function AppRoutes() {
	return <Routes>
		{/* <Route exact path="/" component={Dashboard} /> */}
		{/* <Route path="/login" component={Dashboard} />	Afer logging in show the dashboard for that user */}
		{/* <Route path="/account" render={withBreadcrumb(AccountRoutes,"Accounts", "accounts")} />
		<Route path="/accounts" render={withBreadcrumb(AccountsRoutes,"Accounts")} />
		<Route path="/announcements" component={withBreadcrumb(AnnouncementsRoutes, "Announcements")} />
		<Route path="/burials" render={withBreadcrumb(BurialsRoutes,"Burials", "burials")} />
		<Route path="/companies" render={withBreadcrumb(CompaniesRoutes,"Hospitals")} />
		<Route path="/company" render={withBreadcrumb(CompanyRoutes,"Hospitals", "companies")} />
		<Route path="/cremations" render={withBreadcrumb(CremationsRoutes,"Cremations", "cremations")} />
		<Route path="/dashboard" component={Dashboard} />
		<Route path="/delivery_routes" render={withBreadcrumb(DeliveryRoutesRoutes,"Delivery Routes")} />
		<Route path="/invoices" render={withBreadcrumb(InvoiceRoutes,"Invoices", "invoices")} />
		<Route path="/admin_memorials" render={DetailColumn(AdminMemorialRoutes)} />
		<Route path="/machines" component={withBreadcrumb(MachinesRoutes, "Machines")} />
		<Route path="/memorialize" component={PetReferenceCheck} />
		<Route path="/memorialization" render={withBreadcrumb(ProductsMemorializationRoutes,"Orders", "orders")} />
		<Route path="/my_account" render={withBreadcrumb(ProfileRoutes,"My Account")} />
		<Route path="/my_hospital" render={withBreadcrumb(MyHospitalRoutes,"Hospital")}  />
		<Route path="/new_orders" render={withBreadcrumb(NewOrdersRoutes,"New Orders")} />
		<Route path="/orders" render={OrdersRoutes} />
		<Route path="/order_scan" component={PetChecker} />
		<Route path="/order_statuses" render={withBreadcrumb(OrderStatusRoutes,"Order Statuses")} />
		<Route path="/payment" component={Payment} />
		<Route path="/pet_checker" component={PetChecker} />
		<Route path="/pet_reference_numbers" render={withBreadcrumb(PetReferenceNumbersRoutes,"Pet Reference Numbers")} />
		<Route path="/products" render={withBreadcrumb(ProductsRoutes,"Products")} />
		<Route path="/settings" render={withBreadcrumb(SettingsRoutes,"Settings", "settings")} />
		<Route path="/testimonials" render={withBreadcrumb(TestimonialsRoutes,"Testimonials")} />
		<Route path="/testimonials_review" render={withBreadcrumb(TestimonialsReviewRoutes,"Testimonials", "testimonials")} /> */}
		{/* /users routes require a userId type ID of 1 (CC admin).  */}
		{/* <Route path="/users" requiredPermission={{ userTypeId: 1}} render={withBreadcrumb(UsersRoutes,"Users")} />
		<Route path="/translations" render={DetailColumn(TranslationRoutes)} />
		<Route path="/workflow" render={WorkflowRoutes} />
		<Route path="/delivery_log" component={DeliveryLog} /> */}

		{/* Temporary Not found route for debugging routing issues.  Shouldn't go out to prod.
		<TempNotFoundRoute /> */}

		{/* <Navigate path="*" to="/dashboard" /> */}
	</Routes>
}

// SUB ROUTES
// SINGLE ACCOUNT AND EDIT
// const AccountRoutes = (props) => (
// 	<React.Fragment>
// 		{/* ONLY SHOW SELECTED ITEM OR ADD FORM IF NEEDED */}
// 		<Routes>
// 			<Route path={`${props.match.path}/:accountId`} render={withBreadcrumb(Account,"Account")} />
// 		</Routes>
// 	</React.Fragment>
// )

// // ACCOUNT LIST AND CREATE ACCOUNT FORM
// const AccountsRoutes = (props) => (
// 	<React.Fragment>
// 		{/* ALWAYS SHOW THE LIST */}
// 		<Route path={props.match.path} render={DetailColumn(Accounts)} />
// 		<Route path={`${props.match.path}/account_create`} render={DetailColumn(AccountCreate)} />
// 	</React.Fragment>
// )

// const AnnouncementsRoutes = (props) => (
// 	<React.Fragment>
// 		<Route exact path={props.match.path} render={withBreadcrumb(AnnouncementsView,"Announcements")} />
// 		<Route path={`${props.match.path}/create`} component={AnnouncementCreate} />
// 		<Route path={`${props.match.path}/announcement/:announcementId`} render={withBreadcrumb(AnnouncementSave,"Announcement")}/>
// 	</React.Fragment>
// )

// const BurialsRoutes = (props) => (
// 	<React.Fragment>
// 		<Route exact path={props.match.path} render={withBreadcrumb(BurialLogsView,"Burial Logs")} />
// 		<Route path={`${props.match.path}/logs/:burialLogId`} render={BurialOrdersPerform} />
// 	</React.Fragment>
// )

// const CompaniesRoutes = (props) => (
// 	<React.Fragment>
// 		{/* ALWAYS SHOW THE LIST */}
// 		<Route path={props.match.path} render={DetailColumn(Companies)} />
// 		<Route path={`${props.match.path}/create`} render={DetailColumn(CompanyCreate)} />
// 	</React.Fragment>
// )

// const MyHospitalRoutes = (props) => (
// 	<React.Fragment>
// 		<Route path={`${props.match.path}`} render={MyHospitalSubRoutes}/>
// 	</React.Fragment>
// )

// const MyHospitalSubRoutes = (props) => (
// 	<Routes>
// 		<Route path={`${props.match.path}/user/:userId`} render={withBreadcrumb(User,"User")}/>
// 		<Route>
// 			<React.Fragment>
// 				<Route path={`${props.match.path}`} component={MyHospital} />
// 				<Route path={`${props.match.path}/user_create`} render={withBreadcrumb(UserCreate,"User")}/>
// 			</React.Fragment>
// 		</Route>
// 	</Routes>
// );

// // const InfoRoutes = (props) => (
// // 	<React.Fragment>
// // 		<Route path={`${props.match.path}/contact`} component={InfoContact}/>
// // 		<Route path={`${props.match.path}/cremations`} component={InfoCremations}/>
// // 		<Route path={`${props.match.path}/facility`} component={InfoAboutFacility}/>
// // 		<Route path={`${props.match.path}/petloss`} component={InfoPetLossSupport}/>
// // 		<Route path={`${props.match.path}/services`} component={InfoAboutServices}/>
// // 	</React.Fragment>
// // )

// const CompanyRoutes = (props) => (
// 	<React.Fragment>
// 		<Route path={`${props.match.path}/:companyId`} render={withBreadcrumb(CompanySubRoutes,"Hospital")}/>
// 	</React.Fragment>
// )

// const CompanySubRoutes = (props) => (
// 	<Routes>
// 		<Route path={`${props.match.path}/user/:userId`} render={withBreadcrumb(User,"User")}/>
// 		<Route>
// 			<React.Fragment>
// 				<Route path={`${props.match.path}`} component={CompanyUpdate} />
// 				<Route path={`${props.match.path}/user_create`} render={withBreadcrumb(UserCreate,"User")}/>
// 			</React.Fragment>
// 		</Route>
// 	</Routes>
// );

// const CremationsRoutes = (props) => (
// 	<React.Fragment>
// 		<Route exact path={props.match.path} render={withBreadcrumb(CremationLogsView,"Cremation Logs")} />
// 		<Route exact path={`${props.match.path}/perform`} component={CremationsPerformAll} />
// 		<Route path={`${props.match.path}/list`} component={CremationsList} />
// 		<Route path={`${props.match.path}/log/create`} component={CremationLogCreate} />
// 		<Route path={`${props.match.path}/logs/:cremationLogId`} component={CremationOrdersPerform} />
// 	</React.Fragment>
// )

// const DeliveryRoutesRoutes = (props) => (
// 	<React.Fragment>
// 		<Route exact path={props.match.path} component={DeliveryRoutesView} />
// 		<Route path={`${props.match.path}/create`} component={RouteCreate} />
// 		<Route path={`${props.match.path}/routeId/:routeId`} render={withBreadcrumb(RouteSave,"Route Details")}/>
// 	</React.Fragment>
// )

// const InvoiceRoutes = (props) => (
// 	<Routes>
// 		<Route exact path={props.match.path} component={Invoices} />
// 		<Route exact path={`${props.match.path}/forecasting`} component={InvoiceForecasting} />
// 		<Route exact path={`${props.match.path}/invoice_create`} render={withBreadcrumb(InvoiceCreate,"Create Invoice")} />
// 		<Route path={`${props.match.path}/invoice_details/:invoiceId`} render={withBreadcrumb(Invoices,"Invoice Details")}/>
// 	</Routes>
// )

// const MachinesRoutes = (props) => (
// 	<React.Fragment>
// 		<Route exact path={props.match.path} render={withBreadcrumb(MachinesView,"Machines")} />
// 		<Route path={`${props.match.path}/create`} component={MachineCreate} />
// 		<Route path={`${props.match.path}/machine/:machineId`} render={withBreadcrumb(MachineSave,"Machine")}/>
// 	</React.Fragment>
// )

// // NEW ORDERS LANDING PAGE
// const NewOrdersRoutes = (props) => (
//     <React.Fragment>
// 		<Route exact path={`${props.match.path}/new_order_type/:newOrderType`} component={OrderCremation} />
// 		<Route exact path={`${props.match.path}/create_new/:create_new`} component={OrdersNew} />
// 		<Route exact path={`${props.match.path}/supplies`} component={OrderSupplies} />
// 		<Route exact path={props.match.path} component={OrdersNew} />
//     </React.Fragment>
// )

// // VIEW ORDERS PAGE
// const OrdersRoutes = (props) => (
//     <Routes>
// 		{/* Full orders list */}
// 		<Route exact path={props.match.path} component={OrderPaging} />
// 		<Route path={`${props.match.path}/orderQueue/crematoryLoad/:routeId?`} render={(props) => <LoadUnloadComponent {...props} LoadUnload="Load" />} />
// 		<Route path={`${props.match.path}/orderQueue/crematoryUnload/:routeId?`} render={(props) => <LoadUnloadComponent {...props} LoadUnload="Unload" />} />
// 		<Route path={`${props.match.path}/orderQueue/routes/:routeId?`} component={PickupsDeliveries} />
// 		<Route exact path={`${props.match.path}/order_supplies/referenceNumber/:petReferenceNumber/productType/:productTypeId`} render={withBreadcrumb(ProductsMemorialization,"Supplies", "orders")} />
// 		<Route exact path={`${props.match.path}/orderQueue/:orderQueue`} component={OrdersView} />
// 		{/* Details for single order */}
// 		<Route exact path={`${props.match.path}/orderId/:orderId`} component={OrderDetails} />
// 		<Route path={`${props.match.path}/status_updater`} render={withBreadcrumb(OrderStatusUpdater, "Status Updater")} />
//     </Routes>
// );

// // ADMIN ORDER STATUSES PAGE
// const OrderStatusRoutes = (props) => (
//     <Routes>
// 		<Route exact path={props.match.path} component={OrderStatusesView} />
// 		<Route exact path={`${props.match.path}/orderStatusId/:orderStatusId`} render={withBreadcrumb(OrderStatusSave, "Update Order Status")} />
// 		<Route path={`${props.match.path}/create`} render={withBreadcrumb(OrderStatusCreate, "Create Order Status")} />
//     </Routes>
// );

// // Create Pet REference Numbers PAGE
// const PetReferenceNumbersRoutes = (props) => (
//     <React.Fragment>
// 		<Route exact path={props.match.path} component={PetReferenceCreate} />
//     </React.Fragment>
// )

// // PRODUCTS
// const ProductsRoutes = (props) => (
//     <React.Fragment>
// 		<Route exact path={props.match.path} component={Products} />
// 		<Route exact path={`${props.match.path}/product_categories`} render={withBreadcrumb(ProductCategories, "Categories")} />
// 		<Route exact path={`${props.match.path}/product_materials`} render={withBreadcrumb(ProductMaterials, "Materials")} />
// 		<Route exact path={`${props.match.path}/product_options`} render={withBreadcrumb(ProductOptions, "Options")} />
// 		<Route exact path={`${props.match.path}/product_option_values`} render={withBreadcrumb(ProductOptionValues, "Option Values")} />
// 		<Route exact path={`${props.match.path}/product_save`} component={ProductSave} />
// 		<Route exact path={`${props.match.path}/product_save/:productId`} component={ProductSave} />
//     </React.Fragment>
// )

//  // PRODUCTS MEMORIALIZATION
// const ProductsMemorializationRoutes = (props) => (
//     <React.Fragment>
// 		<Route exact path={props.match.path} component={ProductsMemorialization} />
// 		<Route exact path={`${props.match.path}/referenceNumber/:petReferenceNumber`} component={ProductsMemorialization} />
// 		<Route exact path={`${props.match.path}/status/:petReferenceNumber`} component={MemorializationStatus} />
//     </React.Fragment>
// )

// // MY ACCOUNT PAGE
// const ProfileRoutes = (props) => (
//     <React.Fragment>
//         <Route path={props.match.path} component={User} />
//     </React.Fragment>
// )

// // SETTIMGS LIST AND CREATE SETTING FORM
// const SettingsRoutes = (props) => (
// 	<React.Fragment>
// 		{/* ALWAYS SHOW THE LIST */}
// 		<Route path={props.match.path} component={Settings} />
// 	</React.Fragment>
// )

// const TestimonialsRoutes = (props) => (
// 	<React.Fragment>
// 		<Route path={props.match.path} component={Testimonials} />
// 		<Route path={`${props.match.path}/testimonial_create`} component={TestimonialCreate} />
// 	</React.Fragment>
// )

// const TestimonialsReviewRoutes = (props) => (
// 	<React.Fragment>
// 		<Route path={`${props.match.path}`} component={TestimonialReview} />
// 	</React.Fragment>
// )

// // /users /users/user /users/user_create Routes
// const UsersRoutes = (props) => (
// 	<Routes>
// 		{/* Match a specific user route. */}
// 		<Route exact path={`${props.match.path}/user/:userId`} render={withBreadcrumb(User,"User")} />

// 		{/* This is for /users and /users/user/create both routes need the /users list. */}
// 		<Route>
// 			<React.Fragment>
// 				{/* ALWAYS SHOW THE LIST Both of these routes will match for user_create. */}
// 				<Route path={props.match.path} render={DetailColumn(Users)} />
// 				<Route path={`${props.match.path}/user_create`} render={DetailColumn(CCAdminUserCreate)} />
// 			</React.Fragment>
// 		</Route>
// 	</Routes>
// )

// const WorkflowRoutes = (props) => (
// 	<React.Fragment>
// 		{/* <Route path={props.match.path} component={Testimonials} /> */}
// 		<Route exact path={`${props.match.path}/list/:workflow`} component={WorkflowList} />
// 	</React.Fragment>
// )

// // Help Function to add a breadcrumb to routes, will wrap render functions to pass props
// // DETAIL COLUMN
// function DetailColumn(Component) {
// 	return (props) => <React.Fragment>
// 		<div id="detail-column" className="flex-child column-parent">		{/* DETAIL COLUMN CONTAINER */}
// 			<div id="detail-column-secondary" className="flex-child column-parent p-3">			{/* SECONDARY DETAIL COLUMN CONTAINER */}
// 				<Component {...props}/>
// 			</div>
// 		</div>
// 	</React.Fragment>
// }

// // WITH BREADCRUMB - adds item to the Breadcrumb on the page
// function withBreadcrumb(Component, title, pathOverride) {
// 	return (props) => {
// 		// passing in the 3rd argument pathOverride will change the base URL path for the breadcrumb
// 		let pathname = pathOverride !== undefined ? `/${pathOverride}` : props.match.url;
// 		return <React.Fragment>
// 			<IWDBreadcrumb {...{title, pathname}} />
// 			<Component {...props}/>
// 		</React.Fragment>
// 	}
// }

// export { AppRoutes, PublicRoutes, withBreadcrumb }
export { AppRoutes, PublicRoutes }
