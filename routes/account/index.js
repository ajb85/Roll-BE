const router = require("express").Router();
const UserThemes = require("models/queries/userThemes.js");
const { verifyUserThemes } = require("middleware/accounts.js");

router.get("/themes", async (req, res) => {
  const { user_id } = res.locals.token;
  const userThemes = await UserThemes.find({ user_id }, true);
  return res.status(200).json(userThemes || { themes: {} });
});

router.post("/themes/update", verifyUserThemes, async (req, res) => {
  const { user_id } = res.locals.token;
  const { theme } = req.body;
  const userThemes = await UserThemes.edit(
    { user_id },
    { active: theme.name, themes: JSON.stringify({ ...res.locals.themes, [theme.name]: theme }) }
  );

  return res.status(200).json(userThemes);
});

router.post("/themes/active/:themeName", async (req, res) => {
  const { themeName } = req.params;
  const { user_id } = res.locals.token;

  let userThemes = await UserThemes.find({ user_id }, first);
  const themes = userThemes || {};
  const hasTheme = themes?.[themeName];
  if (hasTheme) {
    userThemes = await UserThemes.edit({ user_id }, { active: themeName });
  }

  return res.status(hasTheme ? 200 : 400).json(userThemes);
});

router.delete("/themes/:themeName", async (req, res) => {
  const { themeName } = req.params;
  const { user_id } = res.locals.token;

  let userThemes = await UserThemes.find({ user_id }, true);
  const hasTheme = userThemes?.themes?.[themeName];
  if (hasTheme) {
    delete userThemes.themes[themeName];
    userThemes = await UserThemes.edit({ user_id }, { themes: JSON.stringify(userThemes.themes) });
  }
  return res.status(hasTheme ? 200 : 400).json(userThemes.theme);
});

module.exports = router;
