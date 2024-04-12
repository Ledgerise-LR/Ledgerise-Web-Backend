
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  
  ActiveItem.getSatisfiedDonationsOfDonor(req.body, (err, needItemsArray) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, needItem: needItemsArray });
  })
}