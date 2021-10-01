const Query = require("../index.js");

module.exports = { find, findReactions, create, react, deleteReaction };

function find(filter, first) {
  return (
    new Query("game_logs as gl")
      .select("gl.*")
      // .join("gameLogReactions as glr", { "glr.log_id": "gl.id" })
      .where(filter)
      .first(first)
      .run()
  );
}

function findReactions(filter, first) {
  return new Query("game_logs_reactions").select("*").where(filter).first(first).run();
}

function create(newLog) {
  return new Query("game_logs")
    .insert(newLog)
    .then(() => find({ "gl.game_id": newLog.game_id }))
    .run();
}

function react(reaction) {
  return new Query("game_logs_reactions")
    .insert(reaction)
    .then(() => find({ "gl.game_id": reaction.game_id }))
    .run();
}

function deleteReaction({ game_id, log_id }) {
  return new Query("game_logs_reactions")
    .delete({ "gl.id": log_id })
    .then(() => find({ "gl.game_id": game_id }))
    .run();
}
