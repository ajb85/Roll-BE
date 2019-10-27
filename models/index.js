const { Pool, Client } = require('pg');

const environment = process.env.NODE_ENV || 'development';
console.log(`Running ${environment} build.`);

let pool, client;

if (environment === 'production') {
  const connection = {
    connectionString: process.env.HEROKU_POSTGRESQL_IVORY_URL
  };
  pool = new Pool(connection);
  client = new Client(connection);
} else if (environment === 'development') {
  const connection = {
    user: process.env.PG_USER,
    host: 'localhost',
    database: process.env.PG_DB,
    password: process.env.PG_PASSWORD,
    port: process.env.PORT || 5432
  };
  pool = new Pool(connection);
  client = new Client(connection);
}

pool.query('SELECT NOW()', err => {
  if (err) {
    console.log('PG Pool Connection Error: ', err);
  }
  pool.end();
});

client.connect();

client.query('SELECT NOW()', err => {
  if (err) {
    console.log('PG Client Connection Error: ', err);
  }
  client.end();
});
