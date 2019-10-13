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

  getSocketByUserID(user_id) {
    return this.userToSocket[user_id];
  }

  join({ user_id, socket_id }, room) {
    if (!socket_id) {
      socket_id = this.getSocketByUserID(user_id);
    }

    if (this.socketIsConnected(socket_id)) {
      this.connected[socket_id].join(room);
    }
  }

  socketIsConnected(socket_id) {
    return this.connected[socket_id];
  }
}

module.exports = new SocketsManager();
