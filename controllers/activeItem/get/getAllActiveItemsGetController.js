
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  req.body.listingType = "ACTIVE_ITEM"
  ActiveItem.find(req.body, (err, activeItems) => {
    if (err) return res.status(200).json({ err: "bad_request" });
    return res.status(200).json({ activeItems });
  })
}
