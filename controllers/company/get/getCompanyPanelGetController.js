
const Company = require("../../../models/Company");

module.exports = (req, res) => {

  Company.getCompanyPanelData(req.query, (err, panelData) => {

    if (err) return res.json({ success: false, err: err });
    return res.status(200).json({ success: true, data: panelData });
  })
}
