import React from 'react';
import { NavLink} from "react-router-dom";
import _ from 'lodash';
import {flowRight as compose} from 'lodash';
import { castNumerics, queryWithLoading, withMutation } from '../utilities/NSDb.js';
import { graphql } from '@apollo/react-hoc';

import { Collapse, Nav, Navbar, NavbarToggler } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// GRAPHQL QUERY
import { 
    GetScoreCategories,
    GetScoreMetrics,
    GetScoreSources,
    SaveScoreMetric
} from './nuhouse_score_graphql.js';

import { 
    GetUsers 
} from '../users/users_graphql.js';

// DOCS: https://www.apollographql.com/docs/react/get-started/
// Import everything needed to use the `useQuery` hook
import { useQuery, useMutation } from '@apollo/client';


// function DisplayUsers() {
//   const { loading, error, data } = useQuery(GetUsers);
//     console.log({data})
//   if (loading) return <p>Loading...</p>;
//   if (error) return <p>Error : {error.message}</p>;

//   return data.users.map(({ user_ID, user_type_ID, first_name, last_name }) => (
//     <div key={user_ID}>
//       <h3>{first_name} {last_name}</h3>
//       <p>{user_ID} {user_type_ID}</p>
//       <br />
//     </div>
//   ));
// }

// function DisplayScoreCategories() {
//   const { loading, error, data } = useQuery(GetScoreCategories);
//     console.log({data})
//   if (loading) return <p>Loading...</p>;
//   if (error) return <p>Error : {error.message}</p>;

//   return data.score_categories.map(({ score_category_ID, score_category_name, score_category_percentage, active, archived, creator_ID, archiver_ID, date_created, date_archived }) => (
//     <div key={score_category_ID}>
//       <h3>{score_category_name} {score_category_percentage}</h3>
//       <p>{active} {creator_ID}</p>
//       <br />
//     </div>
//   ));
// }


class AdminNuHouseScoreClass extends React.Component {
	constructor(props) {
    	super(props)
console.log({props})

        // Alphabetically sort the score_sources
        let TempScoreSources = [...props.ScoreSources.score_sources];
        TempScoreSources = TempScoreSources.sort(function(a,b) {
            if(a.source_name < b.source_name) return -1;
            if(a.source_name > b.source_name) return 1;
            return 0;
        })

		this.state = {
			productMaterialId: "All Materials",
			routeId: "All Routes",
            ScoreCategories: props.ScoreCategories.score_categories,
            ScoreMetrics: props.ScoreMetrics.score_metrics,
            ScoreSources: TempScoreSources,
            SelectedScoreMetric: {},
            selected_score_metric_ID: 0,
            Users: props.Users.users
		}
	}

	// handleFormReload = (values) => {
	// 	this.setState({
	// 		productMaterialId: values.productMaterialId,
	// 		routeId: values.routeId
	// 	})
	// };
    changeSelectedScoreMetricValue = (name, value, type='') => {
        console.log("name: ", name, " | value: ", value, " | type: ", type);
        let new_value = value;
        if(type == 'checkbox') {
            if(new_value == "" || new_value == false || new_value == 'false' || parseInt(new_value) == 0) {
                new_value = 1;
            } else {
                new_value = 0
            }
        }
        this.setState({
            SelectedScoreMetric: {
                ...this.state.SelectedScoreMetric,
                [name]: new_value
            }
        })

    };

    changeCategoryPercentage = (score_category_ID, score_category_percentage, action) => {
        console.log("score_category_ID: ", score_category_ID, " | score_category_percentage: ", score_category_percentage, " | action: ", action)
        let temp_score_category_percentage = action == 'add' ? score_category_percentage+1 : score_category_percentage-1;
        let tempScoreCategories = this.state.ScoreCategories;
        tempScoreCategories = tempScoreCategories.map((cat) => {
            if(parseInt(cat.score_category_ID) == parseInt(score_category_ID)) {
                return { ...cat, score_category_percentage: temp_score_category_percentage};
            } else {
                return cat;
            }
        })
        this.setState({
            ScoreCategories: tempScoreCategories
        })

    };

