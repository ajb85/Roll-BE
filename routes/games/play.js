const router = require('express').Router();

const Users = require('models/db/users.js');
const Games = require('models/db/games.js');
const Dice = require('models/db/dice.js');
const { verifyNewRoll, verifyRound } = require('middleware/playGames.js');
const { updateScoreTotals, getDieValue } = require('Game/Mechanics/');
const { verifyUserInGame } = require('middleware/playGames.js');

router.post(
  '/:game_id/rollDice',
  verifyUserInGame,
  verifyNewRoll,
  async (req, res) => {
    // FE submits locked dice, randomize the others
    const { user_id } = res.locals.token;
    const { game_id } = req.params;
    const { locked, rolls } = res.locals;

    const lastRoll = rolls.length
      ? rolls[rolls.length - 1].dice
      : getDieValue(5);

    const newRoll = rolls.length
      ? lastRoll.map((d, i) => (locked[i] ? d : getDieValue()))
      : lastRoll;

    const savedRoll = await Dice.saveRoll(game_id, user_id, newRoll);
    await Games.updateLastAction(game_id);
    const turnRolls = rolls.map(turn => turn.dice);
    turnRolls.push(savedRoll.dice);
    return res
      .status(201)
      .json({ game_id: savedRoll.game_id, rolls: turnRolls });
  }
);

router.post(
  '/:game_id/submitRound',
  verifyUserInGame,
  verifyRound,
  async (req, res) => {
    // FE submits category, get dice and calculate score, save to DB
    // update last action
    const { game_id } = req.params;
    const { user_id } = res.locals.token;
    const { lastRoll, score } = res.locals;

    const { category } = req.body;

    const updatedScore = updateScoreTotals(category, score, lastRoll);

    const updatedGame = await Games.saveScore(
      { game_id, user_id },
      updatedScore
    );

    if (updatedGame.round === 13) {
      const finished = await Games.deactivate(game_id);
      console.log('FINISHED GAME: ', finished);
      const { wins } = await Users.retrieve({
        id: finished.scores.leader.user_id
      });
      await Users.edit(
        { id: finished.scores.leader.user_id },
        { wins: wins + 1 }
      );
      const { losses } = await Users.retrieve({
        id: finished.scores.user.user_id
      });
      await Users.edit(
        { id: finished.scores.user.user_id },
        { losses: losses + 1 }
      );

      finished.scores.others.forEach(async ({ user_id: id }) => {
        const { losses } = await Users.retrieve({ id });
        await Users.edit({ id }, { losses: losses + 1 });
      });
    }
    await Games.updateLastAction(game_id);
    return res.status(201).json(updatedGame);

    // Save score
    // Clear dice rolls
  }
);

module.exports = router;
