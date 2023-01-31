import React from 'react';
import { Route, Switch, withRouter } from "../utilities/IWDReactRouter";
import { withTranslationAdd, withTranslationEdit } from './translation_form_containers';
import { TranslationForm } from './translation_form';
import { TranslationList } from './translation_list';
import { TranslationTestComponent } from './translation_test';

import { Translate, withTranslate } from './IWDTranslation';
import IWDBreadcrumb from '../utilities/IWDBreadcrumb';

// SUB ROUTES
export const TranslationRoutes = (props) => (
	<React.Fragment>
		<TranslationLayout>
			<Switch>
				<Route exact path={`${props.match.path}`} component={TranslationList}/>

				<Route exact path={`${props.match.path}/test`}>
					<TranslationTestPage />
				</Route>

				<Route path={`${props.match.path}/add`}>
					<React.Fragment>
						<IWDBreadcrumb title="Add Translation" pathname={props.match.path} />
						{/*
							To perform an action when the form submits, provide an onSubmit function
						*/}
						<TranslationAddForm
							heading={<Translate id="Add Translation"/>}
							//onSubmit={(...args) => console.log("onSubmit add form", {args})}
							onCancel={() => props.history.push('/translations')}
						/>
					</React.Fragment>
				</Route>

				<Route path={`${props.match.path}/:translationId`}>
					{/*
						To perform an action when the form submits, provide an onSubmit function
						onSubmit={dummy_onSubmit.bind(null, () => props.history.push('/translations'))}
					*/}
					<TranslationEditForm
						heading={<Translate id="Edit Translation"/>}
						onCancel={() => props.history.push('/translations')}
					/>
				</Route>

			</Switch>
		</TranslationLayout>
	</React.Fragment>
)

const TranslationTestPage = withRouter(TranslationTestComponent);
const TranslationAddForm = withRouter(withTranslationAdd(TranslationForm));
const TranslationEditForm =
	withRouter(
	withTranslationEdit(
	withTranslate(
		(props) => {
			let Translation = props.Translation || {};
			// fallback title
			let title = "Edit Translation";
			if (Translation.phraseKey) {
				title = props.translate('Phrase Key Breadcrumb', {phraseKey: Translation.phraseKey});
			}
			let {children, ...form_props} = props;
			return (
				<React.Fragment>
					{/* passing do_translation=false because we want the phrase key verbatim, not the phrase */}
					<IWDBreadcrumb title={title} pathname={props.match.path} do_translation={false} />

					<TranslationForm {...form_props} heading={<Translate id="Edit Translation"/>}>
						{children}
					</TranslationForm>
				</React.Fragment>
			)
	})));

// lays out wrapper html for pages in /translations route
const TranslationLayout = withRouter((props) => (
	<div className="translation_container">
		<IWDBreadcrumb title="Translations" pathname={props.match.path} />
		{props.children}
	</div>
));