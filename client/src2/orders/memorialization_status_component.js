// import _ from "lodash";
import { compose } from "react-apollo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';	// IMPORTANT: Add any icons you want to use to the index.js import { ... } from '@fortawesome/free-solid-svg-icons' AND library.add(...)
// import Math from 'mathjs';
import moment from 'moment';
import { queryWithLoading } from '../utilities/IWDDb';
import React from 'react';
// import TimeAgo from 'react-timeago';
import { Translate, withTranslate } from '../translations/IWDTranslation';

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component

// GRAPHQL QUERY
import {
  getOrderStatusLogsQuery,
} from './orders_graphql';


// This is the detail view of a single image that can be added to the basket.
const MemorializationStatusContent = (props) => {
  const {
    Account: {
      accountName: crematoryAccountName
    },
    data: {
      Order: {
        companyNameLegal,
        companyType,
        deliveryMethodProductId,
        orderServiceStatusId,
        orderStatusId,
        petFirstName,
        petReferenceNumber,
        ProductsOrder
      }
    }
  } = props;

  // Determine if this is a Private(27) or Communal(26) Order. 
  const cremationProductIndex = ProductsOrder.findIndex((product) => parseInt(product.productTypeId) === 2);
  let cremationProductId = cremationProductIndex > -1 ? parseInt(ProductsOrder[cremationProductIndex].productId) : 0;

  // Filter the products on this order down to only Memorialization products, No delivery categories.
  const ProductsMemorialization = ProductsOrder.filter((product) => parseInt(product.productTypeId) === 3 && parseInt(product.productCategoryId) !== 12);

  // Determine if there will be any products that need to be returned. 
  let returnProducts = ProductsMemorialization.length === 0 ? false : true;

  let style = {};
  // style.backgroundImage = `url(/images/ui/loyalpaws_background6.png)`;
  // style.backgroundSize = 'cover';
  // style.backgroundPosition = 'center center';
  // style.backgroundRepeat = 'no-repeat';
  // style.height = '1000px';
  // style.paddingTop = '350px';
  // style.marginTop = '-350px';

  // Window widths used for determining which classes to use for container display
  let maxImageWidth = window.innerWidth - 40;
  let width = window.innerWidth;
  let mediumWidth = 768;

  let styleCompleted = { backgroundColor: '#ec8333' };

  // LOGIC FOR DETERMINING WHERE THE PET IS LOCATED - BASED ON THE ORDERSTATUSID
    let statusId = parseInt(orderStatusId);
    let serviceStatusId = parseInt(orderServiceStatusId);

    // Use statusId to know where the pet is. Also set previous locations as true so their alerts show as completed.
    let communalCompleted = statusId === 3 ? true : false;
    let courierCompleted = statusId === 15 ? true : false;
    let atCrematoryCompleted = statusId === 16 ? true : false;
    let atVetCompleted = statusId === 10 || statusId === 4 ? true : false;
    let crematoryToVet = statusId === 8 || atVetCompleted || atCrematoryCompleted || courierCompleted ? true : false;
    let atCrematory = statusId === 5 || statusId === 2 || statusId === 9 || statusId === 11 || crematoryToVet || communalCompleted ? true : false;
    let vetToCrematory = statusId === 7 || atCrematory ? true : false;
    let atVet = statusId === 1 || statusId === 13 || vetToCrematory ? true : false;

    // Is this pet's memorialization completed and ready?
    let memorializationReady = courierCompleted || atCrematoryCompleted || atVetCompleted;
    let memorializationReadyStyle = memorializationReady ? {color: '#ec8333'} : {};

    // At Vet's Office - 1 = Awaiting pickup from hospital, 13 = Scanned for pickup - at hospital
    let atVetArrowColor = atVet ? 'orange' : 'gray';
    let atVetAlertClass = atVet ? 'warning' : 'secondary';
    let atVetStyle = atVet ? styleCompleted : {};
    let atVetTextColor = atVet ? 'text-white' : '';

    // In Transit - Vet To Crematory - 7 = En route to crematory
    let vetToCrematoryArrowColor = vetToCrematory ? 'orange' : 'gray';
    let vetToCrematoryBorderColor = vetToCrematory ? '' : 'border-secondary';
    let vetToCrematoryAlertClass = vetToCrematory ? 'warning' : 'secondary';
    let vetToCrematoryStyle = vetToCrematory ? styleCompleted : {};
    let vetToCrematoryTextColor = vetToCrematory ? 'text-white' : '';

    // At Crematory - performing memorialization, NOT ready for pickup - 5 = At Crematory, 2 = Preparing Order, 9 = Preparation completed, awaiting delivery, 11 = Scanned for delivery - at crematory
    let atCrematoryArrowColor = crematoryToVet ? 'orange' : 'gray';
    let atCrematoryBorderColor = atCrematory ? '' : 'border-secondary';
    let atCrematoryAlertClass = atCrematory ? 'warning' : 'secondary';
    let atCrematoryStyle = atCrematory ? styleCompleted : {};
    let atCrematoryTextColor = atCrematory ? 'text-white' : '';

    // In Transit - Crematory To Vet - 8 = Departed from crematory
    let crematoryToVetArrowColor = crematoryToVet ? 'orange' : 'gray';
    let crematoryToVetBorderColor = crematoryToVet ? '' : 'border-secondary';
    let crematoryToVetAlertClass = crematoryToVet ? 'warning' : 'secondary';
    let crematoryToVetStyle = crematoryToVet ? styleCompleted : {};
    let crematoryToVetTextColor = crematoryToVet ? 'text-white' : '';

    // At Vet - Completed and Ready for Pickup - 10 = Scanned for delivery - at hospital, 4 = Completed (Delivered)
    let atVetCompletedBorderColor = atVetCompleted ? '' : 'border-secondary';
    let atVetCompletedAlertClass = atVetCompleted ? 'warning' : 'secondary';
    let atVetCompletedStyle = atVetCompleted ? styleCompleted : {};
    let atVetCompletedTextColor = atVetCompleted ? 'text-white' : '';

    // At Crematory - Completed Ready for Pickup - 16 = Completed (Picked up)
    let atCrematoryCompletedBorderColor = atCrematoryCompleted ? '' : 'border-secondary';
    let atCrematoryCompletedAlertClass = atCrematoryCompleted ? 'warning' : 'secondary';
    let atCrematoryCompletedStyle = atCrematoryCompleted ? styleCompleted : {};
    let atCrematoryCompletedTextColor = atCrematoryCompleted ? 'text-white' : '';

    // Courier Delivery - Completed and Sent via courier - 15 = Completed (Couriered)
    let courierCompletedBorderColor = courierCompleted ? '' : 'border-secondary';
    let courierCompletedAlertClass = courierCompleted ? 'warning' : 'secondary';
    let courierCompletedStyle = courierCompleted ? styleCompleted : {};
    let courierCompletedTextColor = courierCompleted ? 'text-white' : '';

    // Communal Cremation Completed - 3 = Completed (Communal)
    // let communalCompletedArrowColor = communalCompleted ? 'orange' : 'gray';
    let communalCompletedBorderColor = communalCompleted ? '' : 'border-secondary';
    let communalCompletedAlertClass = communalCompleted ? 'warning' : 'secondary';
    let communalCompletedStyle = communalCompleted ? styleCompleted : {};
    let communalCompletedTextColor = communalCompleted ? 'text-white' : '';


  // END PET LOCATION LOGIC

  // Once Communal has been completed, or Private with no products returned has been Cremated.
  let ashesScatteredText = (communalCompleted && cremationProductId === 26) || (returnProducts === false && serviceStatusId === 1) ? "Scattered In Memorial Garden Completed" : "Scattered In Memorial Garden";

  let mainContainerClass = width >= mediumWidth ? 'w-75' : 'mr-3 ml-3';

  return (
    <div className="w-100 bg-light" style={style}>
    <div className="row mr-0 ml-0 w-100 justify-content-center">
    <div className={mainContainerClass}>
      <div className="row mr-0 ml-0 text-justify justify-content-center">
        <div className="col-12 p-0">
          <div className="text-center pb-2">
						<p><img src={process.env.PUBLIC_URL + "/images/logos/lp_transparent.png"} className="pt-5 w-100" alt="Loyal Paws" style={{ maxWidth: 500+'px'}}/></p>
					</div>
        </div>
      </div>
      <div className="row mr-0 ml-0 mb-3 text-center justify-content-center">
        <div className="card w-100 rounded text-center border-secondary mb-3">
          <div className="card-header h4 pt-4 pb-3 text-secondary border-secondary bg-white">
            Memorialization Service and Products
          </div>
          <div className="card-body rounded bg-white text-justify">
            <div className="mb-4">
              View the status and progress of {petFirstName}'s Memorialization below. The first area below shows where your beloved pet is currently, and when Memorialization has been fully completed. 
              The next areas below will show the progess of {petFirstName}'s Memorialization products, such as urns, paw prints, or keepsakes. Refresh this page for up to the minute updates.
            </div>
          </div>
        </div>        
        <div className="card w-100 rounded text-center border-secondary">
          <div className="card-header h4 pt-4 pb-3 text-secondary border-secondary bg-white">
            <div className="col-12" style={memorializationReadyStyle}>
              {
                !memorializationReady && 
                <React.Fragment>
                  <div className="mb-2">
                    <Translate id="Pet Memorialization Location" data={{petFirstName:petFirstName}}/>
                  </div>
                  <div className="h6 mb-0">
                    {moment().format('MMM D h:mm a')}
                  </div>
                  <div>
                    <a href={`/memorialization/status/${petReferenceNumber}`} className="btn btn-addon text-white rounded mt-1"  style={{backgroundColor: '#ec8333'}} type="submit"><FontAwesomeIcon icon="paw" />Refresh Page</a>
                  
                  </div>
                </React.Fragment>
              }
              {memorializationReady && <Translate id="Pet Memorialization Ready" data={{petFirstName:petFirstName}}/>}
            </div>
          </div>
          <div className="card-body rounded bg-white">
            {/* May add an icon / status bar for Waiting For Pet in the future - very unlikely that someone would check this page though before they dropoff pet */}
            {
              companyType === 'Crematory' &&
              <React.Fragment>
                {/* AT CREMATORY */}
                <div className={`mb-1 col-12 h5 alert alert-${atCrematoryAlertClass} ${atCrematoryTextColor} ${atCrematoryBorderColor}`} style={atCrematoryStyle}><span className="p-2">{crematoryAccountName}</span></div>
                <div><FontAwesomeIcon icon="arrow-down" color={atCrematoryArrowColor} /></div>

                {/* PICKUP AT CREMATORY */}
                {
                  parseInt(deliveryMethodProductId) === 29 &&
                  <React.Fragment>
                    <div className={`mb-1 col-12 h5 alert alert-${atCrematoryCompletedAlertClass} ${atCrematoryCompletedTextColor} ${atCrematoryCompletedBorderColor}`} style={atCrematoryCompletedStyle}><span className="p-2"><Translate id="Ready For Pickup At" /> {crematoryAccountName}</span></div>
                  </React.Fragment>
                }

                {/* MAIL TO OWNER */}
                {
                  parseInt(deliveryMethodProductId) === 30 &&
                  <React.Fragment>
                    <div className={`mb-1 col-12 h5 alert alert-${courierCompletedAlertClass} ${courierCompletedTextColor} ${courierCompletedBorderColor}`} style={courierCompletedStyle}><span className="p-2"><Translate id="Delivery - On The Way" /></span></div>
                  </React.Fragment>
                }
              </React.Fragment>
            }
            {
              companyType === 'Vet' &&
              <React.Fragment>
                {/* AT VET'S OFFICE */}
                <div className={`mb-1 col-12 h5 alert alert-${atVetAlertClass} ${atVetTextColor}`} style={atVetStyle}>{companyNameLegal}</div>
                <div><FontAwesomeIcon icon="arrow-down" color={atVetArrowColor} /></div>

                {/* IN TRANSIT FROM VET TO CREMATORY */}
                <div className={`mb-1 col-12 h5 alert alert-${vetToCrematoryAlertClass} ${vetToCrematoryTextColor} ${vetToCrematoryBorderColor}`} style={vetToCrematoryStyle}><span className="p-2"><Translate id="In Transit" /></span></div>
                <div><FontAwesomeIcon icon="arrow-down" color={vetToCrematoryArrowColor} /></div>

                {/* AT CREMATORY */}
                <div className={`mb-1 col-12 h5 alert alert-${atCrematoryAlertClass} ${atCrematoryTextColor} ${atCrematoryBorderColor}`} style={atCrematoryStyle}><span className="p-2">{crematoryAccountName}</span></div>
                <div><FontAwesomeIcon icon="arrow-down" color={atCrematoryArrowColor} /></div>

                {/* NO PRODUCTS RETURNED OR COMMUNAL CREMATION */}
                {
                  (returnProducts === false || cremationProductId === 26)&&
                  <React.Fragment>
                    <div className={`mb-1 col-12 h5 alert alert-${communalCompletedAlertClass} ${communalCompletedTextColor} ${communalCompletedBorderColor}`} style={communalCompletedStyle}><span className="p-2"><Translate id={ashesScatteredText} data={{petFirstName:petFirstName}}/></span></div>
                  </React.Fragment>
                }


                {/* PICKUP AT VET'S OFFICE */}
                {
                  parseInt(deliveryMethodProductId) === 28 &&
                  <React.Fragment>
                    <div className={`mb-1 col-12 h5 alert alert-${crematoryToVetAlertClass} ${crematoryToVetTextColor} ${crematoryToVetBorderColor}`} style={crematoryToVetStyle}><span className="p-2"><Translate id="In Transit" /></span></div>
                    <div><FontAwesomeIcon icon="arrow-down" color={crematoryToVetArrowColor} /></div>

                    <div className={`mb-1 col-12 h5 alert alert-${atVetCompletedAlertClass} ${atVetCompletedTextColor} ${atVetCompletedBorderColor}`} style={atVetCompletedStyle}><span className="p-2"><Translate id="Ready For Pickup At" /> {companyNameLegal}</span></div>
                  </React.Fragment>
                }

                {/* PICKUP AT CREMATORY */}
                {
                  parseInt(deliveryMethodProductId) === 29 &&
                  <React.Fragment>
                    <div className={`mb-1 col-12 h5 alert alert-${atCrematoryCompletedAlertClass} ${atCrematoryCompletedTextColor} ${atCrematoryCompletedBorderColor}`} style={atCrematoryCompletedStyle}><span className="p-2"><Translate id="Ready For Pickup At" /> {crematoryAccountName}</span></div>
                  </React.Fragment>
                }

                {/* MAIL TO OWNER */}
                {
                  parseInt(deliveryMethodProductId) === 30 &&
                  <React.Fragment>
                    <div className={`mb-1 col-12 h5 alert alert-${courierCompletedAlertClass} ${courierCompletedTextColor} ${courierCompletedBorderColor}`} style={courierCompletedStyle}><span className="p-2"><Translate id="Delivery - On The Way" /></span></div>
                  </React.Fragment>
                }
              </React.Fragment>
            }
          </div>

        </div>
      </div>
      {ProductsMemorialization.map((product) => {
        // // Determine the classes for the status icons for each product
        // // Completed and Packaged - last step for most products
        // const iconCompletedPackagedBackgroundColor = product.statusCompletedAndPackaged === 1 ? 'orange' : 'lightgrey';
        // const iconCompletedPackagedColor = product.statusCompletedAndPackaged === 1 ? 'lightgreen' : 'white';
        // const alreadyPackagedDeleteDisabled = product.statusCompletedAndPackaged === 1 ? true : false;

        // // Step 1 for Paw Prints
        // const iconPawPrintTakenBackgroundColor = product.statusPawPrintTaken === 1 ? 'orange' : 'lightgrey';
        // const iconPawPrintTakenColor = product.statusPawPrintTaken === 1 ? 'lightgreen' : 'white';
        // // Step 2 for Paw Prints
        // const iconPawPrintCompletedBackgroundColor = product.statusPawPrintCompleted === 1 ? 'orange' : 'lightgrey';
        // const iconPawPrintCompletedColor = product.statusPawPrintCompleted === 1 ? 'lightgreen' : 'white';

        // // Step 1 for Fur Clipping
        // const iconFurClippingTakenBackgroundColor = product.statusFurClippingCompleted === 1 ? 'orange' : 'lightgrey';
        // const iconFurClippingTakenColor = product.statusFurClippingCompleted === 1 ? 'lightgreen' : 'white';

        // // Confirm Status: Step 1 for Visitation - schedule the date, Step 1 for Urns/Keepsakes/Jewelry - ordered by the crematory from the supplier, has been dispatched to engraver (if stocked), or confirmed as stocked
        // const iconStatusConfirmedBackgroundColor = product.statusConfirmed === 1 ? 'orange' : 'lightgrey';
        // const iconStatusConfirmedColor = product.statusConfirmed === 1 ? 'lightgreen' : 'white';

        // // Step 2 for Urns/Keepsakes/Jewelry - confirming that the remains have been filled into the product
        // const iconRemainsFilledBackgroundColor = product.statusRemainsFilled === 1 ? 'orange' : 'lightgrey';
        // const iconRemainsFilledColor = product.statusRemainsFilled === 1 ? 'lightgreen' : 'white';

        // Pet At Crematory? atCrematory is set way above for the pet location logic
        let furClippingWaitingText = atCrematory ? 'Pet Is At Crematory' : 'Waiting For Pet At Crematory';
        let furClippingArrowColor = atCrematory ? 'orange' : 'gray';
        let pawPrintWaitingText = atCrematory ? 'Pet Is At Crematory' : 'Waiting For Pet At Crematory';
        let pawPrintArrowColor = atCrematory ? 'orange' : 'gray';
        let urnArrowColor = atCrematory ? 'orange' : 'gray';
        // Paw Print Impression Taken
        let pawPrintTaken = product.statusPawPrintTaken === 1 ? true : false;
        let pawPrintTakenArrowColor = pawPrintTaken ? 'orange' : 'gray';
        let pawPrintTakenBorderColor = pawPrintTaken ? '' : 'border-secondary';
        let pawPrintTakenAlertClass = pawPrintTaken ? 'warning' : 'secondary';
        let pawPrintTakenStyle = pawPrintTaken ? styleCompleted : {};
        let pawPrintTakenTextColor = pawPrintTaken ? 'text-white' : '';
        // Paw Print Completed
        let pawPrintCompleted = product.statusPawPrintCompleted === 1 ? true : false;
        let pawPrintCompletedBorderColor = pawPrintCompleted ? '' : 'border-secondary';
        let pawPrintCompletedAlertClass = pawPrintCompleted ? 'warning' : 'secondary';
        let pawPrintCompletedStyle = pawPrintCompleted ? styleCompleted : {};
        let pawPrintCompletedTextColor = pawPrintCompleted ? 'text-white' : '';
        // Fur Clipping Taken
        let furClippingTaken = product.statusFurClippingCompleted === 1 ? true : false;
        let furClippingTakenArrowColor = furClippingTaken ? 'orange' : 'gray';
        let furClippingTakenBorderColor = furClippingTaken ? '' : 'border-secondary';
        let furClippingTakenAlertClass = furClippingTaken ? 'warning' : 'secondary';
        let furClippingTakenStyle = furClippingTaken ? styleCompleted : {};
        let furClippingTakenTextColor = furClippingTaken ? 'text-white' : '';
        // Fur Clipping Completed
        let furClippingCompleted = furClippingTaken === true && product.statusCompletedAndPackaged === 1 ? true : false;
        let furClippingCompletedBorderColor = furClippingCompleted ? '' : 'border-secondary';
        let furClippingCompletedAlertClass = furClippingCompleted ? 'warning' : 'secondary';
        let furClippingCompletedStyle = furClippingCompleted ? styleCompleted : {};
        let furClippingCompletedTextColor = furClippingCompleted ? 'text-white' : '';
        // Cremation Completed - Used for the Urn status about Cremation needing to occur to process the urn order
        let cremationCompleted = serviceStatusId === 1 ? true : false;
        let cremationCompletedArrowColor = cremationCompleted ? 'orange' : 'gray';
        let cremationCompletedAlertClass = cremationCompleted ? 'warning' : 'secondary';
        let cremationCompletedBorderColor = cremationCompleted ? '' : 'border-secondary';
        let cremationCompletedStyle = cremationCompleted ? styleCompleted : {};
        let cremationCompletedTextColor = cremationCompleted ? 'text-white' : '';
        let cremationCompletedText = cremationCompleted ? 'Cremation Has Completed' : 'Waiting For Cremation';
        cremationCompletedText = serviceStatusId === 2 ? 'Cremation In Process Currently' : cremationCompletedText;
        // Urn Completed
        let urnCompleted = product.statusRemainsFilled === 1 ? true : false;
        let urnCompletedBorderColor = urnCompleted ? '' : 'border-secondary';
        let urnCompletedAlertClass = urnCompleted ? 'warning' : 'secondary';
        let urnCompletedStyle = urnCompleted ? styleCompleted : {};
        let urnCompletedTextColor = urnCompleted ? 'text-white' : '';
        // Jewelry / Keepsake Completed
        let keepsakesCompleted = product.statusCompletedAndPackaged === 1 ? true : false;
        let keepsakesCompletedBorderColor = keepsakesCompleted ? '' : 'border-secondary';
        let keepsakesCompletedAlertClass = keepsakesCompleted ? 'warning' : 'secondary';
        let keepsakesCompletedStyle = keepsakesCompleted ? styleCompleted : {};
        let keepsakesCompletedTextColor = keepsakesCompleted ? 'text-white' : '';

        // Set the card-header text to orange and add ' - Completed' if ready
        let productStyle = {};
        if(
        (product.statusIsPawPrint === 1 && pawPrintCompleted) || 
        (product.statusIsFurClipping === 1 && furClippingCompleted) || 
        (parseInt(product.productCategoryId) === 1 && urnCompleted)        
        ) {
          productStyle = {color: '#ec8333'};
        }
        return (
          <div className="row mr-0 ml-0 mb-3 justify-content-center" key={product.productId} >

            <div className="card w-100 border-secondary rounded">

              <div className="card-header h4 pt-4 pb-4 bg-white border-secondary text-center text-secondary">
                <div style={productStyle}>{product.productName}{productStyle.color && ' - Completed'}</div>
              </div>
              <div className="card-body bg-white rounded justify-content-center">
                {product.statusIsPawPrint === 1 &&
                  <React.Fragment>
                    <div className="col-12 h5 mb-1 alert alert-warning text-white text-center" style={styleCompleted}><Translate id={pawPrintWaitingText} data={{crematory: crematoryAccountName, petFirstName:petFirstName}} /></div>
                    <div className="text-center"><FontAwesomeIcon icon="arrow-down" color={pawPrintArrowColor} /></div>

                    <div className={`col-12 h5 mb-1 alert alert-${pawPrintTakenAlertClass} ${pawPrintTakenBorderColor} ${pawPrintTakenTextColor} text-center`} style={pawPrintTakenStyle}><Translate id="Paw Print Impression Taken" /></div>
                    <div className="text-center"><FontAwesomeIcon icon="arrow-down" color={pawPrintTakenArrowColor} /></div>

                    <div className={`col-12 h5 mb-0 alert alert-${pawPrintCompletedAlertClass} ${pawPrintCompletedBorderColor} ${pawPrintCompletedTextColor} text-center`} style={pawPrintCompletedStyle}><Translate id="Completed and Packaged With Care" /></div>
                  </React.Fragment>
                }
                {product.statusIsFurClipping === 1 &&
                  <React.Fragment>
                    <div className="col-12 h5 mb-1 alert alert-warning text-white text-center" style={styleCompleted}><Translate id={furClippingWaitingText} data={{crematory: crematoryAccountName, petFirstName:petFirstName}} /></div>
                    <div className="text-center"><FontAwesomeIcon icon="arrow-down" color={furClippingArrowColor} /></div>
                    
                    <div className={`col-12 h5 mb-1 alert alert-${furClippingTakenAlertClass} ${furClippingTakenBorderColor} ${furClippingTakenTextColor} text-center`} style={furClippingTakenStyle}><Translate id="Fur Clipping Taken" /></div>
                    <div className="text-center"><FontAwesomeIcon icon="arrow-down" color={furClippingTakenArrowColor} /></div>

                    <div className={`col-12 h5 mb-0 alert alert-${furClippingCompletedAlertClass} ${furClippingCompletedBorderColor} ${furClippingCompletedTextColor} text-center`} style={furClippingCompletedStyle}><Translate id="Completed and Packaged With Care" /></div>
                  </React.Fragment>
                }
                {/* Urn */}
                {
                  parseInt(product.productCategoryId) === 1 &&
                  <React.Fragment>
                    <div className="col-12 h5 mb-1 alert alert-warning text-white text-center" style={styleCompleted}><Translate id="Urn Ordered and Ready" /></div>
                    <div className="text-center"><FontAwesomeIcon icon="arrow-down" color={urnArrowColor} /></div>

                    <div className={`col-12 h5 mb-1 alert alert-${cremationCompletedAlertClass} ${cremationCompletedBorderColor} ${cremationCompletedTextColor} text-center`} style={cremationCompletedStyle}><Translate id={cremationCompletedText} /></div>
                    <div className="text-center"><FontAwesomeIcon icon="arrow-down" color={cremationCompletedArrowColor} /></div>

                    <div className={`col-12 h5 mb-0 alert alert-${urnCompletedAlertClass} ${urnCompletedBorderColor} ${urnCompletedTextColor} text-center`} style={urnCompletedStyle}><Translate id="Completed and Packaged With Care" /></div>
                  </React.Fragment>
                }
                {/* Jewelry or Keepsake */}
                {
                  (parseInt(product.productCategoryId) === 2 || parseInt(product.productCategoryId) === 6) &&
                  <React.Fragment>
                    <div className="col-12 h5 mb-1 alert alert-warning text-white text-center" style={styleCompleted}><Translate id="Product Ordered and Ready" data={{productCategory:product.productCategory}}/></div>
                    <div className="text-center"><FontAwesomeIcon icon="arrow-down" color="orange" /></div>
                    <div className={`col-12 h5 mb-0 alert alert-${keepsakesCompletedAlertClass} ${keepsakesCompletedBorderColor} ${keepsakesCompletedTextColor} text-center`} style={keepsakesCompletedStyle}><Translate id="Completed and Packaged With Care" /></div>
                  </React.Fragment>
                }
              </div>
            </div>
          </div>
        )
      })}
    </div>
    </div>
    </div>
  );
}
//QTYZ2DZ


export const MemorializationStatus = compose(
  queryWithLoading({
    gqlString: getOrderStatusLogsQuery, variablesFunction: (props) => ({ orderId: props.orderId, petReferenceNumber: props.match && props.match.params && props.match.params.petReferenceNumber ? props.match.params.petReferenceNumber : '' }),
    options: {
      fetchPolicy: 'network-only'
    }
  }),
  withTranslate
)(MemorializationStatusContent);





