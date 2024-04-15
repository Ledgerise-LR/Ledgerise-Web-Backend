
const Beneficiary = require("../../../models/Beneficiary");

module.exports = (req, res) => {

  Beneficiary.loginBeneficiary(req.body, (err, beneficiary) => {
    if (err) return res.json({ success: false, err: err });
    beneficiary.password = "";
    req.session.beneficiary = beneficiary;
    return res.json({ success: true, beneficiary: beneficiary });
  });
}
