import React from 'react';
import { graphql, compose } from 'react-apollo';
import { withState } from "react-state-hoc";

import { withTranslate } from '../translations/IWDTranslation';
import { MemorialViewer } from '../memorials/memorial_viewer';
import { updateMemorialStatus } from './admin_memorials_graphql';

// Component to render a memorial along with Admin edit options

// inject publish + reject functions into component
export const AdminMemorialViewer = compose(
	withState({}),
	graphql(updateMemorialStatus, {
		props: ({mutate, ownProps}) => ({
			// publish to statusId = 3 ('Published'), reject to statusId = 4 ('Deleted')
			// .then implies no errors, so that's good. If updateMemorial returns a response object (which it does), then more parsing is necessary
			publishMemorial: (memorialId) => mutate({variables: {memorialId, newStatusId: 3}}).then(ownProps.setState),
			rejectMemorial: (memorialId) => mutate({variables: {memorialId, newStatusId: 4}}).then(ownProps.setState),
		}),
		options: {
			refetchQueries: ['MemorialList']
		}
	}),
	withTranslate
)(AdminMemorialViewerLayout)

function parseResult(data) {
	let success = false;
	let executed = false;
	let suffix = 'danger';
	let message = 'Unknown Error';

	if (data && data.memorialUpdate && data.memorialUpdate.Response) {
		executed = true;
		success = data.memorialUpdate.Response.success || false;
		suffix = success ? 'success' : 'danger';
		message = data.memorialUpdate.Response.message || message;
		if (success) {
			let type = parseInt(data.memorialUpdate.Memorial.memorialStatusId, 10);
			if (type === 3) {
				message = 'Successfully published memorial';
			} else if (type === 4) {
				message = 'Successfully removed memorial';
			}
		}
	}

	return { executed, success, suffix, message};
}

// Render Memorial + admin edit UI (currently publish + reject buttons)
function AdminMemorialViewerLayout(props) {
	let {
		data={},
		memorialId=0,
		publishMemorial=(_)=>(_),
		rejectMemorial=(_)=>(_),
	} = props;

	let { executed, suffix, message } = parseResult(data);
	if (executed) {
		return (
			<React.Fragment>
				<h3>{props.translate('Admin Memorial Header', {memorialId})}!</h3>
				<div className={`alert alert-${suffix}`}>
					{props.translate(message)}
				</div>
			</React.Fragment>
		)
	}

	return (
		<React.Fragment>
			<h3>{props.translate('Admin Memorial Header', {memorialId})}!</h3>
			<div>
				<h4>{props.translate('Preview')}: </h4>
				<MemorialViewer memorialId={memorialId} />
			</div>
			<div className="container mt-5">
				<div className="row">
					<div className="col">
						<button className='btn btn-success btn-lg' onClick={() => publishMemorial(memorialId)}>{props.translate('Accept')}</button>
					</div>
					<div className="col">
						<button className='btn btn-danger btn-lg' onClick={() => rejectMemorial(memorialId)}>{props.translate('Reject')}</button>
					</div>
				</div>
			</div>
		</React.Fragment>
	)
}