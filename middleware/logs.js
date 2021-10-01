const Games = require("models/queries/games.js");
const Rolls = require("models/queries/rolls.js");
const Scores = require("models/queries/scores.js");
const Logs = require("models/queries/gameLogs.js");

module.exports = { verifyUserInGame };

async function verifyUserInGame(req, res, next) {
  const { user_id } = res.locals.token;
  const { log_id } = req.params;

  const log = await Logs.find({ "gl.id": log_id }, true);
  const game = await Games.find({ "g.id": log.game_id, "u.id": user_id }, true);

  if (!game) {
    return res.status(404).json({ message: "Game not found" });
  }

  if (!game.isActive) {
    return res.status(400).json({ requestType: "play", message: "Game is no longer active." });
  }
  if (!game.scores[user_id]) {
    return res.status(400).json({
      requestType: "play",
      message: "You are not in this game.",
    });
  }

  res.locals.game = game;
  next();
}
