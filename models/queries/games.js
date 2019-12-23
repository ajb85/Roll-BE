const Query = require('../index.js');
const { clearRolls } = require('./rolls.js');

module.exports = {
  find,
  edit,
  create,
  join,
  leave,
  saveScore,
  updateLastAction
};

function find(filter, first) {
  return new Query('games AS g')
    .select(
      'g.id AS game_id',
      'g.name AS name',
      'g.password AS password',
      'g.isActive AS isActive',
      'g.isJoinable AS isJoinable',
      "CASE WHEN count(r) = 0 THEN '[]' ELSE json_agg(DISTINCT r.dice) END AS rolls",
      'jsonb_object_agg(ps.user_id, ps.*) as scores',
      'count(DISTINCT ps.user_id) as playerCount'
    )
    .join('users_in_game as ug', { 'ug.game_id': 'g.id' })
    .join('users as u', { 'u.id': 'ug.user_id' })
    .join('player_scores as ps', { 'ps.game_id': 'g.id' })
    .join('rolls as r', { 'r.game_id': 'g.id' }, 'LEFT')
    .where(filter)
    .groupBy('g.id', 'ps.game_id')
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
    .insert(newGame, '*')
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
    .insert({ game_id, user_id }, ['*'])
    .first(true)
    .then(async _ => {
      await new Query('scores').insert({ game_id, user_id }).run();
      return find({ 'g.id': game_id }, true);
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

      return users && (users.length || users.game_id)
        ? find({ 'g.id': game_id }, true)
        : edit({ id: game_id }, { isActive: false, isJoinable: false });
    })
    .run();
}

function saveScore(filter, newScore) {
  return new Query('scores')
    .update(newScore)
    .where(filter)
    .first(true)
    .then(async s => {
      await clearRolls(filter);
      return find({ 'g.id': s.game_id }, true);
    })
    .run();
}

function updateLastAction(id) {
  return new Query('games')
    .where({ id })
    .update({ last_action: new Date() }, ['*']);
}
