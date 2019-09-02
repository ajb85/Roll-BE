const server = require('express')();

const manage = require('./manage.js');
const play = require('./play.js');

const { verifyUserInGame } = require('middleware/playGames.js');

server.use(manage);
server.use('/play', verifyUserInGame, play);

module.exports = server;
