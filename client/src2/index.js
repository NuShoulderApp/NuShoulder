// react scripts imports vars with REACT_APP_ prefix from the .env in the root directory to the process.env object
import React from "react";
import { render } from "react-dom";

import ApolloClient from "apollo-client";
import { createUploadLink } from 'apollo-upload-client';
import { ApolloProvider } from "react-apollo";
import { ApplicationLayout } from "./layouts/application";
import { BrowserRouter } from "react-router-dom";
import { InMemoryCache, defaultDataIdFromObject } from 'apollo-cache-inmemory';
import { fetch } from 'isomorphic-unfetch';
import { split } from 'apollo-link';
import { setContext } from 'apollo-link-context';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
//import registerServiceWorker from './registerServiceWorker';
import { unregister } from './registerServiceWorker';

import { SessionQuery } from "./auth/auth_graphql";
import { IWDLocalizeProvider } from "./translations/IWDTranslation";

import _ from "lodash";

// INCLUDE POPPER JS for tooltips
// import 'popper.js';

// INCLUDE BOOTSTRAP 4
import 'bootstrap/dist/css/bootstrap.min.css';

// IWD CREATED CSS & COMPONENTS
import "./css/app.css";

// Use polyfill for IE 11.
import 'babel-polyfill';

// INCLUDE FONTASWESOME 5 - must specify icons to use here - ADD imported FA ICONS to library
import { library } from '@fortawesome/fontawesome-svg-core';
import * as icons from "@fortawesome/free-solid-svg-icons";

// Single list of icons to add to the library.  Will split on whitespace before adding to the library.
const iconList = `
	faAmbulance
	faAlignCenter
	faAngleLeft
	faAngleRight
	faArchive
	faArrowsAltV
	faArrowDown
	faArrowRight
	faBan
	faBarcode
	faBars
	faBell
	faBox
	faBoxOpen
	faBoxes
	faBuilding
	faBullhorn
	faCalendarAlt
	faCaretDown
	faCaretRight
	faCartPlus
	faChartBar
	faChartLine
	faChartPie
	faCheck
	faCheckCircle
	faChevronDown
	faChevronRight
	faCircle
	faClipboardList
	faClock
	faCogs
	faComment
	faComments
	faCreditCard
	faCut
	faDog
	faDollarSign
	faDolly
	faExclamation
	faExclamationCircle
	faExclamationTriangle
	faEye
	faEyeSlash
	faFile
	faFileExcel
	faFileImage
	faFileInvoiceDollar
	faFilePdf
	faFileWord
	faFire
	faFireAlt
	faGrinBeam
	faGripVertical
	faHandPaper
	faHandSparkles
	faHome
	faHospital
	faInbox
	faIndent
	faInfoCircle
	faList
	faLock
	faMagic
	faMapMarkerAlt
	faMinus
	faMonument
	faOutdent
	faPaperPlane
	faPaw
	faPen
	faPenAlt
	faPenSquare
	faPencilSquareo
	faPenSquareo
	faPhone
	faPlus
	faPrint
	faReply
	faSearch
	faShoppingCart
	faShuttleVan
	faSitemap
	faSort
	faSortDown
	faSortUp
	faSpinner
	faSquare
	faTachometerAlt
	faTag
	faTasks
	faThList
	faThumbsUp
	faTimes
	faTrash
	faTrashAlt
	faTruck
	faTruckLoading
	faTruckMoving
	faUndo
	faUnlock
	faUpload
	faUserCircle
	faUserMd
	faUsers
	faUserSecret
	faWalking
	faWarehouse
`.trim().split(/\s+|,/g);

// Add the requested icons to the list.
library.add( _.pick(icons, iconList) );

