const jwt = require('jsonwebtoken');
const secret = require('../config/secret.js');

module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  jwt.verify(token, secret, (err, decodedToken) => {
    if (err) {
      res.status(401).json({ message: 'Invalid token' });
    } else {
      res.locals.token = decodedToken;
      next();
    }
  });
};
