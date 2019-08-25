const bcrypt = require('bcrypt');
exports.seed = function(knex) {
  // Inserts seed entries
  return knex('users').insert([
    {
      username: 'admin',
      email: 'admin@admin.com',
      password: bcrypt.hashSync('admin', 10),
      wins: 0,
      losses: 0
    }
  ]);
};
