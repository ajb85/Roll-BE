const router = require("express").Router();

const Logs = require("models/queries/gameLogs.js");

const getUserListForGame = require("middleware/getUserListForGame.js");
const { verifyUserInGame } = require("middleware/playGames.js");

const Sockets = require("sockets/");

router.post("/react/:game_id/:log_id", verifyUserInGame, getUserListForGame, async (req, res) => {
  const { user_id } = res.locals.token;
  const { game_id, log_id } = req.params;
  const { reaction } = req.body;

  const reactionObj = { user_id, game_id, log_id, reaction };
  const isRemoving = await Logs.findReactions(reactionObj, true);
  const method = isRemoving ? "deleteReaction" : "react";
  const log = await Logs.method(reactionObj);
  Sockets.emitGameUpdate(Object.keys(scores), { log });
  return res.status(isRemoving ? 200 : 201).json(log);
});

module.exports = router;
