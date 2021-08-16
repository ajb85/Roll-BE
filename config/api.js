const server = require("./server");

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
