const db = require('../index.js');

module.exports = { find, create, join, usersInGame };

function find(filter) {
  // return filter
  if (filter) {
    return db('games as g')
      .select(
        'g.id as game_id',
        'g.name as name',
        'g.password as password',
        db.raw('ARRAY_AGG(ug.user_id) as players')
      )
      .join('users_in_game as ug', { 'ug.game_id': 'g.id' })
      .groupBy('g.id')
      .where(filter);
  }
  // .join('users as u', { 'ug.user_id': 'u.id' })
  return db('games as g')
    .select(
      'g.id as game_id',
      'g.name as name',
      'g.password as password',
      'g.last_action as last_action',
      'ug.user_id as players'
    )
    .join('users_in_game as ug', { 'g.id': 'ug.game_id' });
  // .join('users as u', { 'ug.user_id': 'u.id' });
}

function usersInGame(filter) {
  return db('users_in_game').where(filter);
}

function create(game, user_id) {
  return db('games')
    .insert(game, ['*'])
    .then(g =>
      db('users_in_game')
        .insert({ game_id: g[0].id, user_id })
        .then(_ => find({ 'g.id': g[0].id }).first())
    );
}

function join(game_id, user_id) {
  return db('users_in_game')
    .insert({ game_id, user_id })
    .then(_ => find({ 'g.id': game_id }).first());
}
