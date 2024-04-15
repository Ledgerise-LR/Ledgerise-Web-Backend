
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {

  ActiveItem.getAsset(req.query, (err, activeItem) => {
    if (err) return res.status(200).json({ success: false, err: "bad_request" });
    return res.status(200).json({ success: true, activeItem: activeItem });
  })
}
