const Scores = require('models/db/scores.js');

module.exports = { getGameRound, isUsersTurn, isPlayableCategory };

async function getGameRound(game_id, user_id) {
  const scores = await Scores.find({ game_id });
  let userRound, lowCount;
  scores.forEach(userScore => {
    let count = 0;

    for (category in userScore) {
      count =
        userScore[category] && isPlayableCategory(category) ? ++count : count;
    }

    if (user_id && userScore.user_id === user_id) {
      userRound = count;
    }

    lowCount = !lowCount || count < lowCount ? count : lowCount;
  });

  return user_id ? userRound <= lowCount : lowCount;
}

async function isUsersTurn(game_id, user_id) {
  return await getGameRound(game_id, user_id);
}

function isPlayableCategory(category) {
  return {
    Ones: true,
    Twos: true,
    Threes: true,
    Fours: true,
    Fives: true,
    Sixes: true,
    '3 of a Kind': true,
    '4 of a Kind': true,
    'Full House': true,
    'Sm Straight': true,
    'Lg Straight': true,
    'Roll!': true,
    'Free Space': true
  }.hasOwnProperty(category);
}
