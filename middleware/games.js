const Games = require('../models/db/games.js');
module.exports = { verifyNewGame };

async function verifyNewGame(req, res, next) {
  const newGame = req.body;

  if (!newGame.name) {
    console.log('New game, but no name');
    return res.status(400).json({ message: 'New games must have a name' });
  }

  const existingGame = await Games.find({ name: req.body.name });
  if (existingGame && existingGame.length) {
    console.log('New game, but name already exists');
    return res
      .status(400)
      .json({ message: 'A game already exists with that name' });
  }
  console.log('New game, passes middleware');
  req.body = { name: req.body.name, password: req.body.password || null };
  next();
}
