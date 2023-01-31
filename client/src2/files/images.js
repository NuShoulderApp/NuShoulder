import React from 'react';

// Display a thumbnail, with classnames based on thumbType, size
export function Thumbnail (props) {
	let {
		image={},
		type='thumbnail',
		size='small',
		className='',
		...img_props
	} = props;
	let location = image.fullImage.location;
	let caption = image.caption || '';
	if (size === 'medium') {
		location = image.mediumImage.location;
	} else if (size === 'small') {
		location = image.smallImage.location;
	} else if (size === 'tiny') {
		location = image.tinyImage.location;
	}

	let thumbClasses = `${type} thumbnail-${size}`;
	return (
		<Image {...img_props} image={{location, caption}} className={`${thumbClasses} ${className}`}/>
	)
}

export function Image (props) {
	let {
		image={},
		...img_props
	} = props;

	let {location='', caption=''} = image;
	return (
		<span>
			<img {...img_props} src={location} alt={caption} />
			{/* caption */}
		</span>
	)
}
