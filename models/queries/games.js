const Query = require('../index.js');

module.exports = { find, edit, create, join, leave };

function find(filter, first) {
  return new Query('games AS g')
    .select(
      'g.id AS game_id',
      'g.name AS name',
      'g.password AS password',
      'g.isActive AS isActive',
      'g.isJoinable AS isJoinable',
      // 'array_agg(DISTINCT ug.user_id) AS players'
      "array_agg(json_build_object('user_id', u.id, 'username', u.username)) as players",
      "array_agg(json_build_object('user_id', s.user_id, 'Ones', s.Ones, 'Twos', s.Twos, 'Threes', s.Threes, 'Fours', s.Fours, 'Fives', s.Fives, 'Sixes', s.Sixes, 'Left Total', s.Left Total, '3 of a Kind', s.3 of a Kind, '4 of a Kind', s.4 of a Kind, 'Full House', s.Full House, 'Sm Straight', s.Sm Straight, 'Lg Straight', s.Lg Straight, 'Roll!', s.Roll!, 'Roll Bonus', s.Roll! Bonus, 'Free Space', s.Free Space, 'Grand Total', s.Grand Total)) as scores"
    )
    .join('users_in_game AS ug', { 'ug.game_id': 'g.id' })
    .join('scores AS s', { 's.game_id': 'g.id' }, 'LEFT')
    .join('users AS u', { 'u.id': 'ug.user_id' })
    .where(filter)
    .groupBy('g.id')
    .first(first)
    .run();
}

function edit(filter, newInfo) {
  return new Query('games')
    .update(newInfo)
    .where(filter)
    .first(true)
    .then(g => find({ 'g.id': g.id }, true))
    .run();
}

function create(newGame, user_id) {
  return new Query('games')
    .insert(newGame)
    .first(true)
    .then(async g => {
      const game_id = g.id;
      await new Query('users_in_game').insert({ game_id, user_id }).run();
      await new Query('scores').insert({ game_id, user_id }).run();
      return find({ 'g.id': g.id }, true);
    })
    .run();
}

function join(game_id, user_id) {
  return new Query('users_in_game')
    .insert({ game_id, user_id })
    .first(true)
    .then(async _ => {
      await new Query('scores').insert({ game_id, user_id }).run();
      return find({ 'g.id': game_id });
    })
    .run();
}

function leave(game_id, user_id) {
  return new Query('users_in_game')
    .delete({ game_id, user_id })
    .then(async _ => {
      await new Query('scores').delete({ game_id, user_id }).run();
      const users = await new Query('users_in_game')
        .select('*')
        .where({ game_id })
        .run();

      return users && users.length
        ? find({ 'g.id': game_id })
        : edit({ id: game_id }, { isActive: false, isJoinable: false });
    })
    .run();
}
