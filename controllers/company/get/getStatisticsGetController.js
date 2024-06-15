
const Company = require("../../../models/Company");

module.exports = (req, res) => {
  Company.getStatistics(req.query, (err, statistics) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, data: statistics });
  })
}


