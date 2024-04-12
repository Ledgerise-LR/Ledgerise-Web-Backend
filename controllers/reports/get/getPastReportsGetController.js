
const Report = require("../../../models/Report");

module.exports = (req, res) => {
  Report.find({ reporter: req.query.reporter }, (err, reports) => {
    if (err) return res.status(400).json({ err: "bad_request" });
    return res.status(200).json({ success: true, data: reports });
  })
}
