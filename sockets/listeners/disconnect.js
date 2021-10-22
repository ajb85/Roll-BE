module.exports = function (socket) {
  const name = socket?.user?.username || "SOCKET";
  console.log(`\n\n${name} Disconnected`);
  const socketRecord = this.connected.sockets[socket.id];

  if (socketRecord) {
    const { user_id } = socketRecord.user;
    delete this.connected.sockets[socket.id];
    if (this.connected.users[user_id]?.length <= 1) {
      delete this.connected.users[user_id];
    } else if (this.connected.users[user_id]) {
      this.connected.users[user_id] = this.connected.users[user_id].filter((s) => s !== socket);
    }
    console.log(
      "Connections remaining: ",
      this.connected.users[user_id]?.length ? this.connected.users[user_id].length : 0,
      "\n\n"
    );
  }
};
