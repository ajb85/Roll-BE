const router = require('express').Router();
const bcrypt = require('bcrypt');

const Games = require('models/db/games.js');
const Dice = require('models/db/dice.js');

const Sockets = require('sockets/');

const { verifyNewGame, verifyJoin } = require('middleware/manageGames.js');

router.route('/').get(async (req, res) => {
  const { user_id } = res.locals.token;
  const publicGamesList = await Games.find({ password: null });

  publicGamesList.forEach(async g => {
    const dice = await Dice.find({ game_id: g.id, user_id });
    g.lastRoll = dice && dice.length ? dice[dice.length - 1] : [];
  });
  return res.status(200).json(publicGamesList);
});

router.get('/user', async (req, res) => {
  const { user_id } = res.locals.token;
  const userGames = await Games.byUserID(user_id);

  res.status(200).json(userGames);
});

router.post('/user/create', verifyNewGame, async (req, res) => {
  const { user_id } = res.locals.token;
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password, 10);
  }
  const newGame = await Games.create(req.body, user_id);

  Sockets.join({ user_id }, newGame.name);

  return res.status(201).json(newGame);
});

router.post('/user/join', verifyJoin, async (req, res) => {
  const { user_id } = res.locals.token;
  const { game } = res.locals;

  const joined = await Games.join(game.game_id, user_id);

  Sockets.join({ user_id }, joined.name);

  return res.status(201).json(joined);
});

router.post('/user/leave', async (req, res) => {
  const { user_id } = res.locals.token;
  const { game_id } = req.body;
  const game = await Games.leave(game_id, user_id);

  if (!game.players.length || game.players[0] === null) {
    await Games.deactivate(game_id);
  }
  return res.sendStatus(201);
});

module.exports = router;
