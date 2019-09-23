exports.up = function(knex) {
  return knex.schema
    .createTable('games', tbl => {
      tbl.increments();
      tbl.string('name', 15).notNullable();
      tbl.text('password');
      tbl
        .boolean('isJoinable')
        .notNullable()
        .defaultsTo(true);
      tbl
        .boolean('isActive')
        .notNullable()
        .defaultTo(true);
      tbl.timestamp('last_action').defaultsTo(knex.fn.now());
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
        .integer('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .onUpdate('CASCADE')
        .notNullable();
    });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users_in_game').dropTable('games');
};
