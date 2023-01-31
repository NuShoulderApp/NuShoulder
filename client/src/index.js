import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
//import App from './App.js';
import _ from 'lodash';
import logo from './logo.svg';
import './App.css';
// import gql from 'apollo-boost';
import reportWebVitals from './reportWebVitals.js';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    HttpLink,
    from
} from "@apollo/client";
import { BrowserRouter } from 'react-router-dom';
import { ApplicationLayout } from "./layouts/application.js";

// Include bootstrap 5
import 'bootstrap/dist/css/bootstrap.min.css';

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
    "ScoreCategories": "score_category_ID",
    "ScoreMetrics": "score_metric_ID",
    "ScoreSources": "score_source_ID",
	"Users": "user_ID"
}

// NS ToDo: Will have to add this for cacheing
// const cache = new InMemoryCache({
// 	dataIdFromObject: (object) => {
// 		// If the id_type_map has a record for the particular type then lookup the value in the object based on the field name in the map.
// 		if(id_type_map.hasOwnProperty(object.__typename)) {
// 			return object.__typename + '_' + object[id_type_map[object.__typename]];
// 		} else {
// 			return defaultDataIdFromObject(object);
// 		}
// 	}
// });

const client = new ApolloClient({
  uri: 'http://localhost:4000', // uri specifies the location of our GraphQL Server
  cache: new InMemoryCache(),
});


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ApolloProvider client={client}>
    <BrowserRouter>
        <ApplicationLayout />
    </BrowserRouter>
  </ApolloProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
