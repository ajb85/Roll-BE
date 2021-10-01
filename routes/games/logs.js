const router = require("express").Router();

const Logs = require("models/queries/gameLogs.js");

const getUserListForGame = require("middleware/getUserListForGame.js");
const { verifyUserInGame } = require("middleware/logs.js");

const Sockets = require("sockets/");

router.post("/react/:log_id", verifyUserInGame, getUserListForGame, async (req, res) => {
  const { user_id } = res.locals.token;
  const { game_id } = res.locals.game;
  const { log_id } = req.params;
  const reaction = JSON.stringify(req.body.reaction);

  const isRemoving = await Logs.findReactions(
    {
      user_id,
      log_id,
      "reaction @>": JSON.stringify({ unified: req.body.reaction.unified }),
    },
    true
  );

  const log = isRemoving
    ? await Logs.deleteReaction(isRemoving.id, game_id)
    : await Logs.react({ user_id, log_id, reaction }, game_id);
  Sockets.emitGameUpdate(res.locals.userList, { log });
  return res.status(isRemoving ? 200 : 201).json(log);
});

module.exports = router;
