import _ from 'lodash';
import React from 'react';
import { graphql } from 'react-apollo';

import { Thumbnail } from '../files/images';
import { Translate } from '../translations/IWDTranslation';
import { IWDPaginator } from '../layouts/pagination';
import { GetPublishedMemorials } from './memorials_graphql';


export const MemorialShowcaseItem = (props) => {
	let {
		Memorial,
		onClick,
		showStatus=true // this should be false
	} = props;

	let {
		dateBorn='',
		dateDied='',
		images=[],
		petId='',
		petName='',
		//pet={}, // could be used to get data from pets table instead of memorials table
		memorialStatus='',
	} = Memorial;

	let image = false;
	if (images && images.length) {
		image = <Thumbnail image={images[0]} size="medium" type="" className="card-img-top" />
	}

	// using UTC full year because dateBorn and dateDied are formatted like 'YYYY-MM-DD', which Date parses as UTC time.
	// if it was formatted as 'MM/DD/YYYY', Date would parse using local time and getFullYear should be used instead.
	let yearBorn = dateBorn ? new Date(dateBorn).getUTCFullYear() : '';
	let yearDied = dateDied ? new Date(dateDied).getUTCFullYear() : '';

	return (
		<React.Fragment>
			<div className="card" onClick={onClick}>
				{image}
				<div className="card-body p-3">
					<h5 className="card-title mb-1">{petName || petId}</h5>
					<p className="card-text mb-0">{yearBorn} {yearBorn && '-'} {yearDied}</p>
					{showStatus &&
						<p>{memorialStatus}</p>
					}

				</div>
				<div className="card-footer text-center">
					<button className="btn btn-info">
						<Translate id="View"/> <Translate id="Memorial"/>
					</button>
				</div>
			</div>

		</React.Fragment>
	)
}

export const PublishedMemorialShowcase = graphql(GetPublishedMemorials, {
	// inject data.Memorials into props as 'Memorials'
	props: ({data}) => ({
		Memorials: (data.Memorials) ? (data.Memorials.memorials || []) : [],
		// inject cursor into fetchMore call, so it all happens behind the scenes
		fetchMore: () => {
			if (data.fetchMore) {
				let cursor_obj = (data.Memorials) ? (data.Memorials.cursor || {}) : {};
				let cursor = _.pick(cursor_obj, ['after']);
				return data.fetchMore({
					variables: { cursor },

					// add new memorials to list, update cursor
					updateQuery: (prev, { fetchMoreResult }) => ({
						...prev,
						Memorials: {
							...prev.Memorials,
							memorials: [...prev.Memorials.memorials, ...fetchMoreResult.Memorials.memorials],
							cursor: fetchMoreResult.Memorials.cursor
						}
					})
				})
			}
		}
	})
})(MemorialShowcase);

//TODO: this might be able to load next page in advance, for more seamless user experience

export function MemorialShowcase (props)  {
	let {
		Memorials=[],
		fetchMore=(_)=>(_),
		viewMemorial=(_)=>(_)
	} = props;

	return (
		<React.Fragment>
			<IWDPaginator
				list={Memorials}
				listName={'MemorialList'}
				render={({MemorialList}) => {
					return (
						<div className="container">
							<div className="row">
								<div className="col-sm-auto">
									<button className="btn btn-info" onClick={() => { MemorialList.prevPage() }}>Prev</button>
								</div>
								<div className="col-sm">
									<div className="row">
										{MemorialList.list.map((memorial) => {
											return (
												<div className="col-sm-3 mb-3" key={memorial.memorialId}>
													<MemorialShowcaseItem Memorial={memorial} onClick={() => viewMemorial(memorial.memorialId)}/>
												</div>
											)
										})}
									</div>
								</div>
								<div className="col-sm-auto">
									{/* Button that decides whether or not to fetch another page, and then tells paging to move to next page. */}
									<button className="btn btn-info" onClick={async () => {
										// if we're at end of list, fetch more data
										if (MemorialList.endOfList) {
											await fetchMore();
										}
										// finally, tell paging to move window
										MemorialList.nextPage();
									}}><Translate id="Next" /></button>
								</div>
							</div>
						</div>
					)
				}}>
			</IWDPaginator>
		</React.Fragment>
	);
}
