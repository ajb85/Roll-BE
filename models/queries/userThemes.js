const Query = require("../index.js");

module.exports = {
  find,
  edit,
  create,
  remove,
};

function find(filter, first) {
  return new Query("user_themes").select("*").where(filter).first(first).run();
}

function edit(filter, newInfo) {
  return new Query("user_themes").update(newInfo, "*").where(filter).first(true).run();
}

function create({ user_id }, shouldFind) {
  return new Query("user_themes").insert({ user_id, themes: JSON.stringify({}) }, "*").run();
}

function remove(id) {
  return new Query("user_themes").delete({ id }).run();
}
