const { Client, Intents } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

process.env.DISCORD_BOT_TOKEN
  ? client.login(process.env.DISCORD_BOT_TOKEN)
  : console.warn("No Discord token found.  Bot functionality is offline.");

module.exports = client;
