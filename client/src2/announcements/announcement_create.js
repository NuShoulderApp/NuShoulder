import _ from 'lodash';
import React from 'react';
import { withFormik, Field, Form } from "../utilities/IWDFormik";
import { withState } from "react-state-hoc";
import { withRouter, Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { compose } from "react-apollo";
//import * as Yup from "yup";

// UTILITY FUNCTION to offload Loading and Error handling in the React Query component
import { castNumerics, queryWithLoading, withMutation } from '../utilities/IWDDb';

import { Translate, withTranslate } from '../translations/IWDTranslation';

// GRAPHQL QUERY
import { getAnnouncementQuery, getAnnouncementsQuery, AnnouncementSaveMutation } from './announcement_graphql';


// define the form to use with the handlers below
const AnnouncementCreateFormContent = (props) => {
	const {
		active,
		announcement,
		dateEnd,
		dateStart,
		errors,
		isSubmitting,
		setState,
		title,
		touched,
		values
	} = props;

	values.active = active;
	values.announcement = announcement;
	values.dateEnd = dateEnd;
	values.dateStart = dateStart;
	values.title = title;

	return (
		<React.Fragment>
			<div className="w-100 p-1">
				{/* SELECT THE MACHINE TO USE & THE CREMATION TYPE TO PERFORM */}
				<h3><span className="text-white text-shadow"><FontAwesomeIcon icon="plus" /> Create a Announcement</span></h3>
				<div className="card p-3">
					<Form>
						<div className="row">
							<div className="col-md-auto">
								<label htmlFor="title"><Translate id="Title"/></label>
								<Field name="title" value={title} className={`form-control ${errors.title && touched.title && 'is-invalid'}`} onChange={(props) => setState({"title": props.target.value}) } />
									{errors.title && touched.title && <div className="invalid-feedback">{props.translate(errors.title)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="active"><Translate id="Active"/></label>
								<Field component="select" value={active} name="active" className={`form-control ${errors.active && touched.active && 'is-invalid'}`} onChange={(props) => setState({"active": props.target.value}) }>
									<option value="">{props.translate('Select One')}</option>
									<option value="1">{props.translate('Yes')}</option>
									<option value="0">{props.translate('No')}</option>
								</Field>
							</div>
							<div className="col-md-auto">
								<label htmlFor="dateStart"><Translate id="Date Start"/></label>
								<Field name="dateStart" type="date" value={dateStart} className={`form-control ${errors.dateStart && touched.dateStart && 'is-invalid'}`} onChange={(props) => setState({"dateStart": props.target.value}) } />
									{errors.dateStart && touched.dateStart && <div className="invalid-feedback">{props.translate(errors.dateStart)}</div>}
							</div>
							<div className="col-md-auto">
								<label htmlFor="dateEnd"><Translate id="Date End"/></label>
								<Field name="dateEnd" type="date" value={dateEnd} className={`form-control ${errors.dateEnd && touched.dateEnd && 'is-invalid'}`} onChange={(props) => setState({"dateEnd": props.target.value}) } />
									{errors.dateEnd && touched.dateEnd && <div className="invalid-feedback">{props.translate(errors.dateEnd)}</div>}
							</div>
						</div>
						<div className="row mt-3">
							<div className="col-md">
								<label htmlFor="announcement"><Translate id="Announcement"/></label>
								<Field name="announcement" component="textarea" value={announcement}  className={`form-control ${errors.announcement && touched.announcement && 'is-invalid'}`} onChange={(props) => setState({"announcement": props.target.value}) } />
									{errors.announcement && touched.announcement && <div className="invalid-feedback">{props.translate(errors.announcement)}</div>}
							</div>
						</div>
						<div className="row mt-3">
							<div className="col-md-12">
								<Link to={`/announcements`} className="btn btn-default btn-addon float-right"><FontAwesomeIcon icon="times" /> <Translate id="Cancel"/> </Link>
								<button type="submit" className="btn btn-success btn-addon" disabled={isSubmitting}><FontAwesomeIcon icon="plus" /> <Translate id="Create the Announcement"/> </button>
							</div>
						</div>
					</Form>
				</div>
			</div>
		</React.Fragment>
	);
};

// Define the handlers for the form above
const AnnouncementCreateContent = compose (
	withState(({initialValues: {announcementId, active, announcement, dateEnd, dateStart, title}}) => ({announcementId, active, announcement, dateEnd, dateStart, title})),
	withMutation(AnnouncementSaveMutation, "AnnouncementSaveMutation", [{query: getAnnouncementQuery},{query: getAnnouncementsQuery}]),
	withFormik({
		handleSubmit: async ( input, { props: { AnnouncementSaveMutation, history }}, FormikForm ) => {
			// Async/Await Perform the mutation (to the server) and decompose the result.
			let castInput = castNumerics(input,"active,columns,doCommunal,doIndividual,doPrivate,isMultiChamber,rows")
			const { data: { AnnouncementSave }} = await AnnouncementSaveMutation({ input: castInput });
			
			if(AnnouncementSave.Response.success === true) {
				history.push(`/announcements/announcement/${AnnouncementSave.Announcement.announcementId}`);	
			}
		},
		mapPropsToValues: ({initialValues}) => _.mapValues(initialValues, (value) => value === null || value === undefined ? "" : value)
	}),
	withTranslate
)(AnnouncementCreateFormContent);

class AnnouncementCreateClass extends React.Component {
	constructor(props) {
    	super(props)

		this.state = {
			announcementId: 0,
			active: 1,
			announcement: "",
			dateEnd: "",
			dateStart: "",
			title: ""
		}
	}
	
	handleSetState = (valueObject) => {
		this.setState(valueObject)
	};

	render () {
		const Announcement = { announcementId: 0, active: 1, announcement: "", dateEnd: "", dateStart: "", title: "" }; // if we don't get back a announcement then setup an empty one to use
		return (
			<React.Fragment>
				<AnnouncementCreateContent
					initialValues={Announcement}
					Announcement={Announcement}
					handleSetState={this.handleSetState}
					history={this.props.history}
					state={this.state}
				/>
			</React.Fragment>
		)
	}
}

// get the data for the ID in the URL
export const AnnouncementCreate = compose(
	withRouter,
	queryWithLoading({
        gqlString: getAnnouncementQuery,
        variablesFunction: (props) => ({announcementId: 0})
    }),
	withTranslate
)(AnnouncementCreateClass);
