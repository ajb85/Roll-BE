const bcrypt = require('bcrypt');

const Games = require('../models/db/games.js');
module.exports = { verifyNewGame, verifyJoin };

async function verifyNewGame(req, res, next) {
  const newGame = req.body;

  if (!newGame.name) {
    console.log('New game, but no name');
    return res
      .status(400)
      .json({ requestType: 'game', message: 'New games must have a name' });
  }

  const existingGame = await Games.find({ name: req.body.name });
  if (existingGame && existingGame.length) {
    console.log('New game, but name already exists');
    return res.status(400).json({
      requestType: 'game',
      message: 'A game already exists with that name'
    });
  }
  req.body = { name: req.body.name, password: req.body.password || null };
  next();
}

async function verifyJoin(req, res, next) {
  const { user_id } = res.locals.token;
  const { name, password } = req.body;

  const game = await Games.find({ 'g.name': name }).first();

  if (!game) {
    return res
      .status(404)
      .json({ requestType: 'game', message: 'Game cannot be joined.' });
  }

  if (game.joinable === false) {
    // long term should be !game.joinable
    res
      .status(400)
      .json({ requestType: 'game', message: 'Game cannot be joined.' });
  }

  if (game.password && !bcrypt.compareSync(password, game.password)) {
    return res
      .status(401)
      .json({ requestType: 'game', message: 'Invalid password.' });
  }

  if (game.players.find(p => parseInt(p, 10) === parseInt(user_id, 10))) {
    return res
      .status(400)
      .json({ requestType: 'game', message: 'You already joined that game!' });
  }

  res.locals.game = game;
  next();
}
