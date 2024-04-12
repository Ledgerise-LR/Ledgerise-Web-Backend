
const Donor = require("../../../models/Donor");

module.exports = (req, res) => {
  Donor.createNewDonor(req.body, (err, donor) => {
    if (err) return res.json({ success: false, err: err });
    return res.status(200).json({ success: true, donor: donor });
  })
}
