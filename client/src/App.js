import React from "react";
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';	// IMPORTANT: Add any icons you want to use to the index.js import { ... } from '@fortawesome/free-solid-svg-icons' AND library.add(...)
import { Link, NavLink } from "react-router-dom";
import logo from './logo.svg';
import './App.css';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    HttpLink,
    from,
} from "@apollo/client";
//import {onError} from "apollo-client-link-error";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
          Does this go in already? 123
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
