exports.up = function (knex) {
  return knex.schema.createTable("users", (tbl) => {
    tbl.increments();
    tbl.text("username").notNullable().unique();
    tbl.text("password").notNullable();
    tbl.text("email").notNullable().unique();
    tbl.text("avatar");
    tbl.integer("wins").notNullable();
    tbl.integer("losses").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("users");
};
