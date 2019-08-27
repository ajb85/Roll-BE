const router = require('express').Router();
const bcrypt = require('bcrypt');

const Users = require('../../models/db/users.js');
const generateToken = require('../../config/generateToken.js');
const { verifyAccountInfo } = require('../../middleware/accounts.js');
const { isValidEmail } = require('../../config/inputEvaluation.js');

router.post('/', verifyAccountInfo, async (req, res) => {
  const { username, email, account, password } = res.locals.user;

  /* REGISTER NEW ACCOUNT */
  if (username && email) {
    const newUser = {
      username,
      email,
      password: bcrypt.hashSync(password, 10),
      wins: 0,
      losses: 0
    };
    const new_account = await Users.create(newUser);
    delete new_account.password;
    return res
      .status(201)
      .json({ ...new_account, token: generateToken(new_account) });

    /* LOGIN TO EXISTING ACCOUNT */
  } else if (account) {
    const key = isValidEmail(account) ? 'u.email' : 'u.username';
    const user = await Users.find({ [key]: account }).first();
    if (user && bcrypt.compareSync(password, user.password)) {
      return res.status(200).json({
        ...user,
        token: generateToken(user)
      });
    } else {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }
  }
});

module.exports = router;
