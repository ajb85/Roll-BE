const router = require('express').Router();

const Users = require('../../models/db/users.js');
const Games = require('../../models/db/games.js');

const { verifyNewGame } = require('../../middleware/games.js');

router.route('/').get(async (req, res) => {
  const publicGamesList = Games.find({ password: null });

  return res.status(200).json(publicGamesList);
});

router
  .route('/user')
  .get(async (req, res) => {
    const { user_id } = res.locals.token;

    const users_games = await Games.find_in_game(user_id);
    return res.status(200).json(users_games);
  })
  .post(verifyNewGame, async (req, res) => {
    const { user_id } = res.locals.token;

    const newGame = await Games.create(req.body, user_id);
    console.log('NEW GAME: ', newGame);
    return res.status(201).json(newGame);
  });

module.exports = router;
