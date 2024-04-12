
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {

  ActiveItem.listNeedItem(req.body, (err, needItem) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, needItem: needItem });
  })
}
