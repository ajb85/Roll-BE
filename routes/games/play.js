const router = require('express').Router();

const Users = require('models/queries/users.js');
const Games = require('models/queries/games.js');
const Rolls = require('models/queries/rolls.js');

const { getGameRound } = require('Game/Data/');
const { verifyUserInGame } = require('middleware/playGames.js');
const { verifyNewRoll, verifyRound } = require('middleware/playGames.js');
const { updateScoreTotals, getDieValue } = require('Game/Mechanics/');

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
    const savedRoll = await Rolls.saveRoll({ game_id, user_id, dice });
    // await Games.updateLastAction(game_id);
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

    res.locals.game = await Games.saveScore(
      { game_id, user_id },
      { score: JSON.stringify(updatedScore) }
    );

    const { scores } = res.locals.game;

    const round = await getGameRound({ user_id, game_id, scores });

    if (round >= 13) {
      const finished = await Games.edit(
        { id: game_id },
        { isActive: false, isJoinable: false }
      );
      console.log('FINISHED GAME: ', finished);

      const users = await Promise.all(
        Object.keys(finished.scores)
          .sort(
            (a, b) =>
              finished.scores[b]['Grand Total'] -
              finished.scores[a]['Grand Total']
          )
          .map(id => Users.find({ id }, true))
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

    // await Games.updateLastAction(game_id);
    Sockets.sendTurn({ user_id }, res.locals.game);
    return res.status(201).json(res.locals.game);
  }
);

module.exports = router;
