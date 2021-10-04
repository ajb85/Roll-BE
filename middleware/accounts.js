const { isValidEmail, isValidUsername } = require("tools/inputEvaluation.js");
const Users = require("../models/queries/users.js");
const UserThemes = require("../models/queries/userThemes");

module.exports = { verifyAccountInfo, verifyUserThemes };

async function verifyAccountInfo(req, res, next) {
  res.locals.user = req.body;
  const { username, email, password, account } = req.body;

  if (email && password) {
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ requestType: "register", message: "Invalid email format" });
    }

    if (username && !isValidUsername(username)) {
      return res.status(400).json({
        requestType: "register",
        message: "Only alphanumeric characters allowed in a username",
      });
    }

    const usernameExists = await Users.find({ username }, true);
    const emailExists = await Users.find({ email }, true);

    if (usernameExists) {
      return res.status(400).json({ requestType: "register", message: "Username already in use" });
    }

    if (emailExists) {
      return res.status(400).json({ requestType: "register", message: "Email already in use" });
    }
  }

  return password && ((username && email) || account)
    ? next()
    : res.status(400).json({
        message:
          "If registering, provide password, username, and email.  If logging in, include account and password",
      });
}

async function verifyUserThemes(req, res, next) {
  const { user_id } = res.locals.token;
  const userThemes = await UserThemes.find({ user_id });
  res.locals.themes = userThemes?.themes;

  if (!res.locals.themes) {
    await UserThemes.create({ user_id });
    res.locals.themes = {};
  }

  next();
}
