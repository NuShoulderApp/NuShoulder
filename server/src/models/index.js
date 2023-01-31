import dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
import * as path from 'path';
import Sequelize from 'sequelize';
import {fileURLToPath} from 'url';

// const basename = path.basename(__filename);
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

import config from '../config/config.js';
// Import all of the database tables from the models folder, and put their import value into the models array below
import score_categories_db from './score_categories.js';
import score_metrics_db from './score_metrics.js';
import score_sources_db from './score_sources.js';
import users_db from './users.js';
// const config = require('./config')[env];

const db = {};

let sequelize;
// if (config[env].use_env_variable) {
//   sequelize = new Sequelize(config[env].use_env_variable, config[env]);
// } else {
  sequelize = new Sequelize(
    config[env].database,
    config[env].username,
    config[env].password,
    config[env],
  );
// }

try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully!');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}


// From example: https://blog.logrocket.com/creating-scalable-graphql-api-mysql-apollo-node/
// https://github.com/DirkWolthuis/graphql-express-migrating-mysql
    let models = [
        score_categories_db,
        score_metrics_db,
        score_sources_db,
        users_db
        // require('./models/users.js'),
    ]

    // const seqModel = user123(sequelize, Sequelize);
    // db[seqModel.name] = seqModel;
    // // Initialize models
    models.forEach(model => {
        const seqModel = model(sequelize, Sequelize)
        db[seqModel.name] = seqModel
    })

    // // Apply associations
    Object.keys(db).forEach(key => {
        if ('associate' in db[key]) {
            db[key].associate(db)
        }
    })

// From one example - not sure how this fs. is working
    // fs.readdirSync(__dirname)
    //   .filter((file) => (
    //     file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    //   ))
    //   .forEach((file) => {
    //     const model = sequelize.define(path.join(__dirname, file));
    //     //const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes)
    //     db[model.name] = model;
    //   });

    // Object.keys(db).forEach((modelName) => {
    //   if (db[modelName].associate) {
    //     db[modelName].associate(db);
    //   }
    // });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;