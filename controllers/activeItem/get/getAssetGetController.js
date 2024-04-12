
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {

  let body;

  if (req.query.nftAddress && req.query.id && req.query.subcollectionId) {
    body = req.query;
  } else {
    body = req.body;
  }

  ActiveItem.getAsset(body, (err, activeItem) => {
    if (err) return res.status(200).json({ success: false, err: "bad_request" });
    return res.status(200).json({ success: true, activeItem: activeItem });
  })
}
