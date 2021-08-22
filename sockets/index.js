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
      console.log(`${socket.user.username} Connected`);
      for (let l in listeners) {
        socket.on(l, listeners[l].bind(this, socket));
      }

      socket.frontendSubscriptions = {
        error: true,
        subscribe: true,
        disconnect: true,
        connect: true,
      };
    });
  }

  join(id, room, config) {
    const socket = this._getSocket(id);
    const didJoin = socket && !socket.frontendSubscriptions[room];
    if (didJoin) {
      socket.join(room);
      socket.frontendSubscriptions[room] = true;
    }

    if (config) {
      // If the user joining this room should be emitted to the other users
      // in that room (ie: "Username has joined the chat"), supply a config
      // object, including the context and message that should be sent to the FE
      this.emitToRoom(socket.id, room, config.context, config.message);
    }

    return didJoin;
  }

  leave(id, room, config) {
    const socket = this._getSocket(id);

    console.log(`${socket.user.username} is leaving ${room}`);
    socket.leave(room);

    if (config) {
      this.emitToRoom(id, room, config.context, config.message);
    }
  }

  emitToRoom(id, room, context, message) {
    this._getSocket(id).to(room).emit(room, context, message);
  }

  sendTurn(id, turnData) {
    const socket = this._getSocket(id);
    this.emitToRoom(socket.id, turnData.name, "turns", turnData);
  }

  listenToGamesList(id, games) {
    const socket = this._getSocket(id);

    if (socket) {
      games.forEach((room) => socket.join(room));
    }
  }

  _getSocket(id) {
    return this.connected.sockets[id] || this.connected.users[id];
  }
}

module.exports = new SocketsManager();
