import React from "react";
import { Switch, Redirect, Route } from "../utilities/IWDReactRouter";
//import { Link } from "react-router-dom";
import IWDBreadcrumb from '../utilities/IWDBreadcrumb';

import { Accounts } from "../accounts/accounts_component";
import { Account } from "../accounts/account_component";
import { AccountCreate } from "../accounts/account_create_component";

import { AnnouncementsView } from "../announcements/announcements_component";
import { AnnouncementCreate } from "../announcements/announcement_create";
import { AnnouncementSave } from "../announcements/announcement_component";

import { BurialLogsView } from "../burials/burial_logs_component";
import { BurialOrdersPerform } from "../burials/burials_perform";

import { Companies } from "../companies/companies_component";
import { CompanyCreate } from "../companies/company_create_component";
import { CompanyUpdate } from "../companies/company_component";

import { CremationLogsView } from "../cremations/cremation_logs_component";
import { CremationLogCreate } from "../cremations/cremation_log_create";
import { CremationOrdersPerform } from "../cremations/cremations_perform";
import { CremationsPerformAll } from "../cremations/cremations_perform_all";
import { CremationsList } from "../cremations/cremations_list_component";

import { Dashboard } from "../dashboard/dashboard_component";
import { DeliveryRoutesView } from "../delivery_routes/delivery_routes_component";
import { RouteCreate } from "../delivery_routes/delivery_route_create";
import { RouteSave } from "../delivery_routes/delivery_route_component";

import { Home } from "../home/home_component";

// import { InfoAboutFacility } from "../home/about_facility_component";
// import { InfoAboutServices } from "../home/about_services_component";
// import { InfoContact } from "../home/contact_component";
// import { InfoCremations } from "../home/cremations_component";
// import { InfoPetLossSupport } from "../home/pet_loss_support_component";

import { Invoices } from "../invoices/invoices_component";
import { InvoiceCreate } from "../invoices/invoice_create_component";
import { InvoiceForecasting } from "../invoices/forecasting";

import {
	LoginPassword,
	LoginToken,
    RecoverPassword,
    SignUp
} from "../auth/login_component";

import { MachinesView } from "../machines/machines_component";
import { MachineCreate } from "../machines/machine_create";
import { MachineSave } from "../machines/machine_component";
import { MemorializationStatus } from "../orders/memorialization_status_component";
import { MyHospital } from "../companies/my_hospital_component";

import { OrderCremation } from "../orders/order_cremation_component";
import { OrderDetails } from "../orders/order_details_component";
import { OrdersNew } from "../orders/new_order_component";
import { OrderPaging } from "../orders/orders_paging_component";
import { OrderStatusesView } from "../order_statuses/order_statuses_component";
import { OrderStatusCreate } from "../order_statuses/order_status_create";
import { OrderStatusSave } from "../order_statuses/order_status_component";
import { OrderStatusUpdater } from "../orders/order_status_updater_component";
import { OrderSupplies } from "../orders/order_supplies_component";
import { OrdersView } from "../orders/orders_component";
import { PickupsDeliveries } from "../orders/pickups_deliveries_component";
import { DeliveryLog } from "../delivery_log/delivery_log_component";

import { Payment } from "../payments/payment_component"
import { PetChecker } from "../orders/pet_checker_component";
import { PetReferenceCheck } from "../orders/pet_reference_check_component";
import { PetReferenceCreate } from "../pet_reference_numbers/pet_reference_number_create_component";
import { ProductCategories } from "../products/product_categories_component";
import { ProductMaterials } from "../products/product_materials_component";
import { ProductOptions } from "../products/product_options_component";
import { ProductOptionValues } from "../products/product_option_values_component";
import { ProductsMemorialization } from "../products/products_memorialization_component";
import { ProductSave } from "../products/product_save_component";
import { Products } from "../products/products_component";
import { Settings } from "../settings/settings_component";
import { TestimonialCreate } from "../testimonials/testimonial_create_component";
import { TestimonialReview } from "../testimonials/testimonial_review_component";
import { Testimonials } from "../testimonials/testimonials_component";

import { Users } from "../users/users_component";
import { User } from "../users/user_component";
import { CCAdminUserCreate, UserCreate } from "../users/user_create_component";

import { WorkflowList } from "../workflow/workflow_list";

import { TranslationRoutes } from '../translations/routes';
// import { MemorialRoutes } from '../memorials/routes';
import { AdminMemorialRoutes } from '../admin_memorials/routes';
import { LoadUnloadComponent } from "../orders/order_load_unload_component";


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
	return <Switch>
		<Route exact path="/" component={Home} name="Home" />
		<Route path="/login" render={withBreadcrumb(LoginRoutes,"Login")} />


		{/* Info pages - restrict to pet above */}
		{/* <Route path="/info" component={InfoRoutes} /> */}

		{/* Temporary Not found route for debugging routing issues.  Shouldn't go out to prod.
		<TempNotFoundRoute /> */}

		<Redirect path="*" to="/login" />
	</Switch>
}

