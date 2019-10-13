module.exports = function(socket) {
  const { user_id } = this.connected[socket.id];
  delete this.userToSocket[user_id];
  delete this.connected[socket.id];
};
