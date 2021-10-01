exports.up = function (knex) {
  return knex.schema
    .createTable("game_logs", (tbl) => {
      tbl.increments();
      tbl
        .integer("user_id")
        .references("id")
        .inTable("users")
        .onUpdate("CASCADE")
        .onDelete("CASCADE")
        .notNullable();
      tbl
        .integer("game_id")
        .references("id")
        .inTable("games")
        .onUpdate("CASCADE")
        .onDelete("CASCADE")
        .notNullable();
      tbl.enum("action", ["scoreSubmit", "gameInfo"]).notNullable();
      tbl.jsonb("value").notNullable();
    })
    .createTable("game_logs_reactions", (tbl) => {
      tbl.increments();
      tbl
        .integer("user_id")
        .references("id")
        .inTable("users")
        .onUpdate("CASCADE")
        .onDelete("CASCADE")
        .notNullable();
      tbl
        .integer("log_id")
        .references("id")
        .inTable("game_logs")
        .onUpdate("CASCADE")
        .onDelete("CASCADE")
        .notNullable();
      tbl.jsonb("reaction").notNullable();
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable("game_logs_reactions").dropTable("game_logs");
};
