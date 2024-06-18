
const Company = require("../../../models/Company");

module.exports = (req, res) => {
  if (req.session.company != null) {
    Company.authenticateVerifier(req.session.company, (err, company) => {
      if (err || !company) return res.json({ success: false, err: err });
      return res.status(200).json({ success: true, company: company });
    })
  }
  else return res.json({ success: false, err: "auth_error" });
}
