import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { PublishedMemorialShowcase } from './memorial_showcase';
import { MemorialViewer } from './memorial_viewer';
import { Translate } from '../translations/IWDTranslation';

// Page for routes /memorials and /memorials/view
export const MemorialPage = (props) => {
	let memorialId = props.match.params.memorialId || 0;

	//console.log("MemorialPage: ", {props, memorialId});
	return (
		<React.Fragment>
			<div>
				<h3>
					<button className="btn btn-info btn-addon float-right" onClick={() => props.history.push('/memorials/create')}><Translate id="Create a Memorial"/> <FontAwesomeIcon icon="plus" /> </button>
					<Translate id="Memorials" />
				</h3>
			</div>
			<div>
				{/*	show the memorial viewer if we're at /memorials/view/:memorialId */}
				{memorialId > 0 &&
					<div>
						<MemorialViewer memorialId={memorialId} />
						<p>
							<button type="button" className="btn btn-info btn-addon" onClick={() => { props.history.push('/memorials')} }><FontAwesomeIcon icon="angle-left" /> <Translate id="Back"/></button>
						</p>
					</div>
				}
				{/*	show the memorials list if we're NOT at /memorials/view/:memorialId */}
				{ ! memorialId &&
					<PublishedMemorialShowcase viewMemorial={(memorialId) => { if (memorialId > 0) props.history.push(`/memorials/view/${memorialId}`)}} />
				}
			</div>
		</React.Fragment>
	);
}