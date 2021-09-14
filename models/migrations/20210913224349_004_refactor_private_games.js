exports.up = function (knex) {
  return knex.schema.alterTable("games", (tbl) => {
    tbl.dropColumn("password");
    tbl.bool("private").defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("games", (tbl) => {
    tbl.dropColumn("private");
    tbl.text("password");
  });
};
