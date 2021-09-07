module.exports = {
  getGameRound,
  getUserRound,
  isUsersTurn,
  getUsersOnRound,
  isPlayableCategory,
  isGameJoinable,
  getWinners,
  getHighestScore,
};

function getGameRound(game) {
  let lowestRound;

  for (let user_id in game.scores) {
    const round = getUserRound(game, user_id);
    game.scores[user_id].round = round;
    if (!lowestRound || round < lowestRound) {
      lowestRound = round;
    }
  }

  return lowestRound || 0;
}

function getUserRound(game, user_id) {
  let round = 0;
  const { score: userScore } = game?.scores?.[user_id] || {};

  if (userScore) {
    for (let category in userScore) {
      if (userScore[category] !== null && isPlayableCategory(category)) {
        round++;
      }
    }
  }

  return round;
}

function isUsersTurn(game, user_id) {
  const gameRound = getGameRound(game);
  const userRound = getUserRound(game, user_id);

  return userRound <= gameRound;
}

const playableCategories = {
  Ones: true,
  Twos: true,
  Threes: true,
  Fours: true,
  Fives: true,
  Sixes: true,
  "3 of a Kind": true,
  "4 of a Kind": true,
  "Full House": true,
  "Sm Straight": true,
  "Lg Straight": true,
  "Roll!": true,
  "Free Space": true,
};

function isPlayableCategory(category) {
  return !!playableCategories[category];
}

function isGameJoinable(game) {
  return getUserRound(game, game.owner) === 0;
}

function getUsersOnRound(game) {
  const { scores, currentRound } = game;

  const users = {};
  for (let player in scores) {
    const { round } = scores[player] || { round: 0 };
    if (round === currentRound) {
      users[player] = true;
    }
  }

  users.count = Object.keys(users).length;

  return users;
}

function getHighestScore(game) {
  return Object.values(game.scores).reduce(
    (highest, { score }) => (score["Grand Total"] > highest ? score["Grand Total"] : highest),
    0
  );
}

function getWinners(game) {
  if (Number(game.currentRound) >= 13) {
    const winnerLookup = Object.keys(game.scores).reduce((w, userID) => {
      const score = game.scores[userID].score["Grand Total"];
      if (!w || score > w.score) {
        return { [userID]: true, score: game.scores[userID].score["Grand Total"] };
      } else if (score === w.score) {
        w.userID = true;
        return w;
      }

      return w;
    }, null);

    Object.entries(game.scores).forEach(([userID, score]) => {
      score.isWinner = !!winnerLookup[userID];
    });
  }

  return game;
}
