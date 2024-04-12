
const Donor = require("../models/Donor");

module.exports = (req, res, next) => {

  if (req.session && req.session.donor && req.session.volunteer != {}) {
    Donor.authenticateDonor(req.session.donor, (err, donor) => {
      if (err || !donor) return res.json({success: false, err: err});
      return next();
    })
  } else {
    return res.redirect("/login");
  }
}
