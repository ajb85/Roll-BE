const serverless = require("serverless-http");
// use environment variables
require("dotenv").config();

// Automated error handling
require("express-async-errors");

// Allow absolute imports
require("app-module-path").addPath(__dirname);

require("config/api.js");
const server = require("config/server.js");

// const port = process.env.PORT || 4500;
// http.listen(port, () => console.log(`\n** Running on port ${port} **\n`));

exports.handler = serverless(server, {
  response(response, event, context) {
    // the return value is always ignored
    response.headers["Access-Control-Allow-Headers"] = "Content-Type";
    response.headers["Access-Control-Allow-Origin"] = "https://play-roll.com/";
    response.headers["Access-Control-Allow-Methods"] =
      "OPTIONS,POST,GET,PUT,DELETE";
  },
});
