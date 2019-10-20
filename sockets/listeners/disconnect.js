module.exports = function(socket) {
  const user = this.connected[socket.id];

  if (user) {
    const { user_id } = user;
    delete this.userToSocket[user_id];
    delete this.connected[socket.id];
  }
};
