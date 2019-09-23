const server = require('./server.js');
const http = require('http').createServer(server);
const io = require('socket.io')(http);

io.on('connection', socket => {
  console.log('Client Connected');
});

module.exports = { http, io };
