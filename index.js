// use environment variables
require("dotenv").config();

// Automated error handling
require("express-async-errors");

// Allow absolute imports
require("app-module-path").addPath(__dirname);

require("config/api.js");
const server = require("config/server.js");

const port = process.env.PORT || 4500;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));
