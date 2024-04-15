
const NeedDetail = require("../../../models/NeedDetail");

module.exports = (req, res) => {

  NeedDetail.findById(req.query.needDetailsId, (err, needDetails) => {
    if (err) return res.json({ success: false, err: "bad_request" });
    return res.json({ success: true, needDetails: needDetails });
  })
}
