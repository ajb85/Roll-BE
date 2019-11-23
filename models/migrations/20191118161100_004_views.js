const View = require('../View.js');

exports.up = function() {
  return new View('scores as s')
    .create('playerScores')
    .select(
      's.user_id',
      'u.username',
      's.Ones',
      's.Twos',
      's.Threes',
      's.Fours',
      's.Fives',
      's.Sixes',
      's.Left Total',
      's.3 of a Kind',
      's.4 of a Kind',
      's.Full House',
      's.Sm Straight',
      's.Lg Straight',
      's.Roll!',
      's.Roll! Bonus',
      's.Free Space',
      's.Grand Total'
    )
    .join('users AS u', { 'u.id': 's.user_id' })
    .run();
};

exports.down = function() {
  return new View().drop('playerScores').run();
};
