module.exports = function(socket, room) {
  console.log('FE SUBBED TO ', room);
  socket.join(room);
};
