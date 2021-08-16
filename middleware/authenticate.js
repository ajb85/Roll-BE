const jwt = require("jsonwebtoken");
const secret = require("config/secret.js");
const Users = require("models/queries/users.js");

module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  jwt.verify(token, secret, async (err, decodedToken) => {
    try {
      if (err) throw "invalid user";

      res.locals.token = decodedToken;
      const u = await Users.find({ id: decodedToken.user_id }, true);

      if (!u) throw "invalid account";

      res.locals.user = u;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  });
};
