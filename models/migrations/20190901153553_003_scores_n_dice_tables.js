exports.up = function(knex) {
  const categories = [
    'Ones',
    'Twos',
    'Threes',
    'Fours',
    'Fives',
    'Sixes',
    'Left Bonus',
    'Left Total',
    '3 of a Kind',
    '4 of a Kind',
    'Full House',
    'Sm Straight',
    'Lg Straight',
    'Roll!',
    'Roll! Bonus',
    'Free Space',
    'Grand Total'
  ];
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
      categories.forEach(cat => tbl.integer(cat));
    })
    .createTable('dice', tbl => {
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
  return knex.schema.dropTable('dice').dropTable('scores');
};
