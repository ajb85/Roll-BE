const { client, cb } = require('../index.js');

module.exports = { saveRoll };

function saveRoll(game_id, user_id, dice) {
  const query = {
    text: 'INSERT INTO DICE(game_id, user_id, dice) VALUE($1, $2)',
    values: [game_id, user_id, dice]
  };

  return client.query(query, cb);
}
