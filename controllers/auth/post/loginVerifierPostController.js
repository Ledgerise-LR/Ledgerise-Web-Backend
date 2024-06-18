
const Company = require("../../../models/Company");

module.exports = function (req, res) {
  Company.loginVerifier(req.body, (err, company) => {
    if (err) return res.json({ success: false, err: err });
    company.password = "";
    company.image = "";

    req.session.company = company;
    return res.send({ success: true, company: company });  
  })
}
