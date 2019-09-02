const db = require('../index.js');

module.exports = { saveRoll, clearRolls, find };

function saveRoll(game_id, user_id, dice) {
  return db('dice').insert({ user_id, game_id, dice });
}

function find(filter) {
  if (filter) {
    return db('dice').where(filter);
  }
}

function clearRolls(game_id, user_id) {
  return db('dice')
    .where(user_id, game_id)
    .del();
}
