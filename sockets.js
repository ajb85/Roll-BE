const server = require('./server.js');
const http = require('http').createServer(server);
const io = require('socket.io')(http);

io.on('connection', socket => {
  console.log('Sockets Online');
});

module.exports = { http, io };
