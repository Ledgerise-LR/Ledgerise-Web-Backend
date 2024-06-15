
const ActiveItem = require("../../../models/ActiveItem");
const formidable = require("formidable");

module.exports = (req, res) => {

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error uploading file' });
    }

    const name = fields.name[0];
    const imageData = fields.image[0];
    const companyCode = fields.companyCode[0] || "";
    const description = fields.description[0];

    const body = {
      name: name,
      image: imageData,
      companyCode: companyCode || "",
      description: description
    };

    ActiveItem.createSubcollection(body, (err, subcollection) => {
      if (err || !subcollection) return res.json({ success: false, err: err });
      return res.status(200).json({ success: true, subcollection });
    })
  })
}