function LoginRoutes(props){
	return (
		<Switch>
			<Route exact path={`${props.match.path}`} component={LoginPassword} />
			<Route exact path={`${props.match.path}/recoverPassword`} component={RecoverPassword} />
			<Route exact path={`${props.match.path}/:token`} component={LoginToken} />
		</Switch>
	);
}

// Admin / Crematory / Vet Facing Pages - need to login
function AppRoutes() {
	return <Switch>
		<Route exact path="/" component={Dashboard} />
		<Route path="/login" component={Dashboard} />	{/* Afer logging in show the dashboard for that user */}
		<Route path="/account" render={withBreadcrumb(AccountRoutes,"Accounts", "accounts")} />
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
		<Route path="/testimonials_review" render={withBreadcrumb(TestimonialsReviewRoutes,"Testimonials", "testimonials")} />
		{/* /users routes require a userId type ID of 1 (CC admin).  */}
		<Route path="/users" requiredPermission={{ userTypeId: 1}} render={withBreadcrumb(UsersRoutes,"Users")} />
		<Route path="/translations" render={DetailColumn(TranslationRoutes)} />
		<Route path="/workflow" render={WorkflowRoutes} />
		<Route path="/delivery_log" component={DeliveryLog} />

		{/* Temporary Not found route for debugging routing issues.  Shouldn't go out to prod.
		<TempNotFoundRoute /> */}

		<Redirect path="*" to="/dashboard" />
	</Switch>
}

// SUB ROUTES
// SINGLE ACCOUNT AND EDIT
const AccountRoutes = (props) => (
	<React.Fragment>
		{/* ONLY SHOW SELECTED ITEM OR ADD FORM IF NEEDED */}
		<Switch>
			<Route path={`${props.match.path}/:accountId`} render={withBreadcrumb(Account,"Account")} />
		</Switch>
	</React.Fragment>
)

// ACCOUNT LIST AND CREATE ACCOUNT FORM
const AccountsRoutes = (props) => (
	<React.Fragment>
		{/* ALWAYS SHOW THE LIST */}
		<Route path={props.match.path} render={DetailColumn(Accounts)} />
		<Route path={`${props.match.path}/account_create`} render={DetailColumn(AccountCreate)} />
	</React.Fragment>
)

const AnnouncementsRoutes = (props) => (
	<React.Fragment>
		<Route exact path={props.match.path} render={withBreadcrumb(AnnouncementsView,"Announcements")} />
		<Route path={`${props.match.path}/create`} component={AnnouncementCreate} />
		<Route path={`${props.match.path}/announcement/:announcementId`} render={withBreadcrumb(AnnouncementSave,"Announcement")}/>
	</React.Fragment>
)

const BurialsRoutes = (props) => (
	<React.Fragment>
		<Route exact path={props.match.path} render={withBreadcrumb(BurialLogsView,"Burial Logs")} />
		<Route path={`${props.match.path}/logs/:burialLogId`} render={BurialOrdersPerform} />
	</React.Fragment>
)

const CompaniesRoutes = (props) => (
	<React.Fragment>
		{/* ALWAYS SHOW THE LIST */}
		<Route path={props.match.path} render={DetailColumn(Companies)} />
		<Route path={`${props.match.path}/create`} render={DetailColumn(CompanyCreate)} />
	</React.Fragment>
)

const MyHospitalRoutes = (props) => (
	<React.Fragment>
		<Route path={`${props.match.path}`} render={MyHospitalSubRoutes}/>
	</React.Fragment>
)

const MyHospitalSubRoutes = (props) => (
	<Switch>
		<Route path={`${props.match.path}/user/:userId`} render={withBreadcrumb(User,"User")}/>
		<Route>
			<React.Fragment>
				<Route path={`${props.match.path}`} component={MyHospital} />
				<Route path={`${props.match.path}/user_create`} render={withBreadcrumb(UserCreate,"User")}/>
			</React.Fragment>
		</Route>
	</Switch>
);

// const InfoRoutes = (props) => (
// 	<React.Fragment>
// 		<Route path={`${props.match.path}/contact`} component={InfoContact}/>
// 		<Route path={`${props.match.path}/cremations`} component={InfoCremations}/>
// 		<Route path={`${props.match.path}/facility`} component={InfoAboutFacility}/>
// 		<Route path={`${props.match.path}/petloss`} component={InfoPetLossSupport}/>
// 		<Route path={`${props.match.path}/services`} component={InfoAboutServices}/>
// 	</React.Fragment>
// )

