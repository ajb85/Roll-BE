module.exports = { isValidEmail, isValidUsername };

function isValidEmail(email) {
  // Test for email format.  Tests in order:
  // one @, dot after @
  // first character is a number or letter
  // last character is a letter
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    /[a-z0-9]/.test(email[0]) &&
    /[a-z]/.test(email[email.length - 1])
  );
}

function isValidUsername(username) {
  // Verifies username is alphanumeric only
  return /^[a-z0-9]+$/i.test(username);
}
