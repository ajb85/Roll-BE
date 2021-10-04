exports.up = function (knex) {
  return knex.schema.createTable("user_themes", (tbl) => {
    tbl.increments();
    tbl
      .integer("user_id")
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE")
      .notNullable();
    tbl.jsonb("themes").notNullable();
    tbl.text("active");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("user_themes");
};
