const router = require('express').Router();
const bcrypt = require('bcrypt');

const Games = require('models/queries/games.js');
const Rolls = require('models/queries/rolls.js');

const Sockets = require('sockets/');

const { verifyNewGame, verifyJoin } = require('middleware/manageGames.js');

router.route('/').get(async (req, res) => {
  const { user_id } = req.locals.token;
  const publicGamesList = await Games.find({ 'g.password': null });

  publicGamesList &&
    publicGamesList.forEach(async g => {
      const dice = await Rolls.find({ game_id: g.id, user_id });
      g.lastRoll = dice && dice.length ? dice[dice.length - 1] : [];
    });
  return res.status(200).json(publicGamesList || []);
});

router.get('/user', async (req, res) => {
  const { user_id } = res.locals.token;
  const userGames = await Games.find({ 'u.id': user_id });
  console.log('GETTING GAMES');

  const gamesList = userGames.map(({ name }) => name);

  Sockets.listenToGamesList({ user_id }, gamesList);

  return res.status(200).json(userGames);
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
  const {
    game: { game_id }
  } = res.locals;

  const game = await Games.join(game_id, user_id);
  delete game.rolls;
  Sockets.join({ user_id }, game.name, { context: 'userList', message: game });

  return res.status(201).json(game);
});

router.delete('/user/leave/:game_id', async (req, res) => {
  const { user_id } = res.locals.token;
  const { game_id } = req.params;
  const game = await Games.leave(game_id, user_id);

  const config = game.isActive ? { context: 'userList', message: game } : null;
  Sockets.leave({ user_id }, game.name, config);

  return res.sendStatus(201);
});

module.exports = router;
