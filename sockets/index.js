const reqDir = require("require-dir");
const listeners = reqDir("./listeners/");
const http = require("config/http.js");
const cors = { origin: [process.env.FRONTEND_URL], methods: ["GET", "POST"] };
const io = require("socket.io")(http, { cors });
const decodeJWT = require("tools/decodeJWT.js");

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

class SocketsManager {
  constructor() {
    this.io = io;
    this.connected = { sockets: {}, users: {} };
    this.userToSocket = {};

    console.log("\nSOCKETS ONLINE");

    this.io.on("connection", (socket) => {
      this.connected.sockets[socket.id] = socket;
      this.connected.users[socket.user.id] = socket;
      console.log(`\n\n${socket.user.username} Connected\n\n`);
      for (let l in listeners) {
        socket.on(l, listeners[l].bind(this, socket));
      }
    });
  }

  emitGameUpdate(userList = [], g = {}) {
    const { rolls, ...game } = g;
    userList.forEach((user_id) => {
      const s = this._getSocket(user_id);
      console.log("\n\nEMIT TO: ", socket?.user, "\n\n");
      s?.emit("gameUpdates", game);
    });
  }

  _getSocket(id) {
    return this.connected.sockets[id] || this.connected.users[id];
  }
}

module.exports = new SocketsManager();
