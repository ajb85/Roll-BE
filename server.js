const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const server = express();

// Middleware
const errorHandler = require('./middleware/errorHandling.js');
const auth = require('./middleware/authenticate.js');

// Outerware - yes, I made this up
const removePassword = require('./outerware/removePassword.js');

// Routes
const authRouter = require('./routes/auth/');
const gamesRouter = require('./routes/games/');

server.use(helmet());
server.use(express.json());
server.use(cors());

server.use(removePassword);

server.use('/api/auth', authRouter);
server.use('/api/games', auth, gamesRouter);

server.get('/', (req, res) => {
  console.log(res);
  res.send("It's working!");
});

//async error handling middleware MUST come after routes or else will just throw Type error
server.use(errorHandler);

module.exports = server;
