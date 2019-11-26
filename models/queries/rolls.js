const Query = require('../index.js');

module.exports = { find, saveRoll, clearRolls };

function find(filter, first) {
  return new Query('rolls')
    .select('*')
    .where(filter)
    .first(first)
    .run();
}

function saveRoll(newRoll) {
  return new Query('rolls')
    .insert(newRoll)
    .first(true)
    .then(d => find({ id: d.id }, true))
    .run();
}

function clearRolls(filter) {
  return new Query('rolls').delete(filter).run();
}
