module.exports = View =>
  new View('rolls as r')
    .create('user_rolls')
    .select('r.user_id', 'r.game_id', 'r.dice')
    .join('users AS u', { 'u.id': 'r.user_id' })
    .groupBy('r.user_id', 'r.game_id', 'r.dice')
    .run();
