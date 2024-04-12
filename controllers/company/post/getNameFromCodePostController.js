
const Company = require("../../../models/Company");

module.exports = (req, res) => {
  Company.findOne({ code: req.body.code }, (err, company) => {
    if (err || !company) return res.json({ success: false, err: err });
    return res.status(200).json({ success: true, companyName: company.name });
  })
}
