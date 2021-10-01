const Query = require("../index.js");

module.exports = { find, findReactions, create, react, deleteReaction };

function find(filter, first) {
  return new Query("game_logs as gl")
    .select(
      "gl.*",
      "CASE WHEN count(glr) = 0 THEN '[]' ELSE json_agg(json_build_object('id', glr.id,'user_id', u.id, 'username', u.username, 'reaction', glr.reaction) ORDER BY glr.id) END AS reactions"
    )
    .join("game_logs_reactions as glr", { "glr.log_id": "gl.id" }, "left")
    .join("users as u", { "u.id": "glr.user_id" }, "LEFT")
    .where(filter)
    .groupBy("gl.id")
    .orderBy("gl.id")
    .first(first)
    .then((results) => {
      const isArray = Array.isArray(results);
      if (!isArray) {
        results = [results];
      }
      const mappedEmojis = results.map(({ reactions, ...log }) => {
        const indexLog = {};
        log.reactions = reactions.reduce((acc, { reaction, ...r }) => {
          const accIndex = indexLog[reaction.emoji];
          if (accIndex === undefined) {
            indexLog[reaction.emoji] = acc.length;
            acc.push({ reaction, users: [r] });
          } else {
            acc[accIndex].users.push(r);
          }

          return acc;
        }, []);

        return log;
      });

      return isArray ? mappedEmojis : mappedEmojis[0];
    })
    .run();
}

function findReactions(filter, first) {
  return new Query("game_logs_reactions").select("*").where(filter).first(first).run();
}

function create(newLog) {
  return new Query("game_logs")
    .insert(newLog, "*")
    .then(({ game_id }) => {
      return find({ "gl.game_id": game_id });
    })
    .run();
}

function react(reaction, game_id) {
  return new Query("game_logs_reactions")
    .insert(reaction)
    .then(() => find({ "gl.game_id": game_id }))
    .run();
}

function deleteReaction(id, game_id) {
  return new Query("game_logs_reactions")
    .delete({ id })
    .then(() => find({ "gl.game_id": game_id }))
    .run();
}
