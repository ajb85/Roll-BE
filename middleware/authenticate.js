const decodeJWT = require("tools/decodeJWT.js");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const { decoded, user } = await decodeJWT(token);
    if (!decoded || !user) throw "invalid token";

    res.locals.token = decoded;
    res.locals.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
