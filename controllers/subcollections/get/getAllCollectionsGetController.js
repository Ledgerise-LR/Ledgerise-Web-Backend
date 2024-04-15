
const Company = require("../../../models/Company");

module.exports = (req, res) => {
  Company.getAllCollections(req.body, (err, subcollections) => {
    if (err || !subcollections) return res.json({ success: false, err: err });
    return res.status(200).json({ success: true, subcollections });
  })
}
