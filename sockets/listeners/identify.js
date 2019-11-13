const jwt = require('jsonwebtoken');
const secret = require('config/secret.js');
const Users = require('models/queries/users.js');

class Socket {
  constructor(socket, user_id) {
    for (let key in socket) {
      this[key] = socket[key];
    }
    this.user = Users.find({ 'u.id': user_id }, true).then(u => u);
  }
}

module.exports = function(socket, token) {
  if (!this.connected[socket.id] && token) {
    jwt.verify(token, secret, (err, decodedToken) => {
      if (!err) {
        const { user_id } = decodedToken;
        this.connected[socket.id] = new Socket(socket, user_id);
        this.connected[socket.id].user.then(u => {
          if (u) {
            console.log('IDENTIFIED SOCKET: ', u.username);
          }
        });
        this.userToSocket[user_id] = socket.id;
      }
    });
  }
};
