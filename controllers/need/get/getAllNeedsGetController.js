
const Need = require("../../../models/Need");

module.exports = (req, res) => {
  Need.find(req.body, (err, needs) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, needs: needs });
  })
}
