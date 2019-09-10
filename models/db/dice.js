const db = require('../index.js');

module.exports = { saveRoll, clearRolls, find };

function saveRoll(game_id, user_id, dice) {
  return db('dice')
    .insert({ user_id, game_id, dice }, ['*'])
    .then(x => find({ id: x[0].id }).first());
}

function find(filter) {
  if (filter) {
    return db('dice').where(filter);
  }
}

function clearRolls(filter) {
  return db('dice')
    .where(filter)
    .del();
}
