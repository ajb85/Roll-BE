exports.up = function(knex) {
  return knex.schema.alterTable('games', tbl => {
    tbl
      .integer('owner')
      .references('id')
      .inTable('users')
      .onUpdate('CASCADE')
      .onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('games', tbl => {
    tbl.dropColumn('owner');
  });
};
