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

const defaultThemeNames = {
  dark: true,
  light: true,
  night: true,
  neon: true,
  beach: true,
  forest: true,
};

router.post("/themes/active/:themeName", verifyUserThemes, async (req, res) => {
  const { themeName } = req.params;
  const { user_id } = res.locals.token;

  let userThemes = await UserThemes.find({ user_id }, true);
  const { themes } = userThemes || {};
  const hasTheme = themes?.[themeName] || defaultThemeNames[themeName];

  if (hasTheme) {
    userThemes = await UserThemes.edit({ user_id }, { active: themeName });
  } else {
    console.log("THEMES: ", themes, themeName);
  }

  return res.status(hasTheme ? 200 : 400).json(userThemes);
});

router.delete("/themes/:themeName", async (req, res) => {
  const { themeName } = req.params;
  const { user_id } = res.locals.token;

  let userThemes = await UserThemes.find({ user_id }, true);
  const hasTheme = userThemes?.themes?.[themeName];
  if (hasTheme) {
    if (userThemes.themes.active === themeName) {
      userThemes.themes.active = "dark";
    }

    delete userThemes.themes[themeName];
    userThemes = await UserThemes.edit({ user_id }, { themes: JSON.stringify(userThemes.themes) });
  }
  return res.status(hasTheme ? 200 : 400).json(userThemes);
});

module.exports = router;
