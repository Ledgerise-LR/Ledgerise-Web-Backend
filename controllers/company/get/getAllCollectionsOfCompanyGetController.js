
const Company = require("../../../models/Company");

module.exports = (req, res) => {

  let body = {};
  if (req.session.company) {
    body = req.session.company
  } else {
    body.companyCode = req.body.companyCode
  }

  Company.getAllCollectionsOfCompany(body, (err, subcollections) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, subcollections: subcollections });
  })
}
