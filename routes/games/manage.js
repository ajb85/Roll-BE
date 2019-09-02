const router = require('express').Router();
const bcrypt = require('bcrypt');

const Games = require('../../models/db/games.js');
const {
  verifyNewGame,
  verifyJoin
} = require('../../middleware/manageGames.js');

router.route('/').get(async (req, res) => {
  const publicGamesList = Games.find({ password: null });

  return res.status(200).json(publicGamesList);
});

router.get('/user', async (req, res) => {
  const { user_id } = res.locals.token;
  const game_ids = (await Games.find({ 'ug.user_id': user_id })).map(
    g => g.game_id
  );
  const games_list = [];
  await Promise.all(
    game_ids.map(id =>
      Games.find({ 'g.id': id }).then(g => games_list.push(...g))
    )
  );
  games_list.forEach(game => delete game.password);
  return res.status(200).json(games_list);
});

router.post('/user/create', verifyNewGame, async (req, res) => {
  const { user_id } = res.locals.token;
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password, 10);
  }

  const newGame = await Games.create(req.body, user_id);
  delete newGame.password;
  return res.status(201).json(newGame);
});

router.post('/user/join', verifyJoin, async (req, res) => {
  const { user_id } = res.locals.token;
  const { game } = res.locals;

  const joined = await Games.join(game.game_id, user_id);
  delete joined.password;
  return res.status(201).json(joined);
});

router.post('/user/leave', async (req, res) => {
  const { user_id } = res.locals.token;
  const { game_id } = req.body;
  const leaving = await Games.leave(game_id, user_id);
  return res.status(201).json(leaving);
});

module.exports = router;
