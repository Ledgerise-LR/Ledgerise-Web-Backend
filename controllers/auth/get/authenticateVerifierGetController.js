
const Company = require("../../../models/Company");

module.exports = (req, res) => {
  console.log(req.session.company);
  console.log(req.query);
  if (req.session.company != null || req.query.code != null) {
    Company.authenticateVerifier(req.query || req.session.company, (err, company) => {
      if (err || !company) return res.json({ success: false, err: err });
      return res.status(200).json({ success: true, company: company });
    })
  }
  else return res.json({ success: false, err: "auth_error" });
}
