const router = require("express").Router();
const auth = require("middleware/authenticate.js");
const discordOAuth = require("discord/oauth.js");
const OAuth = require("models/queries/oauthTokens.js");

router.get("/discord", discordOAuth.redirect);

router.get("/discord/complete", discordOAuth.complete);

router.post("/discord/identify", auth, async (req, res) => {
  const { state } = req.body;
  const { user_id } = res.locals.token;

  const updated = await OAuth.edit({ state }, { user_id });
  const wasUpdated = updated?.user_id && Number(updated.user_id) === Number(user_id);
  return res
    .status(wasUpdated ? 200 : 404)
    .json(wasUpdated ? { message: "Updated successfully" } : { message: "Invalid state" });
});

module.exports = router;