const CompanyRoutes = (props) => (
	<React.Fragment>
		<Route path={`${props.match.path}/:companyId`} render={withBreadcrumb(CompanySubRoutes,"Hospital")}/>
	</React.Fragment>
)

const CompanySubRoutes = (props) => (
	<Switch>
		<Route path={`${props.match.path}/user/:userId`} render={withBreadcrumb(User,"User")}/>
		<Route>
			<React.Fragment>
				<Route path={`${props.match.path}`} component={CompanyUpdate} />
				<Route path={`${props.match.path}/user_create`} render={withBreadcrumb(UserCreate,"User")}/>
			</React.Fragment>
		</Route>
	</Switch>
);

const CremationsRoutes = (props) => (
	<React.Fragment>
		<Route exact path={props.match.path} render={withBreadcrumb(CremationLogsView,"Cremation Logs")} />
		<Route exact path={`${props.match.path}/perform`} component={CremationsPerformAll} />
		<Route path={`${props.match.path}/list`} component={CremationsList} />
		<Route path={`${props.match.path}/log/create`} component={CremationLogCreate} />
		<Route path={`${props.match.path}/logs/:cremationLogId`} component={CremationOrdersPerform} />
	</React.Fragment>
)

const DeliveryRoutesRoutes = (props) => (
	<React.Fragment>
		<Route exact path={props.match.path} component={DeliveryRoutesView} />
		<Route path={`${props.match.path}/create`} component={RouteCreate} />
		<Route path={`${props.match.path}/routeId/:routeId`} render={withBreadcrumb(RouteSave,"Route Details")}/>
	</React.Fragment>
)

const InvoiceRoutes = (props) => (
	<Switch>
		<Route exact path={props.match.path} component={Invoices} />
		<Route exact path={`${props.match.path}/forecasting`} component={InvoiceForecasting} />
		<Route exact path={`${props.match.path}/invoice_create`} render={withBreadcrumb(InvoiceCreate,"Create Invoice")} />
		<Route path={`${props.match.path}/invoice_details/:invoiceId`} render={withBreadcrumb(Invoices,"Invoice Details")}/>
	</Switch>
)

const MachinesRoutes = (props) => (
	<React.Fragment>
		<Route exact path={props.match.path} render={withBreadcrumb(MachinesView,"Machines")} />
		<Route path={`${props.match.path}/create`} component={MachineCreate} />
		<Route path={`${props.match.path}/machine/:machineId`} render={withBreadcrumb(MachineSave,"Machine")}/>
	</React.Fragment>
)

// NEW ORDERS LANDING PAGE
const NewOrdersRoutes = (props) => (
    <React.Fragment>
		<Route exact path={`${props.match.path}/new_order_type/:newOrderType`} component={OrderCremation} />
		<Route exact path={`${props.match.path}/create_new/:create_new`} component={OrdersNew} />
		<Route exact path={`${props.match.path}/supplies`} component={OrderSupplies} />
		<Route exact path={props.match.path} component={OrdersNew} />
    </React.Fragment>
)

// VIEW ORDERS PAGE
const OrdersRoutes = (props) => (
    <Switch>
		{/* Full orders list */}
		<Route exact path={props.match.path} component={OrderPaging} />
		<Route path={`${props.match.path}/orderQueue/crematoryLoad/:routeId?`} render={(props) => <LoadUnloadComponent {...props} LoadUnload="Load" />} />
		<Route path={`${props.match.path}/orderQueue/crematoryUnload/:routeId?`} render={(props) => <LoadUnloadComponent {...props} LoadUnload="Unload" />} />
		<Route path={`${props.match.path}/orderQueue/routes/:routeId?`} component={PickupsDeliveries} />
		<Route exact path={`${props.match.path}/order_supplies/referenceNumber/:petReferenceNumber/productType/:productTypeId`} render={withBreadcrumb(ProductsMemorialization,"Supplies", "orders")} />
		<Route exact path={`${props.match.path}/orderQueue/:orderQueue`} component={OrdersView} />
		{/* Details for single order */}
		<Route exact path={`${props.match.path}/orderId/:orderId`} component={OrderDetails} />
		<Route path={`${props.match.path}/status_updater`} render={withBreadcrumb(OrderStatusUpdater, "Status Updater")} />
    </Switch>
);

