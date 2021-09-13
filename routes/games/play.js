const router = require("express").Router();

const Games = require("models/queries/games.js");
const Rolls = require("models/queries/rolls.js");

const getUserListForGame = require("middleware/getUserListForGame.js");
const { verifyUserInGame } = require("middleware/playGames.js");
const { verifyNewRoll, verifyRound } = require("middleware/playGames.js");
const { updateScoreTotals, getDieValue, endGame } = require("Game/Mechanics/");

const Sockets = require("sockets/");

router.post("/:game_id/rollDice", verifyUserInGame, verifyNewRoll, async (req, res) => {
  // FE submits locked dice, randomize the others
  const { user_id } = res.locals.token;
  const { game_id } = req.params;
  const { locked, rolls } = res.locals;

  const lastRoll = rolls.length ? rolls[rolls.length - 1].dice : getDieValue(5);

  const dice = rolls.length ? lastRoll.map((d, i) => (locked[i] ? d : getDieValue())) : lastRoll;
  const savedRoll = await Rolls.saveRoll({ game_id, user_id, dice });
  // await Games.updateLastAction(game_id);
  const turnRolls = rolls.map((turn) => turn.dice);
  turnRolls.push(savedRoll.dice);

  return res.status(201).json({ game_id: savedRoll.game_id, rolls: turnRolls });
});

router.post(
  "/:game_id/submitRound",
  verifyUserInGame,
  verifyRound,
  getUserListForGame,
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

    if (res?.locals?.game?.currentRound >= 13) {
      res.locals.game = await endGame(game_id, user_id);
    }

    const { rolls, ...game } = res.locals.game;
    console.log("\n\n EMIT TO : ", res.locals.userList, game, "\n\n");
    Sockets.emitGameUpdate(res.locals.userList, game);
    return res.status(201).json(game);
  }
);

module.exports = router;
