// Removes passwords from any response object as a safety measure
const mung = require('express-mung');

module.exports = mung.json((body, req, res) => {
  if (body && Array.isArray(body)) {
    body.forEach(g => {
      if (g.password) {
        delete g.password;
      }
    });
  } else {
    if (body && body.password) {
      delete body.password;
    }
  }
  return body;
});
