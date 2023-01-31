import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
// import db from './utilities/databaseIndex.js';
import db from './models/index.js';
import typeDefs from './graphql/types/index.js';
import resolvers from './graphql/resolvers/index.js';



const server = new ApolloServer({ 
        typeDefs, 
        resolvers, 
        context: {
            db: db
        }
    });

// `startStandaloneServer` returns a `Promise` with the
// the URL that the server is listening on.
 const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
});
console.log(`🚀  Server ready at ${url}`);

// log uncaught exceptions and kill the server
process.on('uncaughtException', function (err) {
	console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
	console.error(err.stack);
	console.log((new Date).toUTCString() + ' uncaughtException:', err.message);
	console.log(err.stack);
	process.exit(1);
})
// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
//await models.sequelize.sync();
// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
// //   context: {
// //       db: models
// //     }
// });

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
// const { url } = await startStandaloneServer(server, {
//   listen: { port: 4000 },
// //   context: async () => {
// //     const { cache } = server;
// //     const token = req.headers.token;
// //     return {
// //       dataSources: {
// //         moviesApi: new MoviesAPI({ cache, token }),
// //       },
// //       token,
// //     };
// //   }
// });


// THIS IS FROM AN EXAMPLE OF USING SEQUELIZE TO START THE APOLLO SERVER
            // async function start() {
            //   //await models.sequelize.sync();

            //   // The ApolloServer constructor requires two parameters: your schema
            //   // definition and your set of resolvers.
            //   const server = new ApolloServer({ 
            //     typeDefs, 
            //     resolvers,
            //     context: {
            //       db: db
            //     }
            //   });

            //   const { url } = await startStandaloneServer(server, {
            //     listen: { port: 4000 },
            //     //   context: async () => {
            //     //     const { cache } = server;
            //     //     const token = req.headers.token;
            //     //     return {
            //     //       dataSources: {
            //     //         moviesApi: new MoviesAPI({ cache, token }),
            //     //       },
            //     //       token,
            //     //     };
            //     //   }
            // });
            //     console.log(`🚀  Server ready at ${url}`);

            //   // The `listen` method launches a web server.
            // //   server.listen().then(({ url }) => {
            // //     console.log(`🚀  Server ready at ${url}`);
            // //   });
            // }
            // start()
            // //console.log(`🚀  Server ready at: ${url}`);


// THIS IS FROM AN EXAMPLE OF GETTING APOLLO SERVER TO RUN VERY BASIC

            // const express = require("express");
            // const app = express();
            // const PORT = 6969;
            // const {graphqlHTTP} = require("express-graphql");
            // const schema = require("../../client/src/index");

            // app.use(
            //     "/graphql",
            //     graphqlHTTP({
            //         schema,
            //         graphiql: true,
            //     })
            // );

            // // app.get('/', function (req, res) {
            // //     html = fs.readFileSync('index.html');
            // //     res.writeHead(200);
            // //     res.write(html);
            // //     res.end();
            // // });

            // app.listen(PORT, () => {
            //     console.log("server is running!");
            // })