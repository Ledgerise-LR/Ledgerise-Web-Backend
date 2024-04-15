
const Donor = require("../../../models/Donor");

module.exports = (req, res) => {
  Donor.loginDonor(req.body, (err, donor) => {
    if (err) return res.json({ success: false, err: err });
    donor.password = "";
    donor.school_number = "";
    req.session.donor = donor;
    return res.status(200).json({ success: true, donor: donor });
  })
}
