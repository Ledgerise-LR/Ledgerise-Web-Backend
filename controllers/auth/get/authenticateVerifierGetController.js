
const Company = require("../../../models/Company");

module.exports = (req, res) => {
  if (req.session.company != null || req.session.company != undefined) {
    Company.authenticateVerifier(req.session.company, (err, company) => {
      if (err || !company) return res.json({ success: false, err: err });
      return res.status(200).json({ success: true, company: company });
    })
  }
  else if (req.session.company == undefined) return res.json({ success: false, err: "auth_error" });
}
