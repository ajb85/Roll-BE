const { Client } = require('pg');

const environment = process.env.NODE_ENV || 'development';
const connection =
  environment === 'production'
    ? {
        connectionString: process.env.DATABASE_URL
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
    this.text = '';

    // Listed for ease of reading
    this.first;
    this.callback;
    this.returning;
  }

  run() {
    // console.log('QUERY: ', this.text);
    // console.log('VALUES: ', this.values);
    if (this.returning) {
      this.text += ` RETURNING ${this.returning}`;
    }

    return this.client
      .query({ text: this.text, values: this.values })
      .then(res => {
        const data = this.first ? res.rows[0] : res.rows;
        if (!this.callback) {
          // console.log('RETURNING DATA: ', data);
        }
        return this.callback ? this.callback(data) : data;
      })
      .catch(err => console.error('QUERY ERROR: ', err));
  }

  table(table) {
    this.table = table;
  }

  select(...select) {
    const formattedStr = select
      .map(x => {
        if (x.substring(0, 4).toLowerCase() === 'case') {
          return x;
        }
        const toSplit =
          x.indexOf('AS') > 0 ? ' AS ' : x.indexOf('as') ? ' as ' : ' ';
        const split = x.split(toSplit);
        if (split[0] === '*') {
          return x;
        }
        if (split.length <= 1) {
          return this._dotQuotes(x);
        }
        return split.map(y => this._dotQuotes(y)).join(toSplit);
      })
      .join(', ');

    if (this.text.length) {
      this.text += ' ';
    }

    this.text += `SELECT ${formattedStr} FROM ${this.table}`;
    return this;
  }

  update(newInfo, ...returnValues) {
    if (!newInfo || !Object.keys(newInfo).length) {
      return this;
    }

    this.text = 'UPDATE ' + this.table + this.text;
    this.text += this._iterateEquals('SET', newInfo, ',');
    this._returning(returnValues);
    return this;
  }

  insert(newUser, ...returnValues) {
    if (newUser && Object.keys(newUser).length) {
      this.text = 'INSERT INTO ' + this.table;
      this.text += this._iterateColumnsAndValues(newUser);
      this._returning(returnValues);
    }

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

    const whereClause = this._iterateEquals('WHERE', filter, ' AND');
    this.text += whereClause;
    return this;
  }

  first(boolean) {
    this.first = boolean;
    return this;
  }

  then(cb) {
    this.callback = cb;
    return this;
  }

  join(table, conditions, joinType = 'INNER') {
    this.text += ` ${joinType.toUpperCase()} JOIN ${table}${this._iterateEqualsLiteral(
      'ON',
      conditions,
      ' AND'
    )}`;
    return this;
  }

  groupBy(...arg) {
    this.text += ` GROUP BY ${arg.map(str => this._dotQuotes(str)).join(', ')}`;
    return this;
  }

  orderBy(...arg) {
    this.text += ` ORDER BY ${arg.map(str => this._dotQuotes(str)).join(', ')}`;
    return this;
  }

  raw(text) {
    if (this.text.length) {
      this.text += ' ';
    }
    this.text += text;

    return this;
  }

  _dotQuotes(str) {
    const exitString = {
      json_build_object: true,
      row_to_json: true
    };
    const openParensIndex = str.indexOf('(');
    if (openParensIndex > -1) {
      const closeParensIndex = str.lastIndexOf(')');
      const aggFunctionName = str.substring(0, openParensIndex).toLowerCase();

      if (exitString[aggFunctionName]) {
        return `${str.substring(0, openParensIndex + 1)}${this._buildObject(
          str.substring(openParensIndex + 1, closeParensIndex).split(', ')
        )})`;
      }

      return `${str.substring(0, openParensIndex + 1)}${this._dotQuotes(
        str.substring(openParensIndex + 1, closeParensIndex)
      )}${str.substring(closeParensIndex)}`;
    }

    const commaIndex = str.indexOf(',');
    if (commaIndex > -1) {
      return str
        .split(', ')
        .map(x => this._dotQuotes(x))
        .join(', ');
    }

    const dotIndex = str.indexOf('.');
    if (dotIndex > 0) {
      const afterDotStr = str.substring(dotIndex + 1);
      const parensIndex = str.indexOf(')');

      const quotationsStr =
        parensIndex === -1
          ? afterDotStr === '*'
            ? afterDotStr
            : `"${afterDotStr}"`
          : `"${str.substring(dotIndex + 1, parensIndex)}"${y.substring(
              parensIndex
            )}`;
      return `${str.substring(0, dotIndex + 1)}${quotationsStr}`;
    } else {
      return str[0] === '"' || str[0] === "'"
        ? str
        : str[0] === '/'
        ? str.substring(1, str.length - 1)
        : `"${str}"`;
    }
  }

  _iterateEquals(startTerm, data, joinTerm) {
    const keys = Object.keys(data);
    let str = startTerm ? ' ' + startTerm : '';

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (i > 0) {
        str += joinTerm;
      }

      // typeof data[key] === 'string' ? this._dotQuotes(data[key]) : data[key]
      this.values.push(data[key]);
      str += ` ${this._dotQuotes(key)} = $${this.values.length}`;
    }
    return str;
  }

  _buildObject(arr) {
    if (arr.length <= 1) {
      return arr.join('');
    }

    let str = '';
    for (let i = 0; i < arr.length; i += 2) {
      // Will ignore mismatched number of key/value pairs
      const key = arr[i];
      const value = arr[i + 1];

      if (i > 0) {
        str += ', ';
      }

      // this.values.push(key);
      str += `${key}, ${this._dotQuotes(value)}`;
    }
    return str;
  }

  _iterateEqualsLiteral(startTerm, data, joinTerm) {
    const keys = Object.keys(data);
    let str = startTerm ? ' ' + startTerm : '';

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (i > 0) {
        str += joinTerm;
      }

      str += ` ${this._dotQuotes(key)} = ${this._dotQuotes(data[key])}`;
    }
    return str;
  }

  _iterateColumnsAndValues(data) {
    const keys = Object.keys(data);
    const values = [];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const index = this.values.length + 1;
      this.values.push(data[key]);
      values.push(`$${index}`);
    }

    return '(' + keys.join(', ') + ') VALUES(' + values.join(', ') + ')';
  }

  _returning(arg) {
    if (!arg.length) {
      arg = ['*'];
    }
    this.returning = arg.join(', ');
  }
};
