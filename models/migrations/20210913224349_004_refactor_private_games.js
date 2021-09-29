exports.up = function (knex) {
  return knex.schema
    .alterTable("games", (tbl) => {
      tbl.dropColumn("password");
      tbl.bool("private").defaultTo(true).notNullable();
    })
    .createTable("recreate_game_votes", (tbl) => {
      tbl.increments();
      tbl
        .integer("user_id")
        .references("id")
        .inTable("users")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      tbl
        .integer("game_id")
        .references("id")
        .inTable("games")
        .onUpdate("CASCADE")
        .onDelete("CASCADE");
      tbl.bool("vote").notNullable();
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable("recreate_game_votes").alterTable("games", (tbl) => {
    tbl.dropColumn("private");
    tbl.text("password");
  });
};
