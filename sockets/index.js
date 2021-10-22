const reqDir = require("require-dir");
const listeners = reqDir("./listeners/");
const http = require("config/http.js");
const cors = { origin: [process.env.FRONTEND_URL], methods: ["GET", "POST"] };
const io = require("socket.io")(http, { cors });
const decodeJWT = require("tools/decodeJWT.js");
const getGameWithStatuses = require("tools/getGameWithStatuses.js");
const { isUsersTurn } = require("Game/Data");
const { getDiscordUserFromUserId } = require("discord/oauth.js");
const Games = require("models/queries/games.js");
const discordClient = require("discord/");

io.use(async (socket, next) => {
  try {
    const { token } = socket.handshake.auth;
    const { decoded, user } = token && (await decodeJWT(token));
    if (decoded && user) {
      socket.user = user;
      socket.token = decoded;
      next();
    }
  } catch (err) {}
});

const getEmitID = (
  (id) => () =>
    id++
)(1);

class SocketsManager {
  constructor() {
    this.io = io;
    this.connected = { sockets: {}, users: {} };
    this.emitLog = {};
    this.gameRecords = {};
    this.pendingDiscordMessages = {};
    this.timers = {};

    console.log("\nSOCKETS ONLINE");

    this.io.on("connection", (socket) => {
      if (!this.connected.users[socket.user.id]) {
        this.connected.users[socket.user.id] = [];
      }

      this.connected.sockets[socket.id] = socket;
      this.connected.users[socket.user.id].push(socket);
      console.log(
        `${socket.user.username} Connected: ${this.connected.users[socket.user.id].length}`
      );
      for (let l in listeners) {
        socket.on(l, listeners[l].bind(this, socket));
      }
    });
  }

  emitGameUpdate(userList = [], g) {
    if (!g || !g.game_id) return;

    const { rolls, ...game } = g;
    const emit_id = getEmitID();
    game.game_id && (this.emitLog[game.game_id] = emit_id);
    const shouldRecord = game.game_id && game.scores;

    const oldRecord = this.gameRecords[game.game_id] || {};
    const newRecord = shouldRecord && this._recordTurns(game);
    const shouldNotifyOnDiscord = !!newRecord;

    userList.forEach((user_id) => {
      const shouldLog = Number(user_id) === 1;
      const sockets = this._getSocket(user_id);

      const isNotLog = !game.logs;
      sockets?.forEach((s) =>
        s.emit("gameUpdates", isNotLog ? getGameWithStatuses(game, user_id) : game, emit_id)
      );
      const wasNotUsersTurn = shouldNotifyOnDiscord && !oldRecord[user_id];
      const isNowUsersTurn = shouldNotifyOnDiscord && newRecord[user_id];

      const isOffline = this._isSocketOffline(sockets);
      wasNotUsersTurn && isNowUsersTurn && isOffline && this.notifyOnDiscord(user_id, game);
    });
  }

  async notifyOnDiscord(user_id, game) {
    console.log("NOTIFY USER", user_id, "for", game.game_id);
    try {
      if (!this.pendingDiscordMessages[game.game_id]) {
        this.pendingDiscordMessages[game.game_id] = {};
      }

      if (!this.pendingDiscordMessages[game.game_id][user_id]) {
        this.pendingDiscordMessages[game.game_id][user_id] = true;
      }

      if (!this.timers[game.game_id]) {
        const envTimeout = Number(process.env.DISCORD_NOTIFICATION_DELAY);
        const timeout = isNaN(envTimeout) ? 300000 : envTimeout;
        this.timers[game.game_id] = setTimeout(async () => {
          const userIds = Object.keys(this.pendingDiscordMessages[game.game_id]);
          console.log("USERS TO MESSAGE:", userIds);
          delete this.timers[game.game_id];
          delete this.pendingDiscordMessages[game.game_id];

          const updatedGame = await Games.find({ "g.id": game.game_id }, true);
          if (updatedGame) {
            const message =
              updatedGame.round >= 13
                ? `${game.name} is over and it's time to vote!\n${process.env.FRONTEND_URL}/game/play/${game.game_id}`
                : `Time to Roll! It's your turn in game ${game.name}!\n${process.env.FRONTEND_URL}/game/play/${game.game_id}`;
            console.log("SEND MESSAGE: ", message);
            const discordUserInfo = await Promise.all(
              userIds.map(
                (userId) =>
                  isUsersTurn(updatedGame, userId) &&
                  this._isSocketOffline(this._getSocket(userId)) &&
                  getDiscordUserFromUserId(userId)
              )
            );
            console.log("DISCORD IDS: ", discordUserInfo);
            await Promise.all(
              discordUserInfo.map(async (info) => {
                try {
                  if (info) {
                    const user = await discordClient.users.fetch(info.id);
                    console.log("USER TO MESSAGE FOUND: ", !!user);
                    user && (await user.send(message));
                  }
                } catch (err) {
                  console.log("ERROR NOTIFYING ON DISCORD: ", err);
                }
              })
            );
          }
        }, timeout);
      }
    } catch (err) {
      console.log("DISCORD GENERIC ERROR: ", err);
    }
  }

  _getSocket(id) {
    return this.connected.sockets[id] || this.connected.users[id];
  }

  _verifyEmitID(game_id, emit_id) {
    const loggedId = this.emitLog[game_id];
    const noEmitLogs = loggedId === undefined;
    return noEmitLogs || Number(loggedId) === Number(emit_id);
  }

  _recordTurns(game) {
    this.gameRecords[game.game_id] = {};
    Object.keys(game.scores).forEach((user_id) => {
      this.gameRecords[game.game_id][user_id] = isUsersTurn(game, user_id);
    });

    return this.gameRecords[game.game_id];
  }

  _isSocketOffline(sockets) {
    return Array.isArray(sockets)
      ? !sockets.length || sockets.every(({ disconnected }) => disconnected)
      : !sockets?.connected;
  }
}

module.exports = new SocketsManager();
