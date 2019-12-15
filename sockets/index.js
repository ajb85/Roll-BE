const http = require('config/http.js');
const io = require('socket.io')(http);
const reqDir = require('require-dir');
const listeners = reqDir('./listeners/');

class SocketsManager {
  constructor() {
    this.io = io;
    this.connected = {};
    this.userToSocket = {};

    console.log('\nSOCKETS ONLINE');

    this.io.on('connection', socket => {
      socket.user = { username: 'New Socket' };
      this.connected[socket.id] = socket;
      console.log('Client Connected');
      // socket.emit('connect', 'You are now online');
      for (let l in listeners) {
        socket.on(l, listeners[l].bind(this, socket));
      }

      socket.frontendSubscriptions = {
        error: true,
        subscribe: true,
        disconnect: true,
        connect: true
      };
    });
  }

  join(userData, room, config) {
    const socket = this._getSocketFromUserData(userData);
    const alreadyJoined = socket.frontendSubscriptions[room];
    if (!alreadyJoined) {
      socket.join(room);
      socket.frontendSubscriptions[room] = true;
    }

    if (config) {
      // If the user joining this room should be emitted to the other users
      // in that room (ie: "Username has joined the chat"), supply a config
      // object, including the context and message that should be sent to the FE
      this.emitToRoom(socket.id, room, config.context, config.message);
    }

    return !alreadyJoined;
  }

  leave(userData, room, config) {
    const socket = this._getSocketFromUserData(userData);

    console.log(`${socket.user.username} is leaving ${room}`);
    socket.leave(room);

    if (config) {
      console.log('CONFIG: ', config);
      this.emitToRoom(socket.id, room, config.context, config.message);
    }
  }

  emitToRoom(socket_id, room, context, message) {
    console.log(`EMITTING TO ${room}[${context}]: `);
    this.connected[socket_id].to(room).emit(room, context, message);
  }

  sendTurn(userData, turnData) {
    const socket_id = this._getSocketIDFromUserData(userData);
    this.emitToRoom(socket_id, turnData.name, 'turns', turnData);
  }

  listenToGamesList(userData, games) {
    const socket = this.connected[this._getSocketIDFromUserData(userData)];

    if (socket) {
      games.forEach(room => socket.join(room));
    }
  }

  getSocketIDByUserID(user_id) {
    return this.userToSocket[user_id];
  }

  isSocketConnected(socket_id) {
    return this.connected[socket_id];
  }

  _getSocketIDFromUserData({ user_id, socket_id }) {
    return user_id ? this.getSocketIDByUserID(user_id) : socket_id;
  }

  _getSocketFromUserData({ user_id, socket_id }) {
    return user_id
      ? this.connected[this.getSocketIDByUserID(user_id)]
      : this.connected[socket_id];
  }
}

module.exports = new SocketsManager();
