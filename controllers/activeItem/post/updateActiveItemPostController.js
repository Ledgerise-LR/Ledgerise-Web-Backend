
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  ActiveItem.updateItem(req.body, (err, activeItem) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, activeItem: activeItem })
  })
}
