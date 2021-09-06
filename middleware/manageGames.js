const bcrypt = require("bcrypt");
const Games = require("../models/queries/games.js");
const Tracker = require("tools/inviteLinkTracker.js");

module.exports = {
  verifyOwner,
  verifyNewLink,
  verifyNewGame,
  verifyJoin,
  isUserInGame,
};

async function verifyOwner(req, res, next) {
  const { game_id } = req.params;
  const { user_id } = res.locals.token;
  const game = await Games.find({ "g.id": game_id }, true);
  res.locals.game = game;

  if (parseInt(game.owner) !== parseInt(user_id)) {
    return res.status(400).json({
      requestType: "game",
      message: "Only the game owner can do that.",
    });
  }

  next();
}

async function isUserInGame(req, res, next) {
  const { game_id } = req.params;
  const { user_id } = res.locals.token;

  const game = await Games.find({
    "g.id": game_id,
    "ug.user_id": user_id,
  });

  if (!game || !game.length) {
    return res.status(400).json({ requestType: "game", message: "You are not in this game." });
  }

  res.locals.game = game[0];
  next();
}

async function verifyNewLink(req, res, next) {
  if (!res.locals.game) {
    res.locals.game = await Games.find({ "g.id": req.params.game_id }, true);
  }

  const { game } = res.locals;

  if (!game.isJoinable) {
    return res.status(400).json({
      requestType: "game",
      message: "Cannot create invite links for unjoinable games.",
    });
  }

  next();
}

async function verifyNewGame(req, res, next) {
  const newGame = req.body;

  if (!newGame.name) {
    return res.status(400).json({ requestType: "game", message: "New games must have a name" });
  }

  const existingGame = await Games.find({ name: req.body.name.toString(), isActive: true }, true);
  if (existingGame) {
    return res
      .status(400)
      .json({ requestType: "game", message: "A game already exists with that name" });
  }

  req.body = { name: req.body.name, password: req.body.password || null };
  next();
}

async function verifyJoin(req, res, next) {
  const { user_id } = res.locals.token;
  const { name, password, uuid } = req.body;

  let game;
  if (uuid) {
    const game_id = Tracker.find(uuid);
    game = await Games.findWithPassword({ "g.id": game_id, "g.isActive": true }, true);
  } else if (name && password) {
    game = await Games.findWithPassword({ "g.name": name, "g.isActive": true }, true);

    if (game && game.password && !bcrypt.compareSync(password, game.password)) {
      return res.status(401).json({ requestType: "game", message: "Invalid password." });
    }
  }

  if (!game) {
    return res.status(404).json({
      requestType: "game",
      message: "Game either doesn't exist or has ended.",
    });
  }

  if (!game.isJoinable) {
    res
      .status(400)
      .json({ requestType: "game", message: "The host has already started the game." });
  }

  if (game.scores[user_id]) {
    return res.status(400).json({ requestType: "game", message: "You're already in that game!" });
  }

  res.locals.game = game;
  next();
}
