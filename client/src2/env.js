// use the .env file to set variable configuration settings - must be the first line of code in the main index.js file
require('dotenv').config();	
console.log("required dotenv");
console.log("process.env.REACT_APP_GRAPHQL_ENDPOINT: " + process.env.REACT_APP_GRAPHQL_ENDPOINT);
console.log(process.env);