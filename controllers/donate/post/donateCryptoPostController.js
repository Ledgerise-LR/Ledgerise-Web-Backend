
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  ActiveItem.buyItem(req.body, (err, activeItem) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({ success: true, data: activeItem });
  })
}