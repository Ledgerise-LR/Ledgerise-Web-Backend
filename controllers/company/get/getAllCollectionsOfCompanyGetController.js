
const Company = require("../../../models/Company");

module.exports = (req, res) => {

  const body = {
    code: ""
  };

  if (req.query.code) {
    body.code = req.query.code;
  } else if (req.body.code) {
    body.code = req.body.code;
  } else if (req.session.company) {
    body.code = req.session.company.code
  }

  Company.getAllCollectionsOfCompany(body, (err, subcollections) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, subcollections: subcollections });
  })
}
