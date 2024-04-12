
const Subcollection = require("../../../models/Subcollection");

module.exports = (req, res) => {
  Subcollection.findOne({ itemId: req.query.id, nftAddress: req.query.nftAddress }, (err, subcollection) => {
    res.status(200).json({ subcollection: subcollection });
  })
}
