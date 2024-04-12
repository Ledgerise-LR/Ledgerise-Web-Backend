
const Donor = require("../../../models/Donor");

module.exports = (req, res) => {
  const id = req.body._id

  Donor.findById(id, (err, donor) => {
    if (err || !donor) return res.json({ success: false, err: "authentication_failed" });
    if (!err || donor) return res.status(200).json({ success: true, donor: donor });
  })
}
