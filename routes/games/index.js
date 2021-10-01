const server = require("express")();

const manage = require("./manage.js");
const play = require("./play.js");
const logs = require("./logs.js");

server.use("/", manage);
server.use("/play", play);
server.use("/logs", logs);

module.exports = server;
