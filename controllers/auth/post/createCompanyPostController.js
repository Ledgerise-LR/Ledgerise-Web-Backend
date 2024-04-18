
const Company = require("../../../models/Company");
const formidable = require("formidable");

module.exports = (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error uploading file' });
    }

    const body = {
      image: fields.image[0],
      name: fields.name[0],
      code: fields.code[0],
      email: fields.email[0],
      password: fields.password[0],
      charityAddress: fields.charityAddress[0],
      IBAN: fields.IBAN[0],
      receipientName: fields.receipientName[0],
      bankName: fields.bankName[0],
    }

    Company.createNewCompany(body, (err, company) => {
      if (err) return res.json({ success: false, err: err });
      return res.status(201).json({ success: true, company: company });
    });
  });
}
