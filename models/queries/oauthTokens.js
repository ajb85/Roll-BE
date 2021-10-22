const Query = require("../index.js");

module.exports = {
  find,
  edit,
  create,
  remove,
};

function find(filter, first) {
  return new Query("oauth_tokens").select("*").where(filter).run();
}

function edit(filter, newInfo) {
  return new Query("oauth_tokens").update(newInfo).where(filter, "*").first(true).run();
}

function create(tokenInfo) {
  return new Query("oauth_tokens").insert(tokenInfo, "*").first(true).run();
}

function remove(id) {
  return new Query("oauth_tokens").delete({ id });
}