// ADMIN ORDER STATUSES PAGE
const OrderStatusRoutes = (props) => (
    <Switch>
		<Route exact path={props.match.path} component={OrderStatusesView} />
		<Route exact path={`${props.match.path}/orderStatusId/:orderStatusId`} render={withBreadcrumb(OrderStatusSave, "Update Order Status")} />
		<Route path={`${props.match.path}/create`} render={withBreadcrumb(OrderStatusCreate, "Create Order Status")} />
    </Switch>
);

// Create Pet REference Numbers PAGE
const PetReferenceNumbersRoutes = (props) => (
    <React.Fragment>
		<Route exact path={props.match.path} component={PetReferenceCreate} />
    </React.Fragment>
)

// PRODUCTS
const ProductsRoutes = (props) => (
    <React.Fragment>
		<Route exact path={props.match.path} component={Products} />
		<Route exact path={`${props.match.path}/product_categories`} render={withBreadcrumb(ProductCategories, "Categories")} />
		<Route exact path={`${props.match.path}/product_materials`} render={withBreadcrumb(ProductMaterials, "Materials")} />
		<Route exact path={`${props.match.path}/product_options`} render={withBreadcrumb(ProductOptions, "Options")} />
		<Route exact path={`${props.match.path}/product_option_values`} render={withBreadcrumb(ProductOptionValues, "Option Values")} />
		<Route exact path={`${props.match.path}/product_save`} component={ProductSave} />
		<Route exact path={`${props.match.path}/product_save/:productId`} component={ProductSave} />
    </React.Fragment>
)

 // PRODUCTS MEMORIALIZATION
const ProductsMemorializationRoutes = (props) => (
    <React.Fragment>
		<Route exact path={props.match.path} component={ProductsMemorialization} />
		<Route exact path={`${props.match.path}/referenceNumber/:petReferenceNumber`} component={ProductsMemorialization} />
		<Route exact path={`${props.match.path}/status/:petReferenceNumber`} component={MemorializationStatus} />
    </React.Fragment>
)

// MY ACCOUNT PAGE
const ProfileRoutes = (props) => (
    <React.Fragment>
        <Route path={props.match.path} component={User} />
    </React.Fragment>
)

// SETTIMGS LIST AND CREATE SETTING FORM
const SettingsRoutes = (props) => (
	<React.Fragment>
		{/* ALWAYS SHOW THE LIST */}
		<Route path={props.match.path} component={Settings} />
	</React.Fragment>
)

const TestimonialsRoutes = (props) => (
	<React.Fragment>
		<Route path={props.match.path} component={Testimonials} />
		<Route path={`${props.match.path}/testimonial_create`} component={TestimonialCreate} />
	</React.Fragment>
)

const TestimonialsReviewRoutes = (props) => (
	<React.Fragment>
		<Route path={`${props.match.path}`} component={TestimonialReview} />
	</React.Fragment>
)

// /users /users/user /users/user_create Routes
const UsersRoutes = (props) => (
	<Switch>
		{/* Match a specific user route. */}
		<Route exact path={`${props.match.path}/user/:userId`} render={withBreadcrumb(User,"User")} />

		{/* This is for /users and /users/user/create both routes need the /users list. */}
		<Route>
			<React.Fragment>
				{/* ALWAYS SHOW THE LIST Both of these routes will match for user_create. */}
				<Route path={props.match.path} render={DetailColumn(Users)} />
				<Route path={`${props.match.path}/user_create`} render={DetailColumn(CCAdminUserCreate)} />
			</React.Fragment>
		</Route>
	</Switch>
)

const WorkflowRoutes = (props) => (
	<React.Fragment>
		{/* <Route path={props.match.path} component={Testimonials} /> */}
		<Route exact path={`${props.match.path}/list/:workflow`} component={WorkflowList} />
	</React.Fragment>
)

// Help Function to add a breadcrumb to routes, will wrap render functions to pass props
// DETAIL COLUMN
function DetailColumn(Component) {
	return (props) => <React.Fragment>
		<div id="detail-column" className="flex-child column-parent">		{/* DETAIL COLUMN CONTAINER */}
			<div id="detail-column-secondary" className="flex-child column-parent p-3">			{/* SECONDARY DETAIL COLUMN CONTAINER */}
				<Component {...props}/>
			</div>
		</div>
	</React.Fragment>
}

// WITH BREADCRUMB - adds item to the Breadcrumb on the page
function withBreadcrumb(Component, title, pathOverride) {
	return (props) => {
		// passing in the 3rd argument pathOverride will change the base URL path for the breadcrumb
		let pathname = pathOverride !== undefined ? `/${pathOverride}` : props.match.url;
		return <React.Fragment>
			<IWDBreadcrumb {...{title, pathname}} />
			<Component {...props}/>
		</React.Fragment>
	}
}

export { AppRoutes, PublicRoutes, withBreadcrumb }
