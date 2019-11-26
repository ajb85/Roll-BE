const Query = require('../index.js');

module.exports = { find, edit, create, remove };

function find(filter, first) {
  return new Query('users AS u')
    .select('*')
    .where(filter)
    .first(first)
    .run();
}

function edit(filter, newInfo) {
  return new Query('users')
    .update(newInfo)
    .where(filter)
    .first(true)
    .then(u => find({ 'u.id': u.id }, true))
    .run();
}

function create(newUser) {
  return new Query('users')
    .insert(newUser)
    .then(u => find({ 'u.id': u.id }, true))
    .run();
}

function remove(id) {
  return new Query('users').delete({ id }).run();
}
