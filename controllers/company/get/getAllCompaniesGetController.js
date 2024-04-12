
const Company = require("../../../models/Company");

module.exports = (req, res) => {
  Company.find({}, (err, companyArray) => {
    if (err) return res.json({ success: false, err: err });
    return res.status(200).json({ success: true, companies: companyArray });
  })
}
