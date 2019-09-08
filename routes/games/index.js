const server = require('express')();

const manage = require('./manage.js');
const play = require('./play.js');

server.use(manage);
server.use('/play', play);

module.exports = server;
