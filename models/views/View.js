const Query = require('../index.js');

module.exports = class View extends Query {
  constructor(table) {
    super(table);
    this.text = ``;
  }

  create(name) {
    this.text = `CREATE OR REPLACE VIEW "${name}" AS` + this.text;

    return this;
  }

  alter(prevName, newName) {
    this.text = `ALTER VIEW ${prevName} RENAME TO ${newName}`;
    return this;
  }

  drop(name) {
    this.text = `DROP VIEW IF EXISTS ${name}`;
    return this;
  }
};
