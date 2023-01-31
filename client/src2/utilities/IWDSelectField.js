// This file is a wrapper for formik.  It should export everything from formik and enhance anything needed.
import React from 'react';
import { compose, graphql } from "react-apollo";

import { withTranslate } from '../translations/IWDTranslation';

// SELECT INPUT HOC
// creates a select field which gets its options from props.options.
//
// pass in falsey value for defaultOptionLabel to prevent rendering default option
// provide query and listName args to make this a 'connected' select, which gets its options from a query.
// 		--'query' should be the gql`...` string, and 'listName' should be the name of the list in the result data.
//
// expected options format:
//		props.options: [
//			{
//				[valueProp]: 'value for select option',
//				[labelProp]: 'label for select option'
//			},
//			...
//		}
export function createIWDSelectField(valueProp, labelProp, defaultOptionLabel="Select One", query=null, listName='options') {
	function SelectInput(props) {
		const {
			className,
			options,
			valueField=valueProp,
			labelField=labelProp,
			defaultLabel=defaultOptionLabel,
			...FieldProps
		} = props;
		//console.log({FieldProps})
		//console.log("props: ", {className, options, valueField, labelField, defaultLabel, FieldProps, query, listName, props});

		// will connect this select to formik if this is the <Field component={} /> prop
		const { field={} } = FieldProps;

		// merge classes from props
		const classes = `form-control ${className || ''}`

		// return select input containing available options
		return (
			<select {...field} className={classes}>
				{/* HERE the default option is setup. This might make more sense to have a custom default value in addition to the label*/}
				{defaultLabel && <option key={0} value={''}>{props.translate(defaultLabel)}</option>}
				{options && options.map((option) => {
					return <option key={option[valueField]} value={option[valueField]}>{props.translate(option[labelField])}</option>
				})}
			</select>
		)
	}
	// optionally, inject a query result as options list
	if (query && listName) {
		return compose(
			// map query result to 'options' prop using provided listName
			graphql(query, { props: ({data}) => ({ options: data[listName] }) }),
			withTranslate
		)(SelectInput);
	}

	return withTranslate(SelectInput);
}

// Take an array of object, the name of the value and label items in the objects and return value/label structure format the select needs.
export function getSelectOptions(array, value, label ) {
	return array.map(( item ) => ({ value:item[value] , label:item[label] }));
}
