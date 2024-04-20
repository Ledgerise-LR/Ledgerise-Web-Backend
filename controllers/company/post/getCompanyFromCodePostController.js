
const Company = require("../../../models/Company");

module.exports = (req, res) => {
  Company.findOne({ code: req.query.code }, (err, company) => {
    if (err || !company) return res.json({ success: false, err: err });
    company.password = "";
    return res.status(200).json({ success: true, company: company });
  })
}
