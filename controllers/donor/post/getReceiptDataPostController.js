
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  ActiveItem.getReceiptData(req.body, (err, history) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, history: history });
  })
}
