
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  ActiveItem.find(req.body, (err, visualVerifications) => {
    if (err) return res.json({ success: false, err: "fetch_error" });
    return res.json({ success: true, visualVerifications: visualVerifications });
  })
}

