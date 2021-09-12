const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const server = require("./server");

server.use(helmet());
server.use(express.json());
server.use(cors({ origin: process.env.FRONTEND_URL }));

// Middleware
const errorHandler = require("middleware/errorHandling.js");
const auth = require("middleware/authenticate.js");

// Afterware - yes, I made this up
const removePassword = require("afterware/removePassword.js");

// Routes
const authRouter = require("routes/auth");
const gamesRouter = require("routes/games");

server.use(removePassword);

server.use("/api/auth", authRouter);
server.use("/api/games", auth, gamesRouter);

server.get("/", (req, res) => {
  res.send("It's working!");
});

//async error handling middleware MUST come after routes or else will just throw Type error
server.use(errorHandler);
