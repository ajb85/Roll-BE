const jwt = require('jsonwebtoken');
const secret = require('config/secret.js');
const Users = require('models/db/users.js');

class Socket {
  constructor(socket, user_id) {
    this.socket = socket;
    this.user = Users.find({ 'u.id': user_id })
      .first()
      .then(u => u);
  }

  join(room) {
    console.log('JOINING: ', room);
    this.socket.join(room);
  }
}

module.exports = function(socket, token) {
  if (!this.connected[socket.id] && token) {
    jwt.verify(token, secret, (err, decodedToken) => {
      if (!err) {
        const { user_id } = decodedToken;
        this.connected[socket.id] = new Socket(socket, user_id);
        this.userToSocket[user_id] = socket.id;
      }
    });
  }
};
