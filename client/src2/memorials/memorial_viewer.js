import React from 'react';
import { graphql, compose } from 'react-apollo';
import { withRouter } from '../utilities/IWDReactRouter';

import { GetMemorial } from './memorials_graphql';
import { Thumbnail } from '../files/images';
import { Translate, TranslateDefault } from '../translations/IWDTranslation';

// Renders a memorial for user consumption
export function MemorialViewerLayout (props) {
	let {
		Memorial,
	} = props;
	let {
		breed='',
		dateBorn,
		dateDied,
		images=[],
		memorial,
		petName,
		petSpecies=null
	} = Memorial || {};

	//console.log("MemorialViewerLayout", {Memorial, loading, error, petId:pet.petId, memorial, dateBorn, dateDied})
	return (
		<React.Fragment>
			<div className="">
				<h3><Translate id="In Memory of" /> {petName}</h3>
				<h4><span className="small"><Translate id="Born" /></span> {dateBorn} &ndash; <span className="small"><Translate id="Died" /></span> {dateDied}</h4>
				<p><TranslateDefault id={String(breed)}>{breed}</TranslateDefault> &mdash; {(petSpecies && petSpecies.species) || 'Not found'}</p>
				<p>{memorial}</p>
				<span>
					{(images).map((img) => <Thumbnail image={img} key={img.memorialImageId} type="memorial-thumb" size="medium" />)}
				</span>
			</div>
		</React.Fragment>
	);
}

export const MemorialViewer = compose(
	withRouter,
	graphql(GetMemorial, {
		props: ({ data: { loading, error, Memorial}}, ownProps) => {
			//console.log("qpm", {loading, error, Memorial})
			let result = {
				...ownProps,
				Memorial, loading, error
			};
			//console.log("new props: ", {result});
			return result;
		}
	})
)(MemorialViewerLayout)
