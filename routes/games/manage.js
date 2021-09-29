const router = require("express").Router();
const bcrypt = require("bcrypt");

const Games = require("models/queries/games.js");
const Rolls = require("models/queries/rolls.js");

const Tracker = require("tools/inviteLinkTracker.js");
const Sockets = require("sockets/");

const {
  verifyOwner,
  verifyNewLink,
  verifyNewGame,
  verifyJoin,
  isUserInGame,
  verifyRecreateVote,
} = require("middleware/manageGames.js");

const getUserListForGame = require("middleware/getUserListForGame.js");

router.route("/").get(async (req, res) => {
  const { user_id } = req.locals.token;
  const publicGamesList = await Games.find({ "g.private": false });

  publicGamesList &&
    publicGamesList.forEach(async (g) => {
      const dice = await Rolls.find({ game_id: g.id, user_id });
      g.lastRoll = dice && dice.length ? dice[dice.length - 1] : [];
    });

  return res.status(200).json(publicGamesList || []);
});

router.get("/user", async (req, res) => {
  const { user_id } = res.locals.token;
  const userGames = await Games.find({ "u.id": user_id });
  const gamesList = userGames.map(({ name }) => name);

  return res.status(200).json(userGames);
});

router.post("/user/create", verifyNewGame, async (req, res) => {
  const { user_id } = res.locals.token;
  const newGame = await Games.create(req.body, user_id);
  return res.status(201).json(newGame);
});

router.post("/user/join", verifyJoin, getUserListForGame, async (req, res) => {
  const { user_id } = res.locals.token;
  const { game, userList } = res.locals;

  const { rolls, ...g } = await Games.join(game.game_id, user_id);
  Sockets.emitGameUpdate(userList, g);
  return res.status(201).json({ ...g, rolls });
});

router.delete("/user/leave/:game_id", getUserListForGame, async (req, res) => {
  const { user_id } = res.locals.token;
  const { game_id } = req.params;
  const game = await Games.leave(game_id, user_id);

  Sockets.emitGameUpdate(res.locals.userList, game);
  return res.status(200).json({ game_id });
});

router.get("/user/fetch/:game_id", isUserInGame, async (req, res) => {
  return res.status(200).json(res.locals.game);
});

router.get("/invite/create/:game_id", verifyOwner, verifyNewLink, async (req, res) => {
  const { game_id } = req.params;

  const uuid = Tracker.add(game_id);

  return uuid && uuid.length
    ? res.status(201).json({ uuid })
    : res.status(400).json({ message: "Error creating a new uuid" });
});

router.post(
  "/user/recreate/vote/:game_id",
  verifyRecreateVote,
  getUserListForGame,
  async (req, res) => {
    const { user_id } = res.locals.token;
    const { game, userList } = res.locals;
    const { vote } = req.body;

    const updatedGame = await Games.voteForRecreate(game.game_id, user_id, vote);
    const userIds = Object.keys(updatedGame.votes);
    const votingIsComplete = Object.keys(updatedGame.scores).length === userIds.length;

    if (votingIsComplete) {
      updatedGame.votesComplete = true;
      const yesVotes = Object.entries(updatedGame.votes).reduce((acc, [userId, { vote }]) => {
        if (vote) {
          acc.push(userId);
        }

        return acc;
      }, []);

      const newGame =
        yesVotes?.length &&
        (await Games.create(
          { private: true, name: updatedGame.name },
          findNewGameOwner(updatedGame)
        ));

      const joiningNewGame = yesVotes?.length
        ? yesVotes.map((userId) => Games.join(newGame.game_id, userId, false))
        : [];

      const leavingGame = userIds.map((userId) => Games.leave(updatedGame.game_id, userId, true));
      await Promise.all([...leavingGame, ...joiningNewGame]);

      if (newGame?.game_id) {
        updatedGame.newGame = newGame.game_id;
      }
    }

    Sockets.emitGameUpdate(userList, updatedGame);
    return res.status(201).json(updatedGame);
  }
);

module.exports = router;

function findNewGameOwner(game) {
  if (game?.votes?.[game.owner]?.vote) {
    // Keep owner if they're returning
    return game.owner;
  }

  return Number(
    Object.keys(game.scores).find((userId) => {
      // Find the first user who is sticking around
      // This function should not run if no users voted to
      // restart the game
      const { vote } = game.votes[userId] || {};
      return !!vote;
    })
  );
}
