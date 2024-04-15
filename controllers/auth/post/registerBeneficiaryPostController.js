
const Beneficiary = require("../../../models/Beneficiary");

module.exports = (req, res) => {
  Beneficiary.createBeneficiary(req.body, (err, beneficiary) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, beneficiary: beneficiary })
  })
}
