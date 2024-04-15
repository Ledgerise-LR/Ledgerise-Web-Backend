
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  ActiveItem.markQrCodeAsPrinted(req.body, (err, activeItem) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, activeItem: activeItem });
  })
}
