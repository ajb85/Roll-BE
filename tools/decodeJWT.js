const jwt = require("jsonwebtoken");

const Users = require("models/queries/users.js");
const secret = require("config/secret.js");

module.exports = async function decodeJWT(token) {
  try {
    const decoded = jwt.verify(token, secret);
    const user = await Users.find({ id: decoded.user_id }, true);
    if (!user) {
      throw "invalid user";
    }

    return { decoded, user };
  } catch (err) {
    return { decoded: false, user: false };
  }
};