    async changeMetricPercentage(score_metric_ID, score_percentage_of_category, action) {
        console.log("score_metric_ID: ", score_metric_ID, " | score_percentage_of_category: ", score_percentage_of_category, " | action: ", action)
        let temp_score_percentage_of_category = action == 'add' ? score_percentage_of_category+1 : score_percentage_of_category-1;
        let tempScoreMetrics = this.state.ScoreMetrics;
        tempScoreMetrics = tempScoreMetrics.map((metric) => {
            if(parseInt(metric.score_metric_ID) == parseInt(score_metric_ID)) {
                return { ...metric, score_percentage_of_category: temp_score_percentage_of_category};
            } else {
                return metric;
            }
        })
        this.setState({
            ScoreMetrics: tempScoreMetrics
        }, () => {
            let TempMetric = this.state.ScoreMetrics;
            TempMetric.filter((metric) => parseInt(metric.score_metric_ID) == parseInt(score_metric_ID)).forEach((metric) => {
                TempMetric = metric;
            })
            this.saveScoreMetric(TempMetric);
        });

    };

    handleSelectMetric = (metric) => {
        let temp_allow_partial_score = metric.allow_partial_score;
        if(temp_allow_partial_score == true) {
            temp_allow_partial_score = 1;
        } else if(temp_allow_partial_score == false) {
            temp_allow_partial_score = 0;
        }

        let temp_pass_fail = metric.pass_fail;
        if(temp_pass_fail == true) {
            temp_pass_fail = 1;
        } else if(temp_pass_fail == false) {
            temp_pass_fail = 0;
        }
        this.setState({
            selected_score_metric_ID: metric.score_metric_ID, 
            SelectedScoreMetric: {...metric, allow_partial_score: temp_allow_partial_score, pass_fail: temp_pass_fail}
        })
    }

    saveSelectedMetric = () => {
        let tempScoreMetrics = this.state.ScoreMetrics;
        tempScoreMetrics = tempScoreMetrics.map((metric) => {
            if(parseInt(metric.score_metric_ID) == parseInt(this.state.selected_score_metric_ID)) {
                return this.state.SelectedScoreMetric;
            } else {
                return metric;
            }
        })
        this.setState({
            ScoreMetrics: tempScoreMetrics
        }, () => {
            this.saveScoreMetric(this.state.SelectedScoreMetric);
        });
    }

    saveScoreMetric = (metric) => {
        console.log({metric})
        let temp_metric = _.omit(metric,["__typename"]);
        // temp_metric = {
        //     ...castNumerics(temp_metric, "passing_score", true)
        // }

        this.props.SaveScoreMetric({ input: {...temp_metric, 
                                                passing_score: parseInt(temp_metric.passing_score),
                                                score_category_ID: parseInt(temp_metric.score_category_ID),
                                                score_max: parseInt(temp_metric.score_max),
                                                score_min: parseInt(temp_metric.score_min),
                                                score_percentage_of_category: parseInt(temp_metric.score_percentage_of_category),
                                                score_source_ID: parseInt(temp_metric.score_source_ID)
                                            } });
        // this.props.mutate({
        //     variables: {
        //         input: {
        //             score_metric_ID: metric.score_metric_ID,
        //             score_metric_name: metric.score_metric_name
        //         }
        //     }
        // })
        // const [saveData, { data, loading, error }] = useMutation(SaveScoreMetric, {
        //     variables: {
        //         score_metric_ID: props.score_metric_ID,
        //         score_metric_name: props.score_metric_name
        //     },
        //     });
    	//const { data } = await SaveScoreMetric({ input: { score_metric_ID: props.score_metric_ID, score_metric_name: props.score_metric_ID } });
        // console.log("SAVE, data: ", data)
        // console.log("SAVE, saveData: ", saveData)
    }

