
const Company = require("../../../models/Company");

module.exports = (req, res) => {
  Company.loginVerifier(req.body, (err, company) => {
    if (err) return res.json({ success: false, err: err });
    req.session.company = company;
    return res.status(200).json({ success: true, company: company });
  })
}
