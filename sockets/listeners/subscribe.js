module.exports = function(socket, room, config) {
  const didJoin = this.join({ socket_id: socket.id }, room, config);
  if (didJoin) {
    console.log(
      socket && socket.user ? socket.user.username : 'New Socket',
      ' SUBSCRIBED TO: ',
      room
    );
  }
};
