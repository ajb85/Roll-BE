const jwt = require('jsonwebtoken');
const secret = require('config/secret.js');
const Users = require('models/db/users.js');

module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  jwt.verify(token, secret, (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    } else {
      res.locals.token = decodedToken;
      Users.find({ id: decodedToken.user_id })
        .first()
        .then(u => {
          if (u) {
            next();
          } else {
            console.error('AUTH ERROR: user not found by ID');
            return res
              .status(401)
              .json({ message: "That account doesn't exist!" });
          }
        });
    }
  });
};
