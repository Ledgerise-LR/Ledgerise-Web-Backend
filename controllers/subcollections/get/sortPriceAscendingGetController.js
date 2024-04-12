
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  ActiveItem.sortPriceAscending(req.query, (err, docs) => {
    if (err) return console.log("bad_request");
    return res.status(200).json({ activeItems: docs });
  })
}
