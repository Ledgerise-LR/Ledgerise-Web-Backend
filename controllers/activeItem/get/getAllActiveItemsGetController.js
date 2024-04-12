
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  ActiveItem.find({ listingType: "ACTIVE_ITEM" }, (err, activeItems) => {
    if (err) return res.status(200).json({ err: "bad_request" });
    return res.status(200).json({ activeItems });
  })
}
