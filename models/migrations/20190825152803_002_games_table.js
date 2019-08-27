const moment = require('moment');

exports.up = function(knex) {
  return knex.schema
    .createTable('games', tbl => {
      tbl.increments();
      tbl
        .string('name', 15)
        .notNullable()
        .unique();
      tbl.text('password');
      tbl
        .timestamp('last_action')
        .defaultsTo(moment().format('YYYY-MM-DD HH:mm:ss'));
    })
    .createTable('users_in_game', tbl => {
      tbl.increments();
      tbl
        .integer('game_id')
        .references('id')
        .inTable('games')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .notNullable();
      tbl
        .integer('player_1')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .notNullable();
      tbl
        .integer('player_2')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
      tbl
        .integer('player_3')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE');
    });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users_in_game').dropTable('games');
};
