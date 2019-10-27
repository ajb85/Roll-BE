const http = require('config/http.js');
const io = require('socket.io')(http);
const reqDir = require('require-dir');

class SocketsManager {
  constructor() {
    this.io = io;
    this.connected = {};
    this.userToSocket = {};

    this.startListeners();
  }

  startListeners() {
    this.io.on('connection', socket => {
      console.log('Client Connected');
      const listeners = reqDir('./listeners/');

      for (let l in listeners) {
        socket.on(l, listeners[l].bind(this, socket));
      }
    });
  }

  join(userData, room) {
    const socket_id = this._getSocketIDFromUserData(userData);
    const socket = this.connected[socket_id];

    socket.join(room);
    this.emitToRoom(socket_id, room, 'userJoined', socket.user.username);
  }

  leave(userData, room) {
    const socket_id = this._getSocketIDFromUserData(userData);
    const socket = this.connected[socket_id];

    socket.leave(room);
    this.emitToRoom(socket.id, room, 'userLeft', socket.user.username);
  }

  emitToRoom(socket_id, room, context, message) {
    this.connected[socket_id].to(room).emit(context, message);
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
}

module.exports = new SocketsManager();
