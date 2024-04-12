
const Beneficiary = require("../../../models/Beneficiary");

module.exports = (req, res) => {
  if (req.session.beneficiary != null || req.session.beneficiary != undefined) {
    Beneficiary.authenticateBeneficiary(req.session.beneficiary, (err, beneficiary) => {
      if (err || !beneficiary) return res.json({ success: false, err: err });
      return res.status(200).json({ success: true, beneficiary: beneficiary });
    })
  }
  else if (req.session.beneficiary == undefined) return res.json({ success: false, err: "auth_error" })
}
