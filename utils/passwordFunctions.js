
const bcrypt = require("bcryptjs");

function hashPassword (next) {
  const donor = this;

  if (donor.isModified("password")) {
    bcrypt.hash(donor.password, 8, (err, password) => {
      if (err) return "bad_request";
      donor.password = password;
      next();
    })
  }
  else next();
}

const verifyPassword = (passwordText, passwordHash, callback) => {
  bcrypt.compare(passwordText, passwordHash, (err, res) => {
    if (err || !res) return callback("verify_error");
    else if (res) return callback(null, true);
  })
}


module.exports = { hashPassword, verifyPassword }
