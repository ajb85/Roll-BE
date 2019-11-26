module.exports = View =>
  new View('scores as s')
    .create('player_scores')
    .select('s.game_id', 's.user_id', 's.score')
    .join('users AS u', { 'u.id': 's.user_id' })
    .groupBy('s.game_id', 's.user_id', 's.score')
    .run();
