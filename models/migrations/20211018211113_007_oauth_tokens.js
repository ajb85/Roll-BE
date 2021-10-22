exports.up = function (knex) {
  return knex.schema.createTable("oauth_tokens", (tbl) => {
    tbl.increments();
    tbl.text("origin").notNullable();
    tbl.text("state").notNullable();
    tbl
      .integer("user_id")
      .references("id")
      .inTable("users")
      .onUpdate("CASCADE")
      .onDelete("CASCADE");
    tbl.jsonb("payload");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("oauth_tokens");
};
