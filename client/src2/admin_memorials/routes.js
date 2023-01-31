import React from 'react';
import { Route, Switch, Redirect, withRouter } from "../utilities/IWDReactRouter";
//import { withTranslationAdd, withTranslationEdit } from './translation_form_containers';
//import { TranslationForm } from './translation_form';
//import { TranslationList } from './translation_list';
//import { TranslationTestComponent } from './translation_test';

//import { Translate, withTranslate } from '../translations/IWDTranslation';
import IWDBreadcrumb from '../utilities/IWDBreadcrumb';

import { AdminMemorialPage } from './admin_memorials';
//import { AdminMemorialViewer } from './admin_memorial_viewer';

function RenderHomepage (props) {
	let memorialId = props.match.params.memorialId || 0;
	return <AdminMemorialPage memorialId={memorialId} />;
}

// SUB ROUTES
export const AdminMemorialRoutes = (props) => (
	<React.Fragment>
		<MemorialLayout>
			<Switch>
				{/* This is not yet implemented
					<Route path={`${props.match.path}/edit/:memorialId`} component={AdminMemorialEditor} />
				*/}

				{/* These both render the Memorial Page....................*/}
				<Route exact path={`${props.match.path}`} component={RenderHomepage} />
				<Route path={`${props.match.path}/view/:memorialId`} component={RenderHomepage} />

				{/* url Path not found */}
				<Redirect path="*" to='/memorials' />

			</Switch>
		</MemorialLayout>
	</React.Fragment>
)

// lays out wrapper html for pages in route
const MemorialLayout = withRouter((props) => (
	<div className="memorial_container">
		<IWDBreadcrumb title="Admin Memorials" pathname={props.match.path} />
		{props.children}
	</div>
));