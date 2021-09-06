const Query = require("../index.js");
const { clearRolls } = require("./rolls.js");
const getGameWithStatuses = require("tools/getGameWithStatuses.js");

module.exports = {
  find: findWithoutPassword,
  findWithPassword,
  edit,
  create,
  join,
  leave,
  saveScore,
  updateLastAction,
};

function find(filter, first, withPassword) {
  const select = [
    "g.id AS game_id",
    "g.owner",
    "g.name",
    "g.isActive",
    "CASE WHEN count(r) = 0 THEN '[]' ELSE json_agg(DISTINCT r.dice) END AS rolls",
    "jsonb_object_agg(ps.user_id, ps.*) as scores",
    "count(DISTINCT ps.user_id) as playerCount",
  ];

  if (withPassword) {
    select.push("g.password");
  }

  return new Query("games AS g")
    .select(...select)
    .join("users_in_game as ug", { "ug.game_id": "g.id" })
    .join("users as u", { "u.id": "ug.user_id" })
    .join("player_scores as ps", { "ps.game_id": "g.id" })
    .join("rolls as r", { "r.game_id": "g.id" }, "LEFT")
    .where(filter)
    .groupBy("g.id", "ps.game_id")
    .first(first)
    .then((results) => {
      if (!results) {
        return results;
      }

      const user_id = filter["u.id"] || filter["ug.user_id"];
      return Array.isArray(results)
        ? results.map((g) => getGameWithStatuses(g, user_id))
        : getGameWithStatuses(results, user_id);
    })
    .run();
}

function findWithoutPassword(filter, first) {
  return find(filter, first, false);
}

function findWithPassword(filter, first) {
  return find(filter, first, true);
}

function edit(filter, newInfo) {
  return new Query("games")
    .update(newInfo)
    .where(filter)
    .first(true)
    .then((g) => find({ "g.id": g.id }, true))
    .run();
}

function create(newGame, user_id) {
  return new Query("games")
    .insert({ ...newGame, owner: user_id }, "*")
    .first(true)
    .then(async (g) => {
      const game_id = g.id;
      await new Query("users_in_game").insert({ game_id, user_id }).run();
      await new Query("scores").insert({ game_id, user_id }).run();
      return find({ "g.id": g.id, "ug.user_id": user_id }, true);
    })
    .run();
}

function join(game_id, user_id) {
  return new Query("users_in_game")
    .insert({ game_id, user_id }, ["*"])
    .first(true)
    .then(async (_) => {
      await new Query("scores").insert({ game_id, user_id }).run();
      return find({ "g.id": game_id, "ug.user_id": user_id }, true);
    })
    .run();
}

async function leave(game_id, user_id) {
  await new Query("users_in_game").delete({ game_id, user_id }).run();
  await new Query("scores").delete({ game_id, user_id }).run();
  const game = await find({ "g.id": game_id }, true);
  const users = Object.keys(game.scores);

  if (!users?.length) {
    game.isActive = false;
    edit({ id: game_id }, { isActive: false });
  }

  return game;
}

function saveScore(filter, newScore) {
  return new Query("scores")
    .update(newScore)
    .where(filter)
    .first(true)
    .then(async (s) => {
      await clearRolls(filter);
      return find({ "g.id": s.game_id, "ug.user_id": filter.user_id }, true);
    })
    .run();
}

function updateLastAction(id) {
  return new Query("games").where({ id }).update({ last_action: new Date() }, ["*"]);
}
