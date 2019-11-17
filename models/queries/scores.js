const Query = require('../index.js');

module.exports = { find };

function find(filter, first) {
  return new Query('scores')
    .select('*')
    .where(filter)
    .first(first)
    .run();
}
