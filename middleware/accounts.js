const { isValidEmail, isValidUsername } = require('tools/inputEvaluation.js');
const Users = require('../models/queries/users.js');

module.exports = { parseInput, verifyAccountInfo };

function parseInput(req, res, next) {
  res.locals.user = {};
  console.log('BODY: ', req.body);
  res.locals.user.username = req.body.username
    ? req.body.username.toLowerCase()
    : null;
  res.locals.user.email = req.body.email ? req.body.email.toLowerCase() : null;
  res.locals.user.password = req.body.password;
  res.locals.user.account = req.body.account
    ? req.body.account.toLowerCase()
    : null;
  if (next) next();
}

async function verifyAccountInfo(req, res, next) {
  parseInput(req, res);
  const { username, email, password, account } = res.locals.user;

  if (email && password) {
    if (email && !isValidEmail(email)) {
      return res
        .status(400)
        .json({ requestType: 'register', message: 'Invalid email format' });
    }

    if (username && !isValidUsername(username)) {
      return res.status(400).json({
        requestType: 'register',
        message: 'Only alphanumeric characters allowed in a username'
      });
    }

    const usernameExists = await Users.find({ username }, true);
    const emailExists = await Users.find({ email }, true);

    if (usernameExists) {
      return res
        .status(400)
        .json({ requestType: 'register', message: 'Username already in use' });
    }
    if (emailExists) {
      return res
        .status(400)
        .json({ requestType: 'register', message: 'Email already in use' });
    }
  }
  console.log(res.locals);
  password && ((username && email) || account)
    ? next()
    : res.status(400).json({
        message:
          'If registering, provide password, username, and email.  If logging in, include account and password'
      });
}
