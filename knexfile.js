require("dotenv").config();
module.exports = {
  development: {
    client: "postgresql",
    connection: {
      database: process.env.PG_DB,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./models/migrations/",
    },
    seeds: {
      directory: "./models/seeds/",
    },
    useNullAsDefault: true,
  },
  production: {
    client: "postgresql",
    connection: {
    host : process.env.PG_DB,
    user : process.env.PG_USER,
    password : process.env.PG_PASSWORD
  },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./models/migrations/",
    },
    seeds: {
      directory: "./models/seeds/",
    },
    useNullAsDefault: true,
  },
};
