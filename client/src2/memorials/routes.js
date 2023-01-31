import React from 'react';
import { Route, Switch, Redirect, withRouter } from "../utilities/IWDReactRouter";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Translate } from '../translations/IWDTranslation';
import IWDBreadcrumb from '../utilities/IWDBreadcrumb';

import { MemorialPage } from './memorial_home';
import { MemorialCreateForm } from './memorial_create';

// TODO: remove Breadcrumbs from all these pages. (or add breadcrumbs to public facing routes)

// SUB ROUTES
export const MemorialRoutes = (props) => (
	<React.Fragment>
		<MemorialLayout>
			<Switch>
				{/* These both render the Memorial Page....................*/}
				<Route exact path={`${props.match.path}`} component={MemorialPage} />
				<Route path={`${props.match.path}/view/:memorialId`} component={MemorialPage} />
				<Route exact path={`${props.match.path}/create`} render={(child_props) => {
					return (
						<React.Fragment>
							<MemorialCreateForm
								onSubmit={() => {
									// redirect user to memorials upon successful creation
									//props.history.push('/memorials')
								}}/>
							<p><button type="button" className="btn btn-info btn-addon" onClick={() => props.history.push('/memorials')}><FontAwesomeIcon icon="angle-left" /> <Translate id="Back"/></button></p>
						</React.Fragment>
					)
				}} />

				{/* url Path not found */}
				<Redirect path="*" to='/memorials' />

			</Switch>
		</MemorialLayout>
	</React.Fragment>
)

// lays out wrapper html for pages in route
const MemorialLayout = withRouter((props) => (
	<div className="w-100">
		<div className="memorial_container container card p-3">
			<IWDBreadcrumb title="Memorials" pathname={props.match.path} />
			{props.children}
		</div>
	</div>
));