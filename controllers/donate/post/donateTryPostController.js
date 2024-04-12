
const ActiveItem = require("../../../models/ActiveItem");

module.exports = async (req, res) => {

  ActiveItem.buyItemCreditCard(req.body, (err, activeItem) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).json({ success: true, data: activeItem });
  })
}