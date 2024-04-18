
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {

  ActiveItem.sortDefault(req.query, (err, activeItems) => {
    res.status(200).json({ activeItems: activeItems });
  })
}
