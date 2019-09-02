const router = require('express').Router();

const Games = require('models/db/games.js');
const Dice = require('models/db/dice.js');
const Score = require('models/db/scores.js');
const { verifyNewRoll, verifyRound } = require('middleware/playGames.js');
const { updateScoreTotals } = require('Game/Mechanics/');

router.post('/:game_id/rollDice', verifyNewRoll, async (req, res) => {
  // FE submits locked dice, randomize the others
  const { user_id } = res.locals.token;
  const { locked, rolls } = res.locals;

  const lastRoll = rolls[rolls.length - 1];
  const newRoll = lastRoll.map((d, i) => (locked[i] ? d : getDieValue()));

  const savedRoll = await Dice.saveRoll(game_id, user_id, newRoll);
  return res.status(201).json(savedRoll.dice);
});

router.post('/:game_id/submitRound', verifyRound, (req, res) => {
  // FE submits category, get dice and calculate score, save to DB
  // update last action
  //   const { game_id } = req.params;
  //   const { user_id } = res.locals.token;
  const { rolls, score } = res.locals;

  const category = req.body;
  const lastRoll = rolls[rolls.length - 1];
});

module.exports = router;