// APOLLO CACHE - Mapping the primary keys from the db to an id field in the Apollo Cache for each GraphQL Type
const id_type_map = {
	"Account": "accountId",
	"AccountSetting": "accountSettingId",
	"AddressType": "addressTypeId",
	"Announcement": "announcementId",
	"Burial": "burialId",
	"BurialLog": "burialLogId",
	"Company": "companyId",
	"CompanyAddress": "companyAddressId",
	"CompanyPhone": "companyPhoneId",
	"CompanyType": "companyTypeId",
	"CreditCard": "creditCardId",
	"CreditCardCharge": "creditCardChargeId",
	"Cremation": "cremationId",
	"CremationLog": "cremationLogId",
	"Invoice": "invoiceId",
	"InvoiceItem": "invoiceItemId",
	"Language": "languageId",
	"Module": "moduleId",
	"Order": "orderId",
	"OrderHold": "orderHoldId",
	"OrderProduct": "orderProductId",
	"OrderProductProductOption": "orderProductProductOptionId",
	"OrderServiceStatus": "orderServiceStatusId",
	"OrderStatus": "orderStatusId",
	"Pet": "petId",
	"Permission": "permissionId",
	"PhoneType": "phoneTypeId",
	"Product": "productId",
	"ProductImage": "productImageId",
	"ProductCategory": "productCategoryId",
	"ProductCompanyPrice": "productCompanyPriceId",
	"ProductCompanyPromotion": "productCompanyPromotionId",
	"ProductGroup": "productGroupId",
	"ProductMemorialization": "productId",
	"ProductMaterial": "productMaterialId",
	"ProductOption": "productOptionId",
	"ProductOptionValue": "productOptionValueId",
	"ProductAccountWeightTierPrice": "productPriceWeightId",
	"ProductType": "productTypeId",
	"ProductVariationType": "productVariationTypeId",
	"ProductVariationValue": "productVariationValueId",
	"Route": "routeId",
	"Session": "sessionId",
	"Signature" : "signatureId",
	"AccountSettings": "settingId",
	"Testimonial": "testimonialId",
	"TestimonialStatus": "testimonialStatusId",
	"Translation": "translationId",
	"User": "userId",
	"UserAddress": "userAddressId",
	"UserEmail": "userEmailId",
	"UserLogin": "userLoginId",
	"UserPhone": "userPhoneId"
}

const cache = new InMemoryCache({
	dataIdFromObject: (object) => {
		// If the id_type_map has a record for the particular type then lookup the value in the object based on the field name in the map.
		if(id_type_map.hasOwnProperty(object.__typename)) {
			return object.__typename + '_' + object[id_type_map[object.__typename]];
		} else {
			return defaultDataIdFromObject(object);
		}
	}
});

// Get the hostname and protocol for the page that was hit.
const { hostname, protocol } = window.location;
// not sure if this is necessary
const websocketProtocol = (protocol === 'https:' ? 'wss:' : 'ws:');

var endPointPort;
if (process.env.REACT_APP_GRAPHQL_ENDPOINT_PORT){
	endPointPort = (process.env.REACT_APP_GRAPHQL_ENDPOINT_PORT !== '80' ? `:${process.env.REACT_APP_GRAPHQL_ENDPOINT_PORT}` : '');
}else{
	endPointPort = "";
}

// APOLLO LINK to the GraphQL Server to resolve queries remotely
const uploadLink = createUploadLink({
	uri: `${protocol}//${hostname}${endPointPort}/graphql`,
	credentials: 'include'
});

// APOLLO LINK - handles transmision and storage of SESSION token - will be combined with the main GraphQL link
const authLink = setContext((req, { headers }) => {

	// If we see __typename in an object called input inside of the variables, remove it.
	if(req.hasOwnProperty("variables") && req.variables.hasOwnProperty("input") && req.variables.input.hasOwnProperty("__typename")) {
		delete req.variables.input.__typename;
	}
});

// setup websocket link for GQL subscriptions
// more options + detailed descriptions can be found at https://github.com/apollographql/subscriptions-transport-ws
const wsLink = new WebSocketLink({
	uri: `${websocketProtocol}//${hostname}${endPointPort}/graphql/subscriptions`,
	options: {
		//reconnectionAttempts: 10,
		reconnect: true,
		// this should be an object (or a function/Promise that resolves to one), and will be received by server's onConnect
		// TODO: This is likely how we will do authentication
		connectionParams: {},
		lazy: true, // only connect when subscription is created.
		inactivityTimeout: 5000 // disconnect from the server when there are no active subscriptions for at least {inactivityTimeout} ms
	}
});

// split the link to Apollo - use websocket link for subscriptions, http link for other actions
const dataLink = split(
	({query}) => {
		const { kind, operation } = getMainDefinition(query);
		return kind === 'OperationDefinition' && operation === 'subscription';
	},
	wsLink, // if true
	uploadLink // if false
)

// Create ApolloClient to use in App
const client = new ApolloClient({ cache, link: authLink.concat(dataLink) });

// Function to reset the cache (store) and load the session object.
async function initCache() {
	// Reset the apollo cache.
	await client.resetStore();

	// Now that the store is seset, query for the session object.
	return client.query({ query: SessionQuery });
}

// MAIN APP
const App = () => (
	<ApolloProvider client={client}>
		<IWDLocalizeProvider>
			<BrowserRouter>
				<ApplicationLayout />
			</BrowserRouter>
		</IWDLocalizeProvider>
	</ApolloProvider>
);

// Load the session query immediately and then render the main app and register the worker.
initCache().then((result) => {
	render(<App />, document.getElementById("root"))
	//registerServiceWorker();
	unregister();
});

export {
	fetch,
	initCache
};
