
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  ActiveItem.createNeed(req.body, (err, need) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, need: need });
  })
}
