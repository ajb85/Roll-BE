const { Client } = require('pg');

const environment = process.env.NODE_ENV || 'development';
const connection =
  environment === 'production'
    ? {
        connectionString: process.env.HEROKU_POSTGRESQL_IVORY_URL
      }
    : environment === 'development'
    ? {
        user: process.env.PG_USER,
        host: 'localhost',
        database: process.env.PG_DB,
        password: process.env.PG_PASSWORD,
        port: process.env.PORT || 5432
      }
    : console.error(`Whoops, you didn't account for ${environment} builds`);

const client = new Client(connection);
client.connect();

module.exports = class Query {
  constructor(table) {
    this.client = client;
    this.table = table;
    this.values = [];

    // Listed for ease of reading
    this.first;
    this.text;
    this.then;
  }

  run() {
    console.log('QUERY: ', this.text);
    console.log('VALUES: ', this.values);
    return client
      .query({ text: this.text, values: this.values })
      .then(res => {
        const data = this.first ? res.rows[0] : res.rows;
        return this.then ? this.then(data) : data;
      })
      .catch(err => console.error('QUERY ERROR: ', err));
  }

  select(select) {
    this.text = `SELECT ${select} FROM ${this.table}`;
    return this;
  }

  update(newInfo, ...returnValues) {
    if (!newInfo || !Object.keys(newInfo).length) {
      return this;
    }
    this.text = 'UPDATE ' + this.table + this.text;
    this.text += this._iterate('SET', newInfo, ',');
    this.text += this._returning(returnValues);
    return this;
  }

  insert(newUser, ...returnValues) {
    if (!newUser || !Object.keys(newUser).length) {
      return this;
    }
    this.text = 'INSERT INTO ' + this.table + this.text;
    this.text += this._iterate('(', newUser, ',');
    this.text += this._returning(returnValues);
    return this;
  }

  delete(filter) {
    this.text = 'DELETE FROM ' + this.table;
    this.where(filter);

    return this;
  }

  where(filter) {
    if (!filter || !Object.keys(filter).length) {
      return this;
    }

    const whereClause = this._iterate('WHERE', filter, ' AND');
    this.text += whereClause;
    return this;
  }

  first(boolean) {
    this.first = boolean;
    return this;
  }

  then(cb) {
    this.then = cb;
    return this;
  }

  _iterate(startTerm, data, joinTerm) {
    const keys = Object.keys(data);
    let str = ' ' + startTerm;

    for (let i = 0; i < keys.length; i++) {
      const index = this.values.length + 1;
      const key = keys[i];

      if (i > 0) {
        str += joinTerm;
      }

      str += ` ${key} = $${index}`;
      this.values.push(data[key]);
    }
    return str;
  }

  _returning(arg) {
    if (!arg.length) {
      arg = ['*'];
    }

    return ` RETURNING ${arg.join(', ')}`;
  }
};
