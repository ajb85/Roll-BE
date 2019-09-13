// use environment variables
require('dotenv').config();

// Automated error handling
require('express-async-errors');

// Allow absolute imports
require('app-module-path').addPath(__dirname);

const server = require('./server.js');
const http = require('http').createServer(server);
const io = require('socket.io')(http, { path: '/' });

io.on('connection', socket => {
  console.log(socket);
});

const port = process.env.PORT || 4500;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));

server.on('listening', () => console.log('Listening on port'));
