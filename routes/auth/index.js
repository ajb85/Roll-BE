const router = require('express').Router();
const bcrypt = require('bcrypt');

const auth = require('middleware/authenticate.js');
const Users = require('models/queries/users.js');
const generateToken = require('tools/generateToken.js');
const { verifyAccountInfo } = require('middleware/accounts.js');
const { isValidEmail } = require('tools/inputEvaluation.js');

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
    const user = await Users.find({ [key]: account }, true);
    if (user && bcrypt.compareSync(password, user.password)) {
      delete user.password;
      return res.status(200).json({
        ...user,
        token: generateToken(user)
      });
    } else {
      return res
        .status(401)
        .json({ requestType: 'login', message: 'Invalid Credentials' });
    }
  }
});

// router.put('/update/:id', async (req, res) => {
//   // const { user_id: id } = res.locals.token;
//   const { id } = req.params;
//   if (req.body.password) {
//     const password = bcrypt.hashSync(req.body.password, 10);

//     const updated = await Users.edit({ id }, { password });

//     return updated
//       ? res.status(200).json({ message: 'Account updated!' })
//       : res
//           .status(400)
//           .json({ message: 'Something went wrong updating the account' });
//   } else {
//     return res.status(400).json({ message: 'No password' });
//   }
// });

router.get('/', auth, (req, res) => {
  const { user } = res.locals;
  return res.status(200).json(user);
});

module.exports = router;
