import React from 'react';
import { Breadcrumb } from 'react-breadcrumbs';
import { withTranslate } from '../translations/IWDTranslation';

// Simple wrapper for Breadcrumb class.
// 		handles translating breadcrumb titles
//		allows both prop styles:
//			<Breadcrumb title={} pathname={}/>
//				OR
//			<Breadcrumb data={{title, pathname}} />
const IWDBreadcrumb = withTranslate(
	(props) => {
		let { title=null, pathname=null, data=null, do_translation=true } = props;
		// extra check; if the props are passed in as props: {data: {pathname, title}}, use that instead
		if (title === null && pathname === null && data !== null) {
			title = data.title || '';
			pathname = data.pathname || '';
		}
		if (do_translation) {
			title = props.translate(title);
		}
		return <Breadcrumb data={ { title, pathname } } />
	}
);

export { IWDBreadcrumb as default }