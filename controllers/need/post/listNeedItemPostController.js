
const ActiveItem = require("../../../models/ActiveItem");

module.exports = (req, res) => {
  
  ActiveItem.getSatisfiedDonationsOfDonor(req.query, (err, needItemsArray) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, needItemsArray: needItemsArray });
  })
}