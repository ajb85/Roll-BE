const db = require('../index.js');

module.exports = {
  find,
  edit,
  create,
  remove
};

function find(filter) {
  return filter
    ? db('users as u')
        .select(
          'u.id as id',
          'u.username as username',
          'u.password as password',
          'u.email as email',
          'u.wins as wins',
          'u.losses as losses'
        )
        .where(filter)
    : db('users as u').select(
        'u.id as id',
        'u.password as password',
        'u.email as email',
        'u.wins as wins',
        'u.losses as losses'
      );
}

function edit(filter, newInfo) {
  db('users')
    .where(filter)
    .update(newInfo)
    .then(u => find({ id: u[0].id }).first());
}

function create(newUser) {
  return db('users')
    .insert(newUser, ['*'])
    .then(u => find({ id: u[0].id }).first());
}

function remove(id) {
  return db('users')
    .where({ id })
    .delete();
}
