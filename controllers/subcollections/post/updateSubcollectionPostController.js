
const Subcollection = require("../../../models/Subcollection");

module.exports = (req, res) => {

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error uploading file' });
    }

    const imageData = fields.image[0];
    const subcollectionId = fields.subcollectionId[0];
    const companyCode = fields.companyCode[0];
    const nftAddress = fields.nftAddress[0];

    Subcollection.findOneAndUpdate({ itemId: subcollectionId, nftAddress: nftAddress }, { image: imageData, companyCode, companyCode }, (err, subcollection) => {
      if (err || !subcollection) return res.json({ success: false, err: err });
      return res.status(200).json({ success: true, subcollection });
    })
  })
}
