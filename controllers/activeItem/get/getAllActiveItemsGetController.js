
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  req.query.listingType = "ACTIVE_ITEM"
  ActiveItem.find(req.query, (err, activeItems) => {
    if (err) return res.status(200).json({ err: "bad_request" });
    return res.status(200).json({ activeItems });
  })
}
