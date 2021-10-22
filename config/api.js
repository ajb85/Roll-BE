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

// Routes
const authRouter = require("routes/auth/");
const gamesRouter = require("routes/games/");
const accountRouter = require("routes/account/");
const oauthRouter = require("routes/oauth");

server.use("/api/auth", authRouter);
server.use("/api/games", auth, gamesRouter);
server.use("/api/account", auth, accountRouter);
server.use("/api/oauth", oauthRouter);

server.get("/", (req, res) => {
  res.send("It's working!");
});

server.use(errorHandler);
