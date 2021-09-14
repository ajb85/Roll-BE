const router = require("express").Router();
const bcrypt = require("bcrypt");

const Games = require("models/queries/games.js");
const Rolls = require("models/queries/rolls.js");

const Tracker = require("tools/inviteLinkTracker.js");
const Sockets = require("sockets/");

const {
  verifyOwner,
  verifyNewLink,
  verifyNewGame,
  verifyJoin,
  isUserInGame,
} = require("middleware/manageGames.js");
const getUserListForGame = require("middleware/getUserListForGame.js");

router.route("/").get(async (req, res) => {
  const { user_id } = req.locals.token;
  const publicGamesList = await Games.find({ "g.private": false });

  publicGamesList &&
    publicGamesList.forEach(async (g) => {
      const dice = await Rolls.find({ game_id: g.id, user_id });
      g.lastRoll = dice && dice.length ? dice[dice.length - 1] : [];
    });

  return res.status(200).json(publicGamesList || []);
});

router.get("/user", async (req, res) => {
  const { user_id } = res.locals.token;
  const userGames = await Games.find({ "u.id": user_id });
  const gamesList = userGames.map(({ name }) => name);

  return res.status(200).json(userGames);
});

router.post("/user/create", verifyNewGame, async (req, res) => {
  const { user_id } = res.locals.token;
  const newGame = await Games.create(req.body, user_id);
  return res.status(201).json(newGame);
});

router.post("/user/join", verifyJoin, getUserListForGame, async (req, res) => {
  const { user_id } = res.locals.token;
  const { game, userList } = res.locals;

  const { rolls, ...g } = await Games.join(game.game_id, user_id);
  Sockets.emitGameUpdate(userList, g);
  return res.status(201).json({ ...g, rolls });
});

router.delete("/user/leave/:game_id", getUserListForGame, async (req, res) => {
  const { user_id } = res.locals.token;
  const { game_id } = req.params;
  const game = await Games.leave(game_id, user_id);

  Sockets.emitGameUpdate(res.locals.userList, game);
  return res.sendStatus(200).json({ game_id });
});

router.get("/user/fetch/:game_id", isUserInGame, async (req, res) => {
  return res.status(200).json(res.locals.game);
});

router.get("/invite/create/:game_id", verifyOwner, verifyNewLink, async (req, res) => {
  const { game_id } = req.params;

  const uuid = Tracker.add(game_id);

  return uuid && uuid.length
    ? res.status(201).json({ uuid })
    : res.status(400).json({ message: "Error creating a new uuid" });
});

module.exports = router;
