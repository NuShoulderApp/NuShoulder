import React from "react";
// import { Breadcrumbs } from "react-breadcrumbs";
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';	// IMPORTANT: Add any icons you want to use to the index.js import { ... } from '@fortawesome/free-solid-svg-icons' AND library.add(...)
import { Link, NavLink } from "react-router-dom";

// IWD CREATED
import  { AppRoutes, PublicRoutes } from "./routes.js";

// import { Logout } from "../auth/logout_component";

// INCLUDE BOOTSTRAP 5 COMPONENTS - REACTSTRAP
import { Collapse, DropdownToggle, DropdownMenu, DropdownItem, Nav, Navbar, NavbarToggler, UncontrolledDropdown } from 'reactstrap';
// import { withSession } from "../utilities/session";

// import { withTranslate } from '../translations/IWDTranslation';

// HELP COLUMN


// TOP LEVEL APPLICATION FRAMEWORK
class ApplicationLayoutComponent extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			leftNavCollapsed: false,						// left nav - defaulting to open and showing labels with icons
			topNavOpen: false
		}
	}
	// handler to update the application state when collapsing the left navigation - will show icons only in left nav when collapsed
	toggleLeftNav = (e) => {
		e.preventDefault();
		this.setState({
			leftNavCollapsed: !this.state.leftNavCollapsed
		})
	}
	toggleTopNav = (e) => {
		//e.preventDefault();
		this.setState({
			topNavOpen: !this.state.topNavOpen
		})
	}

	/* VARY UI BASED ON USER TYPE ID
		1	NS Admin
		2	Customer Admin
		3	Customer Staff
        4	Athlete
        
	*/

	render() {
        return <PublicRoutes />
	// 	let logoImage = "cs_logo_small.png";
	// 	// set background images
	// 	let style = {};
	// 	// if(this.props.Account.accountPrefix === "loyalpaws") {
	// 	// 	let bgNumber = 1;
	// 	// 	style.backgroundImage = `url(/images/ui/${this.props.Account.accountPrefix}_background${bgNumber}.jpg)`;
	// 	// 	style.backgroundSize = 'cover';
	// 	// 	style.backgroundPosition = 'center center';
	// 	// 	style.backgroundRepeat = 'no-repeat';
	// 	// } else {
	// 	style.backgroundColor = '#E05A00';
	// 	// }
	// 	// Temp overwrite for the background image 
	// 	//style.backgroundColor = '#DDD';

	// 	if( this.props.Session.isLoggedIn() !== true ) {
	// 		// IF NOT LOGGED IN
	// 		// {this.props.Account.accountPrefix === "loyalpaws" && <NavItem><NavLink to={`/info/cremations`} className="nav-link" activeClassName="active">{this.props.translate('Cremation')}</NavLink></NavItem>}
	// 		// {this.props.Account.accountPrefix === "loyalpaws" && <NavItem><NavLink to={`/info/petloss`} className="nav-link" activeClassName="active">{this.props.translate('Pet Loss Support')}</NavLink></NavItem>}
	// 		// {this.props.Account.accountPrefix === "loyalpaws" && <NavItem><NavLink to={`/info/services`} className="nav-link" activeClassName="active">{this.props.translate('About')}</NavLink></NavItem>}
	// 		// <NavItem><NavLink to={`/testimonials`} className="nav-link" activeClassName="active">{this.props.translate('Testimonials')}</NavLink></NavItem>
	// 		// {this.props.Account.accountPrefix === "loyalpaws" && <NavItem><NavLink to={`/info/contact`} className="nav-link" activeClassName="active">{this.props.translate('Contact')}</NavLink></NavItem>}
	// 		// <NavItem><NavLink to={`/memorials`} className="nav-link" activeClassName="active">{this.props.translate('Online Memorials')}</NavLink></NavItem>

	// 		return <PublicRoutes />
	// 		// return <React.Fragment>
	// 		// 	<div id="root-bg" style={style}></div>
	// 		// 	<div id="top-container" className="flex-child column-parent">	{/* TOP CONTAINER INSIDE OF ROOT */}
	// 		// 		{/* TOP NAVIGATION */}
	// 		// 		<Navbar color="light" light expand="sm" className="fixed-top flex-child flex-auto">
	// 		// 			<NavLink to={`/`} className="navbar-brand" activeClassName="" exact><img src={process.env.PUBLIC_URL + "/images/logos/" + logoImage} alt="Home" style={{maxHeight: 75 + 'px'}} /></NavLink>
	// 		// 			<NavbarToggler onClick={this.toggleTopNav} />

	// 		// 			<Collapse isOpen={this.state.topNavOpen} navbar className="mt-4">
	// 		// 				<Nav className="mr-auto" navbar>
	// 		// 					{/* <NavItem><NavLink to={`/memorialize`} className="nav-link" activeClassName="active">{this.props.translate('Memorialize')}</NavLink></NavItem> */}
	// 		// 				</Nav>
	// 		// 				<div className="nav-item float-right"><NavLink to={`/login`} className="nav-link btn btn-success btn-sm" activeClassName="active">{this.props.translate('Veterinary Login')}</NavLink></div>
	// 		// 			</Collapse>
	// 		// 		</Navbar>

	// 		// 		{/* CONTENT CONTAINER */}
	// 		// 		<div id="content-container" className="flex-child row-parent" style={{marginTop: 106 + 'px'}}>
	// 		// 			{/* MAIN CONTENT CONTAINER */}
	// 		// 			<div id="main-content-container" className="flex-child column-parent">
	// 		// 				<div id="main-content" className="flex-child row-parent">	{/* MAIN CONTENT COLUMNS */}
	// 		// 					<PublicRoutes />
	// 		// 				</div>
	// 		// 			</div>
	// 		// 		</div>
	// 		// 	</div>
	// 		// </React.Fragment>
	// 	// NS ADMIN user_type_ID: 1
	// 	} else if (this.props.Session.isLoggedIn() === true && parseInt(this.props.Session.User.userTypeId) === 1) {
	// 		const {
	// 		 	firstName,
	// 		 	lastName
	// 		} =	this.props.Session.User;

	// 		return (
	// 			<React.Fragment>
	// 				<div id="root-bg" style={style}></div>
	// 				<div id="top-container" className="flex-child column-parent">	{/* TOP CONTAINER INSIDE OF ROOT */}
	// 					{/* TOP NAVIGATION */}
	// 					<Navbar color="white" light expand="sm" className="border-bottom fixed-top flex-child flex-auto">
	// 						<NavLink to={`/`} className="navbar-brand" activeClassName="" exact><img src={process.env.PUBLIC_URL + "/images/logos/cloud_logo_small.png"} alt="Home" /></NavLink>
	// 						<NavbarToggler onClick={this.toggleTopNav} />

	// 						<Collapse isOpen={this.state.topNavOpen} navbar>
	// 							<Nav className="mr-auto" navbar>
	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="mr-3">
	// 										Admin
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										{/* <DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/accounts`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="warehouse" /> <span className="nav-label">Accounts</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/products`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="boxes" /> <span className="nav-label">{this.props.translate('Products')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/settings`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="cogs" /> <span className="nav-label">{this.props.translate('Settings')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/users`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="users" /> <span className="nav-label">{this.props.translate('CC Admin Users')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/companies`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="building" /> <span className="nav-label">{this.props.translate('Hospitals')}</span></NavLink></DropdownItem> */}
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>
	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="ml-auto">
	// 										{ `${firstName} ${lastName} ` }
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										{/* <DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/my_account`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="user-circle" />My Account</NavLink></DropdownItem> */}
	// 										<DropdownItem divider />
	// 										<div className="text-center"><Logout/></div>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>
	// 							</Nav>

	// 						</Collapse>
	// 					</Navbar>

	// 					{/* CONTENT CONTAINER */}
	// 					<div id="content-container" className="flex-child row-parent" style={{marginTop: 70 + 'px'}}>
	// 						{/* LEFT NAVIGATION */}
	// 						<div id="nav-left" className={this.state.leftNavCollapsed ? "flex-child flex-auto left-nav-collapsed d-none d-lg-flex scrollable-container" : "flex-child flex-auto left-nav-open d-none d-lg-flex scrollable-container"}>
	// 							<div>
	// 								<ul className="list-group list-group-flush">
	// 									<li className="list-group-item">
	// 										<a href="/" id="leftNavToggler" onClick={this.toggleLeftNav} className="nav-link p-0">
	// 											{/* <FontAwesomeIcon icon={this.state.leftNavCollapsed ? "indent" : "outdent"} /> <span className="nav-label">{this.props.translate('Collapse Nav')}</span> */}
	// 										</a>
	// 									</li>
	// 									{/* <li className="list-group-item"><NavLink to={`/accounts`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="warehouse" /> <span className="nav-label">{this.props.translate('Accounts')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/products`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="boxes" /> <span className="nav-label">{this.props.translate('Products')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/settings`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="cogs" /> <span className="nav-label">{this.props.translate('Settings')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/users`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="users" /> <span className="nav-label">{this.props.translate('CC Admin Users')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/companies`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="building" /> <span className="nav-label">{this.props.translate('Hospitals')}</span></NavLink></li> */}
	// 								</ul>
	// 							</div>
	// 						</div>
	// 						{/* MAIN CONTENT CONTAINER */}
	// 						<div id="main-content-container" className="flex-child column-parent scrollable-container">
	// 							{/*<div id="breadrumb" className="flex-child flex-auto flex-child-header"><Breadcrumbs className="breadcrumb my-0" separator={<span>&nbsp;&gt;&nbsp;</span>} /></div>*/}
	// 							<div id="main-content" className="flex-child row-parent">	{/* MAIN CONTENT COLUMNS */}
	// 								<AppRoutes />
	// 							</div>
	// 						</div>
	// 					</div>
	// 				</div>
	// 			</React.Fragment>
	// 		)
	// 	// CUSTOMER ADMIN
	// 	} else if (this.props.Session.isLoggedIn() === true && this.props.Session.User.userTypeId === "2") {
	// 		const {
	// 			firstName,
	// 			lastName
	// 		} =	this.props.Session.User;

	// 		return (
	// 			<React.Fragment>
	// 				<div id="root-bg" style={style}></div>
	// 				<div id="top-container" className="flex-child column-parent">	{/* TOP CONTAINER INSIDE OF ROOT */}
	// 					{/* TOP NAVIGATION */}
	// 					<Navbar color="white" light expand="sm" className="border-bottom fixed-top flex-child flex-auto">
	// 						<NavLink to={`/`} className="navbar-brand" activeClassName="" exact><img src={process.env.PUBLIC_URL + "/images/logos/" + logoImage} alt="Home" style={{maxHeight: 44 + 'px'}} /></NavLink>
	// 						<NavbarToggler onClick={this.toggleTopNav} />

	// 						<Collapse isOpen={this.state.topNavOpen} navbar>
	// 							<Nav className="mr-auto" navbar>
	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="mr-3">
	// 										{this.props.translate('Orders')}
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										{/* <DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/pet_checker`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="search" /> <span className="nav-label">{this.props.translate('Pet Checker')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/order_scan`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="search" /> <span className="nav-label">{this.props.translate('Order Scan')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/status_updater`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="tasks" /> <span className="nav-label">{this.props.translate('Order Status Updater')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/new_orders`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="cart-plus" /> <span className="nav-label">{this.props.translate('Create an Order')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="shopping-cart" /> <span className="nav-label">{this.props.translate('View Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/supplies`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="user-md" /> <span className="nav-label">{this.props.translate('Vet Supply Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/followups`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="bell" /> <span className="nav-label">{this.props.translate('Follow Up Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/holds`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="hand-paper" /> <span className="nav-label">{this.props.translate('On Hold Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/products`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="shopping-cart" /> <span className="nav-label">{this.props.translate('Product Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/visitations`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="users" /> <span className="nav-label">{this.props.translate('Visitation Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/pawprints`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="paw" /> <span className="nav-label">{this.props.translate('Paw Print Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/cremations`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Cremation Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/urns`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="trash" /> <span className="nav-label">{this.props.translate('Urn Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/burials`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="monument" /> <span className="nav-label">{this.props.translate('Burial Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/completed`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="check" /> <span className="nav-label">{this.props.translate('Completed Orders')}</span></NavLink></DropdownItem> */}
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>

	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="mr-3">
	// 										{this.props.translate('Workflows')}
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										{/* <DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/workflow/list/cremation_prioritization`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Cremation Prioritization')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/workflow/list/ordering_products`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="cart-plus" /> <span className="nav-label">{this.props.translate('Ordering Products')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/workflow/list/engraving`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="pen-alt" /> <span className="nav-label">{this.props.translate('Engraving')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/workflow/list/pawprints`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="paw" /> <span className="nav-label">{this.props.translate('Paw Prints')}</span></NavLink></DropdownItem> */}
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>

	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="mr-3">
	// 										{this.props.translate('Perform')}
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/cremations/perform`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Perform Cremations')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/cremations`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Cremation Logs')}</span></NavLink></DropdownItem>
	// 										{/* <DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/burials`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="monument" /> <span className="nav-label">{this.props.translate('Perform Burials')}</span></NavLink></DropdownItem> */}
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/cremations/list`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="clipboard-list" /> <span className="nav-label">{this.props.translate('Cremations List')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/crematoryLoad`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="truck-loading" /> <span className="nav-label">{this.props.translate('Load Deliveries')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/routes`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="ambulance" /> <span className="nav-label">{this.props.translate('Pickup')} &amp; {this.props.translate('Deliver')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/crematoryUnload`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="dolly" /> <span className="nav-label">{this.props.translate('Unload Pickups')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/delivery_log`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="clipboard-list" /> <span className="nav-label">{this.props.translate('Pickup & Delivery Log')}</span></NavLink></DropdownItem>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>

	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="mr-3">
	// 										{this.props.translate('Invoices')}
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/invoices`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="file-invoice-dollar" /> <span className="nav-label">{this.props.translate('Invoices')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/invoices/forecasting`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="chart-line" /> <span className="nav-label">{this.props.translate('Forecasting')}</span></NavLink></DropdownItem>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>

	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="mr-3">
	// 										{this.props.translate('Admin')}
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/admin_memorials`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="comments" /> <span className="nav-label">{this.props.translate('Admin Memorials')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/testimonials`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="thumbs-up" /> <span className="nav-label">{this.props.translate('Admin Testimonials')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/announcements`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="bullhorn" /> <span className="nav-label">{this.props.translate('Admin Announcements')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/delivery_routes`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="ambulance" /> <span className="nav-label">{this.props.translate('Delivery Routes')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/companies`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="building" /> <span className="nav-label">{this.props.translate('Hospitals')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/products/product_categories`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="sitemap" /> <span className="nav-label">{this.props.translate('Product Categories')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/products/product_materials`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="th-list" /> <span className="nav-label">{this.props.translate('Product Materials')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/products/product_option_values`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="th-list" /> <span className="nav-label">{this.props.translate('Product Option Values')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/products/product_options`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="th-list" /> <span className="nav-label">{this.props.translate('Product Options')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/products`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="boxes" /> <span className="nav-label">{this.props.translate('Products')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} exact to={`/machines`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="inbox" /> <span className="nav-label">{this.props.translate('Machines')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} exact to={`/order_statuses`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="tasks" /> <span className="nav-label">{this.props.translate('Order Statuses')}</span></NavLink></DropdownItem>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>

	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="ml-auto">
	// 										{ `${firstName} ${lastName} ` }
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/my_account`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="user-circle" /> {this.props.translate('My Account')}</NavLink></DropdownItem>
											
	// 										<DropdownItem tag="div"><NavLink to={`/dashboard`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="tachometer-alt" /> <span className="nav-label">{this.props.translate('Dashboard')}</span></NavLink></DropdownItem>
	// 										<div className="text-center"><Logout/></div>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>
	// 							</Nav>
	// 							<div className="float-right"><Link onClick={this.toggleTopNav} to={`/new_orders/create_new/cremation`} className="nav-link btn btn-warning rounded" style={{backgroundColor: '#ec8333', borderColor: '#ec8333'}} active="false"><FontAwesomeIcon icon="paw" className="mr-2" /> {this.props.translate('New Cremation')}</Link></div>
	// 						</Collapse>
	// 					</Navbar>

	// 					{/* CONTENT CONTAINER */}
	// 					<div id="content-container" className="flex-child row-parent" style={{marginTop: 70 + 'px'}}>
	// 						{/* LEFT NAVIGATION */}
	// 						{/* <div id="nav-left" className={this.state.leftNavCollapsed ? "flex-child flex-auto left-nav-collapsed d-none d-lg-flex scrollable-container" : "flex-child flex-auto left-nav-open d-none d-lg-flex scrollable-container"}>
	// 							<div className="">
	// 								<ul className="list-group list-group-flush small">
	// 									<li className="list-group-item">
	// 										<a href="/" color="secondary" id="leftNavToggler" onClick={this.toggleLeftNav} className="nav-link p-0">
	// 											<FontAwesomeIcon icon={this.state.leftNavCollapsed ? "indent" : "outdent"} /> <span className="nav-label">{this.props.translate('Collapse Nav')}</span>
	// 										</a>
	// 									</li>
	// 									<li className="list-group-item"><NavLink to={`/dashboard`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="tachometer-alt" /> <span className="nav-label">{this.props.translate('Dashboard')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/pet_checker`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="search" /> <span className="nav-label">{this.props.translate('Pet Checker')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/order_scan`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="search" /> <span className="nav-label">{this.props.translate('Order Scan')}</span></NavLink></li>

	// 									<li className="list-group-item mb-3"><NavLink to={`/orders/status_updater`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="tasks" /> <span className="nav-label">{this.props.translate('Order Status Updater')}</span></NavLink></li>

	// 									<li className="list-group-item"><NavLink to={`/new_orders`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="cart-plus" /> <span className="nav-label">{this.props.translate('Create an Order')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="shopping-cart" /> <span className="nav-label">{this.props.translate('View Orders')}</span></NavLink></li>
	// 									<li className="list-group-item mb-3"><NavLink to={`/orders/orderQueue/supplies`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="user-md" /> <span className="nav-label">{this.props.translate('Vet Supply Orders')}</span></NavLink></li>

	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/followups`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="bell" /> <span className="nav-label">{this.props.translate('Follow Up Orders')}</span></NavLink></li>
	// 									<li className="list-group-item mb-3"><NavLink to={`/orders/orderQueue/holds`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="hand-paper" /> <span className="nav-label">{this.props.translate('On Hold Orders')}</span></NavLink></li>

	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/crematoryLoad`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="truck-loading" /> <span className="nav-label">{this.props.translate('Load Deliveries')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/routes`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="ambulance" /> <span className="nav-label">{this.props.translate('Pickup')} &amp; {this.props.translate('Deliver')}</span></NavLink></li>
	// 									<li className="list-group-item mb-3"><NavLink to={`/orders/orderQueue/crematoryUnload`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="dolly" /> <span className="nav-label">{this.props.translate('Unload Pickups')}</span></NavLink></li>

	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/products`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="shopping-cart" /> <span className="nav-label">{this.props.translate('Product Orders')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/visitations`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="users" /> <span className="nav-label">{this.props.translate('Visitation Orders')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/pawprints`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="paw" /> <span className="nav-label">{this.props.translate('Paw Print Orders')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/cremations`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Cremation Orders')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/urns`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="trash" /> <span className="nav-label">{this.props.translate('Urn Orders')}</span></NavLink></li>
	// 									<li className="list-group-item mb-3"><NavLink to={`/orders/orderQueue/burials`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="monument" /> <span className="nav-label">{this.props.translate('Burial Orders')}</span></NavLink></li>

	// 									<li className="list-group-item"><NavLink to={`/cremations/perform`} exact className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Perform Cremations')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/cremations`} exact className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Cremation Logs')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/burials`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="monument" /> <span className="nav-label">{this.props.translate('Perform Burials')}</span></NavLink></li>

	// 									<li className="list-group-item mb-3"><NavLink to={`/invoices`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="file-invoice-dollar" /> <span className="nav-label">{this.props.translate('Invoices')}</span></NavLink></li>
	// 								</ul>
	// 							</div>
	// 						</div> */}
	// 						{/* MAIN CONTENT CONTAINER */}
	// 						<div id="main-content-container" className="flex-child column-parent scrollable-container">
	// 							{/*<div id="breadrumb" className="flex-child flex-auto flex-child-header"><Breadcrumbs className="breadcrumb my-0" separator={<span>&nbsp;&gt;&nbsp;</span>} /></div>*/}
	// 							<div id="main-content" className="flex-child row-parent">	{/* MAIN CONTENT COLUMNS */}
	// 								<AppRoutes />
	// 							</div>
	// 						</div>
	// 					</div>
	// 				</div>
	// 			</React.Fragment>
	// 		)
	// 	// CUSTOMER STAFF
	// 	} else if (this.props.Session.isLoggedIn() === true && this.props.Session.User.userTypeId === "3") {
	// 		const {
	// 			firstName,
	// 			lastName
	// 		} =	this.props.Session.User;

	// 		return (
	// 			<React.Fragment>
	// 				<div id="root-bg" style={style}></div>
	// 				<div id="top-container" className="flex-child column-parent">	{/* TOP CONTAINER INSIDE OF ROOT */}
	// 					{/* TOP NAVIGATION */}
	// 					<Navbar color="white" light expand="sm" className="border-bottom fixed-top flex-child flex-auto">
	// 						<NavLink to={`/`} className="navbar-brand" activeClassName="" exact><img src={process.env.PUBLIC_URL + "/images/logos/" + logoImage} alt="Home" style={{maxHeight: 44 + 'px'}} /></NavLink>
	// 						<NavbarToggler onClick={this.toggleTopNav} />

	// 						<Collapse isOpen={this.state.topNavOpen} navbar>
	// 							<Nav className="mr-auto" navbar>
	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="mr-3">
	// 										{this.props.translate('Orders')}
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/pet_checker`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="search" /> <span className="nav-label">{this.props.translate('Pet Checker')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/order_scan`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="search" /> <span className="nav-label">{this.props.translate('Order Scan')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/status_updater`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="tasks" /> <span className="nav-label">{this.props.translate('Order Status Updater')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/new_orders`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="cart-plus" /> <span className="nav-label">{this.props.translate('Create an Order')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="shopping-cart" /> <span className="nav-label">{this.props.translate('View Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/supplies`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="user-md" /> <span className="nav-label">{this.props.translate('Vet Supply Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/followups`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="bell" /> <span className="nav-label">{this.props.translate('Follow Up Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/holds`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="hand-paper" /> <span className="nav-label">{this.props.translate('On Hold Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/products`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="shopping-cart" /> <span className="nav-label">{this.props.translate('Product Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/visitations`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="users" /> <span className="nav-label">{this.props.translate('Visitation Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/pawprints`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="paw" /> <span className="nav-label">{this.props.translate('Paw Print Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/cremations`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Cremation Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/urns`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="trash" /> <span className="nav-label">{this.props.translate('Urn Orders')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/completed`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="check" /> <span className="nav-label">{this.props.translate('Completed Orders')}</span></NavLink></DropdownItem>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>

	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="mr-3">
	// 										{this.props.translate('Perform')}
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} exact to={`/cremations/perform`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Perform Cremations')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} exact to={`/cremations`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Cremation Logs')}</span></NavLink></DropdownItem>
	// 										{/* <DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/burials`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="monument" /> <span className="nav-label">{this.props.translate('Perform Burials')}</span></NavLink></DropdownItem> */}
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/crematoryLoad`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="truck-loading" /> <span className="nav-label">{this.props.translate('Load Deliveries')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/routes`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="ambulance" /> <span className="nav-label">{this.props.translate('Pickup')} &amp; {this.props.translate('Deliver')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/crematoryUnload`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="dolly" /> <span className="nav-label">{this.props.translate('Unload Pickups')}</span></NavLink></DropdownItem>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>

	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="ml-auto">
	// 										{ `${firstName} ${lastName} ` }
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/my_account`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="user-circle" /> {this.props.translate('My Account')}</NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink to={`/dashboard`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="tachometer-alt" /> <span className="nav-label">{this.props.translate('Dashboard')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<div className="text-center"><Logout/></div>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>
	// 							</Nav>

	// 							<div className="float-right"><Link onClick={this.toggleTopNav} to={`/new_orders/create_new/cremation`} className="nav-link btn btn-warning rounded" style={{backgroundColor: '#ec8333', borderColor: '#ec8333'}} active="false"><FontAwesomeIcon icon="paw" className="mr-2" /> {this.props.translate('New Cremation')}</Link></div>
	// 						</Collapse>
	// 					</Navbar>

	// 					{/* CONTENT CONTAINER */}
	// 					<div id="content-container" className="flex-child row-parent" style={{marginTop: 70 + 'px'}}>
	// 						{/* LEFT NAVIGATION */}
	// 						{/* <div id="nav-left" className={this.state.leftNavCollapsed ? "flex-child flex-auto left-nav-collapsed d-none d-lg-flex scrollable-container" : "flex-child flex-auto left-nav-open d-none d-lg-flex scrollable-container"}>
	// 							<div>
	// 								<ul className="list-group list-group-flush">
	// 									<li className="list-group-item">
	// 										<a href="/" color="secondary" id="leftNavToggler" onClick={this.toggleLeftNav} className="nav-link p-0">
	// 											<FontAwesomeIcon icon={this.state.leftNavCollapsed ? "indent" : "outdent"} /> <span className="nav-label">{this.props.translate('Collapse Nav')}</span>
	// 										</a>
	// 									</li>
	// 									<li className="list-group-item"><NavLink to={`/dashboard`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="tachometer-alt" /> <span className="nav-label">{this.props.translate('Dashboard')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/pet_checker`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="search" /> <span className="nav-label">{this.props.translate('Pet Checker')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/order_scan`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="search" /> <span className="nav-label">{this.props.translate('Order Scan')}</span></NavLink></li>
	// 									<li className="list-group-item mb-3"><NavLink to={`/orders/status_updater`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="tasks" /> <span className="nav-label">{this.props.translate('Order Status Updater')}</span></NavLink></li>

	// 									<li className="list-group-item"><NavLink to={`/new_orders`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="cart-plus" /> <span className="nav-label">{this.props.translate('Create an Order')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="shopping-cart" /> <span className="nav-label">{this.props.translate('View Orders')}</span></NavLink></li>
	// 									<li className="list-group-item mb-3"><NavLink to={`/orders/orderQueue/supplies`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="user-md" /> <span className="nav-label">{this.props.translate('Vet Supply Orders')}</span></NavLink></li>

	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/followups`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="bell" /> <span className="nav-label">{this.props.translate('Follow Up Orders')}</span></NavLink></li>
	// 									<li className="list-group-item mb-3"><NavLink to={`/orders/orderQueue/holds`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="hand-paper" /> <span className="nav-label">{this.props.translate('On Hold Orders')}</span></NavLink></li>

	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/crematoryLoad`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="truck-loading" /> <span className="nav-label">{this.props.translate('Load Deliveries')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/crematoryUnload`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="dolly" /> <span className="nav-label">{this.props.translate('Unload Pickups')}</span></NavLink></li>
	// 									<li className="list-group-item mb-3"><NavLink to={`/orders/orderQueue/routes`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="ambulance" /> <span className="nav-label">{this.props.translate('Pickup')} &amp; {this.props.translate('Deliver')}</span></NavLink></li>

	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/products`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="shopping-cart" /> <span className="nav-label">{this.props.translate('Product Orders')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/visitations`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="users" /> <span className="nav-label">{this.props.translate('Visitation Orders')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/pawprints`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="paw" /> <span className="nav-label">{this.props.translate('Paw Print Orders')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/cremations`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Cremation Orders')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/orders/orderQueue/urns`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="trash" /> <span className="nav-label">{this.props.translate('Urn Orders')}</span></NavLink></li>

	// 									<li className="list-group-item"><NavLink to={`/cremations/perform`} exact className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Perform Cremations')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/cremations`} exact className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="fire" /> <span className="nav-label">{this.props.translate('Cremation Logs')}</span></NavLink></li>
	// 									<li className="list-group-item"><NavLink to={`/burials`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="monument" /> <span className="nav-label">{this.props.translate('Perform Burials')}</span></NavLink></li>

	// 									<li className="list-group-item mb-3"><NavLink to={`/invoices`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="file-invoice-dollar" /> <span className="nav-label">{this.props.translate('Invoices')}</span></NavLink></li>
	// 								</ul>
	// 							</div>
	// 						</div> */}
	// 						{/* MAIN CONTENT CONTAINER */}
	// 						<div id="main-content-container" className="flex-child column-parent scrollable-container">
	// 							{/*<div id="breadrumb" className="flex-child flex-auto flex-child-header"><Breadcrumbs className="breadcrumb my-0" separator={<span>&nbsp;&gt;&nbsp;</span>} /></div>*/}
	// 							<div id="main-content" className="flex-child row-parent">	{/* MAIN CONTENT COLUMNS */}
	// 								<AppRoutes />
	// 							</div>
	// 						</div>
	// 					</div>
	// 				</div>
	// 			</React.Fragment>
	// 		)
	// // ATHLETE
	// } else if (this.props.Session.isLoggedIn() === true && this.props.Session.User.userTypeId === "4") {
	// 		const {
	// 			firstName,
	// 			lastName
	// 		} =	this.props.Session.User;

	// 			// let style = {};
	// 			// style.backgroundImage = `url(/images/ui/loyalpaws_background1.jpg)`;
	// 			// style.backgroundSize = 'cover';
	// 			// style.backgroundPosition = 'center center';
	// 			// style.backgroundRepeat = 'no-repeat';

	// 		return (
	// 			<React.Fragment>
	// 				<div id="root-bg" ></div>
	// 				<div id="top-container" className="flex-child column-parent">	{/* TOP CONTAINER INSIDE OF ROOT */}
	// 					{/* TOP NAVIGATION */}
	// 					<Navbar color="white" light expand="sm" className="border-bottom fixed-top flex-child flex-auto">
	// 						<NavLink to={`/`} className="navbar-brand" activeClassName="" exact><img src={process.env.PUBLIC_URL + "/images/logos/" + logoImage} alt="Home" style={{maxHeight: 44 + 'px'}} /></NavLink>
	// 						<NavbarToggler onClick={this.toggleTopNav} />

	// 						<Collapse isOpen={this.state.topNavOpen} navbar>
	// 							<Nav className="mr-auto" navbar>
	// 								{/* <UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="mr-3">
	// 										{this.props.translate('Create an Order')}
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										<DropdownItem tag="div" className="pl-3"><NavLink onClick={this.toggleTopNav} to={`/new_orders/new_order_type/cremation`} className="nav-link p-0" activeClassName="active"><span className="nav-label">{this.props.translate('New Cremation')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div" className="pl-3"><NavLink onClick={this.toggleTopNav} to={`/new_orders/supplies`} className="nav-link p-0" exact activeClassName="active"><span className="nav-label">{this.props.translate('Supplies')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<DropdownItem tag="div" className="pl-3"><NavLink onClick={this.toggleTopNav} to={`/new_orders/new_order_type/products`} className="nav-link p-0" activeClassName="active"><span className="nav-label">{this.props.translate('Product Only')}</span></NavLink></DropdownItem>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown> */}

	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="mr-3">
	// 										{this.props.translate('Orders')}
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/new_orders`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="cart-plus" /> <span className="nav-label">{this.props.translate('Create an Order')}</span></NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders`} className="nav-link p-0" exact activeClassName="active"><FontAwesomeIcon icon="shopping-cart" /> <span className="nav-label">{this.props.translate('View Orders')}</span></NavLink></DropdownItem>
	// 										{/* <DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/supplies`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="user-md" /> <span className="nav-label">{this.props.translate('Vet Supply Orders')}</span></NavLink></DropdownItem> */}
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/holds`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="hand-paper" /> <span className="nav-label">{this.props.translate('On Hold Orders')}</span></NavLink></DropdownItem>
	// 										{/* <DropdownItem divider />
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/delivery_log`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="clipboard-list" /> <span className="nav-label">{this.props.translate('Pickup & Delivery Log')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider /> */}
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/orders/orderQueue/completed`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="check" /> <span className="nav-label">{this.props.translate('Completed Orders')}</span></NavLink></DropdownItem>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>

	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="mr-3">
	// 										{this.props.translate('Invoices')}
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/invoices`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="file-invoice-dollar" /> <span className="nav-label">{this.props.translate('Invoices')}</span></NavLink></DropdownItem>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>
									
	// 								<UncontrolledDropdown nav inNavbar setActiveFromChild>
	// 									<DropdownToggle caret className="ml-auto">
	// 										{ `${firstName} ${lastName} ` }
	// 									</DropdownToggle>
	// 									<DropdownMenu className="bg-white">
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/my_account`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="user-circle" /> {this.props.translate('My Account')}</NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink onClick={this.toggleTopNav} to={`/my_hospital`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="building" /> {this.props.translate('My Hospital')}</NavLink></DropdownItem>
	// 										<DropdownItem tag="div"><NavLink to={`/dashboard`} className="nav-link p-0" activeClassName="active"><FontAwesomeIcon icon="tachometer-alt" /> <span className="nav-label">{this.props.translate('Dashboard')}</span></NavLink></DropdownItem>
	// 										<DropdownItem divider />
	// 										<div className="text-center"><Logout/></div>
	// 									</DropdownMenu>
	// 								</UncontrolledDropdown>
	// 							</Nav>

	// 							<div className="float-right"><Link onClick={this.toggleTopNav} to={`/new_orders/create_new/cremation`} className="nav-link btn btn-warning rounded" style={{backgroundColor: '#ec8333', borderColor: '#ec8333'}} active="false"><FontAwesomeIcon icon="paw" className="mr-2" /> {this.props.translate('New Cremation')}</Link></div>
	// 						</Collapse>
	// 					</Navbar>

	// 					{/* CONTENT CONTAINER */}
	// 					<div id="content-container" className="flex-child row-parent" style={{marginTop: 70 + 'px'}}>
	// 						{/* LEFT NAVIGATION */}
	// 						{/* <div id="nav-left" className={this.state.leftNavCollapsed ? "flex-child flex-auto left-nav-collapsed d-none d-lg-flex scrollable-container" : "flex-child flex-auto left-nav-open d-none d-lg-flex scrollable-container"}>
	// 							<div>
	// 								<ul className="list-group list-group-flush">
	// 									<li className="">
	// 										<a href="/" color="secondary" id="leftNavToggler" onClick={this.toggleLeftNav} className="nav-link border-bottom">
	// 											<FontAwesomeIcon icon={this.state.leftNavCollapsed ? "indent" : "outdent"} /> <span className="nav-label">{this.props.translate('Collapse Nav')}</span>
	// 										</a>
	// 									</li>
	// 									<li className=""><NavLink to={`/dashboard`} className="nav-link border-bottom" activeClassName="active"><FontAwesomeIcon icon="tachometer-alt" /> <span className="nav-label">{this.props.translate('Dashboard')}</span></NavLink></li>
	// 									<li className=""><NavLink to={`/new_orders`} className="nav-link border-bottom" activeClassName="active"><FontAwesomeIcon icon="cart-plus" /> <span className="nav-label">{this.props.translate('New Orders')}</span></NavLink></li>
	// 									<li className=""><NavLink to={`/orders`} className="nav-link border-bottom" exact activeClassName="active"><FontAwesomeIcon icon="shopping-cart" /> <span className="nav-label">{this.props.translate('View Orders')}</span></NavLink></li>
	// 									<li className=""><NavLink to={`/orders/orderQueue/supplies`} className="nav-link border-bottom" activeClassName="active"><FontAwesomeIcon icon="user-md" /> <span className="nav-label">{this.props.translate('Vet Supply Orders')}</span></NavLink></li>
	// 									<li className="mb-3"><NavLink to={`/orders/orderQueue/holds`} className="nav-link border-bottom" activeClassName="active"><FontAwesomeIcon icon="hand-paper" /> <span className="nav-label">{this.props.translate('On Hold Orders')}</span></NavLink></li>
										
	// 									<li className=""><NavLink to={`/delivery_log`} className="nav-link border-bottom" activeClassName="active"><FontAwesomeIcon icon="clipboard-list" /> <span className="nav-label">{this.props.translate('Pickup & Delivery Log')}</span></NavLink></li>
	// 									<li className="mb-3"><NavLink to={`/orders/orderQueue/completed`} className="nav-link border-bottom" activeClassName="active"><FontAwesomeIcon icon="check" /> <span className="nav-label">{this.props.translate('Completed Orders')}</span></NavLink></li>

	// 									<li className=""><NavLink to={`/invoices`} className="nav-link border-bottom" activeClassName="active"><FontAwesomeIcon icon="file-invoice-dollar" /> <span className="nav-label">{this.props.translate('Invoices')}</span></NavLink></li>
	// 								</ul>
	// 							</div>
	// 						</div> */}
	// 						{/* MAIN CONTENT CONTAINER */}
	// 						<div id="main-content-container" className="flex-child column-parent scrollable-container">
	// 							{/*<div id="breadrumb" className="flex-child flex-auto flex-child-header"><Breadcrumbs className="breadcrumb my-0" separator={<span>&nbsp;&gt;&nbsp;</span>} /></div>*/}
	// 							<div id="main-content" className="flex-child row-parent">	{/* MAIN CONTENT COLUMNS */}
	// 								<AppRoutes />
	// 							</div>
	// 						</div>
	// 					</div>
	// 				</div>
	// 			</React.Fragment>
	// 		)
	// 	} else {
	// 		return (
	// 			<React.Fragment>
	// 				<h1>Logged In User</h1>
	// 			</React.Fragment>
	// 		)
	// 	}
	}
}

// // HELPER FUNCTION - RENDER THE MAIN DETAILS COLUMN
// function DetailColumn(props) {
// 	return (
// 		<React.Fragment>
// 			<div id="detail-column" className="flex-child column-parent">		{/* DETAIL COLUMN CONTAINER */}
// 				<div id="detail-column-secondary" className="flex-child column-parent p-3">		{/* SECONDARY DETAIL COLUMN CONTAINER */}
// 					<div>{props.children}</div>
// 				</div>
// 			</div>
// 		</React.Fragment>
// 	)
// }

// // HELPER FUNCTION - RENDER THE SIDEBAR COLUMN
// function SidebarColumn(props) {
// 	return (
// 		<React.Fragment>
// 			<div className="flex-child column-parent">		{/* SIDEBAR COLUMN CONTAINER */}
// 				<div className="flex-child column-parent p-3">		{/* SECONDARY SIDEBAR COLUMN CONTAINER */}
// 					<div>{props.children}</div>
// 				</div>
// 			</div>
// 		</React.Fragment>
// 	)
// }

// const ApplicationLayout = withSession(ApplicationLayoutComponent);
const ApplicationLayout = ApplicationLayoutComponent;

// export { ApplicationLayout, DetailColumn, SidebarColumn }
export {ApplicationLayout}
