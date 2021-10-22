const { ClientCredentials, AuthorizationCode } = require("simple-oauth2");
const OAuth = require("models/queries/oauthTokens.js");
const axios = require("axios");

const redirect_uri = process.env.CURRENT_DEPLOY + "/api/oauth/discord/complete";
const scope = "identify";

const discord = {
  host: "https://discord.com",
  authPath: "/api/oauth2/authorize",
  tokenPath: "/api/oauth2/token",
  useToken: "https://discordapp.com/api/users/@me",
};

const config = {
  client: {
    id: process.env.DISCORD_CLIENT_ID,
    secret: process.env.DISCORD_CLIENT_SECRET,
  },
  auth: {
    authorizeHost: discord.host,
    authorizePath: discord.authPath,
    tokenHost: discord.host,
    tokenPath: discord.tokenPath,
  },
};

class OAuthStateManager {
  constructor() {
    this.storage = {};
    this.timeouts = {};
  }

  add() {
    let d = Date.now();
    while (this.storage[d]) {
      d = Date.now();
    }
    const thirtyMinutes = 108000000;
    this.timeouts[d] = setTimeout(() => {
      delete this.timeouts[d];
      delete this.storage[d];
    }, thirtyMinutes);

    this.storage[d] = true;
    return d;
  }

  validate(code) {
    if (this.storage[code]) {
      clearTimeout(this.timeouts[code]);
      delete this.timeouts[code];
      delete this.storage[code];
      return true;
    }

    return false;
  }
}

const oAuthState = new OAuthStateManager();

const client = new AuthorizationCode(config);

exports.redirect = function redirect(req, res) {
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    const authorizationUri = client.authorizeURL({ redirect_uri, scope, state: oAuthState.add() });
    return res.redirect(authorizationUri);
  } else {
    console.error(
      "Missing env var(s) DISCORD_: CLIENT_ID, CLIENT_SECRET.  OAuth2 is disabled, check .env.sample for more info"
    );
  }
};

exports.complete = async function complete(req, res) {
  const { code, state } = req.query;
  try {
    if (!oAuthState.validate(state)) {
      throw { message: "Invalid state" };
    }
    const { token } = await client.getToken({ code, redirect_uri, scope });
    await OAuth.create({ state, payload: JSON.stringify(token), origin: "Discord" });
    return res.redirect(process.env.FRONTEND_URL + "/oauth/discord/complete/" + state);
  } catch (error) {
    console.log("Access Token Error", error.message);
    return res.sendStatus(400);
  }
};

exports.getDiscordUserFromUserId = async function getDiscordUserFromUserId(user_id) {
  try {
    const tokenFilter = { user_id, origin: "Discord" };
    const userToken = await OAuth.find(tokenFilter, true);
    if (userToken?.payload) {
      let payload = client.createToken(userToken.payload);

      if (payload.expired()) {
        payload = await accessToken.refresh({ scope });
        await OAuth.edit(tokenFilter, { payload });
      }

      const Authorization = `Bearer ${userToken.payload.access_token}`;
      const userInfo = await axios.get(discord.useToken, {
        headers: { Authorization },
      });

      return userInfo.data;
    }
  } catch (err) {}
};
