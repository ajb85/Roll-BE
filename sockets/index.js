const reqDir = require("require-dir");
const listeners = reqDir("./listeners/");
const http = require("config/http.js");
const cors = { origin: [process.env.FRONTEND_URL], methods: ["GET", "POST"] };
const io = require("socket.io")(http, { cors });
const decodeJWT = require("tools/decodeJWT.js");
const getGameWithStatuses = require("tools/getGameWithStatuses.js");

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

    console.log("\nSOCKETS ONLINE");

    this.io.on("connection", (socket) => {
      if (!this.connected.users[socket.user.id]) {
        this.connected.users[socket.user.id] = [];
      }

      this.connected.sockets[socket.id] = socket;
      this.connected.users[socket.user.id].push(socket);
      console.log(`${socket.user.username} Connected`);
      for (let l in listeners) {
        socket.on(l, listeners[l].bind(this, socket));
      }
    });
  }

  emitGameUpdate(userList = [], g) {
    if (!g) return;

    const { rolls, ...game } = g;
    const emit_id = getEmitID();
    game.game_id && (this.emitLog[game.game_id] = emit_id);

    userList.forEach((user_id) => {
      const sockets = this._getSocket(user_id);
      const isNotLog = !game.logs;
      sockets?.forEach((s) =>
        s.emit("gameUpdates", isNotLog ? getGameWithStatuses(game, user_id) : game, emit_id)
      );
    });
  }

  _getSocket(id) {
    return this.connected.sockets[id] || this.connected.users[id];
  }

  _verifyEmitID(game_id, emit_id) {
    const loggedId = this.emitLog[game_id];
    const noEmitLogs = loggedId === undefined;
    return noEmitLogs || Number(loggedId) === Number(emit_id);
  }
}

module.exports = new SocketsManager();
