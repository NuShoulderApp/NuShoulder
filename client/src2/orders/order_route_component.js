import _ from 'lodash';
import React from 'react';
import { graphql } from 'react-apollo';

// GRAPHQL QUERY
import {
	GetOrderQueue
} from './orders_graphql';

import { OrdersViewContent } from './orders_component';

function RoutesOrderQueue(props) {
	let {
		Orders=[],
		fetchMore=(_)=>(_)
	} = props;
	return (
		<React.Fragment>
			<OrdersViewContent Orders={Orders} fetchMore={fetchMore}/>
		</React.Fragment>
	)

}
