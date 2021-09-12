require("dotenv").config();
const parse = require("pg-connection-string").parse;
const pgConfig = process.env.DATABASE_URL ? parse(process.env.DATABASE_URL) : {};
pgConfig.ssl = { rejectUnauthorized: false };

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
    connection: pgConfig,
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
