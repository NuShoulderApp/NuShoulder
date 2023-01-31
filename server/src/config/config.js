import dotenv from 'dotenv';
dotenv.config();

export default {
  development: {
    username: 'admin',
    password: 'Q!w2e3r4t5y6u7i8o9p0',
    database: 'NuShoulder Dev', // This is the name of the database schema that we create for the RDS database instance, NOT the name of the RDS database instance. This one was created using MySQL Work Bench
    host: 'nushoulderdb.cj56ckbsvz17.us-east-1.rds.amazonaws.com',
    dialect: 'mysql',
    use_env_variable: '34.233.102.126',
  },
//   production: {
//     username: 'root',
//     password: null,
//     database: 'database_production',
//     host: '127.0.0.1',
//     dialect: 'postgres',
//     host: '127.0.0.1',
//     dialect: 'postgres',
//     use_env_variable: 'DATABASE_URL',
//   },
};