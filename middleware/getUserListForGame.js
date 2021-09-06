const Games = require("models/queries/games.js");

module.exports = async function getUserListForGame(req, res, next) {
  const { user_id } = res.locals.token;
  const { game_id } = req.params;

  if (!game_id && !res.locals.game) {
    throw new Error("Cannot use getUserListForGame middleware without a game_id param");
  }

  if (!res.locals.game) {
    res.locals.game = await Games.find({ "g.id": game_id }, true);
  }

  const { game } = res.locals;
  res.locals.userList = Object.keys(game.scores).reduce((ul, userID) => {
    if (userID !== user_id) {
      ul.push(userID);
    }
    return ul;
  }, []);

  next();
};
