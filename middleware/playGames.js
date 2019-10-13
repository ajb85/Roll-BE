const Games = require('models/db/games.js');
const Dice = require('models/db/dice.js');
const Scores = require('models/db/scores.js');

const { isUsersTurn, isPlayableCategory } = require('Game/Data/');

module.exports = { verifyNewRoll, verifyRound, verifyUserInGame };

async function verifyUserInGame(req, res, next) {
  const { user_id } = res.locals.token;
  const { game_id } = req.params;

  const game = await Games.find({ game_id }).first();

  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }

  if (!game.isActive) {
    return res
      .status(400)
      .json({ requestType: 'play', message: 'Game is no longer active.' });
  }
  if (game_id && !_isPlayerInGame(game_id, user_id)) {
    return res.status(400).json({
      requestType: 'play',
      route: true,
      message: 'You are not in this game.'
    });
  }

  const isTurn = await isUsersTurn({ game_id, user_id });
  console.log('isTurn: ', isTurn);
  if (game_id && !isTurn) {
    return res
      .status(400)
      .json({ requestType: 'play', message: 'It is not your turn yet.' });
  }

  next();
}

async function verifyNewRoll(req, res, next) {
  const { game_id } = req.params;
  const { user_id } = res.locals.token;

  const rolls = await Dice.find({ game_id, user_id });

  if (rolls && rolls.length >= 3) {
    // User out of turns
    return res
      .status(400)
      .json({ requestType: 'play', message: 'You are out of rolls.' });
  }

  const { locked } = req.body;

  res.locals.locked = locked || [false, false, false, false, false];
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
  const { game_id } = req.params;
  const { category } = req.body;
  console.log('Category: ', category);
  const score = await Scores.find({ game_id, user_id }).first();
  if (score[category] !== null) {
    return res.status(400).json({
      requestType: 'play',
      message: `You've already submitted a score for that category`
    });
  }

  if (!isPlayableCategory(category)) {
    return res
      .status(400)
      .json({ requestType: 'play', message: 'That is not a valid category.' });
  }

  const rolls = await Dice.find({ game_id, user_id });
  if (!rolls || !rolls.length) {
    return res
      .status(400)
      .json({ requestType: 'play', message: 'You must roll first!' });
  }

  res.locals.score = score;
  res.locals.lastRoll = rolls[rolls.length - 1].dice;

  next();
}

async function _isPlayerInGame(game_id, user_id) {
  const game = await Games.find({ 'g.id': game_id }).first();
  return !!game.players.find(id => parseInt(id, 10) === parseInt(user_id, 10));
}
