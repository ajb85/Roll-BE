const db = require('../index.js');

module.exports = { find };

function find(filter) {
  if (filter) {
    return db('scores').where(filter);
  }
}
