import React from 'react';
import gql from 'graphql-tag';
import { queryWithLoading } from '../utilities/IWDDb';
import { compose } from 'react-apollo';

export const GetDeliveryLog = gql`
	query GetDeliveryLog($deliveryLogId: ID) {
		DeliveryLog(deliveryLogId: $deliveryLogId){
			deliveryLogId
				dateCreated
				Driver {
			userId
			firstName
			lastName
			}
				Route {
			routeName
			routeId
			}
				Company {
			companyId
			companyName
			}
				CompanyAddress {
			companyId
			addressId
			addressName
			address1
			}
			Orders {
			deliveryLogOrderId
			deliveryType
			newStatus {
				orderStatusId
				orderStatus
			}
			Order {
				orderId
				orderStatus
			}
			}
				Signature {
			signatureId
			signatureData
			}
		}
	}
`;

const DeliveryLogContent = ({ DeliveryLog: { DeliveryLog } }) => {
	return (
		<React.Fragment>
			Company: {(DeliveryLog.Company || {}).companyName}
			<br/>

			Driver: {DeliveryLog.Driver.firstName} {DeliveryLog.Driver.lastName}
			<br/>


			<img alt="" src={DeliveryLog.Signature.signatureData}/>
		</React.Fragment>
	);
}

export const DeliveryLog = compose(
	queryWithLoading({
		gqlString: GetDeliveryLog,
		name: "DeliveryLog", variablesFunction: (props) => ({ deliveryLogId: props.match.params.deliveryLogId }),
		notFoundCheck: (props) => props.DeliveryLog.DeliveryLog === null
	})
)(DeliveryLogContent);





