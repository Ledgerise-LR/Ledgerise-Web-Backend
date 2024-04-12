
const DepotLocation = require("../../../models/DepotLocation");

module.exports = (req, res) => {

  DepotLocation.findOne({ depotName: req.body.depotName }, (err, depot) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({
      success: true,
      depotLocation: depot.depotLocation
    })
  })
}
