const bcrypt = require('bcrypt');
const Games = require('../models/queries/games.js');

module.exports = { verifyOwner, verifyNewLink, verifyNewGame, verifyJoin };

async function verifyOwner(req, res, next) {
  const { game_id } = req.params;
  const { user_id } = res.locals.token;
  const game = await Games.find({ 'g.id': game_id }, true);
  res.locals.game = game;

  if (parseInt(game.owner) !== parseInt(user_id)) {
    return res.status(400).json({
      requestType: 'game',
      message: 'You are not the game owner, you cannot invite players.'
    });
  }

  next();
}

async function verifyNewLink(req, res, next) {
  let { game } = res.locals;

  if (!game) {
    game = await Games.find({ 'g.id': req.params.game_id }, true);
  }

  if (!game.isJoinable) {
    return res.status(400).json({
      requestType: 'game',
      message: 'Cannot create invite links for unjoinable games.'
    });
  }

  next();
}

async function verifyNewGame(req, res, next) {
  const newGame = req.body;

  if (!newGame.name) {
    console.log('New game, but no name');
    return res
      .status(400)
      .json({ requestType: 'game', message: 'New games must have a name' });
  }
  const existingGame = await Games.find(
    {
      name: req.body.name.toString(),
      isActive: true
    },
    true
  );

  if (existingGame) {
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

  const game = await Games.find({ 'g.name': name, 'g.isActive': true }, true);

  if (!game) {
    return res.status(404).json({
      requestType: 'game',
      message: "Game either doesn't exist or has ended."
    });
  }

  if (!game.isJoinable) {
    res
      .status(400)
      .json({ requestType: 'game', message: 'Game cannot be joined.' });
  }

  if (game.password && !bcrypt.compareSync(password, game.password)) {
    return res
      .status(401)
      .json({ requestType: 'game', message: 'Invalid password.' });
  }

  if (game.scores[user_id]) {
    return res
      .status(400)
      .json({ requestType: 'game', message: "You're already in that game!" });
  }

  res.locals.game = game;
  next();
}
