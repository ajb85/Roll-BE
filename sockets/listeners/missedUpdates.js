const Games = require("models/queries/games.js");

module.exports = async function missedUpdates(socket, game_id, emit_id) {
  const user_id = socket.user.id;

  const isUpToDate = this._verifyEmitID(game_id, emit_id);
  if (!isUpToDate) {
    const game = await Games.find({ "g.id": game_id, "u.id": user_id }, true);
    if (game?.game_id === game_id) {
      // Just verifying it was found correctly
      return socket.emit("gameUpdates", game, this.emitLog[game_id]);
    }
  }
};
