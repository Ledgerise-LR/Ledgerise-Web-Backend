
const Report = require("../../../models/Report");

module.exports = (req, res) => {
  Report.createNewReport(req.body, (err, report) => {
    if (err) return res.status(400).json({ success: false, err: "bad_request" });
    return res.status(200).json({ success: true, data: report });
  })
}
