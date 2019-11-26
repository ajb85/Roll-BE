exports.up = function(knex) {
  const startingScore = JSON.stringify({
    Ones: null,
    Twos: null,
    Threes: null,
    Fours: null,
    Fives: null,
    Sixes: null,
    'Left Bonus': null,
    'Left Total': null,
    '3 of a Kind': null,
    '4 of a Kind': null,
    'Full House': null,
    'Sm Straight': null,
    'Lg Straight': null,
    'Roll!': null,
    'Roll! Bonus': null,
    'Free Space': null,
    'Grand Total': null
  });
  return knex.schema
    .createTable('scores', tbl => {
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
      tbl
        .jsonb('score')
        .notNullable()
        .defaultsTo(startingScore);
    })
    .createTable('rolls', tbl => {
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
      tbl.specificType('dice', 'INT[6]').notNullable();
    });
};

exports.down = function(knex) {
  return knex.schema.dropTable('rolls').dropTable('scores');
};
