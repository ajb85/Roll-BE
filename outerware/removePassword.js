// Removes passwords from any response object as a safety measure
const mung = require('express-mung');

module.exports = mung.json((body, req, res) => {
  if (body && body.password) {
    delete body.password;
  }
  return body;
});
