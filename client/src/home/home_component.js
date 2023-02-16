import React from 'react';
import { NavLink} from "react-router-dom";
import _ from 'lodash';
import {flowRight as compose} from 'lodash';
import { castNumerics, queryWithLoading, withMutation } from '../utilities/NSDb.js';
import { graphql } from '@apollo/react-hoc';

import { Collapse, Nav, Navbar, NavbarToggler } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// GRAPHQL QUERY
// import { 
//     GetScoreCategories,
//     GetScoreMetrics,
//     GetScoreSources,
//     SaveScoreMetric
// } from './nuhouse_score_graphql.js';

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


class HomeClass extends React.Component {
	constructor(props) {
    	super(props)
console.log({props})

		this.state = {
            display_view: '',
            NewPlayer: {
                arm_length_left: '',
                arm_length_right: '',
                date_birth: '',
                email: '',
                first_name: '',
                forearm_length_left: '',
                forearm_length_right: '',
                gender: '',
                height: '',
                last_name: '',
                number: '',
                position: '',
                rookie_season: '',
                sport: '',
                weight: ''
            },
            Users: props.Users.users
		}
	}

    savePlayerAccount = () => {

    }

    AddPlayerView() {

        return (
            <div className="">
                <div className="h4 text-center" style={{color: '#e05900'}}>Create {this.state.create_account} Account</div>
                <div className="form-floating">
                    <input className="form-control" id="first_name" value={this.state.first_name} onChange={(event) => this.changeValue('first_name', event.target.value)} />
                    <label htmlFor="first_name">First Name</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="last_name" value={this.state.last_name} onChange={(event) => this.changeValue('last_name', event.target.value)} />
                    <label htmlFor="last_name">Last Name</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="date_birth" value={this.state.date_birth} onChange={(event) => this.changeValue('date_birth', event.target.value)} />
                    <label htmlFor="date_birth">Birthday</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="rookie_season" value={this.state.rookie_season} onChange={(event) => this.changeValue('rookie_season', event.target.value)} />
                    <label htmlFor="rookie_season">Rookie Season</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="height" value={this.state.height} onChange={(event) => this.changeValue('height', event.target.value)} />
                    <label htmlFor="height">Height</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="weight" value={this.state.weight} onChange={(event) => this.changeValue('weight', event.target.value)} />
                    <label htmlFor="weight">Weight</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="arm_length_left" value={this.state.arm_length_left} onChange={(event) => this.changeValue('arm_length_left', event.target.value)} />
                    <label htmlFor="arm_length_left">Arm Length (L)</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="arm_length_right" value={this.state.arm_length_right} onChange={(event) => this.changeValue('arm_length_right', event.target.value)} />
                    <label htmlFor="arm_length_right">Arm Length (R)</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="forearm_length_left" value={this.state.forearm_length_left} onChange={(event) => this.changeValue('forearm_length_left', event.target.value)} />
                    <label htmlFor="forearm_length_left">Forearm Length (L)</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="forearm_length_right" value={this.state.forearm_length_right} onChange={(event) => this.changeValue('forearm_length_right', event.target.value)} />
                    <label htmlFor="forearm_length_right">Forearm Length (R)</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="sport" value={this.state.sport} onChange={(event) => this.changeValue('sport', event.target.value)} />
                    <label htmlFor="sport">Sport</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="postion" value={this.state.postion} onChange={(event) => this.changeValue('postion', event.target.value)} />
                    <label htmlFor="postion">Position</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="number" value={this.state.number} onChange={(event) => this.changeValue('number', event.target.value)} />
                    <label htmlFor="number">Number</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="gender" value={this.state.gender} onChange={(event) => this.changeValue('gender', event.target.value)} />
                    <label htmlFor="gender">Gender</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="email" value={this.state.email} onChange={(event) => this.changeValue('email', event.target.value)} />
                    <label htmlFor="email">Email</label>
                </div>
                <div className="form-floating">
                    <input className="form-control" id="password" value={this.state.password} onChange={(event) => this.changeValue('password', event.target.value)} />
                    <label htmlFor="password">Password</label>
                </div>
                <button className="" type="button" onClick={() => this.savePlayerAccount()} >
                    <FontAwesomeIcon icon="plus" />Save New Player Account
                </button>
            </div>
        )
    }

    PlayerProfileView() {
        let User = this.state.SelectedUser;
        return (
            <div>
                <div className="clearfix">
                    <div className="float-start">
                        {User.last_name}, {User.first_name}
                        {User.position}, {User.number}
                    </div>
                    <div className="float-end">
                        {User.sport}
                        {User.date_birth}
                    </div>
                </div>
                <div>
                    <div>Arm: L: {User.arm_length_left} | R: {User.arm_length_right}</div>
                    <div>Forearm: L: {User.forearm_length_left} | R: {User.forearm_length_right}</div>
                    <div>Height: {User.height}</div>
                    <div>Weight: {User.weight}</div>
                    <button type="button" className="btn btn-default" onClick={() => this.setState({display_view: 'baseline_PTC'})}>
                        View Baseline PTC
                    </button>
                    <button type="button" className="btn btn-default"  onClick={() => this.setState({display_view: 'scan_QR_code'})}>
                        Scan Player's QR Code
                    </button>
                </div>
                <div>
                    Last NuShoulder Workout Entries
                    
                </div>
            </div>

        )
    }

    BaselinePTCView() {
        return (
            <div>Point in Time Capacity</div>
        )
    }

    PlayersView() {
        
        return (
            <div>
                {this.state.Users.map((user) => {
                    return (
                        <div className="clearfix" key={user.user_ID}>
                            <div className="alert alert-info float-start" onClick={() => this.setState({display_view: 'player_profile', selected_user_ID: user.user_ID, SelectedUser: user})}>
                                {user.last_name}, {user.first_name}<br />
                                {user.position}, {user.number}
                            </div>
                            <div className="float-end">
                                <span onClick={() => this.setState({display_view: 'scan_QR_code'})}><FontAwesomeIcon icon="plus" /></span>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    ScanQRCodeView() {
        return (
            <div>Scan QR Code here</div>
        )
    }

	render () {
        console.log("state: ", this.state)
		return (
            <React.Fragment>
                <div className="p-3">
                    {
                        this.state.display_view == '' &&
                        <div>
                            <button className="" type="button" onClick={() => this.setState({display_view: 'add_player'})} >
                                <FontAwesomeIcon icon="plus" />Add a New Player
                            </button>
                            <button className="" type="button" onClick={() => this.setState({display_view: 'players'})} >
                                <FontAwesomeIcon icon="plus" />Players
                            </button>
                        </div>
                    }
                    {
                        this.state.display_view === 'add_player' &&
                        this.AddPlayerView()
                    }
                    {
                        this.state.display_view === 'baseline_PTC' &&
                        this.BaselinePTCView()
                    }
                    {
                        this.state.display_view === 'players' &&
                        this.PlayersView()
                    }
                    {
                        this.state.display_view === 'player_profile' &&
                        this.PlayerProfileView()
                    }
                    {
                        this.state.display_view === 'scan_QR_code' &&
                        this.ScanQRCodeView()
                    }
                </div>
            </React.Fragment>
		)
	}
}


export const HomeComponent = compose(
	queryWithLoading({
		gqlString: GetUsers,
        name: "Users"
	})
)(HomeClass)

// withMutation(MachineSaveMut,
	// withMutation(SaveScoreMetric, "SaveScoreMetric"),
    // graphql(SaveScoreMetric)ation, "MachineSaveMutation", [{query: getMachinesQuery}]),