	render () {
        console.log("state: ", this.state)
        // Add / Substract 1 from the percentage of the metric
        console.log("allow partial score: ", this.state.SelectedScoreMetric.allow_partial_score)
		return (
            <React.Fragment>
                <div className="p-3">
                    <div className="row">
                        {this.state.ScoreCategories.map((cat) => {
                            let metrics_percentage_total = 0;
                            this.state.ScoreMetrics.filter((metric) => parseInt(metric.score_category_ID) == parseInt(cat.score_category_ID)).forEach((metric) => {
                                console.log("metrics_percentage_total: ", metrics_percentage_total, " | ADD: ", metric.score_percentage_of_category)
                                metrics_percentage_total = parseFloat(metrics_percentage_total)+parseFloat(metric.score_percentage_of_category);
                            });
                            return (
                                <div className="col-md-6 mb-4" key={cat.score_category_ID}>
                                    <div className="card">
                                        <div className="card-header h4">
                                            <div className="float-start">{cat.score_category_name}</div>
                                            <span className="float-end me-4">
                                                {/* <span className="pe-2" onClick={() => this.changeCategoryPercentage(cat.score_category_ID, cat.score_category_percentage, 'subtract')}><FontAwesomeIcon icon="minus"/></span> */}
                                                <span>{cat.score_category_percentage}</span>
                                                {/* <span className="ps-2" onClick={() => this.changeCategoryPercentage(cat.score_category_ID, cat.score_category_percentage, 'add')}><FontAwesomeIcon icon="plus"/></span> */}
                                            </span>
                                        </div>
                                        <div className="card-body accordian" id="accordianExample">
                                            <div className="h5">
                                                <span className="h5 ">Total Metric Percentage In Category:</span>
                                                <span className="h5 float-end me-4">{metrics_percentage_total}</span>
                                            </div>
                                            {this.state.ScoreMetrics.filter((metric) => metric.score_category_ID == cat.score_category_ID)
                                                .sort(function(a,b) {
                                                    if(a.score_metric_name < b.score_metric_name) return -1;
                                                    if(a.score_metric_name > b.score_metric_name) return 1;
                                                    return 0;
                                                }).map((metric) => {
                                                    let selected = metric.score_metric_ID == this.state.selected_score_metric_ID;
                                                    let passing_score = metric.passing_score == null ? "" : metric.passing_score;
                                                    let score_min = metric.score_min == null ? "" : metric.score_min;
                                                    let score_max = metric.score_max == null ? "" : metric.score_max;

                                                    if(selected) {
                                                        console.log("select metric: ", this.state.SelectedScoreMetric)
                                                        passing_score = this.state.SelectedScoreMetric.passing_score == null ? "" : this.state.SelectedScoreMetric.passing_score;
                                                        score_min = this.state.SelectedScoreMetric.score_min == null ? "" : this.state.SelectedScoreMetric.score_min;
                                                        score_max = this.state.SelectedScoreMetric.score_max == null ? "" : this.state.SelectedScoreMetric.score_max;
                                                    }
                                                   
                                                    return (
                                                        <div className={`accordian-item border p-3`} key={metric.score_metric_ID}>
                                                            <div className="{`accordian-header pb-3 ${selected && 'bg-info'}`} id={`heading-${metric.score_metric_ID}`}">
                                                                <div className="" onClick={() => this.handleSelectMetric(metric)}>
                                                                    <span className="float-start pe-3"><FontAwesomeIcon icon={`${selected && 'chevron-down' || 'chevron-right'}`} /></span>
                                                                    <span className="float-start">
                                                                        <button className={`h4 accordion-button float-start ${!selected && 'collapsed'}`} type="button" data-bs-toggle="collapse" data-bs-target={`collapse-${metric.score_metric_ID}`} aria-expanded={selected} aria-controls={`collapse-${metric.score_metric_ID}`}>
                                                                            {metric.score_metric_name}
                                                                        </button>
                                                                    </span>
                                                                </div>
                                                                {/* Plus / Minus selection for changing the metric's perfectage in-line */}
                                                                <span className="float-end">
                                                                    <span className="pe-2" onClick={() => this.changeMetricPercentage(metric.score_metric_ID, metric.score_percentage_of_category, 'subtract')}><FontAwesomeIcon icon="minus"/></span>
                                                                    <span>{metric.score_percentage_of_category}</span>
                                                                    <span className="ps-2" onClick={() => this.changeMetricPercentage(metric.score_metric_ID, metric.score_percentage_of_category, 'add')}><FontAwesomeIcon icon="plus"/></span>
                                                                </span>
                                                            </div>
                                                            <div id={`collapse-${metric.score_metric_ID}`} className={`accordion-collapse w-full mt-3 collapse ${selected && 'show'}`} aria-labelledby={`heading-${metric.score_metric_ID}`} data-bs-parent="#accordionExample">
                                                                <div className="accordion-body clearfix">
                                                                    {/* Prevent showing form until the selected score metric is loaded into state */}
                                                                    {
                                                                        this.state.selected_score_metric_ID == this.state.SelectedScoreMetric.score_metric_ID &&
                                                                        <form>
                                                                            <div className="row m-0 w-100">
                                                                                <div className="col-md-6">
                                                                                    <div className="form-floating">
                                                                                        <input className="form-control" id="score_metric_name" value={this.state.SelectedScoreMetric.score_metric_name} onChange={(event) => this.changeSelectedScoreMetricValue('score_metric_name', event.target.value)} />
                                                                                        <label htmlFor="score_metric_name">Metric Name</label>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="col-md-3">
                                                                                    <div className="form-floating">
                                                                                        <input className="form-control" id="score_units" value={this.state.SelectedScoreMetric.score_units || ""} onChange={(event) => this.changeSelectedScoreMetricValue('score_units', event.target.value)} />
                                                                                        <label htmlFor="score_units">Units</label>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="col-md-3">
                                                                                    <div className="form-floating">
                                                                                        <input className="form-control" id="score_percentage_of_category" value={this.state.SelectedScoreMetric.score_percentage_of_category} onChange={(event) => this.changeSelectedScoreMetricValue('score_percentage_of_category', event.target.value)} />
                                                                                        <label htmlFor="score_percentage_of_category">% of Category</label>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="row m-0 mt-2 w-100">
                                                                                <div className="col-md-6">
                                                                                    <div className="form-floating">
                                                                                        <select className="form-select" aria-label=".form-select" id="score_category_ID" value={this.state.SelectedScoreMetric.score_category_ID} onChange={(event) => this.changeSelectedScoreMetricValue('score_category_ID', event.target.value)}>
                                                                                            {this.state.ScoreCategories.map((cat) => {
                                                                                                return (
                                                                                                    <option value={cat.score_category_ID} key={cat.score_category_ID}>{cat.score_category_name}</option>   
                                                                                                )
                                                                                            })}
                                                                                        </select>
                                                                                        <label htmlFor="score_category_ID">Score Category</label>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="col-md-3">
                                                                                    <div className="form-floating">
                                                                                        <input className="form-control" id="score_min" value={score_min} onChange={(event) => this.changeSelectedScoreMetricValue('score_min', event.target.value)} />
                                                                                        <label htmlFor="score_min">Score Min</label>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="col-md-3">
                                                                                    <div className="form-floating">
                                                                                        <input className="form-control" id="score_max" value={score_max} onChange={(event) => this.changeSelectedScoreMetricValue('score_max', event.target.value)} />
                                                                                        <label htmlFor="score_max">Score Max</label>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="row m-0 mt-2 w-100">
                                                                                <div className="col-md-6">
                                                                                    <div className="form-floating">
                                                                                        <select className="form-select" aria-label=".form-select" id="score_source_ID" value={this.state.SelectedScoreMetric.score_source_ID} onChange={(event) => this.changeSelectedScoreMetricValue('score_source_ID', event.target.value)}>
                                                                                            {this.state.ScoreSources.map((source) => {
                                                                                                return (
                                                                                                    <option value={source.score_source_ID} key={source.score_source_ID}>{source.source_name}</option>   
                                                                                                )
                                                                                            })}
                                                                                        </select>
                                                                                        <label htmlFor="score_source_ID">Source</label>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="col-md-3">
                                                                                    <div className="form-check">
                                                                                        <input className="form-check-input" type="checkbox" id="" checked={parseInt(this.state.SelectedScoreMetric.pass_fail) == 1} value={this.state.SelectedScoreMetric.pass_fail || ""} onChange={() => this.changeSelectedScoreMetricValue('pass_fail', this.state.SelectedScoreMetric.pass_fail, 'checkbox')} />
                                                                                        <label className="form-check-label" htmlFor="">Pass / Fail</label>
                                                                                    </div>
                                                                                    {/* <div className="form-check">
                                                                                        <input className="form-check-input" type="checkbox" id="" checked={parseInt(this.state.SelectedScoreMetric.allow_partial_score) == 1} value={this.state.SelectedScoreMetric.allow_partial_score || ""} onChange={() => this.changeSelectedScoreMetricValue('allow_partial_score', this.state.SelectedScoreMetric.allow_partial_score, 'checkbox')} />
                                                                                        <label className="form-check-label" htmlFor="">Allow Partial Score</label>
                                                                                    </div> */}
                                                                                </div>
                                                                                <div className="col-md-3">
                                                                                    {this.state.SelectedScoreMetric.pass_fail == 1 && 
                                                                                            <div className="form-floating">
                                                                                                <input className="form-control" id="passing_score" value={passing_score} onChange={(event) => this.changeSelectedScoreMetricValue('passing_score', event.target.value)} />
                                                                                                <label htmlFor="passing_score">Passing Score</label>
                                                                                            </div>
                                                                                    }
                                                                                    {this.state.SelectedScoreMetric.pass_fail !== 1 && 
                                                                                            <div className="form-floating">
                                                                                                <input className="form-control" disabled id="passing_score" value={passing_score} onChange={(event) => this.changeSelectedScoreMetricValue('passing_score', event.target.value)} />
                                                                                                <label htmlFor="passing_score">Passing Score</label>
                                                                                            </div>
                                                                                    }
                                                                                </div>
                                                                                <div className="mt-2">
                                                                                    <button type="button" className="btn btn-success btn-sm" onClick={() => this.saveSelectedMetric()}>Save</button>
                                                                                </div>
                                                                            </div>
                                                                            {/* Partial Score Area 
                                                                            {
                                                                                (this.state.SelectedScoreMetric.allow_partial_score == 'true' || parseInt(this.state.SelectedScoreMetric.allow_partial_score) == 1) &&
                                                                                <div className="row m-0 mt-2 w-100">
                                                                                    <div className="col-md-6">
                                                                                        <div className="form-check">
                                                                                            <input className="form-check-input" type="checkbox" id="" value={this.state.SelectedScoreMetric.pass_fail || ""} onChange={() => this.changeSelectedScoreMetricValue('pass_fail', !this.state.SelectedScoreMetric.pass_fail)} />
                                                                                            <label className="form-check-label" htmlFor="">Pass / Fail</label>
                                                                                        </div>
                                                                                        <div className="form-check">
                                                                                            <input className="form-check-input" type="checkbox" id="" value={this.state.SelectedScoreMetric.allow_partial_score || ""} onChange={() => this.changeSelectedScoreMetricValue('allow_partial_score', !this.state.SelectedScoreMetric.allow_partial_score)} />
                                                                                            <label className="form-check-label" htmlFor="">Allow Partial Score</label>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="col-md-3">
                                                                                        {this.state.SelectedScoreMetric.pass_fail == true && 
                                                                                                <div className="form-floating">
                                                                                                    <input className="form-control" id="passing_score" value={this.state.SelectedScoreMetric.passing_score || ""} onChange={(event) => this.changeSelectedScoreMetricValue('passing_score', event.target.value)} />
                                                                                                    <label htmlFor="passing_score">Passing Score</label>
                                                                                                </div>
                                                                                        }
                                                                                        {this.state.SelectedScoreMetric.pass_fail !== true && 
                                                                                                <div className="form-floating">
                                                                                                    <input className="form-control" disabled id="passing_score" value={this.state.SelectedScoreMetric.passing_score || ""} onChange={(event) => this.changeSelectedScoreMetricValue('passing_score', event.target.value)} />
                                                                                                    <label htmlFor="passing_score">Passing Score</label>
                                                                                                </div>
                                                                                        }
                                                                                    </div>
                                                                                    <div className="mt-2">
                                                                                        <button type="button" className="btn btn-success btn-sm" onClick={() => this.saveSelectedMetric()}>Save</button>
                                                                                    </div>
                                                                                </div>  
                                                                            }  */}
                                                                        </form>
                                                                    }                                                                   
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                        {/* <div className="card-footer"></div> */}
                                    </div>
                                </div>
                            )
                        })}                
                    </div>
                </div>
            </React.Fragment>
		)
	}
}


export const AdminNuHouseScoreComponent = compose(
	queryWithLoading({
		gqlString: GetScoreCategories,
        name: "ScoreCategories"
	}),
    queryWithLoading({
		gqlString: GetScoreMetrics,
        name: "ScoreMetrics"
	}),
    queryWithLoading({
		gqlString: GetScoreSources,
        name: "ScoreSources"
	}),
	queryWithLoading({
		gqlString: GetUsers,
        name: "Users"
	}),
	withMutation(SaveScoreMetric, "SaveScoreMetric"),
    graphql(SaveScoreMetric)
)(AdminNuHouseScoreClass)

	// withMutation(MachineSaveMutation, "MachineSaveMutation", [{query: getMachinesQuery}]),
