const Games = require('models/db/games.js');
const Dice = require('models/db/dice.js');
const Scores = require('models/db/scores.js');

const { isUsersTurn } = require('Game/data/');

module.exports = { verifyNewRoll, verifyRound, verifyUserInGame };

async function verifyNewRoll(req, res, next) {
  const { game_id } = req.params;
  const { user_id } = res.locals.token;

  const rolls = await Dice.find({ game_id, user_id });

  if (rolls && rolls.length >= 3) {
    // User out of turns
    return res
      .status(400)
      .json({ requestType: 'play', message: 'You are  out of rolls.' });
  }

  const locked = req.body;

  const lockedDice = [0, 0, 0, 0, 0];

  if (locked && Array.isArray(locked)) {
    // Lock indices client provided
    locked.forEach(n => (lockedDice[n] = 1));
  }

  res.locals.locked = lockedDice;
  res.locals.game = game;
  res.locals.rolls = rolls;
  next();
}

async function verifyRound(req, res, next) {
  if (!req.body) {
    // No category submitted
    return res
      .status(400)
      .json({ requestType: 'play', message: 'You must select a category.' });
  }

  const { user_id } = res.locals.token;
  const score = await Scores.find({ game_id, user_id });

  if (score[category]) {
    return res.status(400).json({
      requestType: 'play',
      message: `You've already submitted a score for that category`
    });
  }

  if (!validCategories[category]) {
    return res
      .status(404)
      .json({ requestType: 'play', message: 'That is not a valid category.' });
  }

  const rolls = await Dice.find({ game_id, user_id });
  if (!rolls || !rolls.length) {
    return res
      .status(400)
      .json({ requestType: 'play', message: 'You must roll first!' });
  }

  res.locals.score = score;
  res.locals.rolls = rolls;

  next();
}

function verifyUserInGame(req, res, next) {
  const { user_id } = res.locals.token;
  const { game_id } = req.params;
  if (game_id && !_isPlayerInGame(game_id, user_id)) {
    return res
      .status(400)
      .json({ requestType: 'play', message: 'You are not in this game.' });
  }

  if (game_id && !isUsersTurn(game_id, user_id)) {
    return res
      .status(400)
      .json({ requestType: 'play', message: 'It is not your turn yet.' });
  }
  next();
}

function _isPlayerInGame(game_id, user_id) {
  const game = Games.find({ 'g.game_id': game_id });
  return !!game.players.find(id => parseInt(id, 10) === parseInt(user_id, 10));
}
