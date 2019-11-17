const Query = require('../index.js');

module.exports = { find, saveRoll, clearRolls };

function find(filter, first) {
  return new Query('dice')
    .select('*')
    .where(filter)
    .first(first)
    .run();
}

function saveRoll(newRoll) {
  return (
    new Query('dice')
      .insert(newRoll)
      .first(true)
      // .then(d => find({ id: d.id }))
      .run()
  );
}

function clearRolls(filter) {
  return new Query('dice').delete(filter).run();
}
