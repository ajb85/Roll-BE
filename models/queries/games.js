const Query = require("../index.js");
const { clearRolls } = require("./rolls.js");
const getGameWithStatuses = require("tools/getGameWithStatuses.js");
const { updateScoreTotals } = require("Game/Mechanics/");

module.exports = {
  find,
  edit,
  create,
  join,
  leave,
  saveScore,
  updateLastAction,
  voteForRecreate,
};

function find(filter, first) {
  const rollsJoin = { "r.game_id": "g.id" };
  const user_id = filter["u.id"] || filter["ug.user_id"];

  const rollsQuery = new Query("rolls").select(
    "CASE WHEN count(r) = 0 THEN '[]' ELSE json_agg(dice ORDER BY id ASC) END"
  );

  if (user_id) {
    rollsJoin["r.user_id"] = user_id;
    rollsQuery.where({ user_id });
  }

  const rollsQueryString = rollsQuery.queryString;

  return new Query("games AS g")
    .select(
      "g.id AS game_id",
      "g.owner",
      "g.name",
      "g.isActive",
      "g.private",
      `(${rollsQueryString}) AS rolls`,
      "jsonb_object_agg(ps.user_id, ps.*) AS scores",
      "COALESCE(jsonb_object_agg(v.user_id, json_build_object('vote', v.vote)) FILTER (WHERE v.user_id IS NOT NULL), '{}') AS votes",
      "count(DISTINCT ps.user_id) as playerCount"
    )
    .join("users_in_game as ug", { "ug.game_id": "g.id" })
    .join("users as u", { "u.id": "ug.user_id" })
    .join("player_scores as ps", { "ps.game_id": "g.id" })
    .join("rolls as r", rollsJoin, "LEFT")
    .join("recreate_game_votes as v", { "v.game_id": "g.id" }, "LEFT")
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

function edit(filter, newInfo) {
  let user_id;
  if (filter["u.id"]) {
    user_id = filter["u.id"];
    delete filter["u.id"];
  }

  if (filter["ug.user_id"]) {
    user_id = filter["ug.user_id"];
    delete filter["ug.user_id"];
  }

  return new Query("games")
    .update(newInfo)
    .where(filter)
    .first(true)
    .then((g) => {
      return find({ "g.id": g.id, "u.id": user_id }, true);
    })
    .run();
}

function create(newGame, user_id, shouldFind = true) {
  return new Query("games")
    .insert({ ...newGame, owner: user_id }, "*")
    .first(true)
    .then(async (g) => {
      const game_id = g.id;
      await new Query("users_in_game").insert({ game_id, user_id }).run();
      await new Query("scores").insert({ game_id, user_id }).run();
      return shouldFind ? find({ "g.id": g.id, "ug.user_id": user_id }, true) : true;
    })
    .run();
}

function join(game_id, user_id, findGame = true) {
  return new Query("users_in_game")
    .insert({ game_id, user_id }, ["*"])
    .first(true)
    .then(async (_) => {
      await new Query("scores").insert({ game_id, user_id }).run();
      return findGame ? find({ "g.id": game_id, "ug.user_id": user_id }, true) : true;
    })
    .run();
}

async function leave(game_id, user_id, endingGame = false) {
  await new Query("users_in_game").delete({ game_id, user_id }).run();
  await new Query("scores").delete({ game_id, user_id }).run();
  let game = await find({ "g.id": game_id, "u.id": user_id }, true);
  const users = game && Object.keys(game.scores);
  if (!endingGame && Number(game.owner) === Number(user_id)) {
    game = await edit(
      { "g.id": game_id, "u.id": user_id },
      { ...game, owner: Object.keys[game.scores][0] }
    );
  }
  if (game && !users?.length) {
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
      return find({ "g.id": s.game_id, "u.id": filter.user_id }, true);
    })
    .run();
}

function updateLastAction(id) {
  return new Query("games").where({ id }).update({ last_action: new Date() }, ["*"]);
}

function voteForRecreate(game_id, user_id, vote) {
  return new Query("recreate_game_votes ")
    .insert({ game_id, user_id, vote })
    .first(true)
    .then(async () => find({ "g.id": game_id, "ug.user_id": user_id }, true))
    .run();
}
