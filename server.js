const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const server = express();

// Middleware
const errorHandler = require('./middleware/errorHandling.js');
const auth = require('./middleware/authenticate.js');

// Routes
const authRouter = require('./routes/auth/');

server.use(helmet());
server.use(express.json());
server.use(cors());

server.use('/api/auth', authRouter);

server.get('/', (req, res) => {
  console.log(res);
  res.send("It's working!");
});

//async error handling middleware MUST come after routes or else will just throw Type error
// server.use(errorHandler);

module.exports = server;
