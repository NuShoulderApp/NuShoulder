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

import config from './config.js';
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
console.log({sequelize})
try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

fs.readdirSync(__dirname)
  .filter((file) => (
    file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
  ))
  .forEach((file) => {
    const model = sequelize.define(path.join(__dirname, file));
    //const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes)
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;