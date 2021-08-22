const Query = require("../index.js");

module.exports = {
  find: findWithoutPassword,
  findWithPassword,
  edit,
  create,
  remove,
};

function find(filter, first, withPassword) {
  const select = [
    "u.id",
    "u.username",
    "u.email",
    "u.avatar",
    "u.wins",
    "u.losses",
  ];

  if (withPassword) {
    select.push("u.password");
  }

  return new Query("users AS u")
    .select(...select)
    .where(filter)
    .first(first)
    .run();
}

function findWithoutPassword(filter, first) {
  return find(filter, first, false);
}

function findWithPassword(filter, first) {
  return find(filter, first, true);
}

function edit(filter, newInfo) {
  return new Query("users")
    .update(newInfo)
    .where(filter)
    .first(true)
    .then((u) => find({ "u.id": u.id }, true))
    .run();
}

function create(newUser) {
  return new Query("users")
    .insert(newUser)
    .then((u) => find({ "u.id": u.id }, true))
    .run();
}

function remove(id) {
  return new Query("users").delete({ id }).run();
}
