const jwt = require('jsonwebtoken');
const secret = require('config/secret.js');
const Users = require('models/queries/users.js');

module.exports = function(socket, token) {
  if (this.connected[socket.id].user.username === 'New Socket' && token) {
    jwt.verify(token, secret, (err, decodedToken) => {
      if (!err) {
        const { user_id } = decodedToken;
        this.connected[socket.id] = socket;
        Users.find({ 'u.id': user_id }, true).then(u => {
          if (u) {
            this.connected[socket.id].user = u;
            console.log(
              'IDENTIFIED SOCKET: ',
              this.connected[socket.id].user.username,
              'USER COUNT: ',
              Object.keys(this.connected).length
            );
          }
        });
        this.userToSocket[user_id] = socket.id;
      }
    });
  }
};
