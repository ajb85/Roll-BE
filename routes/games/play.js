const router = require('express').Router();

const Users = require('models/queries/users.js');
const Games = require('models/queries/games.js');
const Dice = require('models/queries/dice.js');

const { verifyNewRoll, verifyRound } = require('middleware/playGames.js');
const { updateScoreTotals, getDieValue } = require('Game/Mechanics/');
const { verifyUserInGame } = require('middleware/playGames.js');

const Sockets = require('sockets/');

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

    const dice = rolls.length
      ? lastRoll.map((d, i) => (locked[i] ? d : getDieValue()))
      : lastRoll;
    console.log('SAVING ROLL');
    const savedRoll = await Dice.saveRoll({ game_id, user_id, dice });
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

      const users = await Promise.all(
        finished.scores.map(s => Users.find({ id: s.user_id }, true))
      );

      await users.reduce(
        (acc, u, i) =>
          acc.then(_ => {
            const update =
              i === 0 ? { wins: u.wins + 1 } : { losses: u.losses + 1 };
            Users.edit({ id: u.id }, update);
          }),
        Promise.resolve()
      );
    }

    await Games.updateLastAction(game_id);
    Sockets.sendTurn({ user_id }, updatedGame);
    return res.status(201).json(updatedGame);

    // Save score
    // Clear dice rolls
  }
);

module.exports = router;
