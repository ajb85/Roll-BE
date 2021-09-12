const { isValidEmail, isValidUsername } = require("tools/inputEvaluation.js");
const Users = require("../models/queries/users.js");

module.exports = { verifyAccountInfo };

async function verifyAccountInfo(req, res, next) {
  console.log("VERIFYING ACCOUNT INFO");
  res.locals.user = req.body;
  const { username, email, password, account } = req.body;

  if (email && password) {
    console.log("EMAIL & PASSWORD");
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ requestType: "register", message: "Invalid email format" });
    }

    if (username && !isValidUsername(username)) {
      return res.status(400).json({
        requestType: "register",
        message: "Only alphanumeric characters allowed in a username",
      });
    }
    console.log("QUERY DB");
    const usernameExists = await Users.find({ username }, true);
    const emailExists = await Users.find({ email }, true);
    console.log("QUERY DONE");
    if (usernameExists) {
      return res.status(400).json({ requestType: "register", message: "Username already in use" });
    }

    if (emailExists) {
      return res.status(400).json({ requestType: "register", message: "Email already in use" });
    }
  }
  console.log("VERIFIED ACCOUNT", !!(password && ((username && email) || account)));
  return password && ((username && email) || account)
    ? next()
    : res.status(400).json({
        message:
          "If registering, provide password, username, and email.  If logging in, include account and password",
      });
}
