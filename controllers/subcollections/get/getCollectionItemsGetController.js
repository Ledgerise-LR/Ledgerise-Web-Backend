
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {

  let body;
  req.query ? body = req.query : body = req.body;

  ActiveItem.sortDefault(req.query, (err, activeItems) => {
    res.status(200).json({ activeItems: activeItems });
  })
}
