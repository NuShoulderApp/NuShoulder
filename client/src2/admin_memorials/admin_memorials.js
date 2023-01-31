import React from 'react';
import { withRouter } from '../utilities/IWDReactRouter';
import { graphql, compose } from 'react-apollo';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Translate } from '../translations/IWDTranslation';
import { MemorialShowcase } from '../memorials/memorial_showcase';
import { AdminMemorialViewer } from './admin_memorial_viewer';
import { GetPendingMemorials } from '../memorials/memorials_graphql';

// Inject pending memorials into props.Memorials
export const AdminMemorialPage = compose(
	graphql(GetPendingMemorials, {
		props: ({data, fetchMore}) => ({
			Memorials: (data.Memorials) ? (data.Memorials.memorials || []) : [],
			// inject cursor into fetchMore call, so it all happens behind the scenes
			fetchMore: () => {
				return fetchMore({
					variables: (data.Memorials) ? (data.Memorials.cursor || {}) : {},
					updateQuery: (prev, { fetchMoreResult }) => ({
						...prev,
						Memorials: {
							...prev.Memorials,
							memorials: fetchMoreResult.Memorials.memorials
						}
					})
				})
			}
		})
	}),
	withRouter
)(AdminMemorialPageContent);

// Memorial page content
function AdminMemorialPageContent(props) {
	let {
		memorialId=0,
		Memorials=[]
	} = props;

	if (typeof memorialId === 'string') memorialId = parseInt(memorialId, 10);

	// Optionally, we could check that the memorialId is in the Memorials list using the reduce below before rendering Viewer
	let renderViewer = memorialId > 0;

	// find next and previous memorials
	let adjacentMemos = Memorials.reduce((result, m) => {
		// check that next is null to get the first m where memorialID > current
		if (result.next === 0 && m.memorialId > memorialId) {
			result.next = m.memorialId;
		}
		// don't check that prev is null to get the last m where memorialID < current
		else if (m.memorialId < memorialId) {
			result.prev = m.memorialId;
		}
		return result;
	}, {prev: 0, next: 0})

	return (
		<React.Fragment>
			<h3 className="text-white text-shadow"><Translate id="Review Online Memorials" /></h3>
			<div className="card p-3">
				<p><Translate id="Online pet memorials that are pending approval" /></p>
				{/* if we have a memorialId, render the viewer. Otherwise, render the list */}
				{renderViewer &&
					<React.Fragment>
						<div className="container mt-2">
							<div className="row">
								<div className="col-sm-2" style={{alignSelf: 'center'}}>
									{adjacentMemos.prev > 0 &&
										<button className='btn btn-default' onClick={() => props.history.push(`/admin_memorials/view/${adjacentMemos.prev}`)}><Translate id="Previous" /></button>
									}
									{/*
									<button className="btn btn-info" onClick={() => props.history.push('/admin_memorials')}><Translate id="Previous"/></button>
									*/}
								</div>
								<div className="col-sm">
									<AdminMemorialViewer key={memorialId} memorialId={memorialId} />
								</div>
								<div className="col-sm-2" style={{alignSelf: 'center'}}>
									{adjacentMemos.next > 0 &&
										<button className='btn btn-default' onClick={() => props.history.push(`/admin_memorials/view/${adjacentMemos.next}`)}><Translate id="Next" /></button>
									}
								</div>
							</div>
							<div className="row">
								<div className="col-sm">
									<button className="btn btn-info btn-addon" onClick={() => props.history.push('/admin_memorials')}><FontAwesomeIcon icon="angle-left" /> <Translate id="Back"/></button>
								</div>
							</div>
						</div>
					</React.Fragment>
				}
				{ !renderViewer &&
					<MemorialShowcase
						Memorials={Memorials}
						viewMemorial={(mId) => props.history.push(`/admin_memorials/view/${mId}`)}
						/>
				}
			</div>
		</React.Fragment>
	)
}
