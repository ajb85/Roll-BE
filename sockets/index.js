const http = require('config/http.js');
const io = require('socket.io')(http);
const reqDir = require('require-dir');
const listeners = reqDir('./listeners/');

class SocketsManager {
  constructor() {
    this.io = io;
    this.connected = {};
    this.userToSocket = {};

    console.log('SOCKETS ONLINE');

    this.io.on('connection', socket => {
      console.log('Client Connected');

      for (let l in listeners) {
        console.log('Listening: ', l, typeof listeners[l]);
        socket.on(l, listeners[l].bind(this, socket));
      }
    });
  }

  join(userData, room, updatedGame) {
    const socket_id = this._getSocketIDFromUserData(userData);
    const socket = this.connected[socket_id];
    socket.join(room);
    this.emitToRoom(socket_id, room, 'userList', updatedGame);
  }

  leave(userData, room, updatedGame) {
    const socket_id = this._getSocketIDFromUserData(userData);
    const socket = this.connected[socket_id];

    socket.leave(room);
    this.emitToRoom(socket.id, room, 'userList', updatedGame);
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
}

module.exports = new SocketsManager();
