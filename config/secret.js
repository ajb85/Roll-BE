module.exports =
  process.env.JWT_SECRET ||
  "Please don't let this be your secret, update the .env now!!";
