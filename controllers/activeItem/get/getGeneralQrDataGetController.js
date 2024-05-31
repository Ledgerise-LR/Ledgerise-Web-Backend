
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {

  ActiveItem.getGeneralQrData(req.query, (err, generalQrData) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, data: generalQrData });
  })
}
