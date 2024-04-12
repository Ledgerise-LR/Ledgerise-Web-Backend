
const Company = require("../../../models/Company");

module.exports = (req, res) => {
  
  Company.getAllItems(req.body, (err, assets) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, assets: assets });
  })
}
