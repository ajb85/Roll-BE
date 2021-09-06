const {
  getGameRound,
  isUsersTurn,
  isGameJoinable,
  getUsersOnRound,
  getWinners,
} = require("Game/Data/");

module.exports = function getGameWithStatuses(game, user_id) {
  const g = { ...game };

  g.currentRound = getGameRound(g);
  g.isJoinable = isGameJoinable(g);
  g.usersOnRound = getUsersOnRound(g); // Must be after g.currentRound
  getWinners(g);
  if (user_id) {
    g.isUsersTurn = isUsersTurn(g, user_id);
  }

  return g;
};
