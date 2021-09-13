module.exports = function (socket) {
  const name = socket?.user?.username || "SOCKET";
  console.log(`\n\n${name} Disconnected\n\n`);
  const user = this.connected[socket.id];

  if (user) {
    const { user_id } = user;
    delete this.userToSocket[user_id];
    delete this.connected[socket.id];
  }
};
