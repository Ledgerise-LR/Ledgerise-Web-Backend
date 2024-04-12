
const Need = require("../../../models/Need");

module.exports = (req, res) => {
  Need.find({beneficiary_id: req.body.beneficiary_id}, (err, needs) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, needs: needs });
  })
}
